#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/源码参考/craft-docs"
ONLINE_DIR="$TARGET_DIR/online-current"
INDEX_URL="https://agents.craft.do/docs/llms.txt"
SITEMAP_URL="https://agents.craft.do/docs/sitemap.xml"
UPSTREAM_DIR="$ROOT_DIR/源码参考/software/craft-agents-oss"

tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

mkdir -p "$ONLINE_DIR"
curl -fsSL --retry 3 --max-time 60 "$INDEX_URL" -o "$tmp_dir/llms.txt"
cp "$tmp_dir/llms.txt" "$ONLINE_DIR/llms.txt"
curl -fsSL --retry 3 --max-time 60 "$SITEMAP_URL" -o "$ONLINE_DIR/sitemap.xml"

sed -nE 's/.*\((https:\/\/agents\.craft\.do\/docs\/[^)]+)\).*/\1/p' "$tmp_dir/llms.txt" |
while IFS= read -r url; do
  relative_path="${url#https://agents.craft.do/docs/}"
  destination="$ONLINE_DIR/$relative_path"
  mkdir -p "$(dirname "$destination")"
  curl -fsSL --retry 3 --max-time 60 "$url" -o "$destination"
done

# The official Quickstart remains reachable but is absent from both llms.txt and the sitemap.
# Preserve it separately so it is available for migration research without presenting it as current.
mkdir -p "$TARGET_DIR/legacy-unindexed/getting-started"
curl -fsSL --retry 3 --max-time 60 \
  'https://agents.craft.do/docs/getting-started/quickstart.md' \
  -o "$TARGET_DIR/legacy-unindexed/getting-started/quickstart.md"

if [[ -d "$UPSTREAM_DIR/.git" ]]; then
  git -C "$UPSTREAM_DIR" ls-files |
    grep -E '(^|/)(README|CONTRIBUTING|AGENTS|CLAUDE|SECURITY|TRADEMARK|LICENSE)(\.|$)|(^|/)docs?/|release-notes/' |
    sort > "$TARGET_DIR/source-v0.11.1-document-files.txt"
fi

(
  cd "$TARGET_DIR"
  {
    printf 'source_index=%s\n' "$INDEX_URL"
    printf 'synced_at_utc=%s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
    if [[ -d "$UPSTREAM_DIR/.git" ]]; then
      printf 'pinned_source_commit=%s\n' "$(git -C "$UPSTREAM_DIR" rev-parse HEAD)"
      printf 'pinned_source_tag=%s\n' "$(git -C "$UPSTREAM_DIR" describe --tags --exact-match HEAD 2>/dev/null || printf unknown)"
    fi
    printf 'indexed_online_file_count=%s\n' "$(find online-current -type f | wc -l | tr -d ' ')"
    printf 'legacy_unindexed_file_count=%s\n' "$(find legacy-unindexed -type f | wc -l | tr -d ' ')"
    printf '\nsha256\n'
    find online-current legacy-unindexed -type f -print0 | sort -z | xargs -0 shasum -a 256
  } > SYNC-MANIFEST.txt
)

printf 'Craft official documentation synced to %s\n' "$TARGET_DIR"
