#!/usr/bin/env bash
# Fleet verification entry point (repository root)
# Runs validate:dev (typecheck:all + test:shared:all + test:doc-tools).
# Use validate:ci for the full CI gate including i18n checks.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/app"
exec bun run validate:fleet "$@"
