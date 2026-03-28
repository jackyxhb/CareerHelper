# Middleware: lint-staged

**Status:** Active
**Toggle:** Remove `lint-staged` config block from `package.json`

## What it does
On pre-commit, runs ESLint --fix and Prettier --write only on staged files
(not the whole codebase), keeping the feedback loop fast.

## How to disable cleanly
Remove the `"lint-staged"` block from `package.json`.
lint-staged is invoked by Husky — disabling either one is sufficient.

## Why it exists
Running full lint on every commit is slow in a monorepo.
lint-staged scopes the check to changed files only.
