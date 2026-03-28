# Middleware: Husky Pre-commit Hook

**Status:** Active
**Toggle:** Remove/restore `.husky/` directory or disable in `package.json` husky config

## What it does
Runs `scripts/verify-changes.sh` before every commit: ESLint → Prettier → Jest.
Also warns when PLAN.md is still the blank template while code files are staged.

## How to disable (temporarily)
```bash
# Skip for one commit (use sparingly)
git commit --no-verify -m "message"

# Disable globally for this session
HUSKY=0 git commit -m "message"
```

## How to remove cleanly
1. Remove the `husky` block from `package.json`
2. Delete `.husky/` directory if it exists
3. The `verify-changes.sh` script remains and can still be run manually

## Why it exists
Mechanical enforcement of code quality before commits reach CI.
Catching failures locally is faster than waiting for CI.
