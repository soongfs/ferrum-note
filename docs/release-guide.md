# FerrumNote Release Guide

## Prerequisites
- Rust stable (`rustup toolchain install stable`)
- Node 20 + pnpm (`corepack enable`)
- Linux desktop dependencies for Tauri/WebKit (Ubuntu example):
  - `sudo apt-get install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev`

## Local Development

### Desktop Mode (Tauri)

```bash
cd apps/desktop
pnpm install
pnpm tauri dev
```

### Browser Mode (Capability Degraded)

```bash
cd apps/desktop
pnpm install
pnpm dev
```

In browser mode, desktop-only actions (`Open/Save/Save As/Export/Watch`) are intentionally disabled.

## Local Production Build

```bash
cd apps/desktop
pnpm install
pnpm tauri build
```

## Versioning
- Use semantic version tags: `vMAJOR.MINOR.PATCH[-pre]`
- Current pre-release target: `v0.1.0-alpha.1`

## Release Workflow
1. Merge feature branch into `master` via PR (squash merge).
2. Ensure CI is green.
3. Create and push version tag.
4. `Release Build` workflow generates platform bundles.

## Tag And Publish

```bash
git tag -a v0.1.0-alpha.1 -m "chore(release): cut v0.1.0-alpha.1"
git push origin v0.1.0-alpha.1
```

## WSL Notes
- WSL can run desktop mode only when WSLg/X server is available.
- If the desktop window has garbled CJK text, see `docs/wsl-troubleshooting.md`.
