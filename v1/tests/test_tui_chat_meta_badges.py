"""Unit tests for the extracted chat meta badges."""

from __future__ import annotations

from omnisee_every.tui.app import ThemeBadge, VLMBadge, ChatMetaBadge
from textual._context import active_app


class MockApp:
    def __init__(self):
        self.toggle_theme_called = False
        self.toggle_vlm_called = False

    def action_toggle_theme_mode(self):
        self.toggle_theme_called = True

    def toggle_vlm(self):
        self.toggle_vlm_called = True


def test_theme_badge_click():
    badge = ThemeBadge()
    app = MockApp()
    token = active_app.set(app)
    try:
        badge.on_click()
        assert app.toggle_theme_called is True
    finally:
        active_app.reset(token)


def test_vlm_badge_click():
    badge = VLMBadge()
    app = MockApp()
    token = active_app.set(app)
    try:
        badge.on_click()
        assert app.toggle_vlm_called is True
    finally:
        active_app.reset(token)


def test_chat_meta_badge_click():
    badge = ChatMetaBadge()
    app = MockApp()
    token = active_app.set(app)
    try:
        badge.on_click()
        assert app.toggle_vlm_called is True
    finally:
        active_app.reset(token)
