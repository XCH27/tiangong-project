#!/usr/bin/env python3
"""Interactive terminal PTY host for Fleet's bottom terminal panel.

This process is spawned once by the Electron main process
(`interactive-terminal-ipc.ts`). It manages one or more PTY-backed shell
sessions and speaks newline-delimited JSON over stdin/stdout.

Why a Python host instead of `node-pty`?
    `node-pty` is a native module that needs node-gyp / per-platform prebuilds.
    Python ships a `pty` module in its stdlib (Unix), so we avoid the native
    build toolchain entirely for the human-facing terminal. Agent command
    execution does NOT go through here — that goes through the CLI Runtime / ACP
    path (see docs/23) or a registered `terminal.run_command` internal action.

Protocol — main process -> host (one JSON object per line on stdin):
    {"op": "spawn",  "id": str, "cwd": str|null, "cols": int, "rows": int, "shell": str|null}
    {"op": "write",  "id": str, "data": str}            # data is base64-encoded bytes
    {"op": "resize", "id": str, "cols": int, "rows": int}
    {"op": "kill",   "id": str}

Protocol — host -> main process (one JSON object per line on stdout):
    {"type": "spawned", "id": str, "pid": int}
    {"type": "data",    "id": str, "data": str}         # data is base64-encoded bytes
    {"type": "exit",    "id": str, "code": int|null, "signal": int|null}
    {"type": "error",   "id": str, "message": str}
"""

import base64
import json
import os
import select
import signal
import struct
import sys
import threading

try:
    import fcntl
    import pty
    import termios
except ImportError:  # pragma: no cover - non-Unix platforms
    fcntl = None
    pty = None
    termios = None


_STDOUT_LOCK = threading.Lock()


def _emit(message: dict) -> None:
    """Write a single JSON line to stdout atomically."""
    line = json.dumps(message, ensure_ascii=False) + "\n"
    with _STDOUT_LOCK:
        sys.stdout.write(line)
        sys.stdout.flush()


class TerminalSession:
    def __init__(self, session_id: str, cwd, cols: int, rows: int, shell) -> None:
        self.id = session_id
        self.cols = max(1, int(cols or 80))
        self.rows = max(1, int(rows or 24))
        self.pid = -1
        self.master_fd = -1
        self._closed = False
        self._spawn(cwd, shell)

    def _spawn(self, cwd, shell) -> None:
        shell_path = shell or os.environ.get("SHELL") or "/bin/bash"
        target_cwd = cwd if cwd and os.path.isdir(cwd) else os.path.expanduser("~")

        pid, master_fd = pty.fork()
        if pid == 0:
            # Child process: become the shell.
            try:
                os.chdir(target_cwd)
            except OSError:
                pass
            env = os.environ.copy()
            env.pop("CI", None)
            term_env = env.get("TERM", "")
            if not term_env or term_env == "dumb":
                env["TERM"] = "xterm-256color"
            env["COLORTERM"] = env.get("COLORTERM") or "truecolor"
            env["TERM_PROGRAM"] = "Fleet"
            try:
                os.execvpe(shell_path, [shell_path, "-l"], env)
            except OSError:
                os.execvpe("/bin/sh", ["/bin/sh"], env)
            os._exit(127)
            return

        # Parent process.
        self.pid = pid
        self.master_fd = master_fd
        self._set_winsize(self.rows, self.cols)
        _emit({"type": "spawned", "id": self.id, "pid": pid})

        threading.Thread(target=self._read_loop, daemon=True).start()
        threading.Thread(target=self._wait_loop, daemon=True).start()

    def _set_winsize(self, rows: int, cols: int) -> None:
        if self.master_fd < 0 or fcntl is None:
            return
        try:
            winsize = struct.pack("HHHH", rows, cols, 0, 0)
            fcntl.ioctl(self.master_fd, termios.TIOCSWINSZ, winsize)
        except OSError:
            pass

    def _read_loop(self) -> None:
        while not self._closed:
            try:
                ready, _, _ = select.select([self.master_fd], [], [], 0.5)
            except (OSError, ValueError):
                break
            if not ready:
                continue
            try:
                chunk = os.read(self.master_fd, 65536)
            except OSError:
                break
            if not chunk:
                break
            _emit({
                "type": "data",
                "id": self.id,
                "data": base64.b64encode(chunk).decode("ascii"),
            })

    def _wait_loop(self) -> None:
        code = None
        term_signal = None
        try:
            _, status = os.waitpid(self.pid, 0)
            if os.WIFEXITED(status):
                code = os.WEXITSTATUS(status)
            elif os.WIFSIGNALED(status):
                term_signal = os.WTERMSIG(status)
        except OSError:
            pass
        self._closed = True
        try:
            if self.master_fd >= 0:
                os.close(self.master_fd)
        except OSError:
            pass
        _emit({"type": "exit", "id": self.id, "code": code, "signal": term_signal})

    def write(self, data_b64: str) -> None:
        if self._closed or self.master_fd < 0:
            return
        try:
            os.write(self.master_fd, base64.b64decode(data_b64))
        except (OSError, ValueError):
            pass

    def resize(self, cols: int, rows: int) -> None:
        self.cols = max(1, int(cols or self.cols))
        self.rows = max(1, int(rows or self.rows))
        self._set_winsize(self.rows, self.cols)

    def kill(self) -> None:
        if self._closed:
            return
        try:
            os.kill(self.pid, signal.SIGHUP)
        except OSError:
            pass
        try:
            os.kill(self.pid, signal.SIGTERM)
        except OSError:
            pass


def main() -> int:
    if pty is None:
        _emit({"type": "error", "id": "*", "message": "PTY is not supported on this platform"})
        return 1

    sessions: dict[str, TerminalSession] = {}

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            message = json.loads(line)
        except json.JSONDecodeError:
            continue

        op = message.get("op")
        session_id = message.get("id")
        if not isinstance(session_id, str):
            continue

        if op == "spawn":
            existing = sessions.pop(session_id, None)
            if existing:
                existing.kill()
            try:
                sessions[session_id] = TerminalSession(
                    session_id,
                    message.get("cwd"),
                    message.get("cols", 80),
                    message.get("rows", 24),
                    message.get("shell"),
                )
            except Exception as exc:  # noqa: BLE001 - surface spawn failures
                _emit({"type": "error", "id": session_id, "message": str(exc)})
        elif op == "write":
            session = sessions.get(session_id)
            if session:
                session.write(message.get("data", ""))
        elif op == "resize":
            session = sessions.get(session_id)
            if session:
                session.resize(message.get("cols", 80), message.get("rows", 24))
        elif op == "kill":
            session = sessions.pop(session_id, None)
            if session:
                session.kill()

    for session in list(sessions.values()):
        session.kill()
    return 0


if __name__ == "__main__":
    sys.exit(main())
