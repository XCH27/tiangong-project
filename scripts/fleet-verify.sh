#!/usr/bin/env bash
# Fleet verification entry point (repository root)
# Runs the documentation contract validator, then validate:dev
# (typecheck:all + test:shared:all + test:doc-tools).
# Use validate:ci for the full CI gate including i18n checks.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Docs are repository-level, not app-level, so this gate lives here rather than in app/package.json.
# Until 2026-07-24 this validator existed but nothing invoked it, so the cross-document joins it
# checks were enforced only by convention.
python3 "$ROOT_DIR/scripts/validate-doc-contracts.py"

cd "$ROOT_DIR/app"
exec bun run validate:dev "$@"
