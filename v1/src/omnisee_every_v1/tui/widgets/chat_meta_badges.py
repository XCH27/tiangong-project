"""Clickable Top-Right badges for the TUI chat interface."""

from __future__ import annotations
from textual.widgets import Static


class ThemeBadge(Static):
    def on_click(self) -> None:
        self.app.action_toggle_theme_mode()


class VLMBadge(Static):
    def on_click(self) -> None:
        self.app.toggle_vlm()


class ChatMetaBadge(Static):
    def on_click(self) -> None:
        self.app.toggle_vlm()


def _model_label(cfg: dict) -> str:
    from omnisee_every_v1.tui.i18n import get_lang
    from omnisee_every_v1.tui.status_markup import model_label
    return model_label(cfg, get_lang)


def _vision_model_label(cfg: dict) -> str:
    from omnisee_every_v1.tui.status_markup import vision_model_label
    return vision_model_label(cfg)


def _mcp_badge_markup(cfg: dict) -> str:
    from omnisee_every_v1.tui.app import _ACTIVE_THEME, _active_theme_mode
    from omnisee_every_v1.tui.i18n import t
    from omnisee_every_v1.tui.status_markup import mcp_badge_markup
    return mcp_badge_markup(cfg, _ACTIVE_THEME, _active_theme_mode() == "day", t)


def _top_status_markup(cfg: dict) -> str:
    from omnisee_every_v1.tui.app import _ACTIVE_THEME, _active_theme_mode
    from omnisee_every_v1.tui.i18n import t
    from omnisee_every_v1.tui.status_markup import top_status_markup
    return top_status_markup(cfg, _ACTIVE_THEME, _active_theme_mode() == "day", t)
