#!/usr/bin/env python3
import os
import sys
import shutil
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REF_ROOT = os.path.dirname(SCRIPT_DIR)
META_DIR = os.path.join(REF_ROOT, 'meta')
TSV_PATH = os.path.join(META_DIR, 'REVIEWED-HEADS.tsv')

env = dict(os.environ)
env['GIT_HTTP_TIMEOUT'] = '30'
env['GIT_SSH_COMMAND'] = 'ssh -o ConnectTimeout=15 -o BatchMode=yes'

SOFTWARE_REPOS = [
    ("craft-agents-oss", "https://github.com/craft-ai-agents/craft-agents-oss", None),
    ("pi-mono", "https://github.com/badlogic/pi-mono", None),
    ("codex", "https://github.com/openai/codex", ["docs", "sdk/typescript", "codex-rs/agent-graph-store", "codex-rs/app-server-protocol", "codex-rs/core", "codex-rs/execpolicy", "codex-rs/git-utils", "codex-rs/memories", "codex-rs/protocol", "codex-rs/state", "codex-rs/tui"]),
    ("opencode", "https://github.com/anomalyco/opencode", ["packages/core/src/session", "packages/core/src/tool", "packages/core/src/util", "packages/opencode/src/session", "packages/opencode/src/background", "packages/opencode/src/tool", "packages/opencode/src/agent", "packages/opencode/src/acp", "packages/schema/src"]),
    ("OpenHands", "https://github.com/OpenHands/OpenHands", None),
    ("hermes-agent", "https://github.com/NousResearch/hermes-agent", None),
    ("openclaw", "https://github.com/openclaw/openclaw", ["src", "packages", "docs", "skills", "apps", "extensions", "config", "security"]),
    ("penpot", "https://github.com/penpot/penpot", None),
    ("opencut-classic", "https://github.com/opencut-app/opencut-classic", None),
    ("opencut", "https://github.com/OpenCut-app/OpenCut", ["apps"]),
    ("flowgram.ai", "https://github.com/bytedance/flowgram.ai", ["packages", "docs"]),
    ("browser-use", "https://github.com/browser-use/browser-use", ["browser_use", "docs", "tests"]),
    ("mcp-registry", "https://github.com/modelcontextprotocol/registry", ["internal", "pkg", "docs", "cmd"]),
    ("tldraw", "https://github.com/tldraw/tldraw", None),
]

PLUGIN_REPOS = [
    ("repomix", "https://github.com/yamadashy/repomix", None),
    ("markitdown", "https://github.com/microsoft/markitdown", None),
    ("xyflow", "https://github.com/xyflow/xyflow", None),
    ("dockview", "https://github.com/mathuo/dockview", None),
    ("react-resizable-panels", "https://github.com/bvaughn/react-resizable-panels", None),
    ("react-rnd", "https://github.com/bokuweb/react-rnd", None),
    ("hyperframes", "https://github.com/heygen-com/hyperframes", ["packages", "skills", "docs"]),
    ("mem0", "https://github.com/mem0ai/mem0", ["mem0", "tests", "evaluation"]),
    ("agentskills", "https://github.com/agentskills/agentskills", ["docs", "skills-ref"]),
    ("playwright-mcp", "https://github.com/microsoft/playwright-mcp", ["src", "tests"]),
]

def run_cmd(cmd, cwd=None, timeout=120):
    try:
        res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", f"命令执行超时 ({timeout}s): {' '.join(cmd)}"
    except Exception as e:
        return -1, "", str(e)

def update_or_clone(category, name, url, sparse_paths):
    target_dir = os.path.join(REF_ROOT, category, name)
    print(f"\n----------------------------------------\n[{category}/{name}] 开始处理...", flush=True)
    
    is_git = os.path.isdir(os.path.join(target_dir, '.git'))
    
    if is_git:
        print(f"[{name}] 检测到已有 .git，尝试 fetch 并 reset...", flush=True)
        code, out, err = run_cmd(['git', 'fetch', 'origin'], cwd=target_dir, timeout=60)
        if code == 0:
            code_head, default_branch, _ = run_cmd(['git', 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], cwd=target_dir)
            if default_branch.startswith('origin/'):
                default_branch = default_branch[7:]
            else:
                default_branch = 'main'
            
            run_cmd(['git', 'checkout', '-f', default_branch], cwd=target_dir)
            run_cmd(['git', 'reset', '--hard', f'origin/{default_branch}'], cwd=target_dir)
            code_c, commit, _ = run_cmd(['git', 'rev-parse', 'HEAD'], cwd=target_dir)
            if code_c == 0:
                print(f"[{name}] 成功更新至最新提交: {commit[:12]}", flush=True)
                return commit
        print(f"[{name}] fetch 失败或超时 ({err[:100]})，重新克隆...", flush=True)

    if os.path.exists(target_dir):
        print(f"[{name}] 清理旧快照目录: {target_dir}", flush=True)
        shutil.rmtree(target_dir, ignore_errors=True)
    
    os.makedirs(os.path.dirname(target_dir), exist_ok=True)
    
    clone_cmd = ['git', 'clone', '--depth', '1']
    if sparse_paths:
        clone_cmd.append('--sparse')
    clone_cmd.extend([url, target_dir])
    
    print(f"[{name}] 执行克隆: {' '.join(clone_cmd)}", flush=True)
    code, out, err = run_cmd(clone_cmd, timeout=120)
    if code != 0:
        print(f"[{name}] 错误: 克隆失败 -> {err[:150]}", flush=True)
        return None
    
    if sparse_paths:
        print(f"[{name}] 设置 sparse-checkout 路径: {sparse_paths}", flush=True)
        sparse_cmd = ['git', 'sparse-checkout', 'set']
        sparse_cmd.extend(sparse_paths)
        run_cmd(sparse_cmd, cwd=target_dir)
        run_cmd(['git', 'checkout'], cwd=target_dir)
        
    code_c, commit, _ = run_cmd(['git', 'rev-parse', 'HEAD'], cwd=target_dir)
    if code_c == 0:
        print(f"[{name}] 成功克隆并更新至: {commit[:12]}", flush=True)
        return commit

    return None

def save_tsv(records):
    lines = ["# repository\tlast-reviewed-head\tnotes\n"]
    for rel_key in sorted(records.keys()):
        commit, note = records[rel_key]
        if note:
            lines.append(f"{rel_key}\t{commit}\t{note}\n")
        else:
            lines.append(f"{rel_key}\t{commit}\n")

    with open(TSV_PATH, 'w') as f:
        f.writelines(lines)

def main():
    updated_records = {}
    
    if os.path.exists(TSV_PATH):
        with open(TSV_PATH, 'r') as f:
            for line in f:
                if line.startswith('#') or not line.strip(): continue
                parts = line.strip().split('\t')
                if len(parts) >= 2:
                    updated_records[parts[0]] = (parts[1], parts[2] if len(parts) > 2 else '')
    
    success_count = 0
    fail_count = 0

    print("========================================")
    print("开始全量更新与同步 源码参考 项目...")
    print("========================================")

    for name, url, sparse in SOFTWARE_REPOS:
        rel_key = f"software/{name}"
        commit = update_or_clone("software", name, url, sparse)
        if commit:
            old_tag = updated_records.get(rel_key, ('', ''))[1]
            updated_records[rel_key] = (commit, old_tag)
            save_tsv(updated_records)
            success_count += 1
        else:
            fail_count += 1

    for name, url, sparse in PLUGIN_REPOS:
        rel_key = f"plugins/{name}"
        commit = update_or_clone("plugins", name, url, sparse)
        if commit:
            old_tag = updated_records.get(rel_key, ('', ''))[1]
            updated_records[rel_key] = (commit, old_tag)
            save_tsv(updated_records)
            success_count += 1
        else:
            fail_count += 1

    print("\n========================================")
    print(f"更新完成！成功: {success_count}, 失败: {fail_count}")
    print(f"已将最新 commit 写入 {TSV_PATH}")
    print("========================================")

if __name__ == '__main__':
    main()
