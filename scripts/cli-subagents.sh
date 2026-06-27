#!/usr/bin/env bash
# Run local Claude / Grok / Antigravity CLIs as parallel one-shot subagents.
# NOT Fleet in-app CLI Runtime — invokes binaries on your Mac directly.
#
# Examples:
#   ./scripts/cli-subagents.sh "fix routing tests"
#   ./scripts/cli-subagents.sh --claude-model deepseek-v4-pro --grok-model grok-composer-2.5-fast -- "task A" "task B"
#   ./scripts/cli-subagents.sh --only grok --grok-model grok-build -- "run fleet-verify"
#
# Logs: /tmp/fleet-cli-subagents-<pid>/{claude,grok,agy}.{out,err}

set -euo pipefail

WORKSPACE="${WORKSPACE:-$(cd "$(dirname "$0")/.." && pwd)}"
OUT_DIR="${OUT_DIR:-/tmp/fleet-cli-subagents-$$}"

CLAUDE_BIN="${CLAUDE_BIN:-/Users/lullwen/.hermes/node/bin/claude}"
GROK_BIN="${GROK_BIN:-/Users/lullwen/.grok/bin/grok}"
AGY_BIN="${AGY_BIN:-/Users/lullwen/.local/bin/agy}"

CLAUDE_MODEL="${CLAUDE_MODEL:-deepseek-v4-pro}"
GROK_MODEL="${GROK_MODEL:-grok-build}"
AGY_MODEL="${AGY_MODEL:-Gemini 3.5 Flash (High)}"

RUN_CLAUDE=1
RUN_GROK=1
RUN_AGY=1

usage() {
  cat <<'EOF'
Usage: ./scripts/cli-subagents.sh [options] [--] [claude-task] [grok-task] [agy-task]

Options:
  --claude-model MODEL   Claude Code model (default: deepseek-v4-pro)
  --grok-model MODEL     Grok model (default: grok-build)
                         alt: grok-composer-2.5-fast
  --grok-both            Run grok-build AND grok-composer-2.5-fast in parallel
  --agy-model MODEL      Antigravity model (default: "Gemini 3.5 Flash (High)")
  --only AGENT           Run one agent: claude | grok | agy
  --workspace PATH       Repo root (default: repo root)
  --out-dir PATH         Log directory
  -h, --help             Show this help

Environment (optional overrides):
  CLAUDE_BIN  GROK_BIN  AGY_BIN
  CLAUDE_MODEL  GROK_MODEL  AGY_MODEL  WORKSPACE  OUT_DIR

Max-power flags baked in:
  Claude:      --effort max --permission-mode bypassPermissions --add-dir WORKSPACE
  Grok:        --effort max --always-approve --permission-mode bypassPermissions --cwd WORKSPACE
  Antigravity: --dangerously-skip-permissions --add-dir WORKSPACE --print-timeout 10m
EOF
}

GROK_BOTH=0
POSITIONAL=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --claude-model)
      CLAUDE_MODEL="$2"
      shift 2
      ;;
    --grok-model)
      GROK_MODEL="$2"
      shift 2
      ;;
    --grok-both)
      GROK_BOTH=1
      shift
      ;;
    --agy-model)
      AGY_MODEL="$2"
      shift 2
      ;;
    --only)
      RUN_CLAUDE=0
      RUN_GROK=0
      RUN_AGY=0
      case "$2" in
        claude) RUN_CLAUDE=1 ;;
        grok)   RUN_GROK=1 ;;
        agy)    RUN_AGY=1 ;;
        *)
          echo "error: --only expects claude | grok | agy" >&2
          exit 1
          ;;
      esac
      shift 2
      ;;
    --workspace)
      WORKSPACE="$2"
      shift 2
      ;;
    --out-dir)
      OUT_DIR="$2"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --)
      shift
      POSITIONAL+=("$@")
      break
      ;;
    -*)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

TASK_CLAUDE="${POSITIONAL[0]:-}"
TASK_GROK="${POSITIONAL[1]:-$TASK_CLAUDE}"
TASK_AGY="${POSITIONAL[2]:-$TASK_CLAUDE}"

if [[ -z "$TASK_CLAUDE" ]]; then
  usage >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

echo "Workspace:     $WORKSPACE"
echo "Logs:          $OUT_DIR"
echo "Claude model:  $CLAUDE_MODEL"
if [[ "$GROK_BOTH" -eq 1 ]]; then
  echo "Grok models:   grok-build + grok-composer-2.5-fast"
else
  echo "Grok model:    $GROK_MODEL"
fi
echo "Antigravity:   $AGY_MODEL"
echo

run_claude() {
  "$CLAUDE_BIN" -p "$TASK_CLAUDE" \
    --model "$CLAUDE_MODEL" \
    --effort max \
    --permission-mode bypassPermissions \
    --add-dir "$WORKSPACE" \
    >"$OUT_DIR/claude.out" 2>"$OUT_DIR/claude.err"
}

run_grok() {
  local model="$1"
  local suffix="${2:-}"
  "$GROK_BIN" -p "$TASK_GROK" \
    --model "$model" \
    --effort max \
    --always-approve \
    --permission-mode bypassPermissions \
    --cwd "$WORKSPACE" \
    >"$OUT_DIR/grok${suffix}.out" 2>"$OUT_DIR/grok${suffix}.err"
}

run_agy() {
  "$AGY_BIN" --print "$TASK_AGY" \
    --model "$AGY_MODEL" \
    --dangerously-skip-permissions \
    --add-dir "$WORKSPACE" \
    --print-timeout 10m \
    >"$OUT_DIR/agy.out" 2>"$OUT_DIR/agy.err"
}

PIDS=()
NAMES=()

if [[ "$RUN_CLAUDE" -eq 1 ]]; then
  run_claude &
  PIDS+=($!)
  NAMES+=("claude")
fi

if [[ "$RUN_GROK" -eq 1 ]]; then
  if [[ "$GROK_BOTH" -eq 1 ]]; then
    run_grok "grok-build" "" &
    PIDS+=($!)
    NAMES+=("grok-build")
    run_grok "grok-composer-2.5-fast" "-fast" &
    PIDS+=($!)
    NAMES+=("grok-fast")
  else
    run_grok "$GROK_MODEL" "" &
    PIDS+=($!)
    NAMES+=("grok")
  fi
fi

if [[ "$RUN_AGY" -eq 1 ]]; then
  run_agy &
  PIDS+=($!)
  NAMES+=("agy")
fi

FAIL=0
for i in "${!PIDS[@]}"; do
  name="${NAMES[$i]}"
  pid="${PIDS[$i]}"
  if wait "$pid"; then
    echo "✓ $name done"
  else
    echo "✗ $name failed → $OUT_DIR/${name}.err"
    FAIL=1
  fi
done

echo
echo "--- tail outputs ---"
for f in "$OUT_DIR"/*.out; do
  [[ -s "$f" ]] || continue
  base="$(basename "$f" .out)"
  echo "[$base]"
  tail -n 20 "$f"
  echo
done

exit "$FAIL"
