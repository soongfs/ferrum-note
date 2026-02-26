# FerrumNote MVP Scope

## In Scope
- Open/save/save-as Markdown files
- Typora-style editing with TipTap
- Undo/redo and keyboard shortcuts
- Find/replace in current document
- Autosave (default 1500ms)
- HTML/PDF export
- Cross-platform packaging (Windows/macOS/Linux)
- Runtime capability split:
  - `tauri` mode: full desktop features (file IO/export/watch)
  - `web` mode: editing/search/replace only, desktop-only actions disabled with notice

## Out of Scope
- Cloud sync
- Real-time collaboration
- Plugin marketplace
- Multi-document tabs and workspace explorer

## Acceptance Baseline
- Can open and edit large Markdown files (1MB, 5MB, 20MB)
- Round-trip keeps heading/list/blockquote/code/link semantics
- Conflict detection when file changes externally
- Exported HTML/PDF preserves structure and code blocks
- Browser mode (`pnpm dev`) does not call desktop-only commands and clearly shows degraded capabilities
