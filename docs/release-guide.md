# FerrumNote Release Guide

## Local Development

```bash
cd apps/desktop
pnpm install
pnpm tauri dev
```

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
