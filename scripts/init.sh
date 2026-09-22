#!/usr/bin/env bash
# Fleet — one-command initialization for a fresh clone or a new machine.
#
# Why this exists: the pre-commit gate is wired through `core.hooksPath`, which lives in
# .git/config and is NOT carried by a clone. Until 2026-09-20 a fresh clone therefore ran
# **no** typecheck, i18n or doc-contract gate and nothing said so. Run this once after cloning.
#
#   bash scripts/init.sh          # wire + check
#   bash scripts/init.sh --deps   # also run `bun install`
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail=0
ok()   { printf '  \033[32mOK\033[0m    %s\n' "$1"; }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$1"; }
bad()  { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fail=1; }

echo "Fleet init — $ROOT"
echo
echo "1. Commit gates"
if [ -x .githooks/pre-commit ]; then
  git config core.hooksPath .githooks
  ok "core.hooksPath -> .githooks (doc contracts + staged typecheck + i18n)"
else
  bad ".githooks/pre-commit missing or not executable"
fi

echo
echo "2. Toolchain"
want_bun="$(grep -o '"packageManager"[^,]*' app/package.json 2>/dev/null | grep -o '[0-9][0-9.]*' | head -1)"
if command -v bun >/dev/null 2>&1; then
  have="$(bun --version)"
  if [ -n "$want_bun" ] && [ "$have" != "$want_bun" ]; then
    warn "bun $have installed, app/package.json pins $want_bun (CI uses the pin)"
  else
    ok "bun $have"
  fi
else
  bad "bun not installed — https://bun.sh"
fi
command -v python3 >/dev/null 2>&1 && ok "python3 (doc-contract validator)" || bad "python3 missing"

echo
echo "3. Reference mirror (AGENTS.md preflight)"
if [ -d 源码参考/software/craft-agents-oss ]; then
  ok "源码参考/ mounted"
  for pin in "craft-agents-oss-v0.10.5:v0.10.5" "craft-agents-oss:"; do
    d="${pin%%:*}"; want="${pin##*:}"
    [ -d "源码参考/software/$d" ] || { warn "源码参考/software/$d absent"; continue; }
    at="$(git -C "源码参考/software/$d" describe --tags 2>/dev/null || echo '?')"
    if [ -n "$want" ] && [ "$at" != "$want" ]; then
      bad "$d is at $at, must be ON $want (a checkout inside it silently moves the baseline)"
    else
      ok "$d at $at"
    fi
  done
  app_ver="$(grep -m1 '"version"' app/package.json | grep -o '[0-9][0-9.]*')"
  up="$(git -C 源码参考/software/craft-agents-oss describe --tags 2>/dev/null | tr -d v)"
  [ "$app_ver" = "$up" ] && ok "app/ $app_ver matches the rolling pin" \
                         || warn "app/ is $app_ver, rolling pin is $up — see P2 in docs/decisions.md"

  # Upstream drift. v0.13.4 shipped on 2026-09-20 and nobody noticed for days because
  # nothing ever compared the pin against the remote. This is that comparison.
  newest="$(git -C 源码参考/software/craft-agents-oss tag --list 'v*' --sort=-v:refname | head -1)"
  if [ -n "$newest" ] && [ "$newest" != "v$up" ]; then
    warn "upstream has $newest, the pin is at v$up — read the P2 note in docs/decisions.md
        before taking it; preserve a recovery point and declare each admitted delta.
        Refresh the tag list with: git -C 源码参考/software/craft-agents-oss fetch --tags"
  else
    ok "pin is the newest upstream tag this mirror knows ($newest)"
  fi
else
  warn "源码参考/ NOT mounted (/Volumes/AIGC/天工参考). Every 'compare Craft first' step in AGENTS.md
        is unexecutable until it is — a classified limitation, not permission to guess."
fi

if [ "${1:-}" = "--deps" ]; then
  echo
  echo "4. Dependencies"
  (cd app && bun install --frozen-lockfile) && ok "bun install" || bad "bun install failed"
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "Ready. Full gate: bash scripts/fleet-verify.sh"
else
  echo "Fix the FAIL lines above before committing." >&2
fi
exit "$fail"
