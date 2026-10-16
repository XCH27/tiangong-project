#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="${1:-$ROOT_DIR/源码参考/reference-repos.tsv}"

if [ ! -f "$MANIFEST" ]; then
  echo "Manifest not found: $MANIFEST" >&2
  exit 1
fi

cd "$ROOT_DIR"

resolve_ref() {
  local url="$1"
  local ref="$2"

  if [ "$ref" = "HEAD" ]; then
    git ls-remote --symref "$url" HEAD | awk '
      $1 == "ref:" { branch=$2 }
      $2 == "HEAD" { sha=$1 }
      END {
        if (sha == "") exit 1
        if (branch == "") branch="HEAD"
        print sha "\t" branch
      }'
    return
  fi

  local query="$ref"
  if [[ "$ref" != refs/* ]]; then
    query="refs/heads/$ref"
  fi

  git ls-remote "$url" "$query" | awk -v ref="$query" '
    $2 == ref { print $1 "\t" ref; found=1 }
    END { if (!found) exit 1 }'
}

updated=0
failed=0
dry_run="${DRY_RUN:-0}"

while IFS=$'\t' read -r path url ref; do
  if [ -z "${path:-}" ] || [[ "$path" = \#* ]]; then
    continue
  fi

  if [ -z "${url:-}" ] || [ -z "${ref:-}" ]; then
    echo "Invalid manifest row: $path	$url	$ref" >&2
    failed=$((failed + 1))
    continue
  fi

  echo "Checking $path"
  if ! resolved="$(resolve_ref "$url" "$ref")"; then
    echo "  failed to resolve $url $ref" >&2
    failed=$((failed + 1))
    continue
  fi

  sha="${resolved%%$'\t'*}"
  resolved_ref="${resolved#*$'\t'}"
  current="$(git ls-tree HEAD "$path" | awk '{ print $3 }')"

  if [ "$current" = "$sha" ]; then
    echo "  already current at ${sha:0:12} ($resolved_ref)"
    continue
  fi

  current_display="${current:-none}"
  if [ "$dry_run" = "1" ]; then
    echo "  would stage ${current_display:0:12} -> ${sha:0:12} ($resolved_ref)"
  else
    git update-index --add --cacheinfo 160000 "$sha" "$path"
    echo "  staged ${current_display:0:12} -> ${sha:0:12} ($resolved_ref)"
  fi
  updated=$((updated + 1))
done < "$MANIFEST"

echo "Reference gitlink sync complete: $updated updated, $failed failed."

if [ "$failed" -ne 0 ]; then
  exit 1
fi
