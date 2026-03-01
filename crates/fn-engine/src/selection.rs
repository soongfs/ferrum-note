use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct TextRange {
    pub start_utf8: u32,
    pub end_utf8: u32,
}

impl TextRange {
    pub fn new(start_utf8: u32, end_utf8: u32) -> Self {
        Self { start_utf8, end_utf8 }
    }

    pub fn len(self) -> u32 {
        self.end_utf8.saturating_sub(self.start_utf8)
    }
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct Selection {
    pub anchor_utf8: u32,
    pub head_utf8: u32,
}

impl Selection {
    pub fn collapsed(offset: u32) -> Self {
        Self { anchor_utf8: offset, head_utf8: offset }
    }

    pub fn range(self) -> TextRange {
        if self.anchor_utf8 <= self.head_utf8 {
            TextRange::new(self.anchor_utf8, self.head_utf8)
        } else {
            TextRange::new(self.head_utf8, self.anchor_utf8)
        }
    }

    pub fn is_collapsed(self) -> bool {
        self.anchor_utf8 == self.head_utf8
    }

    pub fn clamp(self, max: u32) -> Self {
        Self { anchor_utf8: self.anchor_utf8.min(max), head_utf8: self.head_utf8.min(max) }
    }
}
