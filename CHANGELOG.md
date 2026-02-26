# Changelog

## v0.1.0-alpha.1 - 2026-02-27

### Added
- Rust workspace with Tauri desktop shell and React/TipTap editor.
- Core file lifecycle APIs (`open_file`, `save_file`, `save_as_file`, `watch_file`).
- Config loading from `~/.ferrumnote/config.toml` with defaults.
- Markdown find/replace and autosave synchronization flow.
- HTML/PDF export pipeline with fallback behavior.
- CI, release build workflows, and commit governance docs.

### Testing
- `fn-fs` integration tests for path validation and version conflict.
- Frontend markdown round-trip tests.
- Playwright e2e flow scaffolding.

### Known Notes
- PDF export depends on `wkhtmltopdf`; fallback path is `.fallback.html` when unavailable.
- Runtime verification is pending on an environment with Rust and pnpm installed.
