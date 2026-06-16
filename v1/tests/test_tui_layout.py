"""Layout characterization tests — region bounds and surface contracts.

These tests pin the UI baseline after the stable snapshot commit. They should
fail when a change pushes Mimi off-screen, collapses the meta row, or breaks
bubble left/right structure — without requiring manual `uv run oe` QA.
"""

from __future__ import annotations

import pytest
from textual.app import App, ComposeResult


@pytest.fixture
def llm_cfg() -> dict:
    return {
        "llm": {
            "api_key": "k",
            "base_url": "https://api.deepseek.com",
            "model_name": "deepseek-chat",
        }
    }


def _widget_inside_row(widget, row) -> bool:
    row_right = row.region.x + row.region.width
    widget_right = widget.region.x + widget.region.width
    return (
        widget.display
        and widget.region.width > 0
        and widget.region.height > 0
        and widget_right <= row_right
    )


@pytest.mark.asyncio
async def test_home_mascot_visible_inside_meta_row(llm_cfg: dict) -> None:
    from omnisee_every_v1.tui.screens import HomeScreen
    from omnisee_every_v1.tui.widgets import PetMascot

    screen = HomeScreen(cfg=llm_cfg)

    class Wrapper(App):
        def on_mount(self) -> None:
            self.push_screen(screen)

    async with Wrapper().run_test(size=(80, 30)) as pilot:
        await pilot.pause(0.6)  # slide_in on first launch
        pet = screen.query_one("#home-mascot", PetMascot)
        row = screen.query_one("#home-input-meta-row")
        model = screen.query_one("#home-model")
        assert _widget_inside_row(pet, row)
        assert model.region.width < row.region.width


@pytest.mark.asyncio
async def test_chat_mascot_visible_inside_meta_row(llm_cfg: dict) -> None:
    from omnisee_every.tui.app import ChatScreen
    from omnisee_every_v1.tui.widgets import PetMascot

    screen = ChatScreen(cfg=llm_cfg)

    class Wrapper(App):
        def on_mount(self) -> None:
            self.push_screen(screen)

    async with Wrapper().run_test(size=(80, 30)) as pilot:
        await pilot.pause()
        pet = screen.query_one("#chat-mascot", PetMascot)
        row = screen.query_one("#chat-input-meta-row")
        meta = screen.query_one("#chat-input-meta")
        assert _widget_inside_row(pet, row)
        assert meta.region.width < row.region.width


@pytest.mark.asyncio
async def test_user_message_gutter_left_of_bubble() -> None:
    from omnisee_every.tui.app import Message, _CHAT_BUBBLE_MAX_WIDTH

    class Wrapper(App):
        def compose(self) -> ComposeResult:
            yield Message("user", "hello")

    async with Wrapper().run_test(size=(80, 8)) as pilot:
        await pilot.pause()
        msg = pilot.app.query_one(Message)
        gutter = msg.query_one(".msg-gutter")
        bubble = msg.query_one(".bubble")
        assert gutter.region.x < bubble.region.x
        assert bubble.region.width <= _CHAT_BUBBLE_MAX_WIDTH


@pytest.mark.asyncio
async def test_assistant_message_bubble_left_aligned() -> None:
    from omnisee_every.tui.app import Message, _CHAT_BUBBLE_MAX_WIDTH

    class Wrapper(App):
        def compose(self) -> ComposeResult:
            yield Message("result", "hi")

    async with Wrapper().run_test(size=(80, 8)) as pilot:
        await pilot.pause()
        msg = pilot.app.query_one(Message)
        with pytest.raises(Exception):
            msg.query_one(".msg-gutter")
        bubble = msg.query_one(".bubble")
        assert bubble.region.x <= msg.region.x + 4
        assert bubble.region.width <= _CHAT_BUBBLE_MAX_WIDTH


def test_home_logo_width_within_stack() -> None:
    from omnisee_every.tui.wordmark import home_logo_text

    lines = home_logo_text().splitlines()
    assert lines
    assert max(len(line) for line in lines) <= 76


def test_chat_title_uses_brand_wordmark() -> None:
    from omnisee_every.tui.i18n import t

    brand = t("brand.wordmark")
    assert brand
    assert "OmniVerse" in brand or "天视" in brand
