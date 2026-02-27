# FerrumNote

[中文说明](./README.zh-CN.md)

FerrumNote is a Rust + Tauri + TipTap Markdown editor focused on desktop-first writing workflows.

## Highlights

- Typora-like live Markdown editing experience
- CodeMirror-first editing pipeline with one Markdown source of truth
- Single `Source` toggle:
  - off: `Writer` mode (WYSIWYG-style)
  - on: raw Markdown source mode (line numbers + wrapping)
- Strict Typora-style marker behavior in Writer mode:
  - markdown markers stay hidden while cursor is outside syntax ranges
  - markers become visible and directly editable when cursor enters syntax ranges
- Workspace explorer (directory-first, Markdown-focused)
- Desktop file lifecycle: open, save, save as, autosave, version conflict guard
- HTML and PDF export
- Browser mode capability downgrade with explicit notices
- Cross-platform CI/release pipeline for Linux, macOS, and Windows

## Project Structure

- `apps/desktop`: React + TypeScript frontend and Tauri app shell
- `apps/desktop/src-tauri`: Tauri commands and runtime integration
- `crates/fn-core`: shared contracts and response types
- `crates/fn-fs`: file IO, atomic write, watcher, workspace directory listing
- `crates/fn-export`: HTML/PDF export pipeline
- `crates/fn-config`: app config loading and workspace root persistence
- `docs/`: architecture, scope, release, and troubleshooting docs

## Quick Start

### Prerequisites

- Rust stable
- Node 20
- pnpm 9 (`corepack enable`)
- Linux desktop dependencies for Tauri/WebKit (if using Linux/WSL)

See [docs/release-guide.md](./docs/release-guide.md) and [docs/wsl-troubleshooting.md](./docs/wsl-troubleshooting.md) for platform-specific commands.

### Desktop Mode (recommended)

```bash
cd apps/desktop
pnpm install
pnpm tauri dev
```

Use **Open Folder** to set the workspace root, then browse files from the explorer panel.

Mode switch:

- Click `Source` toggle in the header
- Shortcut: `Ctrl/Cmd + Shift + M`

### Browser Mode (capability-degraded)

```bash
cd apps/desktop
pnpm install
pnpm dev
```

In browser mode, desktop-only features are disabled (`open/save/export/watch/explorer file IO`).
Source toggle, Writer marker editing behavior, and search/replace remain available.

## Validation Commands

Run from `apps/desktop`:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

Run from repo root:

```bash
cargo test --workspace --all-targets
```

## Configuration

App config path:

- `~/.ferrumnote/config.toml`

Important fields:

- `autosave_ms`
- `ui_language`
- `show_debug_panels`
- `workspace_root`

## Branching And Release

- Default branch: `master`
- Work on feature branches: `feature/*`, `fix/*`, `release/*`
- Merge via PR with `Squash and merge`
- Commits follow Conventional Commits + `Why/What/Test`

Pre-release tags (`vX.Y.Z-alpha.N`) are auto-cut after successful CI on `master` push.
Stable tags (`vX.Y.Z`) are pushed manually.

## License

MIT. See [LICENSE](./LICENSE).
