"""Unit tests for the V1 TUI logo asset loader helper."""
from __future__ import annotations

from omnisee_every_v1.tui.logo_asset import get_logo


def test_get_logo():
    logo = get_logo()
    assert isinstance(logo, str)
    lines = logo.splitlines()
    assert len(lines) > 0
    # Every line should be padded/centered to 76 columns
    for line in lines:
        assert len(line) == 76
