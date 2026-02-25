#!/usr/bin/env bash
set -euo pipefail

FIXTURES="${1:-fixtures/parser-fixtures.json}"

if ! command -v swift >/dev/null 2>&1; then
  echo "Swift toolchain not found. Install Swift (Xcode command line tools) and rerun." >&2
  exit 1
fi

echo "Running Swift unit tests..."
swift test

echo "Running parser fixture CLI..."
swift run RecipeCLITest --fixtures "$FIXTURES"
