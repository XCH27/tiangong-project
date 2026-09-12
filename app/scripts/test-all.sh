#!/usr/bin/env bash
# Run only source-tree tests. Bun treats positional paths as substring filters,
# so generated dist/server/packages tests must also be excluded explicitly.
set -euo pipefail

bun test --isolate \
  --path-ignore-patterns='**/node_modules/**' \
  --path-ignore-patterns='**/dist/**' \
  apps packages

while IFS= read -r -d '' isolated_test; do
  bun test "./$isolated_test"
done < <(
  # .tsx too: a component test that stubs a module barrel needs the same isolation,
  # because bun's module mocks are global for the whole run.
  find apps packages -type f \( -name '*.isolated.ts' -o -name '*.isolated.tsx' \) \
    -not -path '*/node_modules/*' \
    -not -path '*/dist/*' \
    -print0
)
