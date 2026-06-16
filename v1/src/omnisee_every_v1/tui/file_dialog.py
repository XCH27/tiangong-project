"""Platform-specific file dialog / chooser helpers for the V1 TUI."""
from __future__ import annotations

import platform
import subprocess


def choose_file_macos() -> str:
    """Choose a file on macOS using AppleScript."""
    cmd = [
        "osascript", "-e",
        'POSIX path of (choose file with prompt "Select a file or video to add")'
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError:
        return ""


def choose_file_windows() -> str:
    """Choose a file on Windows using PowerShell and OpenFileDialog."""
    powershell_cmd = (
        "Add-Type -AssemblyName System.Windows.Forms; "
        "$dialog = New-Object System.Windows.Forms.OpenFileDialog; "
        "$dialog.Filter = 'All Files (*.*)|*.*'; "
        "$dialog.Title = 'Select a File or Video'; "
        "if ($dialog.ShowDialog() -eq 'OK') { $dialog.FileName }"
    )
    cmd = ["powershell", "-Command", powershell_cmd]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return res.stdout.strip()
    except subprocess.CalledProcessError:
        return ""


def choose_file_linux() -> str:
    """Choose a file on Linux using Zenity or KDialog."""
    try:
        res = subprocess.run(
            ["zenity", "--file-selection", "--title=Select a File or Video"],
            capture_output=True, text=True, check=True
        )
        return res.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
        
    try:
        res = subprocess.run(
            ["kdialog", "--getopenfilename", ".", "*"],
            capture_output=True, text=True, check=True
        )
        return res.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    return ""


def choose_file_dialog() -> str:
    """Select the file dialog implementation based on current platform."""
    sys_type = platform.system()
    if sys_type == "Darwin":
        return choose_file_macos()
    elif sys_type == "Windows":
        return choose_file_windows()
    else:
        return choose_file_linux()
