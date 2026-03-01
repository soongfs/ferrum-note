<div align="center">

# FerrumNote

**A desktop-first Markdown editor with a self-hosted Rust/WASM engine**

*Inspired by Typora · Powered by Rust*

[![Version](https://img.shields.io/badge/version-0.1.0--alpha.1-blue.svg)](https://github.com/soongfs/ferrum-note/releases)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Rust](https://img.shields.io/badge/Rust-stable-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

</div>

[中文说明](./README.zh-CN.md)

FerrumNote is a Rust + Tauri desktop Markdown editor with a self-hosted editing engine.
Inspired by Typora; FerrumNote is an independent project and is not affiliated with Typora.

## Highlights

- Self-hosted Markdown engine:
  - Rust core (`fn-engine`)
  - WebAssembly bridge (`fn-engine-wasm`)
  - custom Writer surface in the renderer
- One Markdown source of truth backed by the engine snapshot model
- `Writer` mode for engine-controlled editing and `Source` mode for CodeMirror-based raw editing
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
- `crates/fn-engine`: self-hosted Markdown engine core (doc model, parser, transactions, snapshot)
- `crates/fn-engine-wasm`: WebAssembly bridge for the renderer
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

## Engine Development

When you change the Rust engine or WASM bridge, regenerate the frontend package:

```bash
cd apps/desktop
pnpm engine:build
```

This rebuilds `crates/fn-engine-wasm` and refreshes `src/engine/pkg/*`.

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
