#!/bin/bash
set -e

# Only FULL/SPARSE keepers. See meta/RETENTION.md.
# Do NOT bulk-clone the user catalog. Only the top-tier narrow set in RETENTION.md is materialized;
# use sparse source whenever migration/history is not the evidence under review.
# Temporary comparisons use plugins/_tmp-* or software/_tmp-* and are deleted after intake.

SOFTWARE_REPOS=(
    "https://github.com/craft-ai-agents/craft-agents-oss"
    "https://github.com/badlogic/pi-mono"
    "https://github.com/openai/codex"
    "https://github.com/anomalyco/opencode"
    "https://github.com/OpenHands/OpenHands"
    "https://github.com/NousResearch/hermes-agent"
    "https://github.com/openclaw/openclaw"
    "https://github.com/penpot/penpot"
    "https://github.com/opencut-app/opencut-classic"
    "https://github.com/tldraw/tldraw"
    "https://github.com/bytedance/flowgram.ai"
    "https://github.com/OpenCut-app/OpenCut"
    "https://github.com/browser-use/browser-use"
    "https://github.com/modelcontextprotocol/registry"
)

PLUGIN_REPOS=(
    "https://github.com/yamadashy/repomix"
    "https://github.com/microsoft/markitdown"
    "https://github.com/xyflow/xyflow"
    "https://github.com/mathuo/dockview"
    "https://github.com/bvaughn/react-resizable-panels"
    "https://github.com/bokuweb/react-rnd"
    "https://github.com/heygen-com/hyperframes"
    "https://github.com/mem0ai/mem0"
    "https://github.com/agentskills/agentskills"
    "https://github.com/microsoft/playwright-mcp"
)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REF_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REF_ROOT"
mkdir -p software plugins

clone_repo() {
    local target_dir="$1"
    local repo="$2"
    name=$(basename "$repo" .git)
    case "$name" in
        OpenCut) name="opencut" ;;
        registry) name="mcp-registry" ;;
    esac
    echo "----------------------------------------"
    echo "clone $name -> $target_dir/$name"
    if [ -d "$target_dir/$name" ]; then
        echo "exists, skip"
        return
    fi

    if [ "$name" = "craft-agents-oss" ]; then
        git clone --depth 1 --branch v0.11.1 --detach "$repo" "$target_dir/$name" || echo "FAIL craft baseline"
        return
    fi

    if [ "$name" = "pi-mono" ]; then
        if git clone --no-checkout --filter=blob:none "$repo" "$target_dir/$name" &&
            git -C "$target_dir/$name" fetch --depth 1 origin 13437ca828894f43f973c630d208b488637d8fa9 &&
            git -C "$target_dir/$name" checkout --detach FETCH_HEAD; then
            echo "ok pi-mono fixed evidence checkout"
        else
            echo "FAIL pi-mono fixed evidence checkout"
        fi
        return
    fi

    if [ "$name" = "codex" ]; then
        if git clone --depth 1 --filter=blob:none --sparse "$repo" "$target_dir/$name" &&
            git -C "$target_dir/$name" sparse-checkout set \
                docs sdk/typescript \
                codex-rs/agent-graph-store codex-rs/app-server-protocol \
                codex-rs/core codex-rs/execpolicy codex-rs/git-utils \
                codex-rs/memories codex-rs/protocol codex-rs/state codex-rs/tui; then
            echo "ok codex sparse"
        else
            echo "FAIL codex sparse"
        fi
        return
    fi

    if [ "$name" = "opencode" ]; then
        if git clone --depth 1 --filter=blob:none --sparse "$repo" "$target_dir/$name" &&
            git -C "$target_dir/$name" sparse-checkout set --cone \
                packages/core/src/session packages/core/src/tool packages/core/src/util \
                packages/opencode/src/session packages/opencode/src/background \
                packages/opencode/src/tool packages/opencode/src/agent packages/opencode/src/acp \
                packages/schema/src; then
            echo "ok opencode sparse"
        else
            echo "FAIL opencode sparse"
        fi
        return
    fi

    if [ "$name" = "open-design" ]; then
        if git clone --depth 1 --filter=blob:none --sparse "$repo" "$target_dir/$name" &&
            git -C "$target_dir/$name" sparse-checkout set --cone apps packages docs; then
            echo "ok open-design sparse"
        else
            echo "FAIL open-design sparse"
        fi
        return
    fi

    if [ "$name" = "openclaw" ]; then
        if git clone --depth 1 --filter=blob:none --sparse "$repo" "$target_dir/$name" &&
            git -C "$target_dir/$name" sparse-checkout set --cone \
                src packages docs skills apps extensions config security; then
            echo "ok openclaw sparse"
        else
            echo "FAIL openclaw sparse"
        fi
        return
    fi

    case "$name" in
        flowgram.ai)
            sparse_paths=(packages docs)
            ;;
        opencut)
            sparse_paths=(apps)
            ;;
        browser-use)
            sparse_paths=(browser_use docs tests)
            ;;
        mcp-registry)
            sparse_paths=(internal pkg docs cmd)
            ;;
        hyperframes)
            sparse_paths=(packages skills docs)
            ;;
        mem0)
            sparse_paths=(mem0 tests evaluation)
            ;;
        agentskills)
            sparse_paths=(docs skills-ref)
            ;;
        playwright-mcp)
            sparse_paths=(src tests)
            ;;
        *)
            sparse_paths=()
            ;;
    esac
    if [ "${#sparse_paths[@]}" -gt 0 ]; then
        if git clone --depth 1 --filter=blob:none --sparse "$repo" "$target_dir/$name" &&
            git -C "$target_dir/$name" sparse-checkout set --cone "${sparse_paths[@]}"; then
            echo "ok $name sparse"
        else
            echo "FAIL $name sparse"
        fi
        return
    fi

    if git clone --depth 1 --filter=blob:none "$repo" "$target_dir/$name"; then
        echo "ok $name"
    else
        git clone --depth 1 "$repo" "$target_dir/$name" || echo "FAIL $name"
    fi
}

echo "Cloning FULL/SPARSE keepers only (meta/RETENTION.md)..."
for repo in "${SOFTWARE_REPOS[@]}"; do
    clone_repo software "$repo"
done
for repo in "${PLUGIN_REPOS[@]}"; do
    clone_repo plugins "$repo"
done
echo "done. Temporary comparison checkouts must use _tmp-* and be deleted after intake."
