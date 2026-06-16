"""Worker subprocess lifecycle for the local REST server."""

from __future__ import annotations

import os
import subprocess
import sys
from typing import Mapping


def start_worker_process(env: Mapping[str, str] | None = None) -> subprocess.Popen:
    worker_env = dict(os.environ if env is None else env)
    worker_env["OMNISEE_WORKER_PARENT"] = "oe serve"
    return subprocess.Popen(
        [sys.executable, "-m", "omnisee_backend.worker.main"],
        env=worker_env,
        start_new_session=True,
    )


def stop_worker_process(proc: subprocess.Popen | None, timeout: float = 5.0) -> None:
    if proc is None or proc.poll() is not None:
        return
    proc.terminate()
    try:
        proc.wait(timeout=timeout)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait(timeout=timeout)
