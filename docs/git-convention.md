# Git Convention

## Branching
- Long-lived: `main`
- Working branches: `feature/*`, `fix/*`, `release/*`
- Do not commit directly to `main`; merge via pull request.

## Commit Message
Use Conventional Commits:

```text
type(scope): imperative summary
```

- Summary max length: 72
- Allowed `type`: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `build`, `ci`, `perf`, `revert`

Commit body must include the following sections:

- `Why`
- `What`
- `Test`

## Merge Strategy
- Use `Squash and merge` into `main`
- PR title must satisfy Conventional Commits
- CI must be green before merge
