"""Unit tests for the extracted ChatScreen."""

from __future__ import annotations
import pytest

# Import app first to resolve pre-existing circular dependencies during test collection
import omnisee_every_v1.tui.app as _app

from textual.app import App
from omnisee_every_v1.tui.screens.chat import ChatScreen
from omnisee_every_v1.tui.widgets import PetMascot, ChatMetaBadge, TUIInput

@pytest.fixture
def base_cfg() -> dict:
    return {
        "llm": {
            "api_key": "dummy-key",
            "base_url": "https://api.openai.com/v1",
            "model_name": "gpt-4o",
        }
    }

def test_chat_screen_imports_and_instantiates(base_cfg: dict) -> None:
    """Verify that ChatScreen can be instantiated and has expected attributes."""
    screen = ChatScreen(cfg=base_cfg)
    assert screen.CSS is not None
    assert len(screen.BINDINGS) > 0
    assert screen._cfg == base_cfg

@pytest.mark.asyncio
async def test_chat_screen_compose_and_mount(base_cfg: dict) -> None:
    """Verify that ChatScreen renders all expected layout widgets on mount."""
    screen = ChatScreen(cfg=base_cfg)

    class TestApp(App):
        def on_mount(self) -> None:
            self.push_screen(screen)

    async with TestApp().run_test(size=(80, 30)) as pilot:
        await pilot.pause()
        
        # Verify core TUI components are composed
        assert screen.query_one("#chat-input", TUIInput) is not None
        assert screen.query_one("#chat-mascot", PetMascot) is not None
        assert screen.query_one("#chat-meta", ChatMetaBadge) is not None
        assert screen.query_one("#chat-scroll") is not None
        assert screen.query_one("#chat-add-btn") is not None
        assert screen.query_one("#chat-ctx-bar") is not None
