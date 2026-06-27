#!/usr/bin/env python3
"""Smoke test for terminal_pty_host.py.

Spawns the host, opens one PTY session running `echo`, and asserts that the
host emits a `spawned` event followed by `data` and then `exit`. Run with:

    python3 resources/scripts/tests/test_terminal_pty_host.py
"""

import base64
import json
import os
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
HOST = os.path.join(os.path.dirname(HERE), "terminal_pty_host.py")


def main() -> int:
    proc = subprocess.Popen(
        [sys.executable, HOST],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    assert proc.stdin and proc.stdout

    spawn = {"op": "spawn", "id": "t1", "cwd": HERE, "cols": 80, "rows": 24, "shell": "/bin/sh"}
    proc.stdin.write(json.dumps(spawn) + "\n")
    proc.stdin.flush()

    command = base64.b64encode(b"echo fleet-pty-ok && exit\n").decode("ascii")
    proc.stdin.write(json.dumps({"op": "write", "id": "t1", "data": command}) + "\n")
    proc.stdin.flush()

    saw_spawned = False
    saw_data = False
    saw_exit = False
    deadline = time.time() + 10
    while time.time() < deadline:
        line = proc.stdout.readline()
        if not line:
            break
        message = json.loads(line)
        if message.get("type") == "spawned":
            saw_spawned = True
        elif message.get("type") == "data":
            decoded = base64.b64decode(message.get("data", "")).decode("utf-8", "replace")
            if "fleet-pty-ok" in decoded:
                saw_data = True
        elif message.get("type") == "exit":
            saw_exit = True
            break

    proc.stdin.close()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()

    assert saw_spawned, "host did not emit spawned"
    assert saw_data, "host did not echo expected output"
    assert saw_exit, "host did not emit exit"
    print("OK: terminal_pty_host smoke test passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
