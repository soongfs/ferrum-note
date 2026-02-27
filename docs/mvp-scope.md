# FerrumNote MVP Scope

## In Scope
- Open/save/save-as Markdown files
- Open Folder workspace selection + workspace explorer
- Typora-style editing with TipTap
- Writer/Source mode switching (`Ctrl/Cmd+Shift+M`)
- Source mode based on CodeMirror 6 (line numbers + wrapping)
- Writer mode Markdown syntax lens (inline + core block markers editable)
- Undo/redo and keyboard shortcuts
- Find/replace in current document
- Autosave (default 1500ms)
- HTML/PDF export
- Cross-platform packaging (Windows/macOS/Linux)
- Runtime capability split:
  - `tauri` mode: full desktop features (file IO/export/watch/explorer)
  - `web` mode: editing/search/replace/status only, desktop-only actions disabled with notice

## Out of Scope
- Cloud sync
- Real-time collaboration
- Plugin marketplace
- Multi-document tabs

## Acceptance Baseline
- Can open and edit large Markdown files (1MB, 5MB, 20MB)
- Round-trip keeps heading/list/blockquote/code/link semantics
- Conflict detection when file changes externally
- Exported HTML/PDF preserves structure and code blocks
- Workspace explorer shows directories + Markdown files only and opens files correctly
- Browser mode (`pnpm dev`) does not call desktop-only commands and clearly shows degraded capabilities
- Writer/Source switch keeps Markdown content consistent with no data loss
- Fenced code blocks preserve language (`python`, `c`, etc.) and show visible syntax highlighting
