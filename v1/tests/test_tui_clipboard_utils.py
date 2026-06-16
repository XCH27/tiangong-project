"""Unit tests for the V1 TUI clipboard media probing utilities."""
from __future__ import annotations

import subprocess
from unittest.mock import MagicMock, patch

from omnisee_every_v1.tui.clipboard_utils import is_url, clipboard_has_media


def test_is_url():
    assert is_url("https://www.bilibili.com/video/BV1xx") is True
    assert is_url("http://youtube.com/watch?v=123") is True
    assert is_url("/local/path/to/video.mp4") is False


def test_clipboard_has_media_backend_wins():
    mock_get = MagicMock(return_value=("image", "/tmp/image.png"))
    with patch("omnisee_every.backend.get_clipboard_media", mock_get, create=True):
        assert clipboard_has_media() is True
        mock_get.assert_called_once()


def test_clipboard_has_media_pbpaste_url():
    mock_get = MagicMock(side_effect=Exception("No backend"))
    mock_run = MagicMock()
    mock_run.return_value.stdout = "https://www.bilibili.com/video/BV1xx\n"

    with patch("omnisee_every.backend.get_clipboard_media", mock_get, create=True), \
         patch("subprocess.run", mock_run):
        assert clipboard_has_media() is True
        mock_run.assert_called_once()
        assert "pbpaste" in mock_run.call_args[0][0]


def test_clipboard_has_media_pbpaste_media_path(tmp_path):
    temp_media = tmp_path / "movie.mp4"
    temp_media.touch()

    mock_get = MagicMock(side_effect=Exception("No backend"))
    mock_run = MagicMock()
    mock_run.return_value.stdout = f" {temp_media} \n"

    with patch("omnisee_every.backend.get_clipboard_media", mock_get, create=True), \
         patch("subprocess.run", mock_run):
        assert clipboard_has_media() is True


def test_clipboard_has_media_pbpaste_local_path(tmp_path):
    temp_file = tmp_path / "notes.txt"
    temp_file.touch()

    mock_get = MagicMock(side_effect=Exception("No backend"))
    mock_run = MagicMock()
    mock_run.return_value.stdout = f" {temp_file} \n"

    with patch("omnisee_every.backend.get_clipboard_media", mock_get, create=True), \
         patch("subprocess.run", mock_run):
        assert clipboard_has_media() is True


def test_clipboard_has_media_no_media():
    mock_get = MagicMock(side_effect=Exception("No backend"))
    mock_run = MagicMock()
    mock_run.return_value.stdout = "plain text message\n"

    with patch("omnisee_every.backend.get_clipboard_media", mock_get, create=True), \
         patch("subprocess.run", mock_run):
        assert clipboard_has_media() is False
