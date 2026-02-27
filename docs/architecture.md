# FerrumNote Architecture

## Overview
FerrumNote is a desktop Markdown editor with Typora-like editing UX.

- Frontend: React + TipTap (editing interaction, selection, IME behavior, toolbar, shortcuts)
- UI layout: workspace explorer (left), editor (right), status bar (bottom)
- Desktop runtime: Tauri 2
- Rust domain crates:
  - `fn-core`: shared domain types and payload contracts
  - `fn-fs`: document IO, version guards, file watcher, workspace listing
  - `fn-export`: HTML/PDF export
  - `fn-config`: app configuration from `~/.ferrumnote/config.toml` (including `workspace_root`)

## Source of Truth
Markdown text on disk is the single source of truth.

Runtime editor state is a projection for UX and command handling and is synchronized back to Markdown text using explicit version checks.

## Data Flow
1. Frontend sets workspace root with `set_workspace_root(path)`.
2. Frontend queries explorer entries via `list_workspace_entries(relative_path?)`.
3. Frontend opens Markdown files with `open_file(path)`.
4. Rust reads file and returns `{ content, version, last_modified }`.
5. Frontend applies edits and generates sync payload.
6. Frontend autosaves with `save_file(path, content, expected_version)`.
7. Rust writes atomically and bumps version.
8. File watcher reports external changes for conflict handling.

## Failure Strategy
- Permission and path errors are surfaced with actionable messages.
- Writes are atomic via temp file + rename.
- Version mismatch returns `conflict = true`.
- Workspace explorer rejects path traversal outside configured root.
- PDF export failure falls back to HTML export path.
