#!/usr/bin/env bash
# Typecheck every TypeScript workspace. Keep this discovery-based so adding a
# workspace cannot silently create a CI blind spot.
set -euo pipefail

while IFS= read -r tsconfig; do
  workspace="${tsconfig%/tsconfig.json}"
  if [ -f "$workspace/package.json" ] && grep -Eq '"typecheck"[[:space:]]*:' "$workspace/package.json"; then
    echo "→ Typecheck $workspace (package script)"
    (cd "$workspace" && bun run typecheck)
  else
    echo "→ Typecheck $workspace (tsc --noEmit)"
    (cd "$workspace" && bun run tsc --noEmit)
  fi
done < <(find apps packages -mindepth 2 -maxdepth 2 -name tsconfig.json -print | sort)
