#!/bin/bash
# Verification script for pre-commit and CI
# Runs linting and tests to validate changes

set -e

echo "=========================================="
echo "CareerHelper Verification Script"
echo "=========================================="

# Get affected packages from git diff
AFFECTED_PACKAGES=$(git diff --name-only HEAD | grep -E '^([a-z]+)/' | cut -d'/' -f1 | sort -u | tr '\n' ' ')

if [ -z "$AFFECTED_PACKAGES" ]; then
    echo "No workspace packages affected. Skipping workspace-specific checks."
else
    echo "Affected packages: $AFFECTED_PACKAGES"
fi

echo ""
echo "Step 1: Running ESLint..."
yarn lint
echo "ESLint passed!"

echo ""
echo "Step 2: Running Prettier format check..."
yarn format:check
echo "Prettier check passed!"

echo ""
echo "Step 3: Running tests..."
yarn test
echo "Tests passed!"

echo ""
echo "=========================================="
echo "All verification checks passed!"
echo "=========================================="
