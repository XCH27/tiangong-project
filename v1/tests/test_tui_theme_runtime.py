from __future__ import annotations
import os
import sys
import pytest
from omnisee_every_v1.tui.theme_runtime import (
    resolve_active_theme,
    active_theme_mode,
    set_terminal_background,
    reset_terminal_background,
)

def test_resolve_active_theme_env_override(monkeypatch):
    monkeypatch.setenv("OMNISEE_THEME", "winter")
    theme = resolve_active_theme()
    assert theme["name"] == "winter"


def test_active_theme_mode_env_override(monkeypatch):
    monkeypatch.setenv("OMNISEE_THEME_MODE", "day")
    assert active_theme_mode() == "day"

    monkeypatch.setenv("OMNISEE_THEME_MODE", "night")
    assert active_theme_mode() == "night"


class FakeTTY:
    def __init__(self):
        self.buffer = []

    def write(self, s: str):
        self.buffer.append(s)

    def flush(self):
        pass

    def isatty(self):
        return True


def test_set_terminal_background(monkeypatch):
    fake_tty = FakeTTY()
    monkeypatch.setattr(sys, "stdout", fake_tty)

    # Valid hex color
    set_terminal_background("#123456")
    assert fake_tty.buffer == ["\033]11;#123456\007"]

    # Invalid hex color should be ignored
    fake_tty.buffer.clear()
    set_terminal_background("invalid")
    assert fake_tty.buffer == []


def test_reset_terminal_background(monkeypatch):
    fake_tty = FakeTTY()
    monkeypatch.setattr(sys, "stdout", fake_tty)

    reset_terminal_background()
    assert fake_tty.buffer == ["\033]111\007"]
