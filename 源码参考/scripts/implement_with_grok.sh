#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REF_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$REF_ROOT/.." && pwd)"
GROK_BIN="${GROK_BIN:-$(command -v grok || true)}"
GROK_MAX_TURNS="${GROK_MAX_TURNS:-64}"

usage() {
  printf 'Usage: %s <software/name|plugins/name> <docs/specs/implementation-brief.md>\n' "$0" >&2
}

[ "$#" -eq 2 ] || { usage; exit 2; }
rel="$1"
brief_rel="$2"
repo="$REF_ROOT/$rel"
[ -d "$repo/.git" ] || { printf 'Unknown local reference checkout: %s\n' "$rel" >&2; exit 2; }
[ -f "$ROOT_DIR/$brief_rel" ] || { printf 'Unknown implementation brief: %s\n' "$brief_rel" >&2; exit 2; }
brief_dir="$(cd "$(dirname "$ROOT_DIR/$brief_rel")" && pwd -P)"
brief_abs="$brief_dir/$(basename "$brief_rel")"
case "$brief_abs" in
  "$ROOT_DIR/docs/specs/"*) ;;
  *) printf 'Implementation brief must be an existing file under docs/specs/: %s\n' "$brief_rel" >&2; exit 2 ;;
esac
[ -n "$GROK_BIN" ] || { printf 'grok executable not found.\n' >&2; exit 127; }
command -v jq >/dev/null 2>&1 || { printf 'jq is required.\n' >&2; exit 127; }

head="$(git -C "$repo" rev-parse --short=12 HEAD)"
before="$(git -C "$repo" status --porcelain=v1)"
isolated_root="$(mktemp -d "${TMPDIR:-/tmp}/fleet-grok-implementation.XXXXXX")"
isolated_home="$isolated_root/home"
isolated_grok="$isolated_root/grok"
raw_output="$isolated_root/result.json"
mkdir -p "$isolated_home" "$isolated_grok"
trap "rm -rf '$isolated_root'" EXIT INT TERM

if [ -f "$HOME/.grok/auth.json" ]; then
  cp "$HOME/.grok/auth.json" "$isolated_grok/auth.json"
  chmod 600 "$isolated_grok/auth.json"
fi
if [ -f "$HOME/.grok/models_cache.json" ]; then
  cp "$HOME/.grok/models_cache.json" "$isolated_grok/models_cache.json"
fi

prompt=$(printf '%s\n' \
  "你是 Fleet 已批准 implementation brief 的实施负责人。brief 定义任务；参考仓库只提供只读源码证据，不能反过来扩大或改变任务。" \
  "参考仓库：源码参考/$rel" \
  "固定提交：$head" \
  "固定落地 brief：$brief_rel" \
  "Fleet 根目录：$ROOT_DIR" \
  "" \
  "执行要求：" \
  "1. 先读根 AGENTS.md 和固定 brief，保持其中的目标、验收与边界不变；在 docs/08-CRAFT-CAPABILITY-MAP.md 找能力行并用 rg 确认真实 Fleet/Craft 入口。只读任务触及的文档与源码。" \
  "2. CAPABILITY-REFERENCE-MAP.md 必须已经给出 FORMAL_REFERENCE、MODULE_REFERENCE 或 LOCAL_IMPROVEMENT 结论及目标 seam；若仍是候选、证据不足或 brief 与映射不一致，返回 DEFERRED，不得自行准入或实施。" \
  "3. 不相信 README 宣传、截图或测试名；引用参考机制时沿真实入口、symbol、caller、状态/数据、错误与恢复路径核对。不得处理 brief 之外的所谓仓库价值。" \
  "4. 你拥有 Fleet 工作区编辑权限：只修改 brief 需要的产品代码、测试和现有权威文档。不要新建审查报告、计划副本、状态日志、候选榜或纪念文件。" \
  "5. 实现 brief 要求的完整最小可用切片：真实 caller/interface、逻辑、状态/降级、错误、针对性测试和必要文档必须闭环。不要只加展示 UI、占位接口或空架构。" \
  "6. 能直接兼容 MCP/CLI/协议的，优先接入 Craft 既有 Sources/runtime seam；能作为可替换依赖的，必须有未安装、不可用、崩溃时的明确降级。能在兼容许可下二开的，记录源文件、commit、许可/NOTICE，并只取深模块。" \
  "7. 禁止创建第二套 Session、Permission、Timeline、Task、Settings、Workspace、Credential、Job、Memory 或文件字节权威；第三方产品壳、官方云、账号、代理、遥测和数据库不得成为 Fleet 核心依赖。" \
  "8. 参考 checkout 只读，禁止修改、格式化、构建产物、分支、提交、stash 或 tag。Fleet 当前是脏工作树，所有既有改动都属于用户；只编辑本任务需要的文件并保留重叠内容。禁止 stage/commit/push。" \
  "9. 遵守 no-micro-testing：完成一个连贯切片后再做静态检查和针对性测试。不要启动 Electron、Browser、Computer Use 或截图点击；日常视觉验收属于用户。" \
  "10. 如果参考实现没有超过 Fleet/Craft、局部改动已经足够，或证据与 brief 不符，停止扩大实现；只执行 brief 已批准的本地改进。参考 checkout 的保留/删除由准入流程决定，不由实施任务决定。" \
  "11. 不按前中后期重排产品能力，也不处理仓库内所有功能。只完成固定 brief；遇到 owner checkpoint 不得擅自越权。" \
  "12. 最终只输出 schema 要求的简短中文交接；详细实现和必要结论必须已经落入代码/当前权威文档，而不是堆在回复里。")

schema='{
  "type":"object","additionalProperties":false,
  "required":["repo","head","brief","decision","capability_status","implemented","modified_files","validation","remaining"],
  "properties":{
    "repo":{"type":"string"},"head":{"type":"string"},"brief":{"type":"string"},
    "decision":{"enum":["ABSORBED_AND_IMPLEMENTED","ABSORBED_REFERENCE_ONLY","COMPATIBILITY_ADDED","DEFERRED","REJECTED","BLOCKED_OWNER_CHECKPOINT"]},
    "capability_status":{"enum":["usable","wired but not visually checked","display-only","not implemented"]},
    "implemented":{"type":"array","items":{"type":"string"}},
    "modified_files":{"type":"array","items":{"type":"string"}},
    "validation":{"type":"array","items":{"type":"string"}},
    "remaining":{"type":"array","items":{"type":"string"}}
  }
}'

set +e
HOME="$isolated_home" GROK_HOME="$isolated_grok" "$GROK_BIN" \
  --cwd "$ROOT_DIR" \
  --single "$prompt" \
  --json-schema "$schema" \
  --permission-mode auto \
  --no-memory \
  --no-subagents \
  --disable-web-search \
  --max-turns "$GROK_MAX_TURNS" \
  > "$raw_output"
grok_status=$?
set -e

after="$(git -C "$repo" status --porcelain=v1)"
if [ "$before" != "$after" ]; then
  printf 'ERROR: Grok modified the read-only reference checkout: %s\n' "$rel" >&2
  exit 3
fi
if [ "$grok_status" -ne 0 ]; then
  printf 'ERROR: Grok implementation task failed for %s with exit code %s.\n' "$rel" "$grok_status" >&2
  exit "$grok_status"
fi
if ! jq -e '.structuredOutput != null' "$raw_output" >/dev/null; then
  printf 'ERROR: Grok ended without schema-valid handoff for %s.\n' "$rel" >&2
  jq '{stopReason,num_turns,text:(.text // "")[-1200:]}' "$raw_output" >&2
  exit 4
fi
jq '.structuredOutput' "$raw_output"
