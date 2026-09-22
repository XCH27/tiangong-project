#!/usr/bin/env python3
"""Run Bun tests and compare their failures against the recorded upstream failures.

Fails on a failure not recorded in scripts/known-upstream-test-failures.txt, and on a recorded
failure in a file that ran but no longer fails. Output streams live and unchanged.

A failure is keyed "<file> :: <test name>". An entry prefixed "flaky: " may fail or pass. An error bun reports between tests has no test name
and is keyed "<file> :: <unhandled error>". Only files that actually ran are checked for stale
entries, so a single isolated file can be run through this wrapper too.

    python3 scripts/run-bun-tests.py <bun test arguments...>     (run from app/)
"""
import pathlib, re, subprocess, sys

KNOWN = pathlib.Path(__file__).with_name("known-upstream-test-failures.txt")
FILE_HEADER = re.compile(r"^((?:\./)?(?:apps|packages|scripts)/\S+\.(?:ts|tsx|js|mjs)):$")


def main() -> int:
    known, flaky = set(), set()
    for line in KNOWN.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        target = known
        if line.startswith("flaky: "):
            target, line = flaky, line[len("flaky: "):]
        path, _, name = line.partition(" :: ")
        target.add((path.strip(), name.strip()))

    proc = subprocess.Popen(["bun", "test", *sys.argv[1:]], stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, text=True)
    current, seen, failed, ran = None, set(), set(), False
    for line in proc.stdout:
        sys.stdout.write(line)
        text = line.rstrip("\n")
        header = FILE_HEADER.match(text)
        if header:
            current = header.group(1).removeprefix("./")
            seen.add(current)
            continue
        fail = re.match(r"^\(fail\) (.*?)(?: \[[\d.]+m?s\])?$", text)
        if fail:
            failed.add((current, fail.group(1)))
        elif text.startswith("# Unhandled error between tests"):
            failed.add((current, "<unhandled error>"))
        elif re.match(r"^Ran \d+ tests?", text):
            ran = True
    code = proc.wait()
    if not ran:
        print(f"bun test did not complete (exit {code})", file=sys.stderr)
        return code or 1

    # A flaky entry is neither a new failure when it fails nor stale when it passes.
    new = sorted(failed - known - flaky, key=str)
    stale = sorted((k for k in known - failed if k[0] in seen), key=str)
    for title, rows in (("NEW test failures (not recorded as upstream defects):", new),
                        ("Recorded upstream failures that now PASS — remove them from "
                         "scripts/known-upstream-test-failures.txt:", stale)):
        if rows:
            print(f"\n{title}", file=sys.stderr)
            for path, name in rows:
                print(f"  {path} :: {name}", file=sys.stderr)
    if new or stale:
        return 1
    recorded = len(failed & known)
    print(f"\nbun tests OK: {recorded} recorded upstream failure(s), no new failures")
    return 0


if __name__ == "__main__":
    sys.exit(main())
