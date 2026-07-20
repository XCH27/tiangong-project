#!/bin/bash

# Enforce a strict connection timeout of 15 seconds for git operations to prevent hanging indefinitely
export GIT_HTTP_TIMEOUT=15
export GIT_SSH_COMMAND="ssh -o ConnectTimeout=15 -o BatchMode=yes"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REF_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RETENTION_FILE="$REF_ROOT/meta/RETENTION.md"
cd "$REF_ROOT"

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

    # 参考 checkout 是可重建缓存。此脚本按目录策略以远端为准，不保留本地补丁或纪念备份。
    git checkout -f 2>/dev/null || true
    git reset --hard HEAD 2>/dev/null || true
    git clean -fd 2>/dev/null || true

    # Craft is a compatibility baseline. Refresh the release object but never advance it to HEAD.
    if [ "$name" = "craft-agents-oss" ]; then
        if git fetch --depth 1 origin tag v0.11.1 2>/dev/null &&
            git checkout --detach -f FETCH_HEAD 2>/dev/null &&
            git reset --hard FETCH_HEAD 2>/dev/null; then
            echo "已固定 $name 到 v0.11.1: $(git rev-parse --short HEAD)"
            SUCCESS_REPOS+=("$name")
        else
            echo "错误: 无法刷新 $name 的 v0.11.1 基线"
            FAILED_REPOS+=("$name")
        fi
        cd "$REF_ROOT"
        return
    fi

    # Pi is a fixed harness evidence point paired with the current Fleet dependency audit.
    if [ "$name" = "pi-mono" ]; then
        if git fetch --depth 1 origin 13437ca828894f43f973c630d208b488637d8fa9 2>/dev/null &&
            git checkout --detach -f FETCH_HEAD 2>/dev/null &&
            git reset --hard FETCH_HEAD 2>/dev/null; then
            echo "已固定 $name 到 13437ca82889"
            SUCCESS_REPOS+=("$name")
        else
            echo "错误: 无法刷新 $name 固定证据提交"
            FAILED_REPOS+=("$name")
        fi
        cd "$REF_ROOT"
        return
    fi

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

    cd "$REF_ROOT"
}

# 只刷新 RETENTION.md 登记的独立 Git checkout。未保留候选即使仍在本机也不刷新。
is_retained() {
    local target_dir="$1"
    local name="$2"
    rg -Fq "\`$target_dir/$name\`" "$RETENTION_FILE"
}

for d in software/*; do
    if [ -d "$d/.git" ] && [[ "$(basename "$d")" != _tmp-* ]] &&
        is_retained software "$(basename "$d")"; then
        update_repo software "$(basename "$d")"
    fi
done

for d in plugins/*; do
    if [ -d "$d/.git" ] && [[ "$(basename "$d")" != _tmp-* ]] &&
        is_retained plugins "$(basename "$d")"; then
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
