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
}

#[derive(Debug, Error)]
pub enum ConfigError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("toml parse error: {0}")]
    Parse(#[from] toml::de::Error),
    #[error("home path not available")]
    HomeUnavailable,
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

    let content = toml::to_string_pretty(&AppConfig::default())
        .expect("default config serialization should never fail");
    fs::write(&path, content)?;

    Ok(path)
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
    }
}
