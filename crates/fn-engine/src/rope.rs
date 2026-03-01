use serde::{Deserialize, Serialize};

use crate::{selection::TextRange, EngineError, Result};

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct RopeText(String);

impl RopeText {
    pub fn new(text: impl Into<String>) -> Self {
        Self(text.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    pub fn len_utf8(&self) -> usize {
        self.0.len()
    }

    pub fn replace_range(&mut self, range: TextRange, insert: &str) -> Result<()> {
        let start = range.start_utf8 as usize;
        let end = range.end_utf8 as usize;

        if start > end || end > self.0.len() {
            return Err(EngineError::InvalidUtf8Range { start, end });
        }

        if !self.0.is_char_boundary(start) || !self.0.is_char_boundary(end) {
            return Err(EngineError::InvalidUtf8Range { start, end });
        }

        self.0.replace_range(start..end, insert);
        Ok(())
    }

    pub fn to_string(&self) -> String {
        self.0.clone()
    }
}
