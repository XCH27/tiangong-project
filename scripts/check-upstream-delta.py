#!/usr/bin/env python3
"""Compare tracked source plus unignored additions with the clean, matching Craft pin.

FLEET_UPSTREAM_DIR selects an isolated reference checkout (used by CI); it never moves a pin.
Exit 2 means an absent reference. A wrong version, dirty reference or invalid declaration fails.
"""
import os
import sys
from pathlib import Path

from upstream_contract import (
    ContractError, ReferenceUnavailable, file_content, inventory, read_ledger, validate_reference,
)

ROOT = Path(__file__).resolve().parent.parent
PIN = Path(os.environ.get("FLEET_UPSTREAM_DIR", ROOT / "源码参考/software/craft-agents-oss"))
APP = ROOT / "app"
LEDGER = ROOT / "docs/UPSTREAM-DELTA.tsv"


def differences(app, pin, ours, theirs):
    current = set()
    ours = {path for path in ours if (app / path).exists() or (app / path).is_symlink()}
    for rel in ours & theirs:
        if file_content(app / rel) != file_content(pin / rel):
            current.add(rel)
    current |= ours - theirs
    current |= {f"MISSING:{rel}" for rel in theirs - ours}
    return current


def main():
    try:
        tag = validate_reference(PIN, APP)
        current = differences(APP, PIN, inventory(ROOT, "app", include_untracked=True), inventory(PIN))
        if "--list" in sys.argv:
            print(f"app/ vs {tag} — {len(current)} differing paths")
            for rel in sorted(current):
                print(f"  {rel}")
            return 0
        declared = read_ledger(LEDGER)
        undeclared = sorted(current - declared.keys())
        stale = sorted(declared.keys() - current)
        if undeclared:
            print("UNDECLARED divergence — add a justified entry to docs/UPSTREAM-DELTA.tsv:", file=sys.stderr)
            for rel in undeclared:
                print(f"  {rel}", file=sys.stderr)
        if stale:
            print("STALE delta declarations:", file=sys.stderr)
            for rel in stale:
                print(f"  {rel}", file=sys.stderr)
        if undeclared or stale:
            return 1
        print(f"upstream delta OK: {len(current)} paths, all declared against {tag}")
        return 0
    except ReferenceUnavailable as error:
        print(error, file=sys.stderr)
        return 2
    except (ContractError, OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
