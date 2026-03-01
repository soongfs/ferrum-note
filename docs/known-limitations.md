# Known Limitations (v0.1.0-alpha.1)

- Rust and pnpm toolchains are required but not bundled.
- PDF export depends on `wkhtmltopdf`; when unavailable, export falls back to `.fallback.html`.
- Search/replace currently targets Markdown source text and does not provide in-editor highlight navigation.
- File watcher is started but frontend event broadcast integration is not fully wired yet.
- No cloud sync, collaboration, or plugin marketplace in this release.
- The self-hosted engine M0 only targets core Markdown syntax.
- Writer mode is on the new Rust/WASM path, but rich WYSIWYG rendering depth and IME edge cases are still being stabilized.
- After changing the Rust engine, the frontend wasm package must be regenerated with `pnpm engine:build`.
