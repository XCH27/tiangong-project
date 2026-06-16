"""Home-screen shaded block wordmark for OmniVerse Vision."""

from __future__ import annotations

from omnisee_every_v1.tui.click_pulse_logo import LOGO

_CANVAS_WIDTH = 76

_LOGO_WIDTH = max(len(line) for line in LOGO)

def _center_line(line: str, width: int) -> str:
    pad_left = max(0, (width - _LOGO_WIDTH) // 2)
    return (" " * pad_left + line.ljust(_LOGO_WIDTH)).ljust(width)


def home_logo_text() -> str:
    """Return the centered 76-column terminal wordmark."""
    return "\n".join(_center_line(line, _CANVAS_WIDTH) for line in LOGO)
