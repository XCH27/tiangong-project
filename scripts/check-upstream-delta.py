#!/usr/bin/env python3
"""Every difference between app/ and the upstream pin must be declared.

Why this exists: the project restarted three times (2026-06-20, 2026-07-11, 2026-09-11) and each
collapse had the same shape — a large, undeclared, rewrite-shaped delta accumulated against Craft,
the documentation drifted from it, functions vanished with the pages that carried them, and the
only way out was to throw the tree away. The owner's diagnosis on 2026-09-21: "抄的不彻底或者根本
不仔细看人家怎么做的，然后自己随便做一套不好的东西出来".

So a file may differ from upstream only if docs/UPSTREAM-DELTA.tsv says why and in which layer.
An undeclared difference fails. This does not judge whether a delta is good — it makes every delta
visible and attributable, which is what was missing.

    python3 scripts/check-upstream-delta.py           # fail on undeclared differences
    python3 scripts/check-upstream-delta.py --list    # print current differences
"""
import os, subprocess, sys, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIN = os.path.join(ROOT, "源码参考/software/craft-agents-oss")
APP = os.path.join(ROOT, "app")
LEDGER = os.path.join(ROOT, "docs/UPSTREAM-DELTA.tsv")

# Build output, dependencies and local state are never part of the delta.
SKIP_DIRS = {"node_modules", "dist", "build", "out", "coverage", ".turbo", ".git", ".husky"}
SKIP_FILES = {".DS_Store"}
SKIP_SUFFIX = (".tsbuildinfo",)


def walk(root):
    """Relative paths of every file under root, minus build output and dependencies."""
    found = set()
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in filenames:
            if name in SKIP_FILES or name.endswith(SKIP_SUFFIX):
                continue
            found.add(os.path.relpath(os.path.join(dirpath, name), root))
    return found


def main():
    if not os.path.isdir(PIN):
        print(f"upstream pin not mounted at {PIN} — cannot verify the delta.", file=sys.stderr)
        print("A classified limitation, not permission to proceed: mount the volume or stop.", file=sys.stderr)
        return 2

    tag = subprocess.run(["git", "-C", PIN, "describe", "--tags"],
                         capture_output=True, text=True).stdout.strip() or "?"
    with open(os.path.join(APP, "package.json"), encoding="utf-8") as fh:
        m = re.search(r'"version"\s*:\s*"([0-9.]+)"', fh.read())
    app_version = m.group(1) if m else "?"
    if tag != f"v{app_version}":
        print(f"pin is at {tag} but app/ is {app_version} — the rolling pin must match app/.", file=sys.stderr)
        print("Move the pin deliberately, or this delta is measured against the wrong tree.", file=sys.stderr)
        return 2

    ours, theirs = walk(APP), walk(PIN)
    current = set()
    for rel in sorted(ours & theirs):
        a, b = os.path.join(APP, rel), os.path.join(PIN, rel)
        try:
            if open(a, "rb").read() != open(b, "rb").read():
                current.add(rel)
        except OSError:
            current.add(rel)
    current |= {rel for rel in ours - theirs}
    # Upstream has it and we do not: the shape that loses features silently.
    current |= {f"MISSING:{rel}" for rel in theirs - ours}

    if "--list" in sys.argv:
        print(f"app/ vs {tag} — {len(current)} differing paths")
        for rel in sorted(current):
            print(f"  {rel}")
        return 0

    declared = set()
    if os.path.exists(LEDGER):
        with open(LEDGER, encoding="utf-8") as fh:
            for line in fh:
                line = line.rstrip("\n")
                if not line or line.startswith("#"):
                    continue
                path = line.split("\t", 1)[0].strip()
                if path and path != "path":
                    declared.add(path)

    undeclared = sorted(current - declared)
    stale = sorted(declared - current)

    if undeclared:
        print(f"UNDECLARED divergence from {tag} — each needs a line in docs/UPSTREAM-DELTA.tsv:", file=sys.stderr)
        for rel in undeclared:
            print(f"  {rel}", file=sys.stderr)
        print("\nA MISSING: prefix means upstream ships it and we do not. That is the shape that", file=sys.stderr)
        print("loses features silently, so it needs a louder reason than an ordinary edit.", file=sys.stderr)
    if stale:
        print(f"STALE ledger entries — declared but no longer different from {tag}:", file=sys.stderr)
        for rel in stale:
            print(f"  {rel}", file=sys.stderr)
        print("Remove them, or the ledger stops describing the tree.", file=sys.stderr)

    if undeclared or stale:
        return 1
    print(f"upstream delta OK: {len(current)} paths, all declared against {tag}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
