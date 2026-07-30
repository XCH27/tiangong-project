#!/usr/bin/env python3
import os
import shutil
import subprocess
import urllib.request
import json
import tarfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REF_ROOT = os.path.dirname(SCRIPT_DIR)
META_DIR = os.path.join(REF_ROOT, 'meta')
TSV_PATH = os.path.join(META_DIR, 'REVIEWED-HEADS.tsv')

env = dict(os.environ)
env['GIT_HTTP_TIMEOUT'] = '60'

import ssl
ssl._create_default_https_context = ssl._create_unverified_context

REMAINING_REPOS = [
    ("software", "hermes-agent", "https://github.com/NousResearch/hermes-agent", None),
    ("software", "openclaw", "https://github.com/openclaw/openclaw", ["src", "packages", "docs", "skills", "apps", "extensions", "config", "security"]),
    ("software", "penpot", "https://github.com/penpot/penpot", None),
    ("software", "flowgram.ai", "https://github.com/bytedance/flowgram.ai", ["packages", "docs"]),
    ("software", "mcp-registry", "https://github.com/modelcontextprotocol/registry", ["internal", "pkg", "docs", "cmd"]),
    ("software", "tldraw", "https://github.com/tldraw/tldraw", None),
    ("plugins", "hyperframes", "https://github.com/heygen-com/hyperframes", ["packages", "skills", "docs"]),
    ("plugins", "mem0", "https://github.com/mem0ai/mem0", ["mem0", "tests", "evaluation"]),
]

def run_cmd(cmd, cwd=None, timeout=300):
    try:
        res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, env=env)
        return res.returncode, res.stdout.strip(), res.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "TimeoutExpired"
    except Exception as e:
        return -1, "", str(e)

def save_tsv_single(rel_key, commit, note=''):
    records = {}
    if os.path.exists(TSV_PATH):
        with open(TSV_PATH, 'r') as f:
            for line in f:
                if line.startswith('#') or not line.strip(): continue
                parts = line.strip().split('\t')
                if len(parts) >= 2:
                    records[parts[0]] = (parts[1], parts[2] if len(parts) > 2 else '')
    records[rel_key] = (commit, note)
    lines = ["# repository\tlast-reviewed-head\tnotes\n"]
    for k in sorted(records.keys()):
        c, n = records[k]
        lines.append(f"{k}\t{c}\t{n}\n" if n else f"{k}\t{c}\n")
    with open(TSV_PATH, 'w') as f:
        f.writelines(lines)

def process_repo(category, name, url, sparse_paths):
    target_dir = os.path.join(REF_ROOT, category, name)
    rel_key = f"{category}/{name}"
    print(f"\n========================================\n[{rel_key}] 正在处理剩余项目...", flush=True)

    if os.path.exists(target_dir):
        shutil.rmtree(target_dir, ignore_errors=True)
    os.makedirs(os.path.dirname(target_dir), exist_ok=True)

    # 方式一：优先使用 curl 下载 GitHub HEAD 压缩包（最快）
    try:
        ls_code, ls_out, _ = run_cmd(['git', 'ls-remote', url, 'HEAD'], timeout=15)
        commit = ls_out.split()[0] if (ls_code == 0 and ls_out) else 'HEAD'
        
        tarball_url = f"{url}/archive/HEAD.tar.gz"
        tar_path = os.path.join(REF_ROOT, category, f"_{name}_tmp.tar.gz")
        
        print(f"[{name}] 使用 curl 下载最新快照包: {tarball_url} ...", flush=True)
        curl_code, _, curl_err = run_cmd(['curl', '-sSL', '-o', tar_path, tarball_url], timeout=120)
        if curl_code == 0 and os.path.exists(tar_path):
            with tarfile.open(tar_path, "r:gz") as tar:
                tar.extractall(path=target_dir)
            os.remove(tar_path)

            subdirs = [os.path.join(target_dir, d) for d in os.listdir(target_dir) if os.path.isdir(os.path.join(target_dir, d))]
            if len(subdirs) == 1:
                extracted_dir = subdirs[0]
                for item in os.listdir(extracted_dir):
                    shutil.move(os.path.join(extracted_dir, item), target_dir)
                os.rmdir(extracted_dir)

            run_cmd(['git', 'init'], cwd=target_dir)
            run_cmd(['git', 'remote', 'add', 'origin', url], cwd=target_dir)
            
            print(f"[{name}] Tarball 源码导入成功，已关联最新提交: {commit[:12]}", flush=True)
            save_tsv_single(rel_key, commit, 'snapshot-intake')
            return True
        else:
            print(f"[{name}] curl 下载失败: {curl_err}", flush=True)
    except Exception as ex:
        print(f"[{name}] 异常: {str(ex)}", flush=True)

    return False


def main():
    print("开始补齐剩余 11 个项目的最新源码...")
    success = 0
    fail = 0
    for category, name, url, sparse in REMAINING_REPOS:
        if process_repo(category, name, url, sparse):
            success += 1
        else:
            fail += 1
    print(f"\n剩余项目处理完成！成功: {success}, 失败: {fail}")

if __name__ == '__main__':
    main()
