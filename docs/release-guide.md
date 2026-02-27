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

Then use **Open Folder** to configure `workspace_root` and browse Markdown files in explorer.

### Browser Mode (Capability Degraded)

```bash
cd apps/desktop
pnpm install
pnpm dev
```

In browser mode, desktop-only actions (`Open/Save/Save As/Export/Watch`) are intentionally disabled.
Explorer file IO is disabled as well.

## Local Production Build

```bash
cd apps/desktop
pnpm install
pnpm tauri build
```

## Branding Asset Pipeline

Logo source of truth:

- `apps/desktop/branding/logo-source.png`

Regenerate brand assets + Tauri icon set:

```bash
cd apps/desktop
pnpm brand:prepare
pnpm tauri icon src-tauri/icons/app-icon-source.png --output src-tauri/icons
```

You can override the input image path if needed:

```bash
pnpm brand:prepare -- /absolute/path/to/logo-source.png
```

## Release Eligibility
- Release candidates are cut from `master` only.
- Required checks before stable tagging:
  - `pnpm lint && pnpm test && pnpm test:e2e && pnpm build` (in `apps/desktop`)
  - `cargo test --workspace --all-targets` (repo root)
  - GitHub CI must be green for the target commit.

## Versioning
- Use semantic version tags: `vMAJOR.MINOR.PATCH[-pre]`
- Current pre-release target: `v0.1.0-alpha.1`

## Tag Update Policy
- `vX.Y.Z-alpha.N` tags are auto-generated after successful CI on `master` push.
- Stable tags (`vX.Y.Z`) are created manually after explicit release approval.
- Never move or force-update an existing tag.
- If a release is bad, fix on `master` and cut a new tag.

## Release Workflow
1. Merge feature branch into `master` via PR (squash merge).
2. CI runs on `master` push.
3. `Auto Prerelease` cuts next `vX.Y.Z-alpha.N` tag and publishes prerelease assets automatically.
4. For stable release, create and push a stable tag manually; `Release Build` publishes stable assets.

## Stable Tag And Publish

```bash
git tag -a v0.1.0 -m "chore(release): cut v0.1.0"
git push origin v0.1.0
```

## Windows Icon Verification

After building and installing on Windows, verify:

1. Taskbar icon shape is not squashed.
2. Desktop shortcut icon matches the app icon.
3. Start menu icon matches the app icon.

If Windows still shows an old icon, clear icon cache and reinstall:

1. Uninstall previous FerrumNote build.
2. Delete `%LocalAppData%\\IconCache.db` (and `iconcache_*.db` files if present).
3. Restart Windows Explorer or reboot.
4. Reinstall the latest build artifact.

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
