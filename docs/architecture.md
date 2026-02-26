# FerrumNote Architecture

## Overview
FerrumNote is a desktop Markdown editor with Typora-like editing UX.

- Frontend: React + TipTap (editing interaction, selection, IME behavior, toolbar, shortcuts)
- Desktop runtime: Tauri 2
- Rust domain crates:
  - `fn-core`: shared domain types and payload contracts
  - `fn-fs`: document IO, version guards, file watcher
  - `fn-export`: HTML/PDF export
  - `fn-config`: app configuration from `~/.ferrumnote/config.toml`

## Source of Truth
Markdown text on disk is the single source of truth.

Runtime editor state is a projection for UX and command handling and is synchronized back to Markdown text using explicit version checks.

## Data Flow
1. Frontend calls `open_file(path)`.
2. Rust reads file and returns `{ content, version, last_modified }`.
3. Frontend applies edits and generates sync payload.
4. Frontend autosaves with `save_file(path, content, expected_version)`.
5. Rust writes atomically and bumps version.
6. File watcher reports external changes for conflict handling.

## Failure Strategy
- Permission and path errors are surfaced with actionable messages.
- Writes are atomic via temp file + rename.
- Version mismatch returns `conflict = true`.
- PDF export failure falls back to HTML export path.
