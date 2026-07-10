#!/usr/bin/env bash
# Lead helper: re-validate a clean Craft Agents v0.11.0 checkout.
# Usage: validate-clean-v011.sh /path/to/clean/v0.11.0/tree
set -euo pipefail
ROOT="${1:-/private/tmp/craft-v011-upstream}"
export PATH="${HOME}/.bun/bin:${PATH}"
if ! command -v bun >/dev/null 2>&1; then
  echo "bun not found; install from https://bun.sh" >&2
  exit 1
fi
cd "$ROOT"
echo "cwd=$(pwd)"
echo "head=$(git rev-parse HEAD)"
echo "tag=$(git describe --tags --exact-match 2>/dev/null || true)"
echo "bun=$(bun --version)"
bun install
bun run typecheck:shared
bun run typecheck:electron
echo "OK: install + typecheck:shared + typecheck:electron"
echo "NOTE: typecheck:all and GUI launch are separate; see docs/migration/v0.11-BASELINE-VALIDATION.md"
