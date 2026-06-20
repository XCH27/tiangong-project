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
)

PLUGIN_REPOS=(
    "https://github.com/lessweb/deepcode-cli"
    "https://github.com/chopratejas/headroom"
    "https://github.com/yamadashy/repomix"
    "https://github.com/microsoft/markitdown"
)

cd "/Users/lullwen/Documents/GUI 终端/源码参考"
mkdir -p software plugins

clone_repo() {
    local target_dir="$1"
    local repo="$2"
    name=$(basename "$repo")
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
