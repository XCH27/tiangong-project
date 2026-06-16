"""Clipboard media probing utilities for the V1 TUI."""
from __future__ import annotations

import subprocess

from omnisee_every_v1.tui.path_utils import is_media_path, is_url, local_path_from_paste

def clipboard_has_media() -> bool:
    """Quick (≤200ms) probe: does the clipboard contain a media file / image / media URL?"""
    try:
        from omnisee_every.backend import get_clipboard_media

        m_type, m_path = get_clipboard_media()
        if m_type and m_path:
            return True
    except Exception:
        pass
    # Check for media URL in plain text
    try:
        text_proc = subprocess.run(
            ["pbpaste"], capture_output=True, text=True, timeout=1.0,
        )
        text = (text_proc.stdout or "").strip()
        if is_url(text):
            return True
        if is_media_path(text) or local_path_from_paste(text) is not None:
            return True
    except Exception:
        pass
    return False
