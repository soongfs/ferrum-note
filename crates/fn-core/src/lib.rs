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
