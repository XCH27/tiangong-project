"""Slash commands utilities for the V1 TUI."""
from __future__ import annotations

from omnisee_every_v1.tui.i18n import t


def get_slash_commands() -> list[tuple[str, str]]:
    """Return slash commands with descriptions in the active UI language."""
    return [
        ("/help",          t("slash.help")),
        ("/paste",         t("slash.paste")),
        ("/setup",         t("slash.setup")),
        ("/clear",         t("slash.clear")),
        ("/skill <name>",  t("slash.skill")),
        ("/list",          t("slash.list")),
        ("/quit",          t("slash.quit")),
    ]
