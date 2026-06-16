"""Unit tests for the extracted BeamLogo widget."""

from __future__ import annotations

import pytest
from omnisee_every.tui.app import BeamLogo
from omnisee_every.tui.wordmark import home_logo_text


def test_beam_logo_initialization():
    logo_text = home_logo_text()
    logo = BeamLogo(logo_text, animate=False)

    assert logo._logo_text == logo_text
    assert logo._animate is False
    assert logo._frame_index == 0
    assert logo._ripples == []
    assert logo._active_ripple is None
    assert logo._mouse_down is False
    assert logo._logo_timer is None
    assert logo.can_focus is False


def test_nearest_logo_cell():
    logo_text = home_logo_text()
    logo = BeamLogo(logo_text, animate=False)

    cell = logo._nearest_logo_cell(0, 0)
    assert cell is not None
    col, row = cell
    assert logo._has_logo_cell(col, row)


def test_hex_to_rgb():
    assert BeamLogo._hex_to_rgb("#ffffff") == (255, 255, 255)
    assert BeamLogo._hex_to_rgb("#000000") == (0, 0, 0)
    assert BeamLogo._hex_to_rgb("#123456") == (18, 52, 86)


def test_complement_rgb():
    assert BeamLogo._complement_rgb((255, 255, 255)) == (0, 0, 0)
    assert BeamLogo._complement_rgb((0, 0, 0)) == (255, 255, 255)
    assert BeamLogo._complement_rgb((100, 150, 200)) == (155, 105, 55)
