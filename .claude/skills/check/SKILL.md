---
name: check
description: Run the project's pre-PR validation — ESLint, TypeScript type-check, and the Vitest suite — and report a pass/fail summary. Use before committing or opening a PR, or when asked to "run the checks", "verify the build", or "make sure nothing is broken".
---

Run the three project checks **in order** and report results. Use the existing package.json scripts — do not invent new commands.

1. `npm run lint`
2. `npm run check:types`
3. `npm run test:run`

## Reporting

- Run all three even if an earlier one fails (so the user sees the full picture), unless one fails so catastrophically the others can't run.
- Summarize as a short table: each step with ✅ pass / ❌ fail.
- For any failure, surface the relevant failing output (the actual error/lint message, not the whole log).
- Do **not** fix anything unless the user explicitly asks — report first. If asked to fix, address the failures and re-run the affected check.
