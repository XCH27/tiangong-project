#!/bin/bash
# Lint guard: detect hard-coded `toolName === 'Task'` / `=== 'Agent'` checks.
# The shared helper handles both names after the Claude Agent SDK rename.

set -euo pipefail

PATTERN="toolName === ['\"](Task|Agent)['\"]"

if command -v rg >/dev/null 2>&1; then
  VIOLATIONS=$(rg "$PATTERN" apps/ packages/ \
    --glob '!**/__tests__/**' --glob '!**/toolNames.ts' \
    -l 2>/dev/null || true)
else
  VIOLATIONS=$(grep -R -l -E "$PATTERN" apps/ packages/ \
    --include='*.ts' --include='*.tsx' \
    --exclude-dir='__tests__' --exclude='toolNames.ts' 2>/dev/null || true)
fi

if [ -n "${VIOLATIONS:-}" ]; then
  echo "ERROR: Hard-coded toolName === 'Task' / 'Agent' check found:"
  echo "$VIOLATIONS"
  echo ""
  echo "Use isParentTaskTool(toolName) from @craft-agent/shared/utils/toolNames"
  exit 1
fi

echo "OK: No hard-coded toolName === 'Task' / 'Agent' checks."
