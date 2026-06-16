"""Chat bubble widget — distinct visual identity per author."""

from __future__ import annotations
from string import Template
from typing import ClassVar

from textual import on
from textual.app import ComposeResult
from textual.containers import Horizontal, Vertical, HorizontalGroup, VerticalScroll
from textual.widgets import Button, Static, Input

from omnisee_every_v1.tui.i18n import get_lang
from omnisee_every_v1.tui.theme_runtime import resolve_active_theme

_ACTIVE_THEME = resolve_active_theme()

_CHAT_BUBBLE_MAX_WIDTH = 58
_CHAT_BUBBLE_MIN_WIDTH = 24

class Message(HorizontalGroup):
    """Chat bubble. User rows right-align via 1fr gutter; AI/error left-align."""

    DEFAULT_CSS = Template("""
    Message {
        width: 100%;
        height: auto;
        margin-top: 1;
        margin-bottom: 1;
        background: transparent;
    }

    .bubble {
        height: auto;
        width: auto;
        min-width: ${bubble_min};
        max-width: ${bubble_max};
        padding: 1 2;
        background: ${bg_panel};
        color: ${text_l2};
    }

    Message.msg-user > .msg-gutter {
        width: 1fr;
        min-width: 0;
        height: 1;
    }
    Message.msg-user > .bubble {
        background: ${bg_input};
        border-left: solid ${user_bar};
        text-align: right;
        align: right top;
    }

    Message.msg-result > .bubble {
        border-left: solid ${ai_bar};
    }

    Message.msg-step > .bubble {
        background: ${bg_base};
        border-left: solid ${text_l4};
        padding: 0 2;
        max-width: ${bubble_max};
    }

    Message.msg-plan > .bubble {
        background: ${bg_panel};
        border-left: solid ${accent};
        min-width: 48;
        max-width: 74;
    }

    Message.msg-error > .bubble {
        border-left: solid ${error};
        color: ${error};
    }

    Message.msg-info > .bubble {
        background: ${bg_base};
        border-left: solid ${border_subtle};
        padding: 0 2;
    }

    .msg-text {
        height: auto;
        width: auto;
    }

    .msg-header-row {
        height: 1;
        width: 100%;
        background: transparent;
        border: none;
        align: left middle;
    }

    .msg-header-title {
        height: 1;
        width: 1fr;
    }

    .msg-action-btn {
        width: auto;
        min-width: 0;
        height: 1;
        border: none;
        background: transparent;
        padding: 0 1;
        margin: 0;
    }

    .msg-action-btn.copy {
        color: ${success};
    }

    .msg-action-btn.copy:hover {
        color: ${success};
        text-style: bold;
    }

    .msg-action-btn.recall {
        color: ${error};
    }

    .msg-action-btn.recall:hover {
        color: ${error};
        text-style: bold;
    }

    .msg-action-btn.copied {
        color: ${success};
        text-style: bold;
    }
    """).safe_substitute(
        **_ACTIVE_THEME,
        bubble_max=_CHAT_BUBBLE_MAX_WIDTH,
        bubble_min=_CHAT_BUBBLE_MIN_WIDTH,
    )

    _HEADERS: ClassVar[dict[str, tuple[str, str]]] = {
        "user":   ("▸ 你",       "▸ you"),
        "result": ("◈ 助手",      "◈ assistant"),
        "plan":   ("◌ 分析计划",   "◌ analysis plan"),
        "step":   ("",            ""),
        "error":  ("✗ 错误",      "✗ error"),
        "info":   ("·",           "·"),
    }

    def __init__(self, kind: str, initial: str = "", provider_name: str | None = None) -> None:
        super().__init__()
        self.add_class(f"msg-{kind}")
        self._kind = kind
        self._raw: list[str] = []
        self._initial = initial
        self._provider_name = provider_name

    def compose(self) -> ComposeResult:
        if self._kind == "user":
            yield Static("", classes="msg-gutter", shrink=True)
        
        with Vertical(classes="bubble"):
            with Horizontal(classes="msg-header-row"):
                yield Static("", classes="msg-header-title", markup=True)
                if self._kind in ("user", "result"):
                    yield Button("✓", classes="msg-action-btn copy", id="msg-copy-btn")
                    yield Button("✗", classes="msg-action-btn recall", id="msg-recall-btn")
            yield Static(classes="msg-text", markup=True)

    def on_mount(self) -> None:
        if self._initial:
            self.set_text(self._initial)
        else:
            self._repaint()

    def append(self, line: str) -> None:
        self._raw.append(line)
        self._repaint()

    def set_text(self, text: str) -> None:
        self._raw = [text]
        self._repaint()

    def _repaint(self) -> None:
        is_zh = get_lang() == "zh"
        header_zh, header_en = self._HEADERS.get(self._kind, ("", ""))
        if self._kind == "result" and self._provider_name:
            header = f"◈ {self._provider_name}"
        else:
            header = header_zh if is_zh else header_en

        bar_color_key = {
            "user": "user_bar",
            "result": "ai_bar",
            "plan": "accent",
            "step": "text_l4",
            "error": "error",
            "info": "border_subtle",
        }.get(self._kind, "text_l3")
        bar_color = _ACTIVE_THEME[bar_color_key]

        try:
            header_title = self.query_one(".msg-header-title", Static)
            header_title.update(f"[bold {bar_color}]{header}[/]" if header else "")
            # For user/result the header-row is always visible (buttons live there).
            # For step/info/error hide it only when there's no text.
            if self._kind in ("user", "result"):
                self.query_one(".msg-header-row").styles.display = "block"
            else:
                display = "block" if header else "none"
                self.query_one(".msg-header-row").styles.display = display
        except Exception:
            pass

        body = "\n".join(self._raw) if self._raw else ""
        try:
            self.query_one(".msg-text", Static).update(body if body else " ")
        except Exception:
            pass

    @on(Button.Pressed, "#msg-copy-btn")
    def _on_copy_pressed(self) -> None:
        self.action_copy()

    @on(Button.Pressed, "#msg-recall-btn")
    def _on_recall_pressed(self) -> None:
        try:
            scroll = self.ancestor_of_type(VerticalScroll)
        except Exception:
            return
        
        messages = list(scroll.query(Message))
        try:
            my_idx = messages.index(self)
        except ValueError:
            return
        
        if self._kind == "result" and my_idx > 0 and messages[my_idx - 1]._kind == "user":
            # Recall the AI message AND the preceding user message
            user_msg = messages[my_idx - 1]
            recalled_text = "\n".join(user_msg._raw)
            remove_start_idx = my_idx - 1
        else:
            recalled_text = "\n".join(self._raw)
            remove_start_idx = my_idx
            
        try:
            inp = self.screen.query_one("#chat-input", Input)
            inp.value = recalled_text
            inp.focus()
            inp.cursor_position = len(inp.value)
        except Exception:
            pass

        for msg in messages[remove_start_idx:]:
            msg.remove()

    def action_copy(self) -> None:
        from omnisee_every.backend import set_clipboard_text
        text = "\n".join(self._raw)
        set_clipboard_text(text)
        try:
            btn = self.query_one("#msg-copy-btn", Button)
            btn.add_class("copied")

            def restore():
                btn.remove_class("copied")
            self.set_timer(1.5, restore)
        except Exception:
            pass
