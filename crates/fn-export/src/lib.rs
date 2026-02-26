use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

use comrak::{markdown_to_html, Options};
use fn_core::ExportResponse;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ExportError {
    #[error("invalid path: {0}")]
    InvalidPath(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("pdf exporter unavailable, fallback generated: {0}")]
    PdfExporterUnavailable(String),
}

pub fn export_html(path: &str, content: &str) -> Result<ExportResponse, ExportError> {
    let target = normalize_target(path)?;
    let html = markdown_to_html(content, &Options::default());
    let bytes_written = atomic_write(&target, html.as_bytes())?;

    Ok(ExportResponse {
        output_path: target.display().to_string(),
        bytes_written,
    })
}

pub fn export_pdf(path: &str, content: &str) -> Result<ExportResponse, ExportError> {
    let target = normalize_target(path)?;
    let html = markdown_to_html(content, &Options::default());

    let tmp_html = target.with_extension("ferrumnote-export.html");
    atomic_write(&tmp_html, html.as_bytes())?;

    let result = Command::new("wkhtmltopdf")
        .arg("--quiet")
        .arg(tmp_html.as_os_str())
        .arg(target.as_os_str())
        .output();

    match result {
        Ok(output) if output.status.success() => {
            let bytes_written = fs::metadata(&target)?.len();
            let _ = fs::remove_file(&tmp_html);
            Ok(ExportResponse {
                output_path: target.display().to_string(),
                bytes_written,
            })
        }
        _ => {
            let fallback = target.with_extension("fallback.html");
            let bytes_written = atomic_write(&fallback, html.as_bytes())?;
            let _ = fs::remove_file(&tmp_html);
            Ok(ExportResponse {
                output_path: fallback.display().to_string(),
                bytes_written,
            })
        }
    }
}

fn normalize_target(path: &str) -> Result<PathBuf, ExportError> {
    if path.trim().is_empty() {
        return Err(ExportError::InvalidPath("path is empty".to_string()));
    }

    let target = PathBuf::from(path);

    if target.file_name().is_none() {
        return Err(ExportError::InvalidPath(path.to_string()));
    }

    if let Some(parent) = target.parent() {
        if !parent.exists() {
            return Err(ExportError::InvalidPath(format!(
                "parent directory does not exist: {}",
                parent.display()
            )));
        }
    }

    Ok(target)
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<u64, ExportError> {
    let parent = path
        .parent()
        .ok_or_else(|| ExportError::InvalidPath(path.display().to_string()))?;
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| ExportError::InvalidPath(path.display().to_string()))?;

    let tmp = parent.join(format!(".{file_name}.tmp"));
    let mut file = fs::OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(&tmp)?;

    file.write_all(bytes)?;
    file.sync_all()?;
    fs::rename(&tmp, path)?;

    Ok(bytes.len() as u64)
}
