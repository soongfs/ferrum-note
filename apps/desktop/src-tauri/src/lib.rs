use fn_config::AppConfig;
use fn_core::{
    ExportResponse, ListWorkspaceEntriesResponse, OpenFileResponse, SaveFileResponse,
    WatchStartedResponse,
};

#[tauri::command]
fn open_file(path: String) -> Result<OpenFileResponse, String> {
    fn_fs::open_file(&path).map_err(|err| err.to_string())
}

#[tauri::command]
fn save_file(
    path: String,
    content: String,
    expected_version: u64,
) -> Result<SaveFileResponse, String> {
    fn_fs::save_file(&path, &content, expected_version).map_err(|err| err.to_string())
}

#[tauri::command]
fn save_as_file(path: String, content: String) -> Result<SaveFileResponse, String> {
    fn_fs::save_as_file(&path, &content).map_err(|err| err.to_string())
}

#[tauri::command]
fn export_html(path: String, content: String) -> Result<ExportResponse, String> {
    fn_export::export_html(&path, &content).map_err(|err| err.to_string())
}

#[tauri::command]
fn export_pdf(path: String, content: String) -> Result<ExportResponse, String> {
    fn_export::export_pdf(&path, &content).map_err(|err| err.to_string())
}

#[tauri::command]
fn watch_file(path: String) -> Result<WatchStartedResponse, String> {
    fn_fs::watch_file(&path).map_err(|err| err.to_string())
}

#[tauri::command]
fn load_app_config() -> Result<AppConfig, String> {
    fn_config::load().map_err(|err| err.to_string())
}

#[tauri::command]
fn set_workspace_root(path: String) -> Result<AppConfig, String> {
    fn_config::set_workspace_root(&path).map_err(|err| err.to_string())
}

#[tauri::command]
fn list_workspace_entries(
    relative_path: Option<String>,
) -> Result<ListWorkspaceEntriesResponse, String> {
    let config = fn_config::load().map_err(|err| err.to_string())?;
    let root =
        config.workspace_root.ok_or_else(|| "workspace root is not configured".to_string())?;

    fn_fs::list_workspace_entries(&root, relative_path.as_deref()).map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_file,
            save_file,
            save_as_file,
            export_html,
            export_pdf,
            watch_file,
            load_app_config,
            set_workspace_root,
            list_workspace_entries
        ])
        .run(tauri::generate_context!())
        .expect("error while running FerrumNote");
}
