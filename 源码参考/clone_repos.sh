#!/bin/bash
set -e

SOFTWARE_REPOS=(
    "https://github.com/manaflow-ai/cmux"
    "https://github.com/KunAgent/Kun"
    "https://github.com/iOfficeAI/AionUi"
    "https://github.com/multica-ai/multica"
    "https://github.com/warpdotdev/warp"
    "https://github.com/craft-ai-agents/craft-agents-oss"
    "https://github.com/golutra/golutra"
    "https://github.com/zed-industries/zed"
    "https://github.com/NousResearch/hermes-agent"
    "https://github.com/farion1231/cc-switch"
    "https://github.com/jlcodes99/cockpit-tools"
    "https://github.com/AstrBotDevs/AstrBot"
    "https://github.com/esengine/DeepSeek-Reasonix"
    "https://github.com/OpenHands/OpenHands"
    "https://github.com/can1357/oh-my-pi"
    "https://github.com/zhayujie/CowAgent"
    "https://github.com/jackwener/OpenCLI"
    "https://github.com/calesthio/OpenMontage"
    "https://github.com/CherryHQ/cherry-studio"
    "https://github.com/citrolabs/ego-lite"
    "https://github.com/KDE/kdenlive"
    "https://github.com/lobehub/lobehub"
    "https://github.com/cosmicstack-labs/mercury-agent"
    "https://github.com/open-pencil/open-pencil"
    "https://github.com/anomalyco/opencode"
    "https://github.com/opencut-app/opencut"
    "https://github.com/opencut-app/opencut-classic"
    "https://github.com/ZSeven-W/openpencil"
    "https://github.com/palmier-io/palmier-pro"
    "https://github.com/penpot/penpot"
    "https://github.com/omnigent-ai/omnigent"
    "https://github.com/hanshuaikang/nezha"
    "https://github.com/he-yufeng/CoreCoder"
    "https://github.com/google/agents-cli"
    "https://github.com/cline/cline"
    "https://github.com/tldraw/tldraw"
    "https://github.com/stablyai/orca"
)

PLUGIN_REPOS=(
    "https://github.com/lessweb/deepcode-cli"
    "https://github.com/chopratejas/headroom"
    "https://github.com/yamadashy/repomix"
    "https://github.com/microsoft/markitdown"
    "https://github.com/colbymchenry/codegraph"
    "https://github.com/mksglu/context-mode"
    "https://github.com/heygen-com/hyperframes"
    "https://github.com/letta-ai/letta-code"
    "https://github.com/mem0ai/mem0"
    "https://github.com/MemPalace/mempalace"
    "https://github.com/moorcheh-ai/memanto"
    "https://github.com/nexu-io/open-design"
    "https://github.com/thesysdev/openui"
    "https://github.com/remotion-dev/remotion"
    "https://github.com/rtk-ai/rtk"
    "https://github.com/supermemoryai/supermemory"
    "https://github.com/VoltAgent/awesome-design-md"
    "https://github.com/xzdarcy/react-timeline-editor"
    "https://github.com/daybrush/moveable"
    "https://github.com/mathuo/dockview"
    "https://github.com/bvaughn/react-resizable-panels"
    "https://github.com/bokuweb/react-rnd"
    "https://github.com/google-labs-code/stitch-sdk"
    "https://github.com/google-labs-code/stitch-skills"
    "https://github.com/alibaba/zvec"
    "https://github.com/zhongerxin/Cowart"
)





cd "/Users/lullwen/Documents/GUI 终端/源码参考"
mkdir -p software plugins

clone_repo() {
    local target_dir="$1"
    local repo="$2"
    name=$(basename "$repo" .git)
    echo "----------------------------------------"
    echo "正在克隆 $name ($repo) -> $target_dir/$name ..."
    if [ -d "$target_dir/$name" ]; then
        echo "文件夹 $target_dir/$name 已存在，跳过克隆。"
    else
        if git clone --depth 1 "$repo" "$target_dir/$name"; then
            echo "成功克隆 $name"
        else
            echo "错误: 克隆 $name 失败，尝试不使用 --depth 1 ..."
            if git clone "$repo" "$target_dir/$name"; then
                echo "成功克隆 $name (完整克隆)"
            else
                echo "严重错误: 无法克隆 $repo"
            fi
        fi
    fi
}

echo "开始克隆软件型参考项目..."
for repo in "${SOFTWARE_REPOS[@]}"; do
    clone_repo software "$repo"
done

echo "开始克隆插件/能力型参考项目..."
for repo in "${PLUGIN_REPOS[@]}"; do
    clone_repo plugins "$repo"
done

echo "----------------------------------------"
echo "所有克隆任务已完成！"
