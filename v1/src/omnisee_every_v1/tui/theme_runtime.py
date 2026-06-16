from __future__ import annotations
import os
import re
import sys
import atexit
from omnisee_every_v1.tui.theme import pick_theme, THEMES

_TERMINAL_BG_RESET_REGISTERED = False


def get_tui_config() -> dict:
    try:
        from omnisee_every.backend import load_config
        return load_config()
    except Exception:
        return {}


def resolve_active_theme() -> dict:
    """Pick the theme to use this session.

    Override priority:
      1. OMNISEE_THEME env var (e.g. OMNISEE_THEME=peachy oe)
      2. cfg.ui.theme in tmp/config/config.yaml
      3. Hour-of-day rotation (default)
    """
    env_theme = (os.environ.get("OMNISEE_THEME") or "").strip().lower()
    if env_theme in THEMES:
        return THEMES[env_theme]
    if env_theme == "random":
        return pick_theme({"ui": {"theme": "random"}})
    return pick_theme(get_tui_config())


def active_theme_mode() -> str:
    env_mode = (os.environ.get("OMNISEE_THEME_MODE") or "").strip().lower()
    if env_mode in ("day", "light"):
        return "day"
    if env_mode in ("night", "dark"):
        return "night"
    try:
        ui = (get_tui_config().get("ui") or {})
        mode = (ui.get("theme_mode") or "night").strip().lower()
    except Exception:
        mode = "night"
    return "day" if mode in ("day", "light") else "night"


def set_terminal_background(color: str) -> None:
    """Best-effort terminal default background sync for light theme edge gutters."""
    global _TERMINAL_BG_RESET_REGISTERED
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", color or ""):
        return
    out = sys.stdout
    if not getattr(out, "isatty", lambda: False)():
        return
    try:
        out.write(f"\033]11;{color}\007")
        out.flush()
        if not _TERMINAL_BG_RESET_REGISTERED:
            atexit.register(reset_terminal_background)
            _TERMINAL_BG_RESET_REGISTERED = True
    except Exception:
        pass


def reset_terminal_background() -> None:
    out = sys.stdout
    if not getattr(out, "isatty", lambda: False)():
        return
    try:
        # OSC 111 resets dynamic background color in xterm/iTerm-compatible terminals.
        out.write("\033]111\007")
        out.flush()
    except Exception:
        pass
