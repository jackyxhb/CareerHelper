# Middleware: Dependency Cruiser

**Status:** Active
**Toggle:** Remove `.dependency-cruiser.json` or comment out the step in `cleanup.yml`

## What it does
Enforces workspace boundary rules on every weekly cleanup run:
- `web/src` cannot import from `backend/src`
- `web/src` cannot import from `mobile/src`
- All workspaces may use `shared/src`

## How to disable a specific rule
Edit `.dependency-cruiser.json` and remove or comment the rule object.
Each rule has a `name` field — remove the object with that name.

## How to remove cleanly
1. Delete `.dependency-cruiser.json`
2. Remove the `dependency-cruise` step from `.github/workflows/cleanup.yml`
3. Remove `dependency-cruiser` from `devDependencies` in `package.json`

## Why it exists
Prevents architectural boundary violations that TypeScript's module system
alone won't catch in a Yarn Workspace monorepo.
