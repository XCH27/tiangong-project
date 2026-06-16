"""Tests for the TUI's local-path / media-paste routing.

These tests cover the bugfix where:
  1. Submitting a local video path in chat now routes to the analysis pipeline
     (previously it was sent to semantic search and the user saw "no results").
  2. ctrl+v on plain text no longer swallows the paste — it only triggers the
     media-paste handler when the clipboard actually contains media.
"""
from __future__ import annotations

import ast
from pathlib import Path

import pytest


def _imported_modules(module) -> set[str]:
    path = Path(module.__file__)
    tree = ast.parse(path.read_text(encoding="utf-8"))
    modules: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.add(node.module)
    return modules


def test_is_media_path_recognizes_video_file(tmp_path: Path):
    from omnisee_every_v1.tui.path_utils import is_media_path as _is_media_path
    video = tmp_path / "demo.mp4"
    video.write_bytes(b"\x00\x00\x00\x18ftypisom")  # bare-minimum signature
    assert _is_media_path(str(video)) is True


def test_is_media_path_strips_file_scheme(tmp_path: Path):
    from omnisee_every_v1.tui.path_utils import is_media_path as _is_media_path
    video = tmp_path / "demo.mov"
    video.write_bytes(b"x")
    assert _is_media_path(f"file://{video}") is True


def test_is_media_path_strips_quotes_and_backslash_escapes(tmp_path: Path):
    """macOS drag-and-drop inserts backslash-escaped spaces."""
    from omnisee_every_v1.tui.path_utils import is_media_path as _is_media_path
    d = tmp_path / "my videos"
    d.mkdir()
    video = d / "clip.mp4"
    video.write_bytes(b"x")
    # Wrapped in quotes
    assert _is_media_path(f'"{video}"') is True
    # Backslash-escaped spaces (typical drag-and-drop insert)
    escaped = str(video).replace(" ", "\\ ")
    assert _is_media_path(escaped) is True


def test_is_media_path_rejects_random_text():
    from omnisee_every_v1.tui.path_utils import is_media_path as _is_media_path
    assert _is_media_path("hello world") is False
    assert _is_media_path("/this/does/not/exist.mp4") is False
    assert _is_media_path("") is False


def test_is_media_path_rejects_non_media_files(tmp_path: Path):
    from omnisee_every_v1.tui.path_utils import is_media_path as _is_media_path
    txt = tmp_path / "readme.txt"
    txt.write_text("hi")
    assert _is_media_path(str(txt)) is False


def test_normalize_media_input_handles_all_wrappings(tmp_path: Path):
    from omnisee_every_v1.tui.path_utils import normalize_pasted_media
    video = tmp_path / "v.mp4"
    video.write_bytes(b"x")
    expected = str(video)
    assert normalize_pasted_media(f'"{video}"') == expected
    assert normalize_pasted_media(f"'{video}'") == expected
    assert normalize_pasted_media(f"file://{video}") == expected
    # URLs are kept verbatim
    assert normalize_pasted_media("https://www.bilibili.com/video/BV1") == "https://www.bilibili.com/video/BV1"


def test_local_path_from_paste_accepts_generic_files(tmp_path: Path):
    from omnisee_every_v1.tui.path_utils import attachment_kind as _attachment_kind, local_path_from_paste as _local_path_from_paste

    doc = tmp_path / "notes and refs.md"
    doc.write_text("# hello")

    escaped = str(doc).replace(" ", "\\ ")
    assert _local_path_from_paste(escaped) == doc
    assert _local_path_from_paste(f"file://{str(doc).replace(' ', '%20')}") == doc
    assert _attachment_kind(str(doc)) == "text"


def test_attachment_kind_separates_image_pdf_media_and_generic(tmp_path: Path):
    from omnisee_every_v1.tui.path_utils import attachment_kind as _attachment_kind

    files = {
        "shot.png": "image",
        "deck.pdf": "pdf",
        "clip.mp4": "media",
        "archive.zip": "file",
    }
    for name, kind in files.items():
        path = tmp_path / name
        path.write_bytes(b"x")
        assert _attachment_kind(str(path)) == kind


def test_clipboard_probe_intercepts_generic_file_path(monkeypatch, tmp_path: Path):
    import subprocess
    from omnisee_every_v1.tui.clipboard_utils import clipboard_has_media

    doc = tmp_path / "notes.md"
    doc.write_text("# hello")

    monkeypatch.setattr("omnisee_every.backend.get_clipboard_media", lambda: (None, None))

    def fake_run(*_args, **_kwargs):
        class Proc:
            stdout = str(doc)
        return Proc()

    monkeypatch.setattr(subprocess, "run", fake_run)
    assert clipboard_has_media() is True


def test_normalize_preserves_url_passthrough():
    from omnisee_every_v1.tui.path_utils import normalize_pasted_media
    url = "https://youtu.be/abcdEFG"
    assert normalize_pasted_media(url) == url


def test_paste_routing_does_not_depend_on_legacy_clipboard_modules():
    import omnisee_every.tui.app as tui_app
    import omnisee_every_v1.tui.clipboard_utils as clipboard_utils

    forbidden = {
        "omnisee_every.utils.os_clipboard",
        "omnisee_every.utils.vlm",
        "omnisee_every.cli.main",
    }
    assert _imported_modules(tui_app).isdisjoint(forbidden)
    assert _imported_modules(clipboard_utils).isdisjoint(forbidden)
