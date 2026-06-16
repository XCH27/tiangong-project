"""Unit tests for the V1 TUI file chooser dialog helpers."""
from __future__ import annotations

import subprocess
from unittest.mock import MagicMock, patch

from omnisee_every_v1.tui.file_dialog import (
    choose_file_macos,
    choose_file_windows,
    choose_file_linux,
    choose_file_dialog,
)


def test_choose_file_macos_success():
    mock_run = MagicMock()
    mock_run.return_value.stdout = " /Users/test/video.mp4 \n"
    with patch("subprocess.run", mock_run):
        res = choose_file_macos()
        assert res == "/Users/test/video.mp4"
        mock_run.assert_called_once()
        assert "osascript" in mock_run.call_args[0][0]


def test_choose_file_macos_failure():
    mock_run = MagicMock(side_effect=subprocess.CalledProcessError(1, "cmd"))
    with patch("subprocess.run", mock_run):
        res = choose_file_macos()
        assert res == ""


def test_choose_file_windows_success():
    mock_run = MagicMock()
    mock_run.return_value.stdout = " C:\\test\\video.mp4 \n"
    with patch("subprocess.run", mock_run):
        res = choose_file_windows()
        assert res == "C:\\test\\video.mp4"
        mock_run.assert_called_once()
        assert "powershell" in mock_run.call_args[0][0]


def test_choose_file_windows_failure():
    mock_run = MagicMock(side_effect=subprocess.CalledProcessError(1, "cmd"))
    with patch("subprocess.run", mock_run):
        res = choose_file_windows()
        assert res == ""


def test_choose_file_linux_zenity_success():
    mock_run = MagicMock()
    mock_run.return_value.stdout = " /home/user/video.mp4 \n"
    with patch("subprocess.run", mock_run):
        res = choose_file_linux()
        assert res == "/home/user/video.mp4"
        mock_run.assert_called_once()
        assert "zenity" in mock_run.call_args[0][0]


def test_choose_file_linux_kdialog_fallback():
    def mock_run_side_effect(cmd, **kwargs):
        if "zenity" in cmd[0]:
            raise FileNotFoundError()
        elif "kdialog" in cmd[0]:
            mock_res = MagicMock()
            mock_res.stdout = " /home/user/video_kd.mp4 \n"
            return mock_res
        raise ValueError("Unexpected command")

    with patch("subprocess.run", side_effect=mock_run_side_effect):
        res = choose_file_linux()
        assert res == "/home/user/video_kd.mp4"


def test_choose_file_linux_both_fail():
    with patch("subprocess.run", side_effect=subprocess.CalledProcessError(1, "cmd")):
        res = choose_file_linux()
        assert res == ""


def test_choose_file_dialog_dispatch(monkeypatch):
    with patch("omnisee_every_v1.tui.file_dialog.choose_file_macos", return_value="mac") as m_mac, \
         patch("omnisee_every_v1.tui.file_dialog.choose_file_windows", return_value="win") as m_win, \
         patch("omnisee_every_v1.tui.file_dialog.choose_file_linux", return_value="linux") as m_lin:

        monkeypatch.setattr("platform.system", lambda: "Darwin")
        assert choose_file_dialog() == "mac"
        m_mac.assert_called_once()

        monkeypatch.setattr("platform.system", lambda: "Windows")
        assert choose_file_dialog() == "win"
        m_win.assert_called_once()

        monkeypatch.setattr("platform.system", lambda: "Linux")
        assert choose_file_dialog() == "linux"
        m_lin.assert_called_once()
