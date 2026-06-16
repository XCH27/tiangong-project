from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest
import typer

from omnisee_every.cli import ov


def _make_v2_workspace(tmp_path: Path) -> Path:
    v2_dir = tmp_path / "v2"
    (v2_dir / "src").mkdir(parents=True)
    (v2_dir / "dist").mkdir()
    (v2_dir / "node_modules").mkdir()
    (v2_dir / "package.json").write_text("{}", encoding="utf-8")
    (v2_dir / "src" / "main.tsx").write_text("export {};\n", encoding="utf-8")
    (v2_dir / "dist" / "main.js").write_text("export {};\n", encoding="utf-8")
    return v2_dir


def test_ov_launcher_runs_dist_directly_without_shim(monkeypatch, tmp_path):
    v2_dir = _make_v2_workspace(tmp_path)
    commands: list[list[str]] = []

    monkeypatch.setattr(ov.shutil, "which", lambda exe: f"/bin/{exe}")

    def fake_run(command, cwd, env=None, check=False):
        commands.append(list(command))
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(ov.subprocess, "run", fake_run)

    with pytest.raises(typer.Exit) as exc:
        ov.launch_v2(live=False, api_url="http://127.0.0.1:8000", dev=False, install=False, v2_dir_arg=str(v2_dir))

    assert exc.value.exit_code == 0
    assert commands == [["node", "dist/main.js"]]
    assert all("write-ink-shim" not in " ".join(command) for command in commands)
