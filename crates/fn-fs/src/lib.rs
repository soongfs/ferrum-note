use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::fs;
use std::hash::{Hash, Hasher};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use fn_core::{OpenFileResponse, SaveFileResponse, WatchStartedResponse};
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use once_cell::sync::Lazy;
use thiserror::Error;

static WATCHERS: Lazy<Mutex<HashMap<String, RecommendedWatcher>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

#[derive(Debug, Error)]
pub enum FsError {
    #[error("path is empty")]
    EmptyPath,
    #[error("invalid path: {0}")]
    InvalidPath(String),
    #[error("file does not exist: {0}")]
    FileNotFound(String),
    #[error("path is a directory: {0}")]
    IsDirectory(String),
    #[error("permission denied: {0}")]
    PermissionDenied(String),
    #[error("version conflict")]
    VersionConflict,
    #[error("utf-8 decode error: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("watch error: {0}")]
    Watch(#[from] notify::Error),
    #[error("internal lock failure")]
    Lock,
}

pub fn open_file(path: &str) -> Result<OpenFileResponse, FsError> {
    let normalized = normalize_existing_file(path)?;
    let bytes = fs::read(&normalized)?;
    let metadata = fs::metadata(&normalized)?;
    let content = String::from_utf8(bytes.clone())?;
    let last_modified = last_modified_epoch_ms(&metadata);
    let version = hash_version(&bytes, last_modified);

    Ok(OpenFileResponse { path: normalized.display().to_string(), content, version, last_modified })
}

pub fn save_file(
    path: &str,
    content: &str,
    expected_version: u64,
) -> Result<SaveFileResponse, FsError> {
    let normalized = normalize_write_target(path)?;

    if !normalized.exists() {
        return Err(FsError::FileNotFound(normalized.display().to_string()));
    }

    let current_bytes = fs::read(&normalized)?;
    let current_meta = fs::metadata(&normalized)?;
    let current_last_modified = last_modified_epoch_ms(&current_meta);
    let current_version = hash_version(&current_bytes, current_last_modified);

    if current_version != expected_version {
        return Ok(SaveFileResponse {
            path: normalized.display().to_string(),
            version: current_version,
            bytes_written: 0,
            conflict: true,
        });
    }

    let bytes_written = atomic_write(&normalized, content.as_bytes())?;
    let next_meta = fs::metadata(&normalized)?;
    let next_last_modified = last_modified_epoch_ms(&next_meta);
    let next_version = hash_version(content.as_bytes(), next_last_modified);

    Ok(SaveFileResponse {
        path: normalized.display().to_string(),
        version: next_version,
        bytes_written,
        conflict: false,
    })
}

pub fn save_as_file(path: &str, content: &str) -> Result<SaveFileResponse, FsError> {
    let normalized = normalize_write_target(path)?;
    let bytes_written = atomic_write(&normalized, content.as_bytes())?;
    let meta = fs::metadata(&normalized)?;
    let version = hash_version(content.as_bytes(), last_modified_epoch_ms(&meta));

    Ok(SaveFileResponse {
        path: normalized.display().to_string(),
        version,
        bytes_written,
        conflict: false,
    })
}

pub fn watch_file(path: &str) -> Result<WatchStartedResponse, FsError> {
    let normalized = normalize_existing_file(path)?;
    let watch_id = make_watch_id();
    let mut watcher = notify::recommended_watcher(move |_res| {
        // The Tauri layer will bridge events to the frontend in a later step.
    })?;

    watcher.watch(&normalized, RecursiveMode::NonRecursive)?;

    let mut map = WATCHERS.lock().map_err(|_| FsError::Lock)?;
    map.insert(watch_id.clone(), watcher);

    Ok(WatchStartedResponse { path: normalized.display().to_string(), watch_id })
}

fn normalize_existing_file(path: &str) -> Result<PathBuf, FsError> {
    let target = normalize_path(path)?;

    if !target.exists() {
        return Err(FsError::FileNotFound(target.display().to_string()));
    }

    if target.is_dir() {
        return Err(FsError::IsDirectory(target.display().to_string()));
    }

    Ok(target)
}

fn normalize_write_target(path: &str) -> Result<PathBuf, FsError> {
    let target = normalize_path(path)?;

    if target.is_dir() {
        return Err(FsError::IsDirectory(target.display().to_string()));
    }

    if let Some(parent) = target.parent() {
        if !parent.exists() {
            return Err(FsError::InvalidPath(format!(
                "parent directory does not exist: {}",
                parent.display()
            )));
        }
    }

    Ok(target)
}

fn normalize_path(path: &str) -> Result<PathBuf, FsError> {
    if path.trim().is_empty() {
        return Err(FsError::EmptyPath);
    }

    let target = PathBuf::from(path);

    if target.file_name().is_none() {
        return Err(FsError::InvalidPath(path.to_string()));
    }

    Ok(target)
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<u64, FsError> {
    let parent = path.parent().ok_or_else(|| FsError::InvalidPath(path.display().to_string()))?;
    let file_name = path
        .file_name()
        .and_then(|f| f.to_str())
        .ok_or_else(|| FsError::InvalidPath(path.display().to_string()))?;

    let stamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();

    let tmp_path = parent.join(format!(".{file_name}.ferrumnote-{stamp}.tmp"));

    let mut tmp_file = fs::OpenOptions::new()
        .create_new(true)
        .write(true)
        .open(&tmp_path)
        .map_err(|err| map_permission_err(err, path))?;

    tmp_file.write_all(bytes)?;
    tmp_file.sync_all()?;

    match fs::rename(&tmp_path, path) {
        Ok(_) => Ok(bytes.len() as u64),
        Err(_) => {
            if path.exists() {
                fs::remove_file(path)?;
                fs::rename(&tmp_path, path)?;
                Ok(bytes.len() as u64)
            } else {
                Err(FsError::Io(std::io::Error::other("atomic rename failed")))
            }
        }
    }
}

fn hash_version(bytes: &[u8], last_modified: u64) -> u64 {
    let mut hasher = DefaultHasher::new();
    bytes.hash(&mut hasher);
    last_modified.hash(&mut hasher);
    hasher.finish()
}

fn last_modified_epoch_ms(metadata: &fs::Metadata) -> u64 {
    metadata
        .modified()
        .ok()
        .and_then(|m| m.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or_default()
}

fn make_watch_id() -> String {
    let nanos = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_nanos();
    format!("watch-{nanos}")
}

fn map_permission_err(err: std::io::Error, path: &Path) -> FsError {
    if err.kind() == std::io::ErrorKind::PermissionDenied {
        FsError::PermissionDenied(path.display().to_string())
    } else {
        FsError::Io(err)
    }
}
