"""Unit tests for the extracted Message chat bubble widget."""

from __future__ import annotations

import pytest
from textual.app import App, ComposeResult
from omnisee_every.tui.app import Message


def test_message_initial_kind_and_classes():
    # User message
    msg_user = Message("user", "hello")
    assert msg_user._kind == "user"
    assert msg_user._initial == "hello"
    assert "msg-user" in msg_user.classes

    # Assistant message
    msg_assistant = Message("result", "hi")
    assert msg_assistant._kind == "result"
    assert msg_assistant._initial == "hi"
    assert "msg-result" in msg_assistant.classes


@pytest.mark.asyncio
async def test_message_rendering_zh() -> None:
    from omnisee_every_v1.tui import i18n
    # Force language to Chinese
    i18n._current_lang = "zh"

    class Wrapper(App):
        def compose(self) -> ComposeResult:
            yield Message("user", "hello")
            yield Message("result", "hi", provider_name="DeepSeek")
            yield Message("error", "oops")

    async with Wrapper().run_test(size=(80, 15)) as pilot:
        await pilot.pause()
        user_msg = pilot.app.query(Message)[0]
        ai_msg = pilot.app.query(Message)[1]
        err_msg = pilot.app.query(Message)[2]

        user_header = user_msg.query_one(".msg-header-title").render().markup
        assert "你" in user_header

        ai_header = ai_msg.query_one(".msg-header-title").render().markup
        assert "DeepSeek" in ai_header

        err_header = err_msg.query_one(".msg-header-title").render().markup
        assert "错误" in err_header


@pytest.mark.asyncio
async def test_message_rendering_en() -> None:
    from omnisee_every_v1.tui import i18n
    # Force language to English
    i18n._current_lang = "en"

    class Wrapper(App):
        def compose(self) -> ComposeResult:
            yield Message("user", "hello")
            yield Message("result", "hi")
            yield Message("error", "oops")

    async with Wrapper().run_test(size=(80, 15)) as pilot:
        await pilot.pause()
        user_msg = pilot.app.query(Message)[0]
        ai_msg = pilot.app.query(Message)[1]
        err_msg = pilot.app.query(Message)[2]

        user_header = user_msg.query_one(".msg-header-title").render().markup
        assert "you" in user_header

        ai_header = ai_msg.query_one(".msg-header-title").render().markup
        assert "assistant" in ai_header

        err_header = err_msg.query_one(".msg-header-title").render().markup
        assert "error" in err_header
