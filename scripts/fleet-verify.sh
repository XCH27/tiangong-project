#!/usr/bin/env bash
# Fleet verification entry point (repository root)
# Runs the documentation contract validator, then validate:dev
# (lint:ui-contract + typecheck:all + the whole test suite + test:doc-tools).
# Corrected 2026-08-15: this comment claimed test:shared:all (3 of 703 files). That was true until
# 2026-07-30, when validate:dev was repaired to run the real suite via `bun test --isolate`.
# Use validate:ci for the full CI gate including the three i18n checks.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Docs are repository-level, not app-level, so this gate lives here rather than in app/package.json.
# Until 2026-07-24 this validator existed but nothing invoked it, so the cross-document joins it
# checks were enforced only by convention.
python3 "$ROOT_DIR/scripts/validate-doc-contracts.py"

cd "$ROOT_DIR/app"
exec bun run validate:dev "$@"
