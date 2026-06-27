#!/bin/bash

SCRIPT_DIR="/Users/lullwen/Documents/GUI 终端/源码参考"
cd "$SCRIPT_DIR"

echo "========================================"
echo "开始更新所有源码参考项目..."
echo "========================================"

FAILED_REPOS=()
SUCCESS_REPOS=()

update_repo() {
    local target_dir="$1"
    local name="$2"
    local full_path="$target_dir/$name"
    
    echo "----------------------------------------"
    echo "正在更新 $name ($full_path) ..."
    
    if [ ! -d "$full_path/.git" ]; then
        echo "警告: $full_path 不是 Git 仓库，跳过。"
        return
    fi
    
    # 尝试删除可能遗留的 index.lock
    if [ -f "$full_path/.git/index.lock" ]; then
        echo "发现遗留的 index.lock，尝试删除..."
        rm -f "$full_path/.git/index.lock" || true
    fi
    
    if ! cd "$full_path"; then
        echo "错误: 无法进入目录 $full_path"
        FAILED_REPOS+=("$name")
        return
    fi
    
    # 获知当前分支名称
    local current_branch
    current_branch=$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    
    # 清理未提交的临时修改，确保拉取顺畅
    git checkout -f 2>/dev/null || true
    git reset --hard HEAD 2>/dev/null || true
    
    local updated=false
    
    # 尝试浅层获取更新，如果不行则尝试普通获取
    if git fetch --depth 1 origin "$current_branch" 2>/dev/null; then
        if git reset --hard origin/"$current_branch" 2>/dev/null; then
            echo "已浅层更新 $name 到最新提交: $(git rev-parse --short HEAD)"
            updated=true
        fi
    fi
    
    if [ "$updated" = false ]; then
        if git fetch origin "$current_branch" 2>/dev/null; then
            if git reset --hard origin/"$current_branch" 2>/dev/null; then
                echo "已完整更新 $name 到最新提交: $(git rev-parse --short HEAD)"
                updated=true
            fi
        fi
    fi
    
    if [ "$updated" = false ]; then
        # 如果指定分支 fetch 失败，尝试 fetch origin 并 reset to origin/HEAD
        if git fetch origin 2>/dev/null; then
            local head_ref
            head_ref=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's/origin\///' || echo "")
            if [ -n "$head_ref" ]; then
                git checkout -f "$head_ref" 2>/dev/null || true
                if git reset --hard origin/"$head_ref" 2>/dev/null; then
                    echo "已回退并更新 $name 到 origin HEAD ($head_ref): $(git rev-parse --short HEAD)"
                    updated=true
                fi
            else
                echo "错误: $name fetch 成功但无法推断 origin HEAD 分支"
            fi
        fi
    fi
    
    if [ "$updated" = true ]; then
        SUCCESS_REPOS+=("$name")
    else
        echo "错误: 无法更新 $name (网络、仓库配置或 index.lock 冲突)"
        FAILED_REPOS+=("$name")
    fi
    
    cd "$SCRIPT_DIR"
}

# 遍历 software/ 下的目录
for d in software/*; do
    if [ -d "$d" ]; then
        update_repo software "$(basename "$d")"
    fi
done

# 遍历 plugins/ 下的目录
for d in plugins/*; do
    if [ -d "$d" ]; then
        update_repo plugins "$(basename "$d")"
    fi
done

echo "========================================"
echo "更新任务完成！"
echo "成功 (${#SUCCESS_REPOS[@]}): ${SUCCESS_REPOS[*]}"
if [ ${#FAILED_REPOS[@]} -ne 0 ]; then
    echo "失败 (${#FAILED_REPOS[@]}): ${FAILED_REPOS[*]}"
    exit 1
else
    echo "所有项目全部更新成功！"
fi
echo "========================================"
