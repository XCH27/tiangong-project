"""ChatScreen slash command routing and skill formatting helper."""

from __future__ import annotations
from typing import TYPE_CHECKING
from textual.containers import VerticalScroll
from omnisee_every_v1.tui.slash_commands import get_slash_commands
from omnisee_every_v1.tui.i18n import t

if TYPE_CHECKING:
    from omnisee_every_v1.tui.app import ChatScreen

def format_help_message(accent: str, skills: list[str]) -> str:
    """Formats the /help slash command output."""
    lines = [f"[bold]{t('brand.name')} · {t('slash.help.title')}[/]"]
    lines.extend(f"[{accent}]{name}[/]  {desc}" for name, desc in get_slash_commands())
    lines.append("\n[dim]Skills: " + ", ".join(skills) + "[/]")
    return "\n".join(lines)

def format_skill_usage(skills: list[str]) -> str:
    """Formats the /skill command usage message."""
    return "[dim]用法：/skill <name>\n可用：" + ", ".join(skills) + "[/]"

def format_skill_unknown(arg: str, skills: list[str]) -> str:
    """Formats the /skill command unknown error message."""
    return f"[bold]未知 Skill[/]\n{arg}\n[dim]可用：{', '.join(skills)}[/]"

def format_skill_success(arg: str) -> str:
    """Formats the /skill command success message."""
    return f"[dim]已切换 Skill：[/][#ff6b35]{arg}[/]"

def format_unknown_command(text: str) -> str:
    """Formats the unknown command error message."""
    return f"[bold]未知命令[/]\n{text}\n[dim]输入 /help 查看可用命令[/]"

def handle_clear_command(screen: ChatScreen) -> None:
    """Handles the /clear command logic."""
    scroll = screen.query_one("#chat-scroll", VerticalScroll)
    for child in list(scroll.children):
        child.remove()
    screen._ctx_used = 0
    screen._refresh_context_bar()
    screen._mount_msg("step", "[dim]聊天历史已清空[/]")

def handle_skill_command(screen: ChatScreen, arg: str, skills: list[str]) -> None:
    """Handles the /skill command logic."""
    if not arg:
        screen._mount_msg("step", format_skill_usage(skills))
    elif arg not in skills:
        screen._mount_msg("error", format_skill_unknown(arg, skills))
    else:
        screen._skill = arg
        screen._update_input_meta()
        screen._mount_msg("step", format_skill_success(arg))

def execute_chat_command(screen: ChatScreen, text: str) -> None:
    """Routes and executes a chat slash command on the ChatScreen."""
    parts = text.split(maxsplit=1)
    cmd = parts[0].lower()
    arg = parts[1].strip() if len(parts) > 1 else ""

    from omnisee_every_v1.tui.app import SKILLS, _ACTIVE_THEME

    if cmd == "/help":
        msg = format_help_message(_ACTIVE_THEME["accent"], SKILLS)
        screen._mount_msg("result", msg)
    elif cmd in ("/paste", "/p"):
        screen._handle_paste()
    elif cmd == "/setup":
        screen.action_open_setup()
    elif cmd == "/clear":
        handle_clear_command(screen)
    elif cmd == "/skill":
        handle_skill_command(screen, arg, SKILLS)
    elif cmd == "/list":
        screen._list_tasks()
    elif cmd == "/quit":
        screen.app.exit()
    else:
        screen._mount_msg("error", format_unknown_command(text))
