#!/bin/bash
set -e

REPOS=(
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
)

cd "/Users/lullwen/Documents/GUI 终端/源码参考"

echo "开始克隆项目..."
for repo in "${REPOS[@]}"; do
    name=$(basename "$repo")
    echo "----------------------------------------"
    echo "正在克隆 $name ($repo)..."
    if [ -d "$name" ]; then
        echo "文件夹 $name 已存在，跳过克隆。"
    else
        if git clone --depth 1 "$repo" "$name"; then
            echo "成功克隆 $name"
        else
            echo "错误: 克隆 $name 失败，尝试不使用 --depth 1 ..."
            if git clone "$repo" "$name"; then
                echo "成功克隆 $name (完整克隆)"
            else
                echo "严重错误: 无法克隆 $repo"
            fi
        fi
    fi
done

echo "----------------------------------------"
echo "所有克隆任务已完成！"
