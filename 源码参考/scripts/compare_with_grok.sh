#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REF_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$REF_ROOT/.." && pwd)"
REVIEWED_HEADS="$REF_ROOT/meta/REVIEWED-HEADS.tsv"
REVIEW_SCHEMA_VERSION="fleet-reference-admission-v2"
GROK_BIN="${GROK_BIN:-$(command -v grok || true)}"
GROK_MAX_TURNS="${GROK_MAX_TURNS:-24}"
cd "$REF_ROOT"

# Order by architectural leverage, not alphabetically. Craft is the fixed
# comparison baseline and is not an ordinary intake target.
REVIEW_ORDER=(
  "software/codex"
  "software/opencode"
  "software/grok-build"
  "software/AionUi"
  "software/AionCore"
  "software/omnigent"
  "software/multica"
  "software/golutra"
  "software/OpenHands"
  "software/orca"
  "software/hermes-agent"
  "software/DeepSeek-Reasonix"
  "plugins/headroom"
  "plugins/xyflow"
  "software/vibeframe"
  "plugins/ponytail"
  "plugins/codegraph"
  "plugins/repomix"
  "plugins/markitdown"
  "plugins/rtk"
  "plugins/open-design"
  "software/penpot"
  "software/tldraw"
  "software/open-pencil"
  "software/opencut-classic"
  "plugins/dockview"
  "plugins/react-resizable-panels"
  "plugins/react-rnd"
  "plugins/react-timeline-editor"
)

usage() {
  printf '%s\n' \
    "Usage:" \
    "  $0 list" \
    "  $0 next" \
    "  $0 run <software/name|plugins/name|name>" \
    "  $0 prompt <software/name|plugins/name|name>" \
    "  $0 mark <software/name|plugins/name|name>" \
    "" \
    "list    Show the ordered queue. REVIEWED-HEADS.tsv records the last source-reviewed HEAD." \
    "next    Review exactly one first pending checkout and print JSON to stdout." \
    "run     Review exactly one selected checkout and print JSON to stdout." \
    "prompt  Print the exact read-only prompt without invoking Grok." \
    "mark    After evidence consolidation, cache the checkout's current HEAD as source-reviewed; this does not grant reference admission."
}

repo_head() {
  git -C "$REF_ROOT/$1" rev-parse --short=12 HEAD
}

repo_status() {
  local rel="$1"
  if [ "$rel" = "software/craft-agents-oss" ]; then
    printf 'baseline'
    return
  fi
  local head
  head="$(repo_head "$rel")"
  if awk -F '\t' -v repo="$rel" -v head="$head" -v version="$REVIEW_SCHEMA_VERSION" '$1 == repo && $2 == head && $3 == version { found=1 } END { exit !found }' "$REVIEWED_HEADS"; then
    printf 'source-reviewed'
  else
    printf 'pending'
  fi
}

ordered_repos() {
  local rel
  local known
  local is_known
  for rel in "${REVIEW_ORDER[@]}"; do
    if [ -d "$REF_ROOT/$rel/.git" ]; then
      printf '%s\n' "$rel"
    fi
  done
  for rel in software/* plugins/*; do
    [ -d "$REF_ROOT/$rel/.git" ] || continue
    if [ "$rel" = "software/craft-agents-oss" ]; then
      continue
    fi
    is_known=false
    for known in "${REVIEW_ORDER[@]}"; do
      if [ "$rel" = "$known" ]; then
        is_known=true
        break
      fi
    done
    if [ "$is_known" = false ]; then
      printf '%s\n' "$rel"
    fi
  done
}

resolve_repo() {
  local requested="$1"
  if [ -d "$REF_ROOT/$requested/.git" ]; then
    printf '%s\n' "$requested"
    return
  fi

  local match=""
  local rel
  while IFS= read -r rel; do
    if [ "$(basename "$rel")" = "$requested" ]; then
      if [ -n "$match" ]; then
        printf 'Ambiguous repository name: %s\n' "$requested" >&2
        exit 2
      fi
      match="$rel"
    fi
  done < <(ordered_repos)

  if [ -z "$match" ]; then
    printf 'Unknown reference checkout: %s\n' "$requested" >&2
    exit 2
  fi
  printf '%s\n' "$match"
}

build_prompt() {
  local rel="$1"
  local head="$2"
  printf '%s\n' \
    "你正在对 Fleet 的一个本机只读开源参考 checkout 做源码级差分审查。" \
    "目标仓库：源码参考/$rel" \
    "目标提交：$head" \
    "Fleet 根目录：$ROOT_DIR" \
    "" \
    "硬约束：" \
    "0. 必须先实际使用本地文件/搜索工具完成审计，再输出唯一一次最终 JSON。禁止在第一轮或读取源码前输出占位 JSON、进度 JSON 或‘审查进行中’。所有 path 均写成相对 Fleet 根目录的真实路径。" \
    "1. 只读。禁止编辑、格式化、生成、安装、构建、运行 GUI、创建分支/提交/stash/tag，禁止修改目标 checkout 或 Fleet。" \
    "2. 禁止联网；只使用本机源码。不要相信 README 的宣传，重要结论必须落到真实代码路径和 symbol。" \
    "3. 先读根 AGENTS.md、源码参考/meta/CAPABILITY-REFERENCE-MAP.md 中相关能力行，再用 rg 定位 docs/08 对应行和 app/ 真实 Fleet/Craft 路径。禁止预读整套项目文档。" \
    "4. 最多保留 8 个有实际价值的 capability。每项必须审查入口、核心 symbol、caller、状态/数据路径、错误/取消/恢复路径和对应测试；缺少关键环节必须写明，不能用 README、官网、截图、star 或测试名补证据。" \
    "5. 对每项用相同用户任务和验收条件检查 Fleet/Craft 真实代码，而不是比较功能名。fleet_classification 只能是 CRAFT_REUSE|CRAFT_EXTEND|FLEET_NEW|NO_GAP。" \
    "6. 同类项目横向结论只能来自 CAPABILITY-REFERENCE-MAP.md 已登记且有源码证据的 alternatives。若没有足够横向证据，market_position 必须为 NO_COMPARISON_EVIDENCE，intake_decision 必须为 INSUFFICIENT_COMPARISON；禁止凭记忆声称市面最佳。" \
    "7. 必须做 local_surpass_test：若 Fleet 在现有 seam 上做边界清楚的小改即可达到或超过，intake_decision 强制为 LOCAL_IMPROVEMENT，并给出 exact target path/symbol、改动、验收；不得授予整仓参考地位。" \
    "8. FORMAL_REFERENCE 仅在 Craft/Fleet 缺失或明显更弱、源码已实装、同类领先有证据、Fleet 不可小改超过、没有更优 Fleet 设计、权威/许可/维护成本可接受时成立。只值一个子树/模块/symbol 时必须是 MODULE_REFERENCE。" \
    "9. FORMAL_REFERENCE 或 MODULE_REFERENCE 必须给出 reference_scope、目标 seam、调用方、生命周期与降级，并通过删除测试：删除 checkout 后是否仍会反复缺失无法由几句话表达的源码信息。" \
    "10. 不得创建第二套 Session/Permission/Timeline/Task/Settings/Workspace/Credential/Job/Memory/文件字节权威。许可不明、受限或需逐文件核对时，不得建议代码移植。" \
    "11. 不按 NOW/NEXT/LATER 分期，不因当前开发顺序忽略任何产品领域。这里只判断能力价值、证据强度与准入类别。" \
    "12. 不输出实施代码，不创建报告文件。完成取证后输出详细中文审计底稿，必须列出仓库内相对路径和 symbol；派单器会在第二个只格式化步骤中生成 JSON。" \
    "" \
    "评估重点：避免重复造轮子；找到可复用深模块、兼容适配器、许可允许的二开候选；明确拒绝会破坏 Fleet 权威或本地优先原则的部分。"
}

JSON_SCHEMA='{
  "type":"object",
  "additionalProperties":false,
  "required":["schema_version","repo","audit_trace","repo_disposition","capabilities","rejected_patterns","integration_notes"],
  "properties":{
    "schema_version":{"const":"fleet-reference-admission-v2"},
    "repo":{
      "type":"object","additionalProperties":false,
      "required":["path","head","license","license_confidence"],
      "properties":{
        "path":{"type":"string"},"head":{"type":"string"},"license":{"type":"string"},
        "license_confidence":{"enum":["CLEAR","FILE_LEVEL_CHECK_REQUIRED","RESTRICTED","UNKNOWN"]}
      }
    },
    "audit_trace":{
      "type":"array","minItems":7,
      "items":{"type":"object","additionalProperties":false,"required":["scope","path","symbol","finding"],"properties":{
        "scope":{"enum":["LICENSE","SOURCE_ENTRY","SOURCE_CALLER","SOURCE_STATE_OR_DATA","SOURCE_FAILURE_OR_RECOVERY","SOURCE_TEST","FLEET_COUNTERPART","ALTERNATIVE_EVIDENCE"]},
        "path":{"type":"string","minLength":1},"symbol":{"type":"string"},"finding":{"type":"string"}
      }}
    },
    "repo_disposition":{
      "type":"object","additionalProperties":false,
      "required":["classification","formal_reference_allowed","summary","blocking_gates","checkout_action"],
      "properties":{
        "classification":{"enum":["FORMAL_REFERENCE_CANDIDATE","MODULE_REFERENCE_CANDIDATE","LOCAL_IMPROVEMENT_ONLY","EVIDENCE_ONLY","REJECT","INSUFFICIENT_COMPARISON"]},
        "formal_reference_allowed":{"type":"boolean"},
        "summary":{"type":"string"},
        "blocking_gates":{"type":"array","items":{"type":"string"}},
        "checkout_action":{"enum":["KEEP_FULL","KEEP_SPARSE","KEEP_UNTIL_CONSOLIDATED","REMOVE_AFTER_CONSOLIDATION","NO_CHANGE"]}
      }
    },
    "capabilities":{
      "type":"array","minItems":1,"maxItems":8,
      "items":{
        "type":"object","additionalProperties":false,
        "required":["name","source_evidence","runtime_chain","test_evidence","fleet_evidence","implementation_state","fleet_classification","alternatives_in_map","market_position","superiority","local_surpass_test","intake_decision","reference_scope","target_seam","callers","authority_collision","license_action","deletion_test","recommendation"],
        "properties":{
          "name":{"type":"string"},
          "source_evidence":{"type":"array","minItems":2,"items":{"type":"object","additionalProperties":false,"required":["path","symbol","claim"],"properties":{"path":{"type":"string"},"symbol":{"type":"string"},"claim":{"type":"string"}}}},
          "runtime_chain":{"type":"array","minItems":3,"items":{"type":"object","additionalProperties":false,"required":["path","symbol","role"],"properties":{"path":{"type":"string"},"symbol":{"type":"string"},"role":{"enum":["ENTRY","CALLER","CORE","STATE_OR_DATA","ERROR","CANCEL","RECOVERY","OUTPUT"]}}}},
          "test_evidence":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["path","covers"],"properties":{"path":{"type":"string"},"covers":{"type":"string"}}}},
          "fleet_evidence":{"type":"array","items":{"type":"object","additionalProperties":false,"required":["path","symbol","claim"],"properties":{"path":{"type":"string"},"symbol":{"type":"string"},"claim":{"type":"string"}}}},
          "implementation_state":{"enum":["IMPLEMENTED","PARTIAL","DOCS_ONLY","CLAIM_ONLY","UNKNOWN"]},
          "fleet_classification":{"enum":["CRAFT_REUSE","CRAFT_EXTEND","FLEET_NEW","NO_GAP"]},
          "alternatives_in_map":{"type":"array","items":{"type":"string"}},
          "market_position":{"enum":["BEST_SUPPORTED","BETTER_ALTERNATIVE_EXISTS","NO_COMPARISON_EVIDENCE","NOT_APPLICABLE"]},
          "superiority":{"enum":["REFERENCE_MATERIALLY_BETTER","FLEET_MATERIALLY_BETTER","LOCAL_CHANGE_CAN_SURPASS","COMPLEMENTARY","NO_MEANINGFUL_DIFFERENCE","UNKNOWN"]},
          "local_surpass_test":{"type":"object","additionalProperties":false,"required":["feasible","target_path_or_symbol","bounded_change","acceptance","reason"],"properties":{"feasible":{"enum":["YES","NO","UNKNOWN"]},"target_path_or_symbol":{"type":"string"},"bounded_change":{"type":"string"},"acceptance":{"type":"array","items":{"type":"string"}},"reason":{"type":"string"}}},
          "intake_decision":{"enum":["FORMAL_REFERENCE","MODULE_REFERENCE","LOCAL_IMPROVEMENT","EVIDENCE_ONLY","REJECT","INSUFFICIENT_COMPARISON"]},
          "reference_scope":{"type":"array","items":{"type":"string"}},
          "target_seam":{"type":"string"},
          "callers":{"type":"array","items":{"type":"string"}},
          "authority_collision":{"type":"array","items":{"type":"string"}},
          "license_action":{"type":"string"},
          "deletion_test":{"type":"object","additionalProperties":false,"required":["needs_checkout","reason"],"properties":{"needs_checkout":{"type":"boolean"},"reason":{"type":"string"}}},
          "recommendation":{"type":"string"}
        }
      }
    },
    "rejected_patterns":{"type":"array","items":{"type":"string"}},
    "integration_notes":{"type":"array","items":{"type":"string"}}
  }
}'

run_review() {
  local rel="$1"
  if [ -z "$GROK_BIN" ]; then
    printf 'grok executable not found. Set GROK_BIN or install Grok Build.\n' >&2
    exit 127
  fi
  if [ "$rel" = "software/craft-agents-oss" ]; then
    printf '%s is the fixed baseline, not an ordinary intake target.\n' "$rel" >&2
    exit 2
  fi

  if ! command -v jq >/dev/null 2>&1; then
    printf 'jq is required to extract Grok structuredOutput.\n' >&2
    exit 127
  fi

  local head prompt structuring_prompt audit_text before after root_before root_after isolated_home isolated_user_home isolated_grok_home audit_output grok_output structured_output grok_status structure_status evidence_path
  head="$(repo_head "$rel")"
  prompt="$(build_prompt "$rel" "$head")"
  before="$(git -C "$REF_ROOT/$rel" status --porcelain=v1)"
  root_before="$(git -C "$ROOT_DIR" status --porcelain=v1 --untracked-files=all)"
  isolated_home="$(mktemp -d "${TMPDIR:-/tmp}/fleet-grok-review.XXXXXX")"
  isolated_user_home="$isolated_home/home"
  isolated_grok_home="$isolated_home/grok"
  mkdir -p "$isolated_user_home" "$isolated_grok_home"
  audit_output="$isolated_home/audit.json"
  grok_output="$isolated_home/result.json"
  structured_output="$isolated_home/structured.json"
  trap "rm -rf '$isolated_home'" EXIT INT TERM

  # Reuse only Grok authentication/model discovery. Do not load the user's
  # global MCP servers, plugins, hooks, skills, memory, sessions or config.
  # HOME is isolated as well because Grok can discover Claude/Cursor components
  # independently from GROK_HOME.
  if [ -f "$HOME/.grok/auth.json" ]; then
    cp "$HOME/.grok/auth.json" "$isolated_grok_home/auth.json"
    chmod 600 "$isolated_grok_home/auth.json"
  fi
  if [ -f "$HOME/.grok/models_cache.json" ]; then
    cp "$HOME/.grok/models_cache.json" "$isolated_grok_home/models_cache.json"
  fi

  # Pass 1 is deliberately unconstrained prose: Grok must inspect source before
  # it has to satisfy a large output schema. Combining both caused premature
  # placeholder JSON in Grok CLI 0.2.102.
  set +e
  HOME="$isolated_user_home" GROK_HOME="$isolated_grok_home" "$GROK_BIN" \
    --cwd "$ROOT_DIR" \
    --single "$prompt" \
    --output-format json \
    --permission-mode dontAsk \
    --tools "read_file,grep,list_dir,run_terminal_cmd" \
    --allow "Read(**)" \
    --allow "Grep(**)" \
    --allow "Bash(*)" \
    --sandbox read-only \
    --no-memory \
    --no-subagents \
    --disable-web-search \
    --max-turns "$GROK_MAX_TURNS" \
    > "$audit_output"
  grok_status=$?
  set -e

  if [ "$grok_status" -ne 0 ]; then
    printf 'ERROR: Grok source audit failed for %s with exit code %s.\n' "$rel" "$grok_status" >&2
    exit "$grok_status"
  fi
  audit_text="$(jq -r '.text // empty' "$audit_output")"
  if [ "${#audit_text}" -lt 1200 ]; then
    printf 'ERROR: Grok source audit was too short to demonstrate a detailed code review for %s.\n' "$rel" >&2
    jq '{stopReason,num_turns,text:(.text // "")[-1200:]}' "$audit_output" >&2
    exit 4
  fi
  structuring_prompt=$(printf '%s\n' \
    "下面是已完成的 Fleet 开源参考源码审计底稿。你只负责忠实结构化，不再读取文件、不补造路径、symbol、同类比较或市场结论。" \
    "路径必须保持为相对 Fleet 根目录的真实普通文件路径，绝不能输出目录、glob、占位路径或带大括号的路径；底稿没有同类证据时必须输出 NO_COMPARISON_EVIDENCE/INSUFFICIENT_COMPARISON；小改可超过时必须输出 LOCAL_IMPROVEMENT。" \
    "禁止输出 pending、placeholder、待核验、待审查或审查进行中。只输出 schema 要求的最终 JSON。" \
    "" \
    "$audit_text")

  set +e
  HOME="$isolated_user_home" GROK_HOME="$isolated_grok_home" "$GROK_BIN" \
    --cwd "$ROOT_DIR" \
    --single "$structuring_prompt" \
    --json-schema "$JSON_SCHEMA" \
    --permission-mode plan \
    --sandbox read-only \
    --no-memory \
    --no-subagents \
    --disable-web-search \
    --max-turns 4 \
    > "$grok_output"
  structure_status=$?
  set -e

  after="$(git -C "$REF_ROOT/$rel" status --porcelain=v1)"
  root_after="$(git -C "$ROOT_DIR" status --porcelain=v1 --untracked-files=all)"
  if [ "$before" != "$after" ]; then
    printf 'ERROR: Grok changed the read-only reference checkout: %s\n' "$rel" >&2
    exit 3
  fi
  if [ "$root_before" != "$root_after" ]; then
    printf 'ERROR: Grok changed the Fleet worktree while running a read-only review.\n' >&2
    exit 3
  fi
  if [ "$structure_status" -ne 0 ]; then
    printf 'ERROR: Grok audit structuring failed for %s with exit code %s.\n' "$rel" "$structure_status" >&2
    exit "$structure_status"
  fi

  if jq -e '.structuredOutput != null' "$grok_output" >/dev/null; then
    jq '.structuredOutput' "$grok_output" > "$structured_output"
  elif jq -e '.text | fromjson | type == "object"' "$grok_output" >/dev/null 2>&1; then
    # Some Grok CLI builds return a complete JSON object in `text` but leave
    # structuredOutput null when their internal schema checker cancels late.
    # Parse it only as a candidate; the stricter evidence checks below still
    # reject missing fields, placeholders, directories, or invented paths.
    jq '.text | fromjson' "$grok_output" > "$structured_output"
  else
    printf 'ERROR: Grok ended without parseable structured output for %s.\n' "$rel" >&2
    jq '{stopReason,num_turns,text:(.text // "")[-1200:]}' "$grok_output" >&2
    exit 4
  fi
  if ! jq -e '
    .schema_version == "fleet-reference-admission-v2" and
    (.repo | type == "object") and
    (.repo_disposition | type == "object") and
    (.audit_trace | type == "array" and length >= 7) and
    (.capabilities | type == "array" and length >= 1 and length <= 8) and
    (.rejected_patterns | type == "array") and
    (.integration_notes | type == "array")
  ' "$structured_output" >/dev/null; then
    printf 'ERROR: Grok output is missing the admission-v2 top-level contract.\n' >&2
    exit 5
  fi
  if jq -e '
    ([.audit_trace[].scope] | unique) as $scopes |
    (["LICENSE","SOURCE_ENTRY","SOURCE_CALLER","SOURCE_STATE_OR_DATA","SOURCE_FAILURE_OR_RECOVERY","SOURCE_TEST","FLEET_COUNTERPART"] - $scopes | length) > 0
  ' "$structured_output" >/dev/null; then
    printf 'ERROR: Grok did not cover every mandatory source-audit scope.\n' >&2
    exit 5
  fi
  if jq -e '
    [
      .audit_trace[].symbol,
      .capabilities[].source_evidence[].symbol,
      .capabilities[].runtime_chain[].symbol
    ] | any(test("^(pending|placeholder|bootstrap)$"; "i"))
  ' "$structured_output" >/dev/null; then
    printf 'ERROR: Grok returned placeholder symbols instead of source evidence.\n' >&2
    exit 5
  fi
  if jq -e '
    [
      .audit_trace[].finding,
      .capabilities[].source_evidence[].claim,
      .capabilities[].recommendation
    ] | any(test("审查进行中|待核验|待审查|待定位|占位"))
  ' "$structured_output" >/dev/null; then
    printf 'ERROR: Grok returned an interim narrative instead of a completed source audit.\n' >&2
    exit 5
  fi
  if [ "$(jq -r '[.audit_trace[].path] | unique | length' "$structured_output")" -lt 5 ]; then
    printf 'ERROR: Grok evidence does not span at least five distinct source/Fleet files.\n' >&2
    exit 5
  fi
  while IFS= read -r evidence_path; do
    case "$evidence_path" in
      /*|*../*|../*|*'/..')
        printf 'ERROR: Grok returned a non-workspace-relative evidence path: %s\n' "$evidence_path" >&2
        exit 5
        ;;
    esac
    if [ ! -f "$ROOT_DIR/$evidence_path" ]; then
      printf 'ERROR: Grok evidence path is not an existing regular file: %s\n' "$evidence_path" >&2
      exit 5
    fi
  done < <(jq -r '.audit_trace[].path, .capabilities[].source_evidence[].path, .capabilities[].runtime_chain[].path, .capabilities[].test_evidence[].path, .capabilities[].fleet_evidence[].path' "$structured_output")
  cat "$structured_output"
}

mark_reviewed() {
  local rel="$1"
  local head tmp
  head="$(repo_head "$rel")"
  tmp="$(mktemp "${TMPDIR:-/tmp}/fleet-reviewed-heads.XXXXXX")"
  awk -F '\t' -v repo="$rel" '$1 != repo' "$REVIEWED_HEADS" > "$tmp"
  printf '%s\t%s\t%s\n' "$rel" "$head" "$REVIEW_SCHEMA_VERSION" >> "$tmp"
  LC_ALL=C sort -t $'\t' -k1,1 "$tmp" > "$REVIEWED_HEADS"
  rm -f "$tmp"
  printf 'Marked %s at %s as source-reviewed. This cache does not grant formal reference admission.\n' "$rel" "$head"
}

command="${1:-}"
case "$command" in
  list)
    printf '%-42s %-12s %s\n' "repository" "head" "status"
    while IFS= read -r rel; do
      printf '%-42s %-12s %s\n' "$rel" "$(repo_head "$rel")" "$(repo_status "$rel")"
    done < <(ordered_repos)
    printf '%-42s %-12s %s\n' "software/craft-agents-oss" "$(repo_head software/craft-agents-oss)" "baseline"
    ;;
  next)
    while IFS= read -r rel; do
      if [ "$(repo_status "$rel")" = "pending" ]; then
        printf 'Reviewing %s at %s\n' "$rel" "$(repo_head "$rel")" >&2
        run_review "$rel"
        exit 0
      fi
    done < <(ordered_repos)
    printf 'No pending reference checkout. Refresh repositories to look for stale HEADs.\n' >&2
    ;;
  run)
    [ "$#" -eq 2 ] || { usage >&2; exit 2; }
    run_review "$(resolve_repo "$2")"
    ;;
  prompt)
    [ "$#" -eq 2 ] || { usage >&2; exit 2; }
    rel="$(resolve_repo "$2")"
    build_prompt "$rel" "$(repo_head "$rel")"
    ;;
  mark)
    [ "$#" -eq 2 ] || { usage >&2; exit 2; }
    mark_reviewed "$(resolve_repo "$2")"
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac
