"""Unit tests for the ChatScreen slash command helpers and routing."""

from __future__ import annotations
from unittest.mock import MagicMock

import pytest
from omnisee_every_v1.tui.chat_commands import (
    format_help_message,
    format_skill_usage,
    format_skill_unknown,
    format_skill_success,
    format_unknown_command,
    execute_chat_command,
)

def test_command_formatting():
    skills = ["skill-a", "skill-b"]
    
    # Test help format
    help_msg = format_help_message("accent-color", skills)
    assert "accent-color" in help_msg
    assert "skill-a" in help_msg
    assert "skill-b" in help_msg

    # Test skill usage format
    usage = format_skill_usage(skills)
    assert "/skill" in usage
    assert "skill-a" in usage

    # Test skill unknown format
    unknown = format_skill_unknown("bad-skill", skills)
    assert "未知 Skill" in unknown
    assert "bad-skill" in unknown
    assert "skill-b" in unknown

    # Test skill success format
    success = format_skill_success("good-skill")
    assert "已切换 Skill" in success
    assert "good-skill" in success

    # Test unknown command format
    unknown_cmd = format_unknown_command("/unknown")
    assert "未知命令" in unknown_cmd
    assert "/unknown" in unknown_cmd


def test_execute_chat_command_help():
    screen = MagicMock()
    # Mock global variables used inside execute_chat_command if needed
    # (they are imported from omnisee_every_v1.tui.app)
    # Let's verify that we can execute it.
    execute_chat_command(screen, "/help")
    screen._mount_msg.assert_called_once()
    args, kwargs = screen._mount_msg.call_args
    assert args[0] == "result"
    assert "Skills: " in args[1]


def test_execute_chat_command_paste():
    screen = MagicMock()
    execute_chat_command(screen, "/paste")
    screen._handle_paste.assert_called_once()

    screen = MagicMock()
    execute_chat_command(screen, "/p")
    screen._handle_paste.assert_called_once()


def test_execute_chat_command_setup():
    screen = MagicMock()
    execute_chat_command(screen, "/setup")
    screen.action_open_setup.assert_called_once()


def test_execute_chat_command_clear():
    screen = MagicMock()
    mock_scroll = MagicMock()
    mock_scroll.children = [MagicMock(), MagicMock()]
    screen.query_one.return_value = mock_scroll
    
    execute_chat_command(screen, "/clear")
    from textual.containers import VerticalScroll
    screen.query_one.assert_called_once_with("#chat-scroll", VerticalScroll)
    assert screen._ctx_used == 0
    screen._refresh_context_bar.assert_called_once()
    screen._mount_msg.assert_called_once_with("step", "[dim]聊天历史已清空[/]")


def test_execute_chat_command_skill():
    from omnisee_every_v1.tui.app import SKILLS

    # No argument
    screen = MagicMock()
    execute_chat_command(screen, "/skill")
    screen._mount_msg.assert_called_once_with("step", format_skill_usage(SKILLS))

    # Unknown skill
    screen = MagicMock()
    execute_chat_command(screen, "/skill nonexistent")
    screen._mount_msg.assert_called_once_with("error", format_skill_unknown("nonexistent", SKILLS))

    # Valid skill
    if SKILLS:
        valid_skill = SKILLS[0]
        screen = MagicMock()
        execute_chat_command(screen, f"/skill {valid_skill}")
        assert screen._skill == valid_skill
        screen._update_input_meta.assert_called_once()
        screen._mount_msg.assert_called_once_with("step", format_skill_success(valid_skill))


def test_execute_chat_command_list():
    screen = MagicMock()
    execute_chat_command(screen, "/list")
    screen._list_tasks.assert_called_once()


def test_execute_chat_command_quit():
    screen = MagicMock()
    execute_chat_command(screen, "/quit")
    screen.app.exit.assert_called_once()


def test_execute_chat_command_unknown():
    screen = MagicMock()
    execute_chat_command(screen, "/invalid")
    screen._mount_msg.assert_called_once_with("error", format_unknown_command("/invalid"))
