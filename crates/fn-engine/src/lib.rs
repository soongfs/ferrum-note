pub mod ast;
pub mod parser;
pub mod registry;
pub mod render_snapshot;
pub mod rope;
pub mod selection;
pub mod transaction;

use ast::BlockNode;
use parser::{normalize_code_language, parse_document};
use registry::EnginePluginRegistry;
use render_snapshot::{build_snapshot, EditorSnapshot};
use rope::RopeText;
use selection::{Selection, TextRange};
use thiserror::Error;
use transaction::{EngineCommand, EngineTransaction, TransactionKind};

#[derive(Debug, Error, Clone, PartialEq, Eq)]
pub enum EngineError {
    #[error("invalid utf-8 range {start}..{end}")]
    InvalidUtf8Range { start: usize, end: usize },
    #[error("selection is out of bounds")]
    SelectionOutOfBounds,
    #[error("unsupported command: {0}")]
    UnsupportedCommand(String),
}

pub type Result<T> = std::result::Result<T, EngineError>;

#[derive(Debug, Clone)]
pub struct Doc {
    pub text: RopeText,
    pub blocks: Vec<BlockNode>,
    pub revision: u64,
}

#[derive(Debug, Clone)]
struct HistoryState {
    markdown: String,
    selection: Selection,
    revision: u64,
}

#[derive(Debug, Clone)]
pub struct Engine {
    doc: Doc,
    selection: Selection,
    history: Vec<HistoryState>,
    future: Vec<HistoryState>,
    registry: EnginePluginRegistry,
}

impl Doc {
    pub fn parse(markdown: impl Into<String>, revision: u64) -> Self {
        let markdown = markdown.into();
        Self { blocks: parse_document(&markdown), text: RopeText::new(markdown), revision }
    }
}

impl Engine {
    pub fn new(markdown: impl Into<String>) -> Self {
        let doc = Doc::parse(markdown, 0);
        let selection = Selection::collapsed(0);
        Self {
            doc,
            selection,
            history: Vec::new(),
            future: Vec::new(),
            registry: EnginePluginRegistry::core_markdown(),
        }
    }

    pub fn snapshot(&self) -> EditorSnapshot {
        build_snapshot(&self.doc, self.selection)
    }

    pub fn markdown(&self) -> String {
        self.doc.text.to_string()
    }

    pub fn registry(&self) -> &EnginePluginRegistry {
        &self.registry
    }

    pub fn doc(&self) -> &Doc {
        &self.doc
    }

    pub fn selection(&self) -> Selection {
        self.selection
    }

    pub fn set_markdown(&mut self, markdown: impl Into<String>) -> EditorSnapshot {
        let next_markdown = markdown.into();
        self.history.push(self.capture_state());
        self.future.clear();
        self.doc = Doc::parse(next_markdown, self.doc.revision + 1);
        self.selection = self.selection.clamp(self.doc.text.len_utf8() as u32);
        self.snapshot()
    }

    pub fn set_selection(&mut self, anchor_utf8: u32, head_utf8: u32) -> Result<Selection> {
        let max = self.doc.text.len_utf8() as u32;
        if anchor_utf8 > max || head_utf8 > max {
            return Err(EngineError::SelectionOutOfBounds);
        }
        self.selection = Selection { anchor_utf8, head_utf8 };
        Ok(self.selection)
    }

    pub fn replace_text(
        &mut self,
        start_utf8: u32,
        end_utf8: u32,
        insert: impl Into<String>,
    ) -> Result<EngineTransaction> {
        let range = TextRange::new(start_utf8, end_utf8);
        let insert = insert.into();
        let selection_before = self.selection;
        self.ensure_range(range)?;
        self.history.push(self.capture_state());
        self.future.clear();

        let (effective_range, effective_insert, selection_after) =
            self.transform_insert(range, &insert)?;
        self.doc.text.replace_range(effective_range, &effective_insert)?;
        self.reparse(self.doc.revision + 1);
        self.selection = selection_after.clamp(self.doc.text.len_utf8() as u32);

        Ok(EngineTransaction {
            kind: TransactionKind::ReplaceText { range: effective_range, insert: effective_insert },
            selection_before,
            selection_after: self.selection,
            revision_before: self.doc.revision.saturating_sub(1),
            revision_after: self.doc.revision,
        })
    }

    pub fn apply_command(&mut self, command: EngineCommand) -> Result<EngineTransaction> {
        match command {
            EngineCommand::Undo => self.undo_transaction(),
            EngineCommand::Redo => self.redo_transaction(),
            other => {
                let selection_before = self.selection;
                let revision_before = self.doc.revision;
                self.history.push(self.capture_state());
                self.future.clear();
                self.apply_non_history_command(&other)?;
                self.reparse(revision_before + 1);
                self.selection = self.selection.clamp(self.doc.text.len_utf8() as u32);
                Ok(EngineTransaction {
                    kind: TransactionKind::ApplyCommand { command: other },
                    selection_before,
                    selection_after: self.selection,
                    revision_before,
                    revision_after: self.doc.revision,
                })
            }
        }
    }

    pub fn undo(&mut self) -> Result<EditorSnapshot> {
        self.undo_transaction().map(|_| self.snapshot())
    }

    pub fn redo(&mut self) -> Result<EditorSnapshot> {
        self.redo_transaction().map(|_| self.snapshot())
    }

    fn apply_non_history_command(&mut self, command: &EngineCommand) -> Result<()> {
        match command {
            EngineCommand::ToggleStrong => self.toggle_wrapping_marker("**"),
            EngineCommand::ToggleEmphasis => self.toggle_wrapping_marker("*"),
            EngineCommand::ToggleInlineCode => self.toggle_wrapping_marker("`"),
            EngineCommand::ToggleHeading { level } => {
                self.toggle_line_prefix(&format!("{} ", "#".repeat((*level).clamp(1, 6) as usize)))
            }
            EngineCommand::ToggleBlockquote => self.toggle_line_prefix("> "),
            EngineCommand::ToggleBulletList => self.toggle_line_prefix("- "),
            EngineCommand::ToggleOrderedList => self.toggle_ordered_list_prefix(),
            EngineCommand::InsertFence { language } => self.insert_fence(language.clone()),
            EngineCommand::Undo | EngineCommand::Redo => Ok(()),
        }
    }

    fn undo_transaction(&mut self) -> Result<EngineTransaction> {
        let Some(previous) = self.history.pop() else {
            return Ok(EngineTransaction {
                kind: TransactionKind::ApplyCommand { command: EngineCommand::Undo },
                selection_before: self.selection,
                selection_after: self.selection,
                revision_before: self.doc.revision,
                revision_after: self.doc.revision,
            });
        };

        let current = self.capture_state();
        let selection_before = self.selection;
        let revision_before = self.doc.revision;
        self.future.push(current);
        self.restore_state(previous);

        Ok(EngineTransaction {
            kind: TransactionKind::ApplyCommand { command: EngineCommand::Undo },
            selection_before,
            selection_after: self.selection,
            revision_before,
            revision_after: self.doc.revision,
        })
    }

    fn redo_transaction(&mut self) -> Result<EngineTransaction> {
        let Some(next) = self.future.pop() else {
            return Ok(EngineTransaction {
                kind: TransactionKind::ApplyCommand { command: EngineCommand::Redo },
                selection_before: self.selection,
                selection_after: self.selection,
                revision_before: self.doc.revision,
                revision_after: self.doc.revision,
            });
        };

        let current = self.capture_state();
        let selection_before = self.selection;
        let revision_before = self.doc.revision;
        self.history.push(current);
        self.restore_state(next);

        Ok(EngineTransaction {
            kind: TransactionKind::ApplyCommand { command: EngineCommand::Redo },
            selection_before,
            selection_after: self.selection,
            revision_before,
            revision_after: self.doc.revision,
        })
    }

    fn toggle_wrapping_marker(&mut self, marker: &str) -> Result<()> {
        let selection = self.selection.range();
        let markdown = self.doc.text.as_str().to_string();
        let marker_len = marker.len() as u32;

        if selection.len() == 0 {
            let insert = format!("{marker}{marker}");
            self.doc.text.replace_range(selection, &insert)?;
            let cursor = selection.start_utf8 + marker_len;
            self.selection = Selection::collapsed(cursor);
            return Ok(());
        }

        let start = selection.start_utf8 as usize;
        let end = selection.end_utf8 as usize;
        if start >= marker.len()
            && end + marker.len() <= markdown.len()
            && markdown[start - marker.len()..start] == *marker
            && markdown[end..end + marker.len()] == *marker
        {
            self.doc.text.replace_range(
                TextRange::new(selection.end_utf8, selection.end_utf8 + marker_len),
                "",
            )?;
            self.doc.text.replace_range(
                TextRange::new(selection.start_utf8 - marker_len, selection.start_utf8),
                "",
            )?;
            self.selection = Selection {
                anchor_utf8: selection.start_utf8 - marker_len,
                head_utf8: selection.end_utf8 - marker_len,
            };
            return Ok(());
        }

        self.doc
            .text
            .replace_range(TextRange::new(selection.end_utf8, selection.end_utf8), marker)?;
        self.doc
            .text
            .replace_range(TextRange::new(selection.start_utf8, selection.start_utf8), marker)?;
        self.selection = Selection {
            anchor_utf8: selection.start_utf8 + marker_len,
            head_utf8: selection.end_utf8 + marker_len,
        };
        Ok(())
    }

    fn toggle_line_prefix(&mut self, prefix: &str) -> Result<()> {
        let markdown = self.doc.text.as_str().to_string();
        let anchor = self.selection.range().start_utf8 as usize;
        let (line_start, line_end) = line_bounds(&markdown, anchor);
        let line = &markdown[line_start..line_end];
        let prefix_len = prefix.len() as u32;

        if line.starts_with(prefix) {
            self.doc.text.replace_range(
                TextRange::new(line_start as u32, line_start as u32 + prefix_len),
                "",
            )?;
            self.selection =
                shift_selection(self.selection, line_start as u32, -(prefix_len as i32));
        } else {
            self.doc
                .text
                .replace_range(TextRange::new(line_start as u32, line_start as u32), prefix)?;
            self.selection = shift_selection(self.selection, line_start as u32, prefix_len as i32);
        }
        Ok(())
    }

    fn toggle_ordered_list_prefix(&mut self) -> Result<()> {
        let markdown = self.doc.text.as_str().to_string();
        let anchor = self.selection.range().start_utf8 as usize;
        let (line_start, line_end) = line_bounds(&markdown, anchor);
        let line = &markdown[line_start..line_end];

        if let Some((_number, prefix_len)) = parse_ordered_prefix(line) {
            self.doc.text.replace_range(
                TextRange::new(line_start as u32, (line_start + prefix_len) as u32),
                "",
            )?;
            self.selection =
                shift_selection(self.selection, line_start as u32, -(prefix_len as i32));
        } else {
            let prefix = "1. ";
            self.doc
                .text
                .replace_range(TextRange::new(line_start as u32, line_start as u32), prefix)?;
            self.selection =
                shift_selection(self.selection, line_start as u32, prefix.len() as i32);
        }
        Ok(())
    }

    fn insert_fence(&mut self, language: Option<String>) -> Result<()> {
        let selection = self.selection.range();
        let language = language.as_deref().and_then(normalize_code_language).unwrap_or_default();
        let opening =
            if language.is_empty() { "```".to_string() } else { format!("```{language}") };
        let insert = format!("{opening}\n\n```");
        self.doc.text.replace_range(selection, &insert)?;
        let cursor = selection.start_utf8 + opening.len() as u32 + 1;
        self.selection = Selection::collapsed(cursor);
        Ok(())
    }

    fn transform_insert(
        &self,
        range: TextRange,
        insert: &str,
    ) -> Result<(TextRange, String, Selection)> {
        if insert != "\n" {
            let next_cursor = range.start_utf8 + insert.len() as u32;
            return Ok((range, insert.to_string(), Selection::collapsed(next_cursor)));
        }

        let markdown = self.doc.text.as_str();
        let cursor = range.start_utf8 as usize;
        let (line_start, line_end) = line_bounds(markdown, cursor);
        let line = &markdown[line_start..line_end];
        let trimmed = line.trim_end_matches('\r');

        if range.len() == 0
            && cursor == line_end
            && is_fence_trigger_line(trimmed)
            && !has_closing_fence_below(markdown, line_end)
        {
            let normalized_opening = normalize_fence_opening(trimmed);
            let insert = format!("{normalized_opening}\n\n```");
            let selection =
                Selection::collapsed(line_start as u32 + normalized_opening.len() as u32 + 1);
            return Ok((TextRange::new(line_start as u32, range.end_utf8), insert, selection));
        }

        if range.len() == 0 && cursor == line_end {
            if let Some(prefix) = list_continuation_prefix(trimmed) {
                let insert = format!("\n{prefix}");
                let selection = Selection::collapsed(range.start_utf8 + insert.len() as u32);
                return Ok((range, insert, selection));
            }
        }

        let next_cursor = range.start_utf8 + 1;
        Ok((range, "\n".to_string(), Selection::collapsed(next_cursor)))
    }

    fn ensure_range(&self, range: TextRange) -> Result<()> {
        let start = range.start_utf8 as usize;
        let end = range.end_utf8 as usize;
        if start > end || end > self.doc.text.len_utf8() {
            return Err(EngineError::InvalidUtf8Range { start, end });
        }
        Ok(())
    }

    fn capture_state(&self) -> HistoryState {
        HistoryState {
            markdown: self.markdown(),
            selection: self.selection,
            revision: self.doc.revision,
        }
    }

    fn restore_state(&mut self, state: HistoryState) {
        self.doc = Doc::parse(state.markdown, state.revision);
        self.selection = state.selection.clamp(self.doc.text.len_utf8() as u32);
    }

    fn reparse(&mut self, revision: u64) {
        let markdown = self.markdown();
        self.doc = Doc::parse(markdown, revision);
    }
}

fn line_bounds(markdown: &str, offset: usize) -> (usize, usize) {
    let clamped = offset.min(markdown.len());
    let start = markdown[..clamped].rfind('\n').map(|index| index + 1).unwrap_or(0);
    let end = markdown[clamped..].find('\n').map(|index| clamped + index).unwrap_or(markdown.len());
    (start, end)
}

fn shift_selection(selection: Selection, pivot: u32, delta: i32) -> Selection {
    Selection {
        anchor_utf8: shift_offset(selection.anchor_utf8, pivot, delta),
        head_utf8: shift_offset(selection.head_utf8, pivot, delta),
    }
}

fn shift_offset(offset: u32, pivot: u32, delta: i32) -> u32 {
    if offset < pivot {
        return offset;
    }
    if delta.is_negative() {
        offset.saturating_sub(delta.unsigned_abs())
    } else {
        offset.saturating_add(delta as u32)
    }
}

fn is_fence_trigger_line(line: &str) -> bool {
    let Some(rest) = line.strip_prefix("```") else {
        return false;
    };
    rest.chars().all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '_' | '-' | '+' | '#'))
}

fn has_closing_fence_below(markdown: &str, line_end: usize) -> bool {
    markdown[line_end..].lines().any(|line| line.trim() == "```")
}

fn normalize_fence_opening(line: &str) -> String {
    let suffix = line.strip_prefix("```").unwrap_or_default();
    let normalized = normalize_code_language(suffix).unwrap_or_default();

    if normalized.is_empty() {
        "```".to_string()
    } else {
        format!("```{normalized}")
    }
}

fn list_continuation_prefix(line: &str) -> Option<String> {
    if line.starts_with("> ") && line[2..].trim().is_empty().not() {
        return Some("> ".to_string());
    }

    if line.starts_with("- ") && line[2..].trim().is_empty().not() {
        return Some("- ".to_string());
    }

    if let Some((number, prefix_len)) = parse_ordered_prefix(line) {
        if line[prefix_len..].trim().is_empty().not() {
            return Some(format!("{}. ", number + 1));
        }
    }

    None
}

fn parse_ordered_prefix(line: &str) -> Option<(u32, usize)> {
    let digits = line.chars().take_while(|ch| ch.is_ascii_digit()).count();
    if digits == 0 {
        return None;
    }
    if !line[digits..].starts_with(". ") {
        return None;
    }
    Some((line[..digits].parse::<u32>().ok()?, digits + 2))
}

trait BoolExt {
    fn not(self) -> bool;
}

impl BoolExt for bool {
    fn not(self) -> bool {
        !self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::render_snapshot::RenderBlockKind;

    #[test]
    fn parses_core_markdown_blocks() {
        let engine = Engine::new("# Heading\n\n> Quote\n\n- Item\n\n```python\nprint(1)\n```\n");
        let snapshot = engine.snapshot();
        assert!(snapshot.blocks.iter().any(|block| block.kind == RenderBlockKind::Heading));
        assert!(snapshot
            .blocks
            .iter()
            .any(|block| block.kind == RenderBlockKind::BlockquoteParagraph));
        assert!(snapshot.blocks.iter().any(|block| block.kind == RenderBlockKind::BulletListItem));
        assert!(snapshot.blocks.iter().any(|block| block.kind == RenderBlockKind::FencedCode));
    }

    #[test]
    fn preserves_round_trip_markdown() {
        let markdown = "Paragraph with **bold** and `code` and [link](https://example.com).";
        let engine = Engine::new(markdown);
        assert_eq!(engine.markdown(), markdown);
    }

    #[test]
    fn auto_closes_fence_on_enter() {
        let mut engine = Engine::new("```py");
        engine.set_selection(5, 5).unwrap();
        engine.replace_text(5, 5, "\n").unwrap();
        assert_eq!(engine.markdown(), "```python\n\n```");
        assert_eq!(engine.selection(), Selection::collapsed(10));
    }

    #[test]
    fn keeps_inline_code_stable_on_enter() {
        let mut engine = Engine::new("`test`");
        engine.set_selection(6, 6).unwrap();
        engine.replace_text(6, 6, "\n").unwrap();
        assert_eq!(engine.markdown(), "`test`\n");
    }

    #[test]
    fn toggles_wrapping_markers() {
        let mut engine = Engine::new("hello");
        engine.set_selection(0, 5).unwrap();
        engine.apply_command(EngineCommand::ToggleStrong).unwrap();
        assert_eq!(engine.markdown(), "**hello**");
        engine.set_selection(2, 7).unwrap();
        engine.apply_command(EngineCommand::ToggleStrong).unwrap();
        assert_eq!(engine.markdown(), "hello");
    }

    #[test]
    fn supports_undo_redo() {
        let mut engine = Engine::new("hello");
        engine.replace_text(5, 5, " world").unwrap();
        assert_eq!(engine.markdown(), "hello world");
        engine.undo().unwrap();
        assert_eq!(engine.markdown(), "hello");
        engine.redo().unwrap();
        assert_eq!(engine.markdown(), "hello world");
    }
}
