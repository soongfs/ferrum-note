use serde::{Deserialize, Serialize};

use crate::selection::{Selection, TextRange};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct EngineTransaction {
    pub kind: TransactionKind,
    pub selection_before: Selection,
    pub selection_after: Selection,
    pub revision_before: u64,
    pub revision_after: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum TransactionKind {
    ReplaceText { range: TextRange, insert: String },
    ApplyCommand { command: EngineCommand },
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum EngineCommand {
    ToggleStrong,
    ToggleEmphasis,
    ToggleInlineCode,
    ToggleHeading { level: u8 },
    ToggleBlockquote,
    ToggleBulletList,
    ToggleOrderedList,
    InsertFence { language: Option<String> },
    Undo,
    Redo,
}

impl EngineCommand {
    pub fn parse(input: &str) -> Option<Self> {
        match input {
            "toggle_strong" => Some(Self::ToggleStrong),
            "toggle_emphasis" => Some(Self::ToggleEmphasis),
            "toggle_inline_code" => Some(Self::ToggleInlineCode),
            "toggle_blockquote" => Some(Self::ToggleBlockquote),
            "toggle_bullet_list" => Some(Self::ToggleBulletList),
            "toggle_ordered_list" => Some(Self::ToggleOrderedList),
            "undo" => Some(Self::Undo),
            "redo" => Some(Self::Redo),
            _ if input.starts_with("toggle_heading:") => {
                let level = input.split(':').nth(1)?.parse::<u8>().ok()?;
                Some(Self::ToggleHeading { level })
            }
            _ if input.starts_with("insert_fence") => {
                let language = input.split_once(':').and_then(|(_, value)| {
                    let trimmed = value.trim();
                    if trimmed.is_empty() {
                        None
                    } else {
                        Some(trimmed.to_string())
                    }
                });
                Some(Self::InsertFence { language })
            }
            _ => None,
        }
    }
}
