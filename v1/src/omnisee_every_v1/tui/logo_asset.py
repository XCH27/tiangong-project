"""Logo asset loader helper for the V1 TUI."""
from __future__ import annotations

from omnisee_every_v1.tui.wordmark import home_logo_text


def get_logo() -> str:
    """Home-screen title — solid block English wordmark."""
    return home_logo_text()
