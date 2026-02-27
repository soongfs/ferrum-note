use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AppConfig {
    pub autosave_ms: u64,
    pub theme: String,
    pub font_size: u16,
    pub recent_files_limit: usize,
    pub line_width_hint: u16,
    pub ui_language: String,
    pub show_debug_panels: bool,
    pub workspace_root: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            autosave_ms: 1500,
            theme: "light".to_string(),
            font_size: 16,
            recent_files_limit: 20,
            line_width_hint: 88,
            ui_language: "en".to_string(),
            show_debug_panels: false,
            workspace_root: None,
        }
    }
}

#[derive(Debug, Deserialize)]
struct PartialConfig {
    autosave_ms: Option<u64>,
    theme: Option<String>,
    font_size: Option<u16>,
    recent_files_limit: Option<usize>,
    line_width_hint: Option<u16>,
    ui_language: Option<String>,
    show_debug_panels: Option<bool>,
    workspace_root: Option<String>,
}

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("toml parse error: {0}")]
    Parse(#[from] toml::de::Error),
    #[error("toml serialize error: {0}")]
    Serialize(#[from] toml::ser::Error),
    #[error("home path not available")]
    HomeUnavailable,
    #[error("invalid workspace root: {0}")]
    InvalidWorkspaceRoot(String),
}

pub fn load() -> Result<AppConfig, ConfigError> {
    let path = default_config_path()?;
    load_from_path(path)
}

pub fn load_from_path<P: AsRef<Path>>(path: P) -> Result<AppConfig, ConfigError> {
    let path = path.as_ref();

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let raw = fs::read_to_string(path)?;
    if raw.trim().is_empty() {
        return Ok(AppConfig::default());
    }

    let partial: PartialConfig = toml::from_str(&raw)?;
    Ok(merge_with_default(partial))
}

pub fn write_default_if_missing() -> Result<PathBuf, ConfigError> {
    let path = default_config_path()?;

    if path.exists() {
        return Ok(path);
    }

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    write_to_path(&path, &AppConfig::default())?;

    Ok(path)
}

pub fn set_workspace_root(path: &str) -> Result<AppConfig, ConfigError> {
    let config_path = default_config_path()?;
    set_workspace_root_at_path(path, &config_path)
}

pub fn default_config_path() -> Result<PathBuf, ConfigError> {
    let home = std::env::var("HOME").map_err(|_| ConfigError::HomeUnavailable)?;
    Ok(PathBuf::from(home).join(".ferrumnote").join("config.toml"))
}

fn merge_with_default(partial: PartialConfig) -> AppConfig {
    let defaults = AppConfig::default();

    AppConfig {
        autosave_ms: partial.autosave_ms.unwrap_or(defaults.autosave_ms),
        theme: partial.theme.unwrap_or(defaults.theme),
        font_size: partial.font_size.unwrap_or(defaults.font_size),
        recent_files_limit: partial.recent_files_limit.unwrap_or(defaults.recent_files_limit),
        line_width_hint: partial.line_width_hint.unwrap_or(defaults.line_width_hint),
        ui_language: partial.ui_language.unwrap_or(defaults.ui_language),
        show_debug_panels: partial.show_debug_panels.unwrap_or(defaults.show_debug_panels),
        workspace_root: partial
            .workspace_root
            .and_then(|root| if root.trim().is_empty() { None } else { Some(root) })
            .or(defaults.workspace_root),
    }
}

fn set_workspace_root_at_path<P: AsRef<Path>>(
    workspace_path: &str,
    config_path: P,
) -> Result<AppConfig, ConfigError> {
    if workspace_path.trim().is_empty() {
        return Err(ConfigError::InvalidWorkspaceRoot("workspace root is empty".to_string()));
    }

    let workspace = PathBuf::from(workspace_path);
    if !workspace.exists() {
        return Err(ConfigError::InvalidWorkspaceRoot(format!(
            "workspace root does not exist: {}",
            workspace.display()
        )));
    }
    if !workspace.is_dir() {
        return Err(ConfigError::InvalidWorkspaceRoot(format!(
            "workspace root is not a directory: {}",
            workspace.display()
        )));
    }

    let canonical = workspace.canonicalize()?;
    let config_path = config_path.as_ref();
    let mut config = load_from_path(config_path)?;
    config.workspace_root = Some(canonical.display().to_string());
    write_to_path(config_path, &config)?;
    Ok(config)
}

fn write_to_path(path: &Path, config: &AppConfig) -> Result<(), ConfigError> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }

    let content = toml::to_string_pretty(config)?;
    fs::write(path, content)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn set_workspace_root_persists_to_config_file() {
        let temp = tempdir().expect("temp dir should be created");
        let workspace = temp.path().join("workspace");
        let config_path = temp.path().join(".ferrumnote").join("config.toml");
        fs::create_dir_all(&workspace).expect("workspace should be created");

        let saved = set_workspace_root_at_path(
            workspace.to_str().expect("workspace path must be utf-8"),
            &config_path,
        )
        .expect("workspace root should be saved");

        let expected = workspace
            .canonicalize()
            .expect("canonical workspace path should resolve")
            .display()
            .to_string();
        assert_eq!(saved.workspace_root, Some(expected.clone()));

        let loaded = load_from_path(&config_path).expect("config should reload");
        assert_eq!(loaded.workspace_root, Some(expected));
    }

    #[test]
    fn set_workspace_root_rejects_missing_directory() {
        let temp = tempdir().expect("temp dir should be created");
        let missing = temp.path().join("missing");
        let config_path = temp.path().join(".ferrumnote").join("config.toml");

        let err = set_workspace_root_at_path(
            missing.to_str().expect("missing path must be utf-8"),
            &config_path,
        )
        .expect_err("missing path should be rejected");

        assert!(matches!(err, ConfigError::InvalidWorkspaceRoot(_)));
    }
}
