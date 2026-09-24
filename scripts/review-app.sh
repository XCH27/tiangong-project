#!/usr/bin/env bash
# Launch the desktop app for review without touching the owner's real data.
#
# Three things must move, and each needs its own lever:
#   1. Craft's profile          CRAFT_CONFIG_DIR
#   2. homedir()-based paths    HOME — upstream workspaces/storage.ts hardcodes
#                               join(homedir(), '.craft-agent'), ignoring CRAFT_CONFIG_DIR
#   3. Electron user data       --user-data-dir — on macOS Electron resolves it through the system,
#      (Local/Session Storage,  not HOME, so without the switch a review instance writes UI
#       caches, cookies)        preferences into the owner's real ~/Library/Application Support.
# Dev mode (electron:dev) cannot pass the switch — scripts/electron-dev.ts hardcodes Electron's
# arguments — so this builds once and launches the compiled app unpackaged, which never runs the
# auto-updater either.
#
#   bash scripts/review-app.sh                 # build, then a fresh first-run instance; removed on exit
#   KEEP=1 bash scripts/review-app.sh          # keep the review directory for a later session
#   SKIP_BUILD=1 bash scripts/review-app.sh    # reuse the last electron:build output
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUN="$(command -v bun)"
REVIEW="${REVIEW_DIR:-$(mktemp -d "${TMPDIR:-/tmp}/fleet-review.XXXXXX")}"
mkdir -p "$REVIEW/home" "$REVIEW/profile" "$REVIEW/electron"
[ "${KEEP:-0}" = "1" ] || trap 'rm -rf "$REVIEW"' EXIT
echo "review home:    $REVIEW/home"
echo "review profile: $REVIEW/profile"
echo "electron data:  $REVIEW/electron"
cd "$ROOT/app"
[ "${SKIP_BUILD:-0}" = "1" ] || "$BUN" run electron:build
HOME="$REVIEW/home" CRAFT_CONFIG_DIR="$REVIEW/profile" CRAFT_BUN="$BUN" \
  node_modules/.bin/electron apps/electron --user-data-dir="$REVIEW/electron"
