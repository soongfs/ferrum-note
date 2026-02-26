# FerrumNote WSL Troubleshooting

## 1. Tauri Build Fails With `pkg-config` Or GTK/WebKit Errors

Install Linux desktop dependencies inside WSL:

```bash
sudo apt-get update
sudo apt-get install -y \
  pkg-config \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

Arch Linux equivalent:

```bash
sudo pacman -S --needed pkgconf gtk3 webkit2gtk-4.1 libayatana-appindicator librsvg
```

Verify:

```bash
which pkg-config
pkg-config --modversion gtk+-3.0
pkg-config --modversion webkit2gtk-4.1
```

## 2. `tauri::generate_context!()` Fails Because Icon Is Missing

Ensure `apps/desktop/src-tauri/icons/icon.png` exists before running:

```bash
cargo test --workspace
```

Tauri context generation loads icon assets at compile time.

## 3. Window Opens But Chinese Text Is Garbled/Squares

Install CJK fonts in WSL:

```bash
sudo apt-get install -y fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
fc-cache -f -v
```

Then restart the Tauri app.

For MVP, UI defaults to English to avoid font fallback issues in minimal WSL images.

## 4. Desktop Window Cannot Start In WSL

Check WSLg display variables:

```bash
echo $DISPLAY
echo $WAYLAND_DISPLAY
```

If both are empty, desktop GUI is unavailable. Use browser mode:

```bash
cd apps/desktop
pnpm dev
```

## 5. Browser Mode Shows Disabled Buttons

This is expected behavior. Browser mode is capability-degraded by design:
- Available: Markdown editing, find/replace, local status rendering
- Disabled: open/save/save-as/export/watch (desktop-only commands)

## 6. Playwright e2e Fails With Missing Shared Libraries

Typical error:
- `error while loading shared libraries: libasound.so.2`
- `error while loading shared libraries: libnspr4.so`

Install missing runtime packages:

Ubuntu/Debian:

```bash
sudo apt-get install -y libasound2 libnspr4 libnss3
```

Arch Linux:

```bash
sudo pacman -S --needed alsa-lib nspr nss
```

To inspect all unresolved libraries:

```bash
ldd ~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell | rg "not found"
```
