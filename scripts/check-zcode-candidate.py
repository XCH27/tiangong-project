#!/usr/bin/env python3
"""Replay the candidate's declared source recipe without touching any working index."""
from __future__ import annotations
import os
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "29628c9acdb81b703bbd4080c207a0e7ce5e276e"

def verify(candidate: Path, patch_directory: Path, compare_working: bool = True) -> tuple[int, str]:
    patches = sorted(patch_directory.glob("[0-9][0-9][0-9][0-9]-*.patch"))
    numbers = [int(path.name[:4]) for path in patches]
    if numbers != list(range(1, len(patches) + 1)) or not patches:
        raise ValueError("Candidate patches must be nonempty and consecutively numbered")
    readme = (patch_directory / "README.md").read_text()
    declared = re.findall(r"^\| (\d{4}) \| \[([^\]]+)\]\(\2\) \|", readme, re.M)
    if [(int(number), name) for number, name in declared] != [(int(path.name[:4]), path.name) for path in patches]:
        raise ValueError("The reconstruction table does not match the ordered patch files")
    with tempfile.TemporaryDirectory(prefix="fleet-source-gate-") as directory:
        index = Path(directory) / "index"
        env = {**os.environ, "GIT_INDEX_FILE": str(index)}
        def git(*args: str) -> str:
            return subprocess.check_output(["git", "-C", str(candidate), *args], env=env, text=True).strip()
        git("read-tree", BASE)
        for patch in patches:
            git("apply", "--cached", "--check", str(patch))
            git("apply", "--cached", str(patch))
        reconstructed = git("write-tree")
        if compare_working:
            index.unlink()
            git("read-tree", BASE)
            git("add", "-A")
            working = git("write-tree")
            if working != reconstructed:
                raise ValueError(f"Candidate has undeclared source changes: working {working}, recipe {reconstructed}")
        return len(patches), reconstructed

if __name__ == "__main__":
    import sys
    candidate = ROOT / ".fleet/zcode"
    if not (candidate / ".git").exists():
        print("Candidate checkout unavailable; reconstruct it from patches/zcode before verification", file=sys.stderr)
        raise SystemExit(2)
    try:
        count, tree = verify(candidate, ROOT / "patches/zcode", "--recipe-only" not in sys.argv)
        print(f"ZCode source recipe verified: {count} patches, tree {tree}; working index unchanged")
    except (ValueError, subprocess.CalledProcessError) as error:
        print(f"ZCode source verification failed: {error}", file=sys.stderr)
        raise SystemExit(1)
