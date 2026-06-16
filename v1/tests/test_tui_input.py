"""Unit tests for the extracted TUIInput widget."""

from __future__ import annotations
import pytest
from textual.app import App
from textual.screen import Screen
from omnisee_every_v1.tui.widgets.tui_input import TUIInput, _clipboard_has_media


class MockScreen(Screen):
    def __init__(self):
        super().__init__()
        self.setup_called = False
        self.paste_called = False

    def action_open_setup(self):
        self.setup_called = True

    def action_paste_media(self):
        self.paste_called = True


@pytest.mark.asyncio
async def test_tui_input_setup_routing():
    # Test F1, Ctrl+K, Ctrl+S opens setup
    from textual.events import Key

    screen = MockScreen()
    tui_input = TUIInput()
    screen._add_child(tui_input)

    class MockApp(App):
        def on_mount(self):
            self.push_screen(screen)

    async with MockApp().run_test() as pilot:
        for k in ("f1", "ctrl+k", "ctrl+s"):
            screen.setup_called = False
            ev = Key(k, character=None)
            await tui_input._on_key(ev)
            assert screen.setup_called is True
            assert ev._stop_propagation is True


@pytest.mark.asyncio
async def test_tui_input_paste_with_media(monkeypatch: pytest.MonkeyPatch):
    # Mock clipboard_has_media to return True
    monkeypatch.setattr("omnisee_every_v1.tui.widgets.tui_input._clipboard_has_media", lambda: True)

    from textual.events import Key

    screen = MockScreen()
    tui_input = TUIInput()
    screen._add_child(tui_input)

    class MockApp(App):
        def on_mount(self):
            self.push_screen(screen)

    async with MockApp().run_test() as pilot:
        for k in ("ctrl+v", "super+v", "cmd+v"):
            screen.paste_called = False
            ev = Key(k, character=None)
            await tui_input._on_key(ev)
            assert screen.paste_called is True
            assert ev._stop_propagation is True


@pytest.mark.asyncio
async def test_tui_input_paste_without_media(monkeypatch: pytest.MonkeyPatch):
    # Mock clipboard_has_media to return False
    monkeypatch.setattr("omnisee_every_v1.tui.widgets.tui_input._clipboard_has_media", lambda: False)

    from textual.events import Key

    screen = MockScreen()
    tui_input = TUIInput()
    screen._add_child(tui_input)

    class MockApp(App):
        def on_mount(self):
            self.push_screen(screen)

    async with MockApp().run_test() as pilot:
        for k in ("ctrl+v", "super+v", "cmd+v"):
            screen.paste_called = False
            ev = Key(k, character=None)
            await tui_input._on_key(ev)
            assert screen.paste_called is False
            assert ev._stop_propagation is False
