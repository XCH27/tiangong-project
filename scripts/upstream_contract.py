"""Shared inventory and declaration rules for Fleet's upstream comparison gates."""
import csv
import json
import os
import re
import subprocess
from pathlib import Path


class ContractError(ValueError):
    pass


class ReferenceUnavailable(ContractError):
    pass


def git(root, *args):
    result = subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True)
    if result.returncode:
        raise ContractError(result.stderr.strip() or f"git {' '.join(args)} failed")
    return result.stdout


def inventory(root, prefix="", include_untracked=False):
    """Keep every tracked file, including ignored source directories and deleted files."""
    args = ["ls-files", "-z", "--cached"]
    if include_untracked:
        args += ["--others", "--exclude-standard"]
    args += ["--", prefix or "."]
    paths = git(root, *args).split("\0")
    return {path[len(prefix):].lstrip("/") for path in paths if path}


def validate_reference(pin, app):
    if not pin.is_dir():
        raise ReferenceUnavailable(f"upstream reference unavailable at {pin}; mount it or set FLEET_UPSTREAM_DIR")
    version = json.loads((app / "package.json").read_text(encoding="utf-8"))["version"]
    tag = git(pin, "describe", "--tags", "--exact-match").strip()
    if tag != f"v{version}":
        raise ContractError(f"reference is at {tag}, but app/ is {version}; compare matching versions")
    changed = git(pin, "diff", "--name-only", tag, "--").strip()
    if changed:
        raise ContractError(f"reference has tracked changes against {tag}:\n{changed}")
    return tag


def read_ledger(path):
    if not path.is_file():
        raise ContractError(f"missing delta ledger: {path}")
    lines = [line for line in path.read_text(encoding="utf-8").splitlines()
             if line.strip() and not line.startswith("#")]
    rows = csv.reader(lines, delimiter="\t")
    if next(rows, None) != ["path", "layer", "reason"]:
        raise ContractError("delta ledger must have path, layer, reason columns")
    entries = {}
    for row in rows:
        if len(row) != 3:
            raise ContractError(f"delta ledger row needs exactly three fields: {row!r}")
        name, layer, reason = (part.strip() for part in row)
        rel = name.removeprefix("MISSING:")
        if not rel or rel.startswith("/") or ".." in Path(rel).parts:
            raise ContractError(f"invalid delta path: {name!r}")
        if name in entries:
            raise ContractError(f"duplicate delta declaration: {name}")
        if layer not in {"L0", "L1", "L2", "LOC"} or not reason:
            raise ContractError(f"{name}: require L0/L1/L2/LOC and a nonempty reason")
        if layer == "L2" and not re.search(r"\b(?:REUSE|EXTEND|NEW)\b", reason):
            raise ContractError(f"{name}: an L2 reason must name REUSE, EXTEND or NEW")
        entries[name] = (layer, reason)
    return entries


def file_content(path):
    # Compare symlinks themselves, never read through them into another authority.
    if path.is_symlink():
        return ("symlink", os.readlink(path))
    return ("file", path.read_bytes())
