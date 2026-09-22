#!/usr/bin/env bash
# Fleet verification entry point (repository root)
# Runs repository contracts, reference gates, types, the full source test suite and document tools.
# Upstream validate:dev is a subset; this entry also verifies Fleet boundaries.
# FLEET_UPSTREAM_DIR selects an isolated matching Craft checkout, including in CI.
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Docs are repository-level, not app-level, so this gate lives here rather than in app/package.json.
# Until 2026-07-24 this validator existed but nothing invoked it, so the cross-document joins it
# checks were enforced only by convention.
python3 "$ROOT_DIR/scripts/validate-doc-contracts.py"
python3 -m unittest discover -s "$ROOT_DIR/scripts/tests" -p 'test_*.py'
python3 "$ROOT_DIR/scripts/check-upstream-delta.py"
python3 "$ROOT_DIR/scripts/check-orphaned-components.py"

cd "$ROOT_DIR/app"
bun run typecheck:all
bun run lint:ui-contract
bun run lint:i18n:parity
bun run lint:i18n:sorted
bun run lint:i18n:coverage

# Profile-aware storage and server smoke tests inherit this setting for both test phases.
# This is not a filesystem sandbox: direct homedir paths must be audited separately.
test_profile=$(mktemp -d "${TMPDIR:-/tmp}/fleet-verification-profile.XXXXXX")
isolated_test_list="$test_profile/isolated-tests"
trap 'rm -rf "$test_profile"' EXIT
export CRAFT_CONFIG_DIR="$test_profile"
printf 'Test profile: %s (disposable; removed on exit)\n' "$CRAFT_CONFIG_DIR"

# Bun's per-file isolation prevents module mocks in one suite leaking into another.
# Explicit source roots avoid running generated bundles or dependency tests.
bun test --isolate --path-ignore-patterns='**/node_modules/**' --path-ignore-patterns='**/dist/**' apps packages scripts

find apps packages scripts -type f \( -name '*.isolated.ts' -o -name '*.isolated.tsx' \) \
  -not -path '*/node_modules/*' -not -path '*/dist/*' -print0 > "$isolated_test_list"
while IFS= read -r -d '' isolated_test; do
  bun test "./$isolated_test"
done < "$isolated_test_list"

bun run test:doc-tools

# Exercise the real server entry and RPC/storage loop with explicit outbound guards.
# This is backend evidence; it cannot substitute for Electron/renderer acceptance.
bun "$ROOT_DIR/scripts/smoke-baseline.mjs"
