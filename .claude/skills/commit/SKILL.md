---
name: commit
description: Stage changes and create a Conventional Commits-compliant commit that passes this repo's commitlint and lefthook hooks. Use when asked to commit work. Optionally takes a message hint as an argument.
---

Create a commit that satisfies this repo's `commitlint.config.js` (Conventional Commits) and `lefthook.yml` (lint-staged + type-check pre-commit hook).

## Process

1. Show the current state: run `git status` and `git diff --staged` (and `git diff` for unstaged changes). If nothing is staged, review unstaged changes and stage the files relevant to this commit.
2. Propose a Conventional Commits message: `type(scope): subject`
   - `type` is one of the conventional types (feat, fix, chore, docs, refactor, test, etc.).
   - Keep the subject imperative and concise. Add a body only if it adds real context.
   - If the user passed `$ARGUMENTS`, use it as the message or as a strong hint.
3. Commit with the required trailer:

   ```
   type(scope): subject

   Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
   ```

4. Let lefthook run (lint-staged + type-check). If the hook fails, show the failure, fix or report it, and retry — do not bypass hooks with `--no-verify`.

## Notes

- Commit only; do not push unless the user asks.
- If the working tree spans unrelated changes, suggest splitting into multiple commits rather than one mixed commit.
