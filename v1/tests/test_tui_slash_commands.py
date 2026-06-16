"""Unit tests for the V1 TUI slash commands helper."""
from __future__ import annotations

from omnisee_every_v1.tui.slash_commands import get_slash_commands
from omnisee_every_v1.tui.i18n import get_lang, set_lang


def test_get_slash_commands():
    old_lang = get_lang()
    try:
        set_lang("zh")
        commands_zh = get_slash_commands()
        assert len(commands_zh) == 7
        assert commands_zh[0][0] == "/help"
        assert commands_zh[1][0] == "/paste"
        assert commands_zh[2][0] == "/setup"
        assert commands_zh[3][0] == "/clear"
        assert commands_zh[4][0] == "/skill <name>"
        assert commands_zh[5][0] == "/list"
        assert commands_zh[6][0] == "/quit"

        set_lang("en")
        commands_en = get_slash_commands()
        assert len(commands_en) == 7
        assert commands_en[0][1] != commands_zh[0][1]
    finally:
        set_lang(old_lang)
