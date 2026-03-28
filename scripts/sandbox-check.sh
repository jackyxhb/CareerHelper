#!/bin/bash
# Sandbox safety check — warns when destructive operations are attempted outside CI.
# Source this script or call it before any deployment/destructive operation.

set -e

DESTRUCTIVE_OPS=("serverless deploy" "amplify publish" "cdk deploy" "aws s3" "rm -rf" "git push --force" "git reset --hard")

is_ci() {
  [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$CODEBUILD_BUILD_ID" ]
}

warn_if_local() {
  local op="$1"
  if ! is_ci; then
    echo "⚠️  SANDBOX WARNING: '$op' is a destructive/deployment operation."
    echo "   You are running outside CI. This should be gated to CI/CD pipelines."
    echo "   Proceeding requires explicit confirmation."
    echo ""
    read -r -p "   Type 'yes-i-know' to continue locally: " confirm
    if [ "$confirm" != "yes-i-know" ]; then
      echo "Aborted."
      exit 1
    fi
  fi
}

# If called with an operation argument, check it
if [ -n "$1" ]; then
  warn_if_local "$1"
fi

echo "Sandbox check passed."
