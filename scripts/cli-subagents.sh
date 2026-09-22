#!/usr/bin/env bash
# cli-subagents.sh v2 — quota-aware dispatcher for local CLI agents.
# Runs Antigravity / Kimi / OpenCode / Cursor / Codex as parallel one-shot
# subagents over a shared task queue, with quota detection, cooldown,
# failover, optional per-task verification and escalation.
# NOT Fleet in-app CLI Runtime — invokes binaries on this Mac directly.
#
# Core model (why it looks like this):
#   - Agents have limited quota. Cheap/fast agents (agy) take easy bulk work;
#     smart agents (codex/cursor/kimi/opencode) are reserved for hard tasks
#     and for rescuing easy tasks that failed verification.
#   - When an agent's quota runs out (detected from its output), it enters a
#     persistent cooldown (survives across runs, in --state-dir) and its task
#     is requeued to the next eligible agent. If every eligible agent is in
#     cooldown, remaining tasks are saved and the run exits 75 with a resume
#     command — tasks are never lost.
#
# Examples:
#   ./scripts/cli-subagents.sh --lane easy -- "fix typo in docs/ARCHITECTURE.md ..." "update stale date in ..."
#   ./scripts/cli-subagents.sh --tasks-file /tmp/batch.txt --verify 'python3 scripts/validate-doc-contracts.py'
#   ./scripts/cli-subagents.sh --only codex -- "hard: refactor the doc-links module ..."
#   ./scripts/cli-subagents.sh --probe          # roster, binaries, quota cooldowns
#   ./scripts/cli-subagents.sh --resume /tmp/fleet-cli-subagents-XXXX   # continue a starved run
#
# Task lanes:
#   easy → agy first (big quota, needs explicit instructions; give it many).
#   hard → smart agents only; agy is excluded unless --spill.
#   Prefix a task with "easy:" or "hard:" to override --lane per task.
#
# Logs & state: RUN_DIR/t<NN>-<agent>.{out,err}, RUN_DIR/results.tsv,
#               STATE_DIR/cooldown-<agent>, STATE_DIR/ledger.log

set -uo pipefail

# ---------------------------------------------------------------- defaults --
WORKSPACE="${WORKSPACE:-$(cd "$(dirname "$0")/.." && pwd)}"
RUN_DIR="${OUT_DIR:-}"
STATE_DIR="${STATE_DIR:-$HOME/.fleet/cli-agents}"

AGENTS="agy cbc kimi opencode cursor codex"
CHEAP="agy cbc"   # big/unlimited quota, lower capability → easy lane

BIN_agy="${AGY_BIN:-$(command -v agy 2>/dev/null || echo /Users/lullwen/.local/bin/agy)}"
BIN_cbc="${CBC_BIN:-$(command -v cbc 2>/dev/null || echo /Users/lullwen/.local/bin/cbc)}"
BIN_kimi="${KIMI_BIN:-$(command -v kimi 2>/dev/null || echo /Users/lullwen/.kimi-code/bin/kimi)}"
BIN_opencode="${OPENCODE_BIN:-$(command -v opencode 2>/dev/null || echo /opt/homebrew/bin/opencode)}"
BIN_cursor="${CURSOR_BIN:-$(command -v cursor-agent 2>/dev/null || echo /Users/lullwen/.local/bin/agent)}"
BIN_codex="${CODEX_BIN:-$(command -v codex 2>/dev/null || echo /Users/lullwen/.local/bin/codex)}"

MODEL_agy="${AGY_MODEL:-Gemini 3.5 Flash (High)}"
MODEL_cbc="${CBC_MODEL:-}"
MODEL_kimi="${KIMI_MODEL:-}"
MODEL_opencode="${OPENCODE_MODEL:-}"
MODEL_cursor="${CURSOR_MODEL:-}"
MODEL_codex="${CODEX_MODEL:-}"

# Parallel slots per agent. agy is fast with a large quota; cbc is weak but
# has unlimited quota — both take several easy tasks at once. Smart agents run
# one task at a time.
SLOTS_agy="${AGY_JOBS:-3}"
SLOTS_cbc="${CBC_JOBS:-2}"
SLOTS_kimi=1
SLOTS_opencode=1
SLOTS_cursor=1
SLOTS_codex=1

# Dispatch order per lane (first eligible wins). Overridable via env.
# easy: fast-and-cheap first (agy), unlimited-quota second (cbc); smart agents
#       only when every cheap agent is in cooldown or missing.
# hard: strongest first (codex ~ lead-level: important work and reviews).
EASY_ORDER="${EASY_ORDER:-agy cbc codex cursor kimi opencode}"
HARD_ORDER="${HARD_ORDER:-codex cursor kimi opencode}"

DEFAULT_LANE="hard"
SPILL=0                      # 1 = hard tasks may fall back to agy as last resort
RETRIES="${RETRIES:-2}"      # max reassignments per task after real failures
TIMEOUT_MIN="${TIMEOUT_MIN:-30}"
COOLDOWN_MIN="${COOLDOWN_MIN:-360}"
VERIFY_CMD=""
TASKS_FILE=""
RESUME_DIR=""
DRY_RUN=0
PROBE=0
ONLY=""
SKIP=""

# Output patterns that mean "quota/credit exhausted", not "task failed".
# Deliberately phrase-level: bare words false-positive on echoed file content
# ("quotations" contains "quota"; git hashes contain "402"/"429"). Checked
# ONLY when the agent exits non-zero — a successful exit is never quota death.
QUOTA_REGEX="${QUOTA_REGEX:-rate.?limit (reached|exceeded|hit)|too many requests|status.?(429|402)|http.?(429|402)|error.?(429|402)|quota (exceeded|exhausted|reached|used up)|out of quota|insufficient (credit|fund|balance|quota)|out of (credit|token)s|credit balance (is )?(too low|empty|exhausted)|usage limit (reached|exceeded)|payment required|subscription .*(expired|exceeded)|额度(已)?(用完|耗尽|不足)|超出.?(额度|限额)|欠费|配额(已)?(用完|耗尽|不足)|次数已用}"

usage() {
  cat <<'EOF'
Usage: ./scripts/cli-subagents.sh [options] [--] task [task ...]

Each positional argument is ONE task (a full prompt). Tasks are queued and
dispatched to agents by lane; an agent picks up the next task when free.

Options:
  --lane easy|hard       Default lane for unlabeled tasks (default: hard).
                         Per-task override: prefix the task with "easy:" or "hard:".
  --tasks-file FILE      Read tasks from FILE, one per line ("easy:"/"hard:" prefixes ok).
  --only A[,B...]        Restrict roster: agy | cbc | kimi | opencode | cursor | codex
  --skip A[,B...]        Remove agents from the roster.
  --spill                Allow hard tasks to fall back to agy when all smart
                         agents are unavailable (off by default: agy output on
                         hard tasks is rarely worth its speed).
  --verify CMD           Run CMD (cwd=workspace) after each task; env gets
                         TASK_ID/TASK_AGENT/TASK_OUT. Non-zero exit = the work
                         is rejected and the task escalates to a smarter agent.
  --retries N            Max reassignments per task on real failure (default 2).
  --timeout MIN          Per-task wall clock; overdue tasks are killed and
                         requeued (default 30).
  --cooldown MIN         Quota cooldown length in minutes (default 360).
  --state-dir PATH       Persistent quota/cooldown ledger (default ~/.fleet/cli-agents).
  --out-dir PATH         Run directory (queue state + logs).
  --resume DIR           Re-enqueue the unfinished tasks of a previous run.
  --workspace PATH       Repo root handed to every agent (default: repo root).
  --agy-model M | --cbc-model M | --kimi-model M | --opencode-model M | --cursor-model M | --codex-model M
  --dry-run              Print the dispatch plan, run nothing.
  --probe                Show roster: binary, model, slots, cooldown state; exit.
  -h, --help             This help.

Environment overrides:
  AGY_BIN CBC_BIN KIMI_BIN OPENCODE_BIN CURSOR_BIN CODEX_BIN
  AGY_MODEL CBC_MODEL KIMI_MODEL OPENCODE_MODEL CURSOR_MODEL CODEX_MODEL
  AGY_JOBS CBC_JOBS EASY_ORDER HARD_ORDER RETRIES TIMEOUT_MIN COOLDOWN_MIN
  QUOTA_REGEX PREAMBLE WORKSPACE OUT_DIR STATE_DIR

Quota policy (what happens when an agent runs out):
  1. Exhaustion is detected from the agent's output (QUOTA_REGEX) or a failed
     probe; the agent enters cooldown for --cooldown minutes, recorded in
     STATE_DIR so later runs skip it too.
  2. Its task is requeued (not counted as a failure) to the next eligible agent.
  3. If ALL eligible agents are cooling down, the remaining queue is saved and
     the run exits 75, printing the exact --resume command.
Exit codes: 0 all done · 1 some tasks failed · 75 quota-starved (resume later).

Max-power flags baked in per agent:
  Antigravity: --print --dangerously-skip-permissions --add-dir WS --print-timeout <timeout>
  CodeBuddy:   -p --dangerously-skip-permissions --add-dir WS
  Kimi:        --prompt ... --auto --add-dir WS
  OpenCode:    run --auto --dir WS
  Cursor:      --print --force --trust --workspace WS
  Codex:       exec --dangerously-bypass-approvals-and-sandbox -C WS
EOF
}

# ------------------------------------------------------------------ helpers --
get() { eval "printf '%s' \"\${$1:-}\""; }
now() { date +%s; }
ts() { date +%H:%M:%S; }
say() { printf '[%s] %s\n' "$(ts)" "$*"; }
ledger() { mkdir -p "$STATE_DIR"; printf '%s %s\n' "$(date '+%F %T')" "$*" >>"$STATE_DIR/ledger.log"; }

in_list() { # in_list needle "a b c"
  local n="$1" x
  for x in $2; do [[ "$x" == "$n" ]] && return 0; done
  return 1
}

cooldown_until() { # -> epoch or 0
  local f="$STATE_DIR/cooldown-$1"
  [[ -f "$f" ]] || { echo 0; return; }
  head -n1 "$f" 2>/dev/null || echo 0
}

is_cooling() {
  local u; u="$(cooldown_until "$1")"
  [[ "$u" =~ ^[0-9]+$ ]] && [[ "$u" -gt "$(now)" ]]
}

start_cooldown() { # agent reason
  mkdir -p "$STATE_DIR"
  local until=$(( $(now) + COOLDOWN_MIN * 60 ))
  { echo "$until"; echo "$2"; } >"$STATE_DIR/cooldown-$1"
  ledger "cooldown $1 ${COOLDOWN_MIN}m: $2"
  say "⚠ $1 quota exhausted → cooldown ${COOLDOWN_MIN}m ($2)"
}

agent_alive() { # binary exists and not cooling
  local bin; bin="$(get "BIN_$1")"
  [[ -x "$bin" ]] || return 1
  is_cooling "$1" && return 1
  return 0
}

looks_like_quota() { # outfile errfile -> 0 if quota exhaustion
  local out="$1" err="$2"
  { [[ -f "$err" ]] && grep -Eiq "$QUOTA_REGEX" "$err"; } && return 0
  { [[ -f "$out" ]] && tail -n 50 "$out" | grep -Eiq "$QUOTA_REGEX"; } && return 0
  return 1
}

# --------------------------------------------------------------- arg parsing --
POSITIONAL=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --lane)            DEFAULT_LANE="${2:?--lane needs easy|hard}"; shift 2 ;;
    --tasks-file)      TASKS_FILE="${2:?--tasks-file needs a path}"; shift 2 ;;
    --only)            ONLY="${2:?--only needs agent name(s)}"; shift 2 ;;
    --skip)            SKIP="${2:?--skip needs agent name(s)}"; shift 2 ;;
    --spill)           SPILL=1; shift ;;
    --verify)          VERIFY_CMD="${2:?--verify needs a command}"; shift 2 ;;
    --retries)         RETRIES="${2:?}"; shift 2 ;;
    --timeout)         TIMEOUT_MIN="${2:?}"; shift 2 ;;
    --cooldown)        COOLDOWN_MIN="${2:?}"; shift 2 ;;
    --state-dir)       STATE_DIR="${2:?}"; shift 2 ;;
    --out-dir)         RUN_DIR="${2:?}"; shift 2 ;;
    --resume)          RESUME_DIR="${2:?--resume needs a run dir}"; shift 2 ;;
    --workspace)       WORKSPACE="${2:?}"; shift 2 ;;
    --agy-model)       MODEL_agy="${2:?}"; shift 2 ;;
    --cbc-model)       MODEL_cbc="${2:?}"; shift 2 ;;
    --kimi-model)      MODEL_kimi="${2:?}"; shift 2 ;;
    --opencode-model)  MODEL_opencode="${2:?}"; shift 2 ;;
    --cursor-model)    MODEL_cursor="${2:?}"; shift 2 ;;
    --codex-model)     MODEL_codex="${2:?}"; shift 2 ;;
    --dry-run)         DRY_RUN=1; shift ;;
    --probe)           PROBE=1; shift ;;
    -h|--help)         usage; exit 0 ;;
    --)                shift; POSITIONAL+=("$@"); break ;;
    -*)                echo "error: unknown option: $1" >&2; usage >&2; exit 2 ;;
    *)                 POSITIONAL+=("$1"); shift ;;
  esac
done

case "$DEFAULT_LANE" in easy|hard) ;; *) echo "error: --lane must be easy|hard" >&2; exit 2 ;; esac

# Roster after --only / --skip
ROSTER=""
for a in $AGENTS; do
  if [[ -n "$ONLY" ]]; then
    case ",$ONLY," in *",$a,"*) ;; *) continue ;; esac
  fi
  case ",$SKIP," in *",$a,"*) continue ;; esac
  ROSTER="$ROSTER $a"
done
ROSTER="${ROSTER# }"
[[ -n "$ROSTER" ]] || { echo "error: roster is empty after --only/--skip" >&2; exit 2; }

# ------------------------------------------------------------------- probe --
if [[ "$PROBE" -eq 1 ]]; then
  printf '%-10s %-6s %-6s %-9s %s\n' AGENT SLOTS TIER STATE BIN
  for a in $ROSTER; do
    bin="$(get "BIN_$a")"; tier="smart"; in_list "$a" "$CHEAP" && tier="cheap"
    if [[ ! -x "$bin" ]]; then st="no-bin"
    elif is_cooling "$a"; then
      u="$(cooldown_until "$a")"; st="cool $(( (u - $(now)) / 60 ))m"
    else st="ready"; fi
    printf '%-10s %-6s %-6s %-9s %s\n' "$a" "$(get "SLOTS_$a")" "$tier" "$st" "$bin"
  done
  [[ -f "$STATE_DIR/ledger.log" ]] && { echo; echo "recent quota events:"; tail -n 5 "$STATE_DIR/ledger.log"; }
  exit 0
fi

# ------------------------------------------------------------- task intake --
TASK_TEXT=(); TASK_LANE=(); TASK_STATE=(); TASK_TRIED=(); TASK_ATTEMPTS=(); TASK_AGENT=(); TASK_T0=(); TASK_NOTE=()

add_task() { # raw text
  local raw="$1" lane="$DEFAULT_LANE"
  case "$raw" in
    easy:*) lane="easy"; raw="${raw#easy:}" ;;
    hard:*) lane="hard"; raw="${raw#hard:}" ;;
  esac
  raw="${raw# }"
  [[ -n "$raw" ]] || return 0
  TASK_TEXT+=("$raw"); TASK_LANE+=("$lane"); TASK_STATE+=("pending")
  TASK_TRIED+=(""); TASK_ATTEMPTS+=(0); TASK_AGENT+=("-"); TASK_T0+=(0); TASK_NOTE+=("")
}

if [[ -n "$RESUME_DIR" ]]; then
  [[ -f "$RESUME_DIR/pending.txt" ]] || { echo "error: $RESUME_DIR/pending.txt not found" >&2; exit 2; }
  while IFS= read -r line; do [[ -n "$line" ]] && add_task "$line"; done <"$RESUME_DIR/pending.txt"
fi
if [[ -n "$TASKS_FILE" ]]; then
  [[ -f "$TASKS_FILE" ]] || { echo "error: tasks file not found: $TASKS_FILE" >&2; exit 2; }
  while IFS= read -r line; do
    case "$line" in \#*|"") continue ;; esac
    add_task "$line"
  done <"$TASKS_FILE"
fi
for t in ${POSITIONAL[@]+"${POSITIONAL[@]}"}; do add_task "$t"; done

NTASK=${#TASK_TEXT[@]}
[[ "$NTASK" -gt 0 ]] || { usage >&2; exit 2; }

# --------------------------------------------------------------- run setup --
[[ -n "$RUN_DIR" ]] || RUN_DIR="/tmp/fleet-cli-subagents-$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$RUN_DIR" "$STATE_DIR"

PREAMBLE_DEFAULT="You are a one-shot subagent working in the repo at $WORKSPACE.
First read the root AGENTS.md and follow it. Then do EXACTLY the task below — nothing more.
Hard rules: never git commit/push/tag, never delete files unless the task says so, stay inside
the task's stated file scope, keep the diff minimal. When done, print a short report:
files changed, commands run, and how you verified the result.
TASK:"
PREAMBLE="${PREAMBLE:-$PREAMBLE_DEFAULT}"

# order_for <lane> <tried> -> eligible agent order for a task
order_for() {
  local lane="$1" tried="$2" order out="" a
  if [[ "$lane" == "easy" ]]; then order="$EASY_ORDER"; else
    order="$HARD_ORDER"; [[ "$SPILL" -eq 1 ]] && order="$order agy"
  fi
  for a in $order; do
    in_list "$a" "$ROSTER" || continue
    in_list "$a" "$tried" && continue
    out="$out $a"
  done
  printf '%s' "${out# }"
}

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "workspace: $WORKSPACE"
  echo "roster:    $ROSTER (agy slots: $(get SLOTS_agy))"
  echo "lanes:     easy=[$EASY_ORDER] hard=[$HARD_ORDER$([[ $SPILL -eq 1 ]] && echo ' agy')]"
  echo "verify:    ${VERIFY_CMD:-<none>}   retries: $RETRIES   timeout: ${TIMEOUT_MIN}m   cooldown: ${COOLDOWN_MIN}m"
  echo
  i=0
  while [[ $i -lt $NTASK ]]; do
    ord="$(order_for "${TASK_LANE[$i]}" "")"
    printf 't%02d %-4s → [%s]  %.90s\n' "$i" "${TASK_LANE[$i]}" "${ord:-NO ELIGIBLE AGENT}" "${TASK_TEXT[$i]}"
    i=$((i+1))
  done
  exit 0
fi

# ------------------------------------------------------------------ launch --
build_and_run() { # agent task_text out err  (runs in background subshell)
  local a="$1" text="$2" out="$3" err="$4" bin model prompt
  bin="$(get "BIN_$a")"; model="$(get "MODEL_$a")"
  prompt="$PREAMBLE
$text"
  case "$a" in
    agy)
      "$bin" --print "$prompt" --model "$model" \
        --dangerously-skip-permissions --add-dir "$WORKSPACE" \
        --print-timeout "${TIMEOUT_MIN}m" >"$out" 2>"$err"
      ;;
    cbc)
      local args=(-p "$prompt" --dangerously-skip-permissions --add-dir "$WORKSPACE")
      [[ -n "$model" ]] && args+=(--model "$model")
      (cd "$WORKSPACE" && "$bin" "${args[@]}") >"$out" 2>"$err"
      ;;
    kimi)
      local args=(--prompt "$prompt" --auto --add-dir "$WORKSPACE")
      [[ -n "$model" ]] && args+=(--model "$model")
      (cd "$WORKSPACE" && "$bin" "${args[@]}") >"$out" 2>"$err"
      ;;
    opencode)
      local args=(run --auto --dir "$WORKSPACE")
      [[ -n "$model" ]] && args+=(--model "$model")
      args+=("$prompt")
      (cd "$WORKSPACE" && "$bin" "${args[@]}") >"$out" 2>"$err"
      ;;
    cursor)
      local args=(--print --force --trust --workspace "$WORKSPACE")
      [[ -n "$model" ]] && args+=(--model "$model")
      args+=("$prompt")
      (cd "$WORKSPACE" && "$bin" "${args[@]}") >"$out" 2>"$err"
      ;;
    codex)
      local args=(exec --dangerously-bypass-approvals-and-sandbox -C "$WORKSPACE")
      [[ -n "$model" ]] && args+=(--model "$model")
      args+=("$prompt")
      (cd "$WORKSPACE" && "$bin" "${args[@]}") >"$out" 2>"$err"
      ;;
  esac
}

# slot tables (indexed arrays, bash-3.2 safe)
SLOT_AGENT=(); SLOT_PID=(); SLOT_TASK=()
for a in $ROSTER; do
  n="$(get "SLOTS_$a")"; s=0
  while [[ $s -lt $n ]]; do SLOT_AGENT+=("$a"); SLOT_PID+=(0); SLOT_TASK+=(-1); s=$((s+1)); done
done
NSLOT=${#SLOT_AGENT[@]}

busy_slots_of() { # agent -> count
  local a="$1" i=0 c=0
  while [[ $i -lt $NSLOT ]]; do
    [[ "${SLOT_AGENT[$i]}" == "$a" && "${SLOT_PID[$i]}" -ne 0 ]] && c=$((c+1))
    i=$((i+1))
  done
  echo "$c"
}

free_slot_of() { # agent -> slot index or -1
  local a="$1" i=0
  while [[ $i -lt $NSLOT ]]; do
    if [[ "${SLOT_AGENT[$i]}" == "$a" && "${SLOT_PID[$i]}" -eq 0 ]]; then echo "$i"; return; fi
    i=$((i+1))
  done
  echo -1
}

launch() { # task_id slot_id
  local t="$1" s="$2" a="${SLOT_AGENT[$2]}"
  local out err
  out="$(printf '%s/t%02d-%s.out' "$RUN_DIR" "$t" "$a")"
  err="$(printf '%s/t%02d-%s.err' "$RUN_DIR" "$t" "$a")"
  build_and_run "$a" "${TASK_TEXT[$t]}" "$out" "$err" &
  SLOT_PID[$s]=$!
  SLOT_TASK[$s]=$t
  TASK_STATE[$t]="running"; TASK_AGENT[$t]="$a"; TASK_T0[$t]="$(now)"
  TASK_TRIED[$t]="${TASK_TRIED[$t]} $a"; TASK_TRIED[$t]="${TASK_TRIED[$t]# }"
  say "▶ t$(printf '%02d' "$t") (${TASK_LANE[$t]}) → $a   ${TASK_TEXT[$t]:0:80}"
}

requeue() { # task_id note
  TASK_STATE[$1]="pending"; TASK_AGENT[$1]="-"; TASK_NOTE[$1]="$2"
}

finish() { # task_id state note
  TASK_STATE[$1]="$2"; TASK_NOTE[$1]="$3"
}

verify_task() { # task_id agent -> 0 pass
  [[ -n "$VERIFY_CMD" ]] || return 0
  local t="$1" a="$2"
  ( cd "$WORKSPACE" && \
    TASK_ID="t$t" TASK_AGENT="$a" TASK_OUT="$(printf '%s/t%02d-%s.out' "$RUN_DIR" "$t" "$a")" \
    bash -c "$VERIFY_CMD" ) >"$RUN_DIR/t$(printf '%02d' "$t")-verify.log" 2>&1
}

on_slot_done() { # slot_id exit_code
  # NB: split declarations — in one `local a=$1 b=${X[$a]}` line, bash expands
  # every assignment BEFORE local runs, so $a would be the caller's variable.
  local s="$1" code="$2"
  local t="${SLOT_TASK[$s]}" a="${SLOT_AGENT[$s]}"
  local out err dur
  out="$(printf '%s/t%02d-%s.out' "$RUN_DIR" "$t" "$a")"
  err="$(printf '%s/t%02d-%s.err' "$RUN_DIR" "$t" "$a")"
  dur=$(( $(now) - TASK_T0[$t] ))
  SLOT_PID[$s]=0; SLOT_TASK[$s]=-1

  if [[ "$code" -eq 0 ]]; then
    if verify_task "$t" "$a"; then
      finish "$t" "done" "by $a in ${dur}s"
      say "✓ t$(printf '%02d' "$t") done by $a (${dur}s)"
    else
      # Work rejected by the verify gate → escalate to a smarter agent.
      TASK_LANE[$t]="hard"
      TASK_ATTEMPTS[$t]=$(( TASK_ATTEMPTS[$t] + 1 ))
      if [[ "${TASK_ATTEMPTS[$t]}" -gt "$RETRIES" ]]; then
        finish "$t" "failed" "verify failed after $a; retries exhausted"
        say "✗ t$(printf '%02d' "$t") verify FAILED after $a — retries exhausted"
      else
        requeue "$t" "verify failed after $a → escalating"
        say "↻ t$(printf '%02d' "$t") verify failed after $a → escalating to smart lane"
      fi
    fi
    return
  fi

  if looks_like_quota "$out" "$err"; then
    start_cooldown "$a" "task t$t: $(tail -n1 "$err" 2>/dev/null | cut -c1-100)"
    # quota ≠ task failure: no attempt count, and the agent leaves the task's
    # tried list so the task can return to it after cooldown (via --resume)
    local kept="" x
    for x in ${TASK_TRIED[$t]}; do [[ "$x" != "$a" ]] && kept="$kept $x"; done
    TASK_TRIED[$t]="${kept# }"
    requeue "$t" "requeued after $a quota"
    return
  fi

  TASK_ATTEMPTS[$t]=$(( TASK_ATTEMPTS[$t] + 1 ))
  if [[ "${TASK_ATTEMPTS[$t]}" -gt "$RETRIES" ]]; then
    finish "$t" "failed" "exit $code from $a; see $err"
    say "✗ t$(printf '%02d' "$t") failed (exit $code from $a) → $err"
  else
    requeue "$t" "exit $code from $a"
    say "↻ t$(printf '%02d' "$t") exit $code from $a → requeued"
  fi
}

cleanup() {
  local i=0
  while [[ $i -lt $NSLOT ]]; do
    [[ "${SLOT_PID[$i]}" -ne 0 ]] && kill "${SLOT_PID[$i]}" 2>/dev/null
    i=$((i+1))
  done
}
trap cleanup INT TERM

say "workspace $WORKSPACE · roster [$ROSTER] · $NTASK task(s) · logs $RUN_DIR"

# --------------------------------------------------------------- main loop --
while :; do
  # 1) reap finished jobs
  i=0
  while [[ $i -lt $NSLOT ]]; do
    pid="${SLOT_PID[$i]}"
    if [[ "$pid" -ne 0 ]] && ! kill -0 "$pid" 2>/dev/null; then
      wait "$pid"; code=$?
      on_slot_done "$i" "$code"
    fi
    i=$((i+1))
  done

  # 2) kill overdue jobs (they will be reaped next pass as failures)
  i=0
  while [[ $i -lt $NSLOT ]]; do
    pid="${SLOT_PID[$i]}"; t="${SLOT_TASK[$i]}"
    if [[ "$pid" -ne 0 && "$t" -ge 0 ]]; then
      if [[ $(( $(now) - TASK_T0[$t] )) -gt $(( TIMEOUT_MIN * 60 )) ]]; then
        say "⏱ t$(printf '%02d' "$t") timed out on ${SLOT_AGENT[$i]} → killing"
        kill "$pid" 2>/dev/null
      fi
    fi
    i=$((i+1))
  done

  # 3) assign pending tasks (FIFO; first eligible agent with a free slot)
  t=0
  while [[ $t -lt $NTASK ]]; do
    if [[ "${TASK_STATE[$t]}" == "pending" ]]; then
      ord="$(order_for "${TASK_LANE[$t]}" "${TASK_TRIED[$t]}")"
      if [[ -z "$ord" ]]; then
        finish "$t" "failed" "no untried agent left"
        say "✗ t$(printf '%02d' "$t") failed — every eligible agent already tried"
      else
        alive_any=0; assigned=0
        for a in $ord; do
          agent_alive "$a" || continue
          alive_any=1
          # easy lane: don't burn smart-agent quota while a cheap agent is
          # merely busy — wait for one of its slots instead
          if [[ "${TASK_LANE[$t]}" == "easy" ]] && ! in_list "$a" "$CHEAP"; then
            cheap_free=0
            for c in $CHEAP; do
              if in_list "$c" "$ord" && agent_alive "$c"; then cheap_free=1; break; fi
            done
            [[ "$cheap_free" -eq 1 ]] && break
          fi
          s="$(free_slot_of "$a")"
          if [[ "$s" -ge 0 ]]; then launch "$t" "$s"; assigned=1; break; fi
        done
        if [[ "$alive_any" -eq 0 ]]; then
          finish "$t" "starved" "all eligible agents in quota cooldown or missing"
        fi
      fi
    fi
    t=$((t+1))
  done

  # 4) done?
  pending=0; running=0
  t=0
  while [[ $t -lt $NTASK ]]; do
    case "${TASK_STATE[$t]}" in
      pending) pending=$((pending+1)) ;;
      running) running=$((running+1)) ;;
    esac
    t=$((t+1))
  done
  [[ $pending -eq 0 && $running -eq 0 ]] && break
  sleep 2
done

# ----------------------------------------------------------------- summary --
echo
printf '%-5s %-5s %-8s %-9s %-4s %s\n' ID LANE AGENT STATE TRY NOTE >"$RUN_DIR/results.tsv"
FAILED=0; STARVED=0
t=0
while [[ $t -lt $NTASK ]]; do
  printf '%-5s %-5s %-8s %-9s %-4s %s\n' \
    "t$(printf '%02d' "$t")" "${TASK_LANE[$t]}" "${TASK_AGENT[$t]}" "${TASK_STATE[$t]}" \
    "${TASK_ATTEMPTS[$t]}" "${TASK_NOTE[$t]}" | tee -a "$RUN_DIR/results.tsv"
  case "${TASK_STATE[$t]}" in
    failed) FAILED=1 ;;
    starved) STARVED=1 ;;
  esac
  t=$((t+1))
done

# persist unfinished queue for --resume
: >"$RUN_DIR/pending.txt"
t=0
while [[ $t -lt $NTASK ]]; do
  if [[ "${TASK_STATE[$t]}" == "starved" || "${TASK_STATE[$t]}" == "pending" ]]; then
    printf '%s: %s\n' "${TASK_LANE[$t]}" "${TASK_TEXT[$t]}" >>"$RUN_DIR/pending.txt"
  fi
  t=$((t+1))
done

echo
echo "--- output tails ---"
for f in "$RUN_DIR"/t*.out; do
  [[ -s "$f" ]] || continue
  echo "[$(basename "$f" .out)]"; tail -n 12 "$f"; echo
done

if [[ "$STARVED" -eq 1 ]]; then
  echo "quota-starved: unfinished tasks saved."
  echo "resume with: $0 --resume $RUN_DIR"
  exit 75
fi
exit "$FAILED"
