from __future__ import annotations

import shutil
import subprocess

from typer.testing import CliRunner

from omnisee_backend.core import doctor


def test_doctor_report_checks_environment_without_heavy_imports(monkeypatch, tmp_path):
    def fake_which(name: str):
        return f"/usr/bin/{name}" if name in {"ffmpeg", "ffprobe", "yt-dlp"} else None

    def fake_run(*_args, **_kwargs):
        return subprocess.CompletedProcess(args=[], returncode=0, stdout="tool 1.0\n", stderr="")

    monkeypatch.setattr(shutil, "which", fake_which)
    monkeypatch.setattr(subprocess, "run", fake_run)
    monkeypatch.setattr("omnisee_backend.core.doctor.doctor_summary", lambda: {"status": "ok"})
    monkeypatch.setattr(
        "omnisee_backend.core.image_runtime_advisor._ollama_status",
        lambda _config: {"installed": False, "reachable": False, "models": []},
    )

    report = doctor.doctor_report(
        {
            "workspace_dir": str(tmp_path),
            "runtime": {"offline": True, "allow_external_network": False},
            "llm": {"api_key": ""},
            "vlm": {"provider": "minicpm_public"},
            "asr": {"default_provider": "bcut", "vad_filter": True},
            "cookies": {"bilibili": "secret-cookie", "douyin": None},
        }
    )

    assert report["status"] == "ok"
    assert report["checks"]["ffmpeg"]["status"] == "ok"
    assert report["checks"]["workspace"]["writable"] is True
    assert report["checks"]["providers"]["offline"] is True
    assert report["checks"]["cookies"] == {"configured": ["bilibili"], "count": 1}


def test_doctor_uses_longer_timeout_for_ytdlp(monkeypatch, tmp_path):
    def fake_which(name: str):
        return f"/usr/bin/{name}"

    calls = []

    def fake_run(args, **kwargs):
        calls.append((args[0], kwargs.get("timeout")))
        return subprocess.CompletedProcess(args=args, returncode=0, stdout="tool 1.0\n", stderr="")

    monkeypatch.setattr(shutil, "which", fake_which)
    monkeypatch.setattr(subprocess, "run", fake_run)
    monkeypatch.setattr("omnisee_backend.core.doctor.doctor_summary", lambda: {"status": "ok"})
    monkeypatch.setattr(
        "omnisee_backend.core.image_runtime_advisor._ollama_status",
        lambda _config: {"installed": False, "reachable": False, "models": []},
    )

    doctor.doctor_report({"workspace_dir": str(tmp_path), "runtime": {}})

    assert ("/usr/bin/yt-dlp", 5.0) in calls


def test_doctor_report_warns_when_required_binary_missing(monkeypatch, tmp_path):
    monkeypatch.setattr(shutil, "which", lambda name: None)
    monkeypatch.setattr("omnisee_backend.core.doctor.doctor_summary", lambda: {"status": "warning"})
    monkeypatch.setattr(
        "omnisee_backend.core.image_runtime_advisor._ollama_status",
        lambda _config: {"installed": False, "reachable": False, "models": []},
    )

    report = doctor.doctor_report({"workspace_dir": str(tmp_path), "runtime": {}})

    assert report["status"] == "warning"
    assert report["checks"]["ffmpeg"]["status"] == "missing"
    assert report["checks"]["ffprobe"]["status"] == "missing"


def test_oe_doctor_cli_outputs_json(monkeypatch, tmp_path):
    from omnisee_every.cli.main import app

    monkeypatch.setattr(
        "omnisee_every.backend.doctor_report_for_frontend",
        lambda: {"status": "ok", "checks": {"python": {"status": "ok"}}},
    )

    result = CliRunner().invoke(app, ["doctor", "--json-output"])

    assert result.exit_code == 0
    assert '"status": "ok"' in result.output
