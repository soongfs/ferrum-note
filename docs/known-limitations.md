# Known Limitations (v0.1.0-alpha.1)

- Rust and pnpm toolchains are required but not bundled.
- PDF export depends on `wkhtmltopdf`; when unavailable, export falls back to `.fallback.html`.
- Search/replace currently targets Markdown source text and does not provide in-editor highlight navigation.
- File watcher is started but frontend event broadcast integration is not fully wired yet.
- No cloud sync, collaboration, or plugin marketplace in this release.
- Syntax lens currently focuses on inline markers and core block types; task-list and table marker direct editing are not included yet.
