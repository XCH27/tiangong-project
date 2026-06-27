#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]]; then
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    export GITHUB_PERSONAL_ACCESS_TOKEN="$GITHUB_TOKEN"
  elif [[ -n "${GH_TOKEN:-}" ]]; then
    export GITHUB_PERSONAL_ACCESS_TOKEN="$GH_TOKEN"
  elif command -v gh >/dev/null 2>&1; then
    export GITHUB_PERSONAL_ACCESS_TOKEN="$(gh auth token)"
  fi
fi

if [[ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]]; then
  echo "GitHub MCP: set GITHUB_TOKEN/GH_TOKEN or run 'gh auth login'." >&2
  exit 1
fi

exec npx -y @modelcontextprotocol/server-github "$@"
