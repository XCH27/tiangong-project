from __future__ import annotations

import sys


def test_serve_starts_and_stops_worker(monkeypatch):
    from omnisee_every_v1.cli.commands import interactive

    calls: list[tuple[str, object]] = []

    class FakeProcess:
        pid = 12345

        def __init__(self, *args, **kwargs):
            calls.append(("popen", args[0]))
            self._terminated = False

        def poll(self):
            return None

        def terminate(self):
            calls.append(("terminate", None))
            self._terminated = True

        def wait(self, timeout=None):
            calls.append(("wait", timeout))
            return 0

        def kill(self):
            calls.append(("kill", None))

    def fake_uvicorn_run(app, host, port, reload):
        calls.append(("uvicorn", (app, host, port, reload)))

    monkeypatch.setattr("omnisee_every.backend.load_config", lambda: {"api": {"key": ""}})
    monkeypatch.setattr("omnisee_every_v1.cli.worker_process.subprocess.Popen", FakeProcess)
    monkeypatch.setattr("uvicorn.run", fake_uvicorn_run)

    interactive.serve(host="127.0.0.1", port=8765, reload=False)

    assert ("popen", [sys.executable, "-m", "omnisee_backend.worker.main"]) in calls
    assert ("uvicorn", ("omnisee_every.api.router:app", "127.0.0.1", 8765, False)) in calls
    assert ("terminate", None) in calls
    assert ("kill", None) not in calls
