#!/usr/bin/env bash
# Active ZCode verification. Retained Craft is an explicit historical check only.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
case "${1:-}" in
  ""|--candidate-only) ;;
  --retained-craft)
    cd "$ROOT_DIR/app"
    exec bun run validate:fleet
    ;;
  *) echo "Usage: fleet-verify.sh [--candidate-only|--retained-craft]" >&2; exit 2 ;;
esac
python3 -m unittest discover -s "$ROOT_DIR/scripts/tests" -p 'test_*.py'
node --test "$ROOT_DIR/scripts/review-zcode.test.mjs"
python3 "$ROOT_DIR/scripts/check-zcode-candidate.py"
cd "$ROOT_DIR/.fleet/zcode"
node --test packages/desktop/scripts/desktop-vite-config.test.mjs
node scripts/build-desktop-agent-cli.mjs
pnpm typecheck
pnpm -r --filter './apps/zcode-cli/packages/*' --if-present run typecheck
pnpm verify:pre-push
pnpm --filter @zcode/desktop build:no-runtime-assets
pnpm test:staged-agent-recovery
pnpm test:page-assistant-ui
pnpm test:plugin-market-ui

# Strict CLI source debt remains a failing check; it must not hide build/runtime evidence.
pnpm lint:cli
