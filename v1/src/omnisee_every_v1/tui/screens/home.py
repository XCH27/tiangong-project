"""HomeScreen — Textual TUI centered launch state, big logo + framed input."""

from __future__ import annotations
import platform
from string import Template
from typing import ClassVar

from textual import events, on
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import Input, Static

from omnisee_every_v1.tui.i18n import t, get_lang
from omnisee_every_v1.tui.logo_asset import get_logo as _get_logo
from omnisee_every_v1.tui.widgets import (
    ThemeBadge,
    VLMBadge,
    BeamLogo,
    _mcp_badge_markup,
    _model_label,
)
from omnisee_every_v1.tui.widgets.mascot import PetMascot
from omnisee_every_v1.tui.path_utils import (
    is_media_path as _is_media_path,
    normalize_pasted_media as _normalize_media_input,
    is_url as _is_url,
)
from omnisee_every_v1.tui.status_markup import needs_setup


# ─────────────────────────────────────────────────────────────────────────────
# CSS Template for HomeScreen
# ─────────────────────────────────────────────────────────────────────────────
_HOME_CSS_TEMPLATE = Template("""
HomeScreen {
    background: ${bg_base};
    align: center middle;
    width: 100%;
    height: 100%;
}
#home-stack {
    width: 76;
    height: auto;
    align: center middle;
}
#logo-wrap {
    height: auto;
    align: center middle;
}
#logo {
    color: ${accent};
    text-style: bold;
    text-align: center;
    width: 100%;
    height: auto;
    content-align: center middle;
}
#logo-tagline {
    color: ${text_l2};
    text-align: center;
    height: 1;
}
.spacer-2 { height: 2; }
.spacer-1 { height: 1; }

#top-bar {
    dock: top;
    height: 1;
    width: 100%;
    background: ${bg_base};
}
#theme-badge {
    content-align: left middle;
    color: ${text_l4};
    width: auto;
    height: 1;
    padding: 0 2;
}
#theme-badge:hover {
    color: ${accent};
    text-style: bold;
}
#top-bar-spacer {
    width: 1fr;
    height: 1;
}
#vlm-badge {
    content-align: right middle;
    color: ${text_l4};
    width: auto;
    height: 1;
    padding: 0 2;
}
#vlm-badge:hover {
    color: ${accent};
    text-style: bold;
}

#home-input-frame {
    height: auto;
    width: 100%;
    background: ${bg_input};
    border-left: heavy ${accent};
    padding: 1 2;
}
#home-input {
    background: transparent;
    border: none;
    color: ${text_l2};
    height: 1;
    padding: 0;
}
#home-input:focus { border: none; }
#home-input > .input--cursor {
    background: transparent;
    color: ${text_l4};
    text-style: underline;
}
#home-model {
    color: ${text_l3};
    height: 1;
    width: 1fr;
}
#home-input-meta-row {
    height: 1;
    width: 100%;
    margin-top: 1;
}
#home-mascot {
    width: 10;
    min-width: 10;
    height: 1;
    color: ${accent};
    content-align: right middle;
}

#home-bottom {
    height: 1;
    width: 100%;
    margin-top: 1;
    color: ${text_l4};
}
#home-bottom-text {
    height: 1;
    width: auto;
    content-align: left middle;
}
#home-bottom-spacer { width: 1fr; height: 1; }
""")


from omnisee_every_v1.tui.app import _ACTIVE_THEME
_HOME_CSS = _HOME_CSS_TEMPLATE.safe_substitute(**_ACTIVE_THEME)


# Play opening animations only on first HomeScreen mount per process.
_FIRST_LAUNCH: bool = True


def _needs_setup(cfg: dict) -> tuple[bool, str]:
    return needs_setup(cfg, t)


class HomeScreen(Screen):
    CSS = _HOME_CSS

    # Every action has at least TWO bindings: one ctrl+ (modern terminals)
    # and one function key (works on every platform, never intercepted by terminal).
    # Avoid: ctrl+s/ctrl+q (XOFF/XON in some shells), ctrl+c/v/x (clipboard),
    #        ctrl+z (suspend), ctrl+l (clear line), ctrl+d (EOF), ctrl+a (select all).
    BINDINGS: ClassVar[list[Binding]] = [
        Binding("ctrl+q", "app.quit", "退出", show=False),
        Binding("super+q", "app.quit", "退出", show=False),
        Binding("cmd+q", "app.quit", "退出", show=False),
        Binding("f10",    "app.quit", "quit", show=False),
        Binding("f1",     "open_setup", "配置模型"),
        Binding("ctrl+s", "open_setup", "配置", show=False),
        Binding("ctrl+k", "open_setup", "配置(Mac)", show=False),
        Binding("ctrl+v", "paste_media", "智能粘贴", key_display="⌘+V" if platform.system() == "Darwin" else "ctrl+v"),
        Binding("super+v", "paste_media", "智能粘贴", show=False),
        Binding("cmd+v", "paste_media", "智能粘贴", show=False),
        # F2/F3 theme actions are bound at the App level (works on every screen).
        Binding("ctrl+m", "toggle_mascot", "Mimi", show=False),
    ]

    def __init__(self, cfg: dict) -> None:
        super().__init__()
        self._cfg = cfg

    def compose(self) -> ComposeResult:
        from omnisee_every_v1.tui.app import _active_theme_mode, _ACTIVE_THEME, TUIInput
        animate = _FIRST_LAUNCH

        is_zh = get_lang() == "zh"
        season_label = (
            _ACTIVE_THEME["name_zh"] if is_zh else _ACTIVE_THEME["name"]
        )
        mode_label = "昼" if _active_theme_mode() == "day" and is_zh else ("day" if _active_theme_mode() == "day" else "")
        badge_left = f"{_ACTIVE_THEME['glyph']} {season_label}" + (f" · {mode_label}" if mode_label else "")
        with Horizontal(id="top-bar"):
            yield ThemeBadge(
                f"[{_ACTIVE_THEME['text_l4']}]{badge_left}[/]",
                id="theme-badge", markup=True,
            )
            yield Static("", id="top-bar-spacer")
            yield VLMBadge(
                _mcp_badge_markup(self._cfg),
                id="vlm-badge", markup=True,
            )
        with Vertical(id="home-stack"):
            with Vertical(id="logo-wrap"):
                yield BeamLogo(_get_logo(), animate=animate, id="logo")
                yield Static("", classes="spacer-1")
                yield Static(
                    f"[bold]{t('brand.tagline')}[/]",
                    id="logo-tagline", markup=True,
                )
            yield Static("", classes="spacer-2")
            with Vertical(id="home-input-frame"):
                yield TUIInput(
                    placeholder=t("home.placeholder"),
                    id="home-input",
                )
                with Horizontal(id="home-input-meta-row"):
                    yield Static(self._model_line(), id="home-model", markup=True)
                    yield PetMascot(slide_in=animate, compact=True, id="home-mascot")
            with Horizontal(id="home-bottom"):
                yield Static(t("home.bottom"), id="home-bottom-text", markup=True)
                yield Static("", id="home-bottom-spacer")

    def action_toggle_mascot(self) -> None:
        try:
            mascot = self.query_one("#home-mascot", PetMascot)
            mascot.display = not mascot.display
        except Exception:
            pass

    def on_mouse_down(self, event: events.MouseDown) -> None:
        if isinstance(getattr(event, "widget", None), BeamLogo):
            return
        try:
            logo = self.query_one("#logo", BeamLogo)
        except Exception:
            return
        screen_x = int(getattr(event, "screen_x", event.x))
        screen_y = int(getattr(event, "screen_y", event.y))
        logo.trigger_pulse_at(screen_x - logo.region.x, screen_y - logo.region.y)

    def _model_line(self) -> str:
        from omnisee_every_v1.tui.app import _ACTIVE_THEME
        needs, reason = _needs_setup(self._cfg)
        accent = _ACTIVE_THEME["accent"]
        muted = _ACTIVE_THEME["text_l4"]
        if not needs:
            return f"[{accent}]▸[/] [{muted}]{_model_label(self._cfg)}[/]"
        return f"[{_ACTIVE_THEME['error']}]▸[/] [{muted}]bcut  ·  [{_ACTIVE_THEME['error']}]{t('home.model_hint', reason=reason)}[/][/]"

    def _refresh_vlm(self) -> None:
        from omnisee_every_v1.tui.app import _active_theme_mode, _ACTIVE_THEME
        try:
            self.query_one("#home-model", Static).update(self._model_line())
        except Exception:
            pass
        try:
            is_zh = get_lang() == "zh"
            season_label = (
                _ACTIVE_THEME["name_zh"] if is_zh else _ACTIVE_THEME["name"]
            )
            mode_label = "昼" if _active_theme_mode() == "day" and is_zh else ("day" if _active_theme_mode() == "day" else "")
            badge_left = f"{_ACTIVE_THEME['glyph']} {season_label}" + (f" · {mode_label}" if mode_label else "")
            self.query_one("#theme-badge", Static).update(
                f"[{_ACTIVE_THEME['text_l4']}]{badge_left}[/]"
            )
            self.query_one("#vlm-badge", Static).update(
                _mcp_badge_markup(self._cfg)
            )
        except Exception:
            pass

    def on_mount(self) -> None:
        global _FIRST_LAUNCH
        _FIRST_LAUNCH = False
        self.query_one("#home-input", Input).focus()
        needs, reason = _needs_setup(self._cfg)
        if needs:
            from omnisee_every_v1.tui.app import SetupModal
            self.set_timer(0.3, lambda: self.app.push_screen(
                SetupModal(reason=reason, cfg=self._cfg), self._after_setup
            ))

    def _after_setup(self, saved: bool) -> None:
        if saved:
            from omnisee_every_v1.tui.app import _get_config
            self._cfg = _get_config()
            self.query_one("#home-model", Static).update(self._model_line())

    @on(Input.Submitted, "#home-input")
    def _submitted(self, e: Input.Submitted) -> None:
        from omnisee_every_v1.tui.app import ChatScreen
        text = e.value.strip()
        if not text:
            return
        # Normalize file:// URLs / escaped local paths before handing off
        if _is_media_path(text):
            text = _normalize_media_input(text)
        self.app.switch_screen(ChatScreen(cfg=self._cfg, first=text))

    def action_open_setup(self) -> None:
        from omnisee_every_v1.tui.app import SetupModal
        self.app.push_screen(SetupModal(cfg=self._cfg), self._after_setup)

    def action_paste_media(self) -> None:
        from omnisee_every_v1.tui.app import ChatScreen
        # Check clipboard and switch screen if media is copied
        from omnisee_every.backend import get_clipboard_media

        m_type, m_path = get_clipboard_media()
        
        # Or check if clipboard contains a video URL
        is_media_url = False
        if not m_type or not m_path:
            try:
                import subprocess
                text_proc = subprocess.run(
                    ["pbpaste"],
                    capture_output=True,
                    text=True,
                    timeout=2.0
                )
                text = text_proc.stdout.strip()
                if _is_url(text):
                    is_media_url = True
            except Exception:
                pass
                
        if m_type or is_media_url:
            chat = ChatScreen(cfg=self._cfg)
            self.app.switch_screen(chat)
            chat.call_after_refresh(chat.action_paste_media)
