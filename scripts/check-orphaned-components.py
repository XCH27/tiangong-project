#!/usr/bin/env python3
"""Detect components that lose their production code references relative to Craft.

This is a lexical reference heuristic, not proof of a reachable/rendered mount. It ignores tests,
playground, comments, strings, imports and re-exports, but cannot resolve aliases or dynamic routing.
An intentional loss requires L2 with `replacement:` and either the component's exact path or an
explicit `removes: <component path>;` marker on the changed caller's declaration.
"""
import os
import re
import sys
from pathlib import Path

from upstream_contract import ContractError, ReferenceUnavailable, inventory, read_ledger, validate_reference

ROOT = Path(__file__).resolve().parent.parent
PIN = Path(os.environ.get("FLEET_UPSTREAM_DIR", ROOT / "源码参考/software/craft-agents-oss"))
APP = ROOT / "app"
LEDGER = ROOT / "docs/UPSTREAM-DELTA.tsv"
NON_PRODUCTION = {"__tests__", "tests", "test", "playground", "fixtures", "__fixtures__"}
LITERALS = re.compile(r'''//[^\n]*|/\*[\s\S]*?\*/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`''')
MODULE_REFERENCE = re.compile(
    r'''^\s*(?:import\s+(?:type\s+)?(?:[^;]*?\s+from\s*)?["']["']\s*;?|export\s+(?:type\s+)?(?:\{[^}]*\}|\*(?:\s+as\s+\w+)?)(?:\s+from\s*["']["'])?\s*;?)''',
    re.MULTILINE,
)


def sources(paths):
    return {rel for rel in paths
            if Path(rel).suffix in {".ts", ".tsx"}
            and not NON_PRODUCTION.intersection(Path(rel).parts)
            and not re.search(r"\.(?:test|spec|isolated|stories)\.tsx?$", rel)}


def code_identifiers(text):
    def erase(match):
        value = match.group()
        if value[0] in "\"'`":
            return value[0] + value[0]
        return "\n" * value.count("\n") + " "
    code = LITERALS.sub(erase, text)
    code = MODULE_REFERENCE.sub("", code)
    return set(re.findall(r"\b[A-Za-z_$][\w$]*\b", code))


def reference_counts(root, paths, names):
    counts = dict.fromkeys(names, 0)
    for rel in paths:
        path = root / rel
        if not path.is_file():
            continue
        identifiers = code_identifiers(path.read_text(encoding="utf-8")) & names
        identifiers.discard(path.stem)
        for name in identifiers:
            counts[name] += 1
    return counts


def removal_declared(rel, entries):
    for path, (layer, reason) in entries.items():
        if layer != "L2" or not re.search(r"\breplacement:\s*\S", reason):
            continue
        removals = {value.strip() for value in re.findall(r"\bremoves:\s*([^;\n]+)", reason)}
        if path.removeprefix("MISSING:") == rel or rel in removals:
            return True
    return False


def main():
    try:
        validate_reference(PIN, APP)
        ours = sources(inventory(ROOT, "app", include_untracked=True))
        theirs = sources(inventory(PIN))
        components = {rel: Path(rel).stem for rel in theirs if rel.endswith(".tsx")}
        names = set(components.values())
        ours_counts = reference_counts(APP, ours, names)
        theirs_counts = reference_counts(PIN, theirs, names)
        orphans = sorted(rel for rel, name in components.items()
                         if theirs_counts[name] > 0 and ours_counts[name] == 0)
        if "--list" in sys.argv:
            print(f"{len(orphans)} component(s) lost production references (heuristic)")
            for rel in orphans:
                print(f"  {rel}")
            return 0
        entries = read_ledger(LEDGER)
        undeclared = [rel for rel in orphans if not removal_declared(rel, entries)]
        if undeclared:
            print("Components with no remaining production reference:", file=sys.stderr)
            for rel in undeclared:
                print(f"  {rel}", file=sys.stderr)
            print("Restore the reference, or declare an L2 removes: component/path; replacement: destination on the changed caller.", file=sys.stderr)
            return 1
        print(f"production reference check OK: {len(components)} components, {len(orphans)} declared losses (heuristic)")
        return 0
    except ReferenceUnavailable as error:
        print(error, file=sys.stderr)
        return 2
    except (ContractError, OSError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
