# FerrumNote Release Guide

## Prerequisites
- Rust stable (`rustup toolchain install stable`)
- Node 20 + pnpm (`corepack enable`)
- Linux desktop dependencies for Tauri/WebKit
  - Ubuntu/Debian:
    - `sudo apt-get install -y pkg-config libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev`
  - Arch Linux:
    - `sudo pacman -S --needed pkgconf gtk3 webkit2gtk-4.1 libayatana-appindicator librsvg`
- Playwright runtime dependencies for e2e
  - Ubuntu/Debian:
    - `sudo apt-get install -y libnspr4 libnss3 libasound2`
  - Arch Linux:
    - `sudo pacman -S --needed nspr nss alsa-lib`

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

## Release Eligibility
- Release candidates are cut from `master` only.
- Required checks before tagging:
  - `pnpm lint && pnpm test && pnpm build` (in `apps/desktop`)
  - `cargo test --workspace` (repo root)
  - GitHub CI must be green for the target commit.

## Versioning
- Use semantic version tags: `vMAJOR.MINOR.PATCH[-pre]`
- Current pre-release target: `v0.1.0-alpha.1`

## Tag Update Policy
- Create a new tag only after the release candidate commit is merged to `master`.
- Never move or force-update an existing tag.
- If a release is bad, fix on `master` and cut a new tag (`v0.1.0-alpha.2`, `v0.1.0-alpha.3`, ...).

## Release Workflow
1. Merge feature branch into `master` via PR (squash merge).
2. Ensure CI is green.
3. Create and push version tag.
4. `Release Build` workflow builds bundles and publishes assets to GitHub Releases.

## Tag And Publish

```bash
git tag -a v0.1.0-alpha.1 -m "chore(release): cut v0.1.0-alpha.1"
git push origin v0.1.0-alpha.1
```

## Repository Rename (`FerrumNote` -> `ferrum-note`)
1. Rename the repository in GitHub Settings.
2. Update local remote URL:
   ```bash
   git remote set-url origin https://github.com/soongfs/ferrum-note.git
   git remote -v
   ```
3. Keep local directory name aligned if desired:
   ```bash
   cd /home/soongfs/type-shell
   mv FerrumNote ferrum-note
   ```

## WSL Notes
- WSL can run desktop mode only when WSLg/X server is available.
- If the desktop window has garbled CJK text, see `docs/wsl-troubleshooting.md`.
