## Why
- Explain why this change is needed.
- Link issue/bug/user story if applicable.

## What
- Describe the implementation and key behavior changes.
- Call out any non-obvious tradeoffs.

## Test
- List the validation commands and key results.

Example:
- `pnpm lint`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `cargo test --workspace --all-targets`

## Acceptance Evidence
- Add screenshots and/or key command output summaries.
- For UI changes, include before/after where possible.

## Checklist
- [ ] PR title follows Conventional Commits (`type(scope): summary`)
- [ ] Commit messages include `Why / What / Test`
- [ ] CI is green
- [ ] Scope is focused (no unrelated changes)
- [ ] Docs updated when behavior or workflow changed
