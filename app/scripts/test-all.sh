#!/usr/bin/env bash
# Run only source-tree tests. Bun treats positional paths as substring filters,
# so generated dist/server/packages tests must also be excluded explicitly.
set -euo pipefail

bun test --isolate \
  --path-ignore-patterns='**/node_modules/**' \
  --path-ignore-patterns='**/dist/**' \
  apps packages

isolated_test_list=$(mktemp "${TMPDIR:-/tmp}/fleet-isolated-tests.XXXXXX")
trap 'rm -f "$isolated_test_list"' EXIT

# Keep the isolated test list NUL-delimited and run each entry in its own
# process. The temporary list is removed on either success or failure.
find apps packages -type f \( -name '*.isolated.ts' -o -name '*.isolated.tsx' \) \
  -not -path '*/node_modules/*' \
  -not -path '*/dist/*' \
  -print0 > "$isolated_test_list"

while IFS= read -r -d '' isolated_test; do
  bun test "./$isolated_test"
done < "$isolated_test_list"
