#!/usr/bin/env bash
# Staged typecheck + i18n checks for app/, run by .githooks/pre-commit.
#
# Lives at the repository root on purpose. app/ preserves its declared Craft deltas (see
# docs/UPSTREAM-DELTA.tsv), and upstream's OSS package.json names scripts it does not ship
# (typecheck-staged.sh, lint-i18n-staged.sh and a dozen more), so the gate cannot live inside app/.
#
# Typecheck: every apps/<X> or packages/<X> workspace touched by the staged change; a staged root
# config file triggers the full typecheck. i18n: upstream's own sorted/parity/coverage checks,
# only when a locale or source file is staged.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT/app"

changed="$(git diff --cached --name-only --diff-filter=ACMR --relative)"
if [ -z "$changed" ]; then
  echo "no staged app/ files — skipping typecheck and i18n"
  exit 0
fi

# ─── typecheck ────────────────────────────────────────────────────────────────
if printf '%s\n' "$changed" | grep -Eq '^(package\.json|bun\.lock|tsconfig(\..+)?\.json)$'; then
  echo "→ root config staged — full typecheck"
  bun run typecheck:all
else
  workspaces="$(printf '%s\n' "$changed" | grep -E '^(apps|packages)/[^/]+/' | awk -F/ '{print $1"/"$2}' | sort -u || true)"
  while IFS= read -r ws; do
    [ -n "$ws" ] && [ -f "$ws/tsconfig.json" ] || continue
    if [ -f "$ws/package.json" ] && grep -Eq '"typecheck"[[:space:]]*:' "$ws/package.json"; then
      echo "→ typecheck $ws"; (cd "$ws" && bun run typecheck)
    else
      echo "→ tsc $ws"; (cd "$ws" && bun run tsc --noEmit)
    fi
  done <<< "$workspaces"
fi

# ─── i18n (upstream's own checks) ─────────────────────────────────────────────
if printf '%s\n' "$changed" | grep -q 'i18n/locales/.*\.json'; then
  bun run lint:i18n:sorted
  bun run lint:i18n:parity
fi
if printf '%s\n' "$changed" | grep -Eq '\.(tsx?|json)$'; then
  bun run lint:i18n:coverage
fi
