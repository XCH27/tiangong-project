#!/usr/bin/env python3
"""A component upstream mounts and we do not is a feature that lost its home.

On 2026-09-21 this check, run by hand, found two in the tree that was then discarded:

  CreateProjectDialog  upstream mounts it in AppShell with open/close state. Our tree had replaced
                       the flow with a native folder picker, so the user could no longer name a
                       project — re-creating the exact problem upstream's own comment says the
                       dialog was added to fix ("produced ugly permanent slugs").
  BoardListToggle      upstream mounts it in AppShell and KanbanBoardContainer. Ours mounted it
                       nowhere; the list/board toggle it provided had no replacement surface.

Neither was noticed for weeks, because nothing looked. The owner's words for the pattern:
"删除的页面也没考虑把需要保留的功能放在哪里体现".

An orphan is not automatically wrong — a deliberate removal is fine. It must be declared in
docs/UPSTREAM-DELTA.tsv with layer L2 and a reason naming where the function now lives.

    python3 scripts/check-orphaned-components.py           # fail on undeclared orphans
    python3 scripts/check-orphaned-components.py --list    # print every orphan
"""
import os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PIN = os.path.join(ROOT, "源码参考/software/craft-agents-oss")
APP = os.path.join(ROOT, "app")
LEDGER = os.path.join(ROOT, "docs/UPSTREAM-DELTA.tsv")
SKIP = {"node_modules", "dist", "build", "out", ".git", "__tests__", "coverage", ".turbo"}


def sources(root):
    """Every .ts/.tsx source path under root, excluding build output and tests."""
    out = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP]
        for name in filenames:
            if name.endswith((".ts", ".tsx")) and not name.endswith((".test.ts", ".test.tsx")):
                out.append(os.path.join(dirpath, name))
    return out


def mount_counts(files, names):
    """How many files other than its own definition mention each name."""
    counts = {name: 0 for name in names}
    patterns = {name: re.compile(r"\b" + re.escape(name) + r"\b") for name in names}
    for path in files:
        try:
            text = open(path, encoding="utf-8", errors="ignore").read()
        except OSError:
            continue
        base = os.path.basename(path)
        for name in names:
            if base == f"{name}.tsx" or base == f"{name}.ts":
                continue
            if patterns[name].search(text):
                counts[name] += 1
    return counts


def main():
    if not os.path.isdir(PIN):
        print(f"upstream pin not mounted at {PIN} — cannot check for orphans.", file=sys.stderr)
        return 2

    ours, theirs = sources(APP), sources(PIN)
    # Only components that exist on both sides: a file we deleted outright is the delta gate's job.
    shared_names = set()
    for path in ours:
        name = os.path.basename(path)
        if not name.endswith(".tsx"):
            continue
        rel = os.path.relpath(path, APP)
        if os.path.exists(os.path.join(PIN, rel)):
            shared_names.add(name[:-4])
    if not shared_names:
        print("no shared components to compare.")
        return 0

    ours_counts = mount_counts(ours, shared_names)
    theirs_counts = mount_counts(theirs, shared_names)
    orphans = sorted(n for n in shared_names if ours_counts[n] == 0 and theirs_counts[n] > 0)

    if "--list" in sys.argv:
        print(f"{len(orphans)} component(s) upstream mounts and we do not")
        for name in orphans:
            print(f"  {name}  (upstream: {theirs_counts[name]} mounting file(s))")
        return 0

    declared = set()
    if os.path.exists(LEDGER):
        for line in open(LEDGER, encoding="utf-8"):
            if line.startswith("#") or not line.strip():
                continue
            declared.add(line.split("\t", 1)[0].strip())

    undeclared = [n for n in orphans
                  if not any(n in entry for entry in declared)]
    if undeclared:
        print("ORPHANED components — upstream mounts these, we mount them nowhere:", file=sys.stderr)
        for name in undeclared:
            print(f"  {name}  (upstream mounts it in {theirs_counts[name]} file(s))", file=sys.stderr)
        print("\nEach is a function that lost its home. Either mount it, or declare the removal in", file=sys.stderr)
        print("docs/UPSTREAM-DELTA.tsv as L2 with a reason naming where the function now lives.", file=sys.stderr)
        return 1

    print(f"no undeclared orphaned components ({len(orphans)} declared)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
