# FerrumNote Architecture

## Overview
FerrumNote is a desktop Markdown editor with a self-hosted editing engine.

- Frontend shell: React
- Writer runtime: custom `contenteditable` surface backed by a Rust/WASM engine
- Source runtime: CodeMirror 6
- UI layout: workspace explorer (left), editor (right), status bar (bottom)
- Desktop runtime: Tauri 2
- Rust domain crates:
  - `fn-core`: shared domain types and payload contracts
  - `fn-fs`: document IO, version guards, file watcher, workspace listing
  - `fn-export`: HTML/PDF export
  - `fn-config`: app configuration from `~/.ferrumnote/config.toml`
  - `fn-engine`: Markdown parser, transactions, snapshot builder, plugin registry
  - `fn-engine-wasm`: renderer-facing WebAssembly wrapper around `fn-engine`

## Source of Truth
Markdown text is the single durable source of truth.

At runtime, FerrumNote keeps an engine-owned document model and selection state.
Writer mode renders an engine snapshot. Source mode edits raw Markdown and reparses the engine state.

## Data Flow
1. Frontend loads config and workspace root.
2. Frontend opens Markdown files through Tauri commands.
3. Rust returns `{ content, version, last_modified }`.
4. Frontend hydrates `fn-engine-wasm` with the Markdown string.
5. Writer mode applies engine transactions and emits fresh snapshots.
6. Source mode updates the raw Markdown string and reparses the engine.
7. Autosave persists Markdown to disk through `save_file(path, content, expected_version)`.
8. Rust writes atomically and bumps version.

## Failure Strategy
- Permission and path errors are surfaced with actionable messages.
- Writes are atomic via temp file + rename.
- Version mismatch returns `conflict = true`.
- Workspace explorer rejects path traversal outside configured root.
- Browser mode disables desktop-only capabilities explicitly.
- Engine development keeps generated WASM artifacts in `apps/desktop/src/engine/pkg` to avoid breaking the desktop build path.
