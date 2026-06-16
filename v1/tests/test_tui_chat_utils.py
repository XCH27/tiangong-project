"""Unit tests for the V1 TUI chat utility helpers."""
from __future__ import annotations

from omnisee_every_v1.tui.chat_utils import estimate_message_tokens, looks_like_visual_query


def test_estimate_message_tokens():
    # empty/whitespace text estimates to 0 tokens
    assert estimate_message_tokens("") == 0
    assert estimate_message_tokens("   ") == 0

    # short non-empty text estimates at least 1 token
    assert estimate_message_tokens("a") == 1
    assert estimate_message_tokens("ab") == 1

    # longer text follows the existing (len(stripped) + 2) // 3 rule
    assert estimate_message_tokens("abc") == 1
    assert estimate_message_tokens("abcd") == 2
    assert estimate_message_tokens("abcde") == 2
    assert estimate_message_tokens("abcdef") == 2
    assert estimate_message_tokens("abcdefg") == 3


def test_looks_like_visual_query():
    # Chinese visual-query keywords are detected
    assert looks_like_visual_query("图片里面有什么") is True
    assert looks_like_visual_query("看一下这张截图") is True
    assert looks_like_visual_query("画面里的猫") is True

    # English visual-query keywords are detected
    assert looks_like_visual_query("describe this screenshot") is True
    assert looks_like_visual_query("show image details") is True

    # unrelated text is not detected as visual
    assert looks_like_visual_query("你好，今天天气怎么样？") is False
    assert looks_like_visual_query("估计要下一天雨") is False
    assert looks_like_visual_query("") is False
