use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct DocId(pub String);

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct OpenFileResponse {
    pub path: String,
    pub content: String,
    pub version: u64,
    pub last_modified: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct SaveFileResponse {
    pub path: String,
    pub version: u64,
    pub bytes_written: u64,
    pub conflict: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ExportResponse {
    pub output_path: String,
    pub bytes_written: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WatchStartedResponse {
    pub path: String,
    pub watch_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EditorSyncPayload {
    pub doc_id: String,
    pub markdown: String,
    pub version: u64,
    pub dirty: bool,
    pub changed_blocks: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WorkspaceEntryKind {
    Directory,
    Markdown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct WorkspaceEntry {
    pub name: String,
    pub relative_path: String,
    pub absolute_path: String,
    pub kind: WorkspaceEntryKind,
    pub modified_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ListWorkspaceEntriesResponse {
    pub root_path: String,
    pub current_relative_path: String,
    pub entries: Vec<WorkspaceEntry>,
}
