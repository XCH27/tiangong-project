#!/usr/bin/env bash
# Fleet 一键自动化验证（仓库根目录入口）
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/app"
exec bun run validate:fleet "$@"
