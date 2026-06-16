"""ChatScreen — Textual TUI conversation interface with left-bar message style."""

from __future__ import annotations
import os
import platform
from pathlib import Path
from string import Template
from typing import ClassVar

from textual import on, work
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Horizontal, Vertical, VerticalScroll
from textual.screen import Screen
from textual.widgets import Button, Input, OptionList, Static
from textual.widgets.option_list import Option
from rich.text import Text

from omnisee_every_v1.tui.chat_attachments_ui import (
    AttachmentState,
    build_attachment_bar_markup as _build_attachment_bar_markup,
)
from omnisee_every_v1.tui.chat_utils import (
    estimate_message_tokens as _estimate_message_tokens,
    looks_like_visual_query as _looks_like_visual_query,
)
from omnisee_every_v1.tui.file_dialog import (
    choose_file_dialog as _choose_file_dialog,
)
from omnisee_every_v1.tui.path_utils import (
    attachment_kind as _attachment_kind,
    is_media_path as _is_media_path,
    is_url as _is_url,
    normalize_pasted_media as _normalize_media_input,
)
from omnisee_every_v1.tui.model_meta import (
    model_has_vision as _model_has_vision,
)
from omnisee_every_v1.tui.attachments import (
    file_attachment_preview as _file_attachment_preview,
)
from omnisee_every_v1.tui.slash_commands import get_slash_commands
from omnisee_every_v1.tui.i18n import t
from omnisee_every_v1.tui.widgets import (
    Message,
    ChatMetaBadge,
    TUIInput,
    _top_status_markup,
    _vision_model_label,
    PetMascot,
)
from omnisee_every_v1.tui.skills_catalog import load_skills_and_depths as _load_skills_and_depths
from omnisee_every_v1.tui.video_plan import build_analysis_plan_markup

_, _SKILLS_DEPTH_MAP = _load_skills_and_depths()

_CHAT_MARGIN = 2
_CHAT_PAD = 2
_CHAT_INSET = _CHAT_MARGIN + _CHAT_PAD

_CSS_RULES = [
    "ChatScreen { background: ${bg_base}; width: 100%; height: 100%; }",
    "#chat-top { height: 1; background: ${bg_panel}; padding: 0 ${chat_inset}; dock: top; color: ${text_l3}; }",
    "#chat-title { color: ${text_l1}; text-style: bold; width: auto; height: 1; content-align: left middle; }",
    "#chat-top-spacer { width: 1fr; height: 1; }",
    "#chat-meta { content-align: right middle; color: ${text_l3}; height: 1; width: auto; }",
    "#chat-meta:hover { color: ${accent}; text-style: bold; }",
    "#chat-column { height: 1fr; width: 1fr; margin: 0 ${chat_margin}; }",
    "#chat-scroll { background: ${bg_base}; padding: 1 ${chat_pad} 1 ${chat_pad}; width: 100%; scrollbar-size-vertical: 0; scrollbar-size-horizontal: 0; height: 1fr; }",
    "#chat-scroll Message { width: 100%; }",
    "#chat-footer { width: 100%; height: auto; margin: 0 0 1 0; }",
    "#chat-input-frame { height: auto; width: 100%; background: ${bg_input}; border-left: heavy ${accent}; padding: 1 ${chat_pad}; }",
    "#chat-ctx-row { height: 1; width: 100%; }",
    "#chat-ctx-spacer { width: 1fr; height: 1; }",
    "#chat-ctx-bar { content-align: right middle; color: ${text_l4}; height: 1; width: auto; }",
    "#chat-attachment-bar { height: 1; margin-bottom: 1; color: ${success}; text-style: bold; }",
    "#chat-attachment-bar.hidden { display: none; height: 0; margin-bottom: 0; }",
    "#chat-input-row { height: 1; width: 100%; margin-top: 1; }",
    "#chat-add-btn { width: 3; min-width: 3; height: 1; border: none; background: ${accent}; color: ${bg_panel}; content-align: center middle; margin-right: 1; padding: 0; }",
    "#chat-add-btn:hover { background: ${success}; }",
    "#chat-input {\n    background: transparent; border: none; color: ${text_l2}; height: 1; padding: 0; margin-top: 0; width: 1fr; }",
    "#chat-input:focus { border: none; }",
    "#chat-input > .input--cursor { background: transparent; color: ${text_l4}; text-style: underline; }",
    "#chat-input-meta-row { height: 1; width: 100%; margin-top: 1; }",
    "#chat-input-meta { color: ${text_l3}; height: 1; width: 1fr; }",
    "#chat-mascot { width: 10; min-width: 10; height: 1; color: ${accent}; content-align: right middle; }",
    "#chat-bottom { height: 1; background: ${bg_base}; padding: 0; margin-top: 1; color: ${text_l4}; }",
    "#chat-bottom-text { height: 1; width: auto; content-align: left middle; }",
    "#chat-bottom-spacer { width: 1fr; height: 1; }",
    "#slash-panel { height: auto; width: 62; margin: 0 0 1 1; background: ${bg_panel}; border: none; border-left: solid ${accent}; padding: 0 1; scrollbar-size-vertical: 0; }",
    "#slash-panel > .option-list--option { height: 1; padding: 0 1; }",
    "#slash-panel > .option-list--option-highlighted { background: ${bg_input}; color: ${text_l1}; text-style: bold; }",
    "#slash-panel.hidden { display: none; }"
]

from omnisee_every_v1.tui.theme_runtime import resolve_active_theme
_ACTIVE_THEME = resolve_active_theme()

_CHAT_CSS = Template("\n".join(_CSS_RULES)).safe_substitute(
    **_ACTIVE_THEME,
    chat_margin=_CHAT_MARGIN,
    chat_pad=_CHAT_PAD,
    chat_inset=_CHAT_INSET,
)


class ChatScreen(Screen):
    CSS = _CHAT_CSS
    BINDINGS: ClassVar[list[Binding]] = [
        Binding("ctrl+q", "app.quit", "退出", show=False),
        Binding("super+q", "app.quit", "退出", show=False),
        Binding("cmd+q", "app.quit", "退出", show=False),
        Binding("f10",    "app.quit", "quit", show=False),
        Binding("f1",     "open_setup", "配置模型"),
        Binding("ctrl+k", "open_setup", "配置", show=False),
        Binding("ctrl+s", "open_setup", "配置（备用）", show=False),
        Binding("ctrl+v", "paste_media", "智能粘贴", key_display="⌘+V" if platform.system() == "Darwin" else "ctrl+v"),
        Binding("super+v", "paste_media", "智能粘贴", show=False),
        Binding("cmd+v", "paste_media", "智能粘贴", show=False),
        Binding("escape", "clear_input", "", show=False),
        Binding("ctrl+m", "toggle_mascot", "Mimi", show=False),
        Binding("ctrl+end", "scroll_to_end", "跳到末尾", show=True),
        Binding("ctrl+y", "copy_last_message", "复制最新助手回复", show=True, key_display="⌘+Y" if platform.system() == "Darwin" else "ctrl+y"),
        Binding("super+y", "copy_last_message", "复制最新助手回复", show=False),
        Binding("cmd+y", "copy_last_message", "复制最新助手回复", show=False),
    ]

    def __init__(self, cfg: dict, first: str = "") -> None:
        from omnisee_every_v1.tui.app import _model_context_total
        super().__init__()
        self._cfg = cfg
        self._first = first
        self._skill = "video-note"
        self._ctx_used: int = 0
        self._ctx_total: int = _model_context_total(cfg)
        self._attachments = AttachmentState()
        self._is_submitting = False
        self._running_progress_bar: str | None = None

    @property
    def _pending_attachments(self) -> list[dict[str, str]]: return self._attachments.pending_attachments
    @_pending_attachments.setter
    def _pending_attachments(self, val: list[dict[str, str]]) -> None: self._attachments.pending_attachments = val
    @property
    def _next_image_id(self) -> int: return self._attachments.next_image_id
    @_next_image_id.setter
    def _next_image_id(self, val: int) -> None: self._attachments.next_image_id = val
    @property
    def _next_file_id(self) -> int: return self._attachments.next_file_id
    @_next_file_id.setter
    def _next_file_id(self, val: int) -> None: self._attachments.next_file_id = val
    @property
    def _next_pdf_id(self) -> int: return self._attachments.next_pdf_id
    @_next_pdf_id.setter
    def _next_pdf_id(self, val: int) -> None: self._attachments.next_pdf_id = val

    def compose(self) -> ComposeResult:
        from omnisee_every_v1.tui.app import _ctx_bar_markup, _chat_input_meta_markup
        with Horizontal(id="chat-top"):
            yield Static(f"◈ {t('brand.wordmark')}", id="chat-title")
            yield Static("", id="chat-top-spacer")
            yield ChatMetaBadge(_top_status_markup(self._cfg), id="chat-meta", markup=True)

        with Vertical(id="chat-column"):
            yield VerticalScroll(id="chat-scroll")

            with Vertical(id="chat-footer"):
                yield OptionList(id="slash-panel", classes="hidden")

                with Vertical(id="chat-input-frame"):
                    with Horizontal(id="chat-ctx-row"):
                        yield Button("+", id="chat-add-btn", variant="primary")
                        yield Static("", id="chat-ctx-spacer")
                        yield Static(
                            _ctx_bar_markup(self._ctx_used, self._ctx_total),
                            id="chat-ctx-bar", markup=True,
                        )
                    yield Static("", id="chat-attachment-bar", classes="hidden", markup=True)
                    with Horizontal(id="chat-input-row"):
                        yield TUIInput(placeholder=t("chat.placeholder"), id="chat-input")
                    with Horizontal(id="chat-input-meta-row"):
                        yield Static(
                            _chat_input_meta_markup(self._cfg, self._input_meta()),
                            id="chat-input-meta", markup=True,
                        )
                        yield PetMascot(compact=True, id="chat-mascot")

                with Horizontal(id="chat-bottom"):
                    yield Static(t("chat.meta"), id="chat-bottom-text", markup=True)
                    yield Static("", id="chat-bottom-spacer")

    def _refresh_vlm(self) -> None:
        from omnisee_every_v1.tui.app import _chat_input_meta_markup
        try:
            self.query_one("#chat-input-meta", Static).update(
                _chat_input_meta_markup(self._cfg, self._input_meta(), getattr(self, "_running_progress_bar", None))
            )
        except Exception:
            pass
        try:
            self.query_one("#chat-meta", Static).update(
                _top_status_markup(self._cfg)
            )
        except Exception:
            pass

    def on_mount(self) -> None:
        self.query_one("#chat-input", Input).focus()
        if self._first:
            self._handle(self._first)

    def _input_meta(self) -> str:
        meta = "ready"
        if self._skill and self._skill != "video-note":
            meta = f"skill:{self._skill}"
        return meta

    def _refresh_context_bar(self) -> None:
        from omnisee_every_v1.tui.app import _ctx_bar_markup
        try:
            self.query_one("#chat-ctx-bar", Static).update(
                _ctx_bar_markup(self._ctx_used, self._ctx_total)
            )
        except Exception:
            pass

    def _record_context_text(self, *texts: str) -> None:
        from omnisee_every_v1.tui.app import _model_context_total
        added = sum(_estimate_message_tokens(text) for text in texts)
        if added <= 0:
            return
        if self._ctx_total <= 0:
            self._ctx_total = _model_context_total(self._cfg)
        self._ctx_used += added
        self._refresh_context_bar()

    def _mimi(self) -> PetMascot | None:
        try:
            return self.query_one("#chat-mascot", PetMascot)
        except Exception:
            return None

    @staticmethod
    def _theme_color(name: str) -> str:
        return _ACTIVE_THEME.get(name, _ACTIVE_THEME["accent"])

    def action_toggle_mascot(self) -> None:
        m = self._mimi()
        if m:
            m.display = not m.display

    def action_scroll_to_end(self) -> None:
        try:
            self.query_one("#chat-scroll", VerticalScroll).scroll_end(animate=False)
        except Exception:
            pass

    def action_copy_last_message(self) -> None:
        try:
            scroll = self.query_one("#chat-scroll", VerticalScroll)
            messages = list(scroll.query(Message))
            ai_messages = [m for m in messages if m._kind == "result"]
            if ai_messages:
                ai_messages[-1].action_copy()
        except Exception:
            pass

    @on(Button.Pressed, "#chat-add-btn")
    def _add_btn_pressed(self, e: Button.Pressed) -> None:
        try:
            self._select_file_async()
        except Exception:
            self._handle_paste()

    @work(thread=True)
    def _select_file_async(self) -> None:
        path = _choose_file_dialog()
        if path:
            self.app.call_from_thread(self._process_uploaded_file, path)

    def _attach_image(self, path: str, from_paste: bool) -> None:
        from omnisee_every.backend import describe_image
        placeholder = self._attachments.allocate_image_placeholder() if from_paste else self._add_image_attachment(path, "Analyzing image...")
        def run():
            if from_paste:
                self._add_image_attachment(path, "Analyzing clipboard image...", placeholder)
            self._insert_placeholder_to_input(placeholder)
            self._update_input_meta()
        if from_paste:
            self.app.call_from_thread(run)
        else:
            run()
        def analyze_bg():
            try:
                vlm_ok, desc = describe_image(path, self._cfg)
                desc = desc if vlm_ok else ("Attached clipboard image" if from_paste else "Attached image file")
            except Exception:
                desc = "Attached clipboard image" if from_paste else "Attached image file"
            self.app.call_from_thread(lambda: (self._attachments.update_description(placeholder, desc), self._update_attachment_bar()))
        self.run_worker(analyze_bg, thread=True)

    def _attach_media(self, path: str, from_paste: bool) -> None:
        msg1 = f"[bold {_ACTIVE_THEME['success']}]✓ 成功选择{'剪贴板' if from_paste else ''}媒体源！[/]\n[dim]路径: {path}[/]"
        if from_paste:
            self.app.call_from_thread(self._mount_msg, "step", msg1)
            self.app.call_from_thread(self._mount_analysis_plan, path)
            self.app.call_from_thread(self._pipeline, path)
        else:
            self._mount_msg("step", msg1)
            self._mount_analysis_plan(path)
            self._pipeline(path)

    def _attach_generic(self, path: str, kind: str, from_paste: bool) -> None:
        label = "PDF" if kind == "pdf" else "文件"
        def add_file():
            p = self._add_file_attachment(path, f"Attached {kind} file")
            self._insert_placeholder_to_input(p)
            self._update_input_meta()
            self._mount_msg("step" if from_paste else "info", f"[bold {_ACTIVE_THEME['success'] if from_paste else _ACTIVE_THEME['accent']}]✓ 已添加{label}附件[/]\n[dim]{Path(path).name} → {p}[/]")
        if from_paste:
            self.app.call_from_thread(add_file)
        else:
            add_file()

    def _add_attachment_by_path(self, path: str, from_paste: bool = False) -> None:
        if not path or not os.path.exists(path):
            return
        kind = _attachment_kind(path)
        if kind == "image":
            self._attach_image(path, from_paste)
        elif kind in ("media", "directory"):
            self._attach_media(path, from_paste)
        else:
            self._attach_generic(path, kind, from_paste)

    def _process_uploaded_file(self, path: str) -> None:
        self._add_attachment_by_path(path, from_paste=False)

    @on(Input.Submitted, "#chat-input")
    def _submitted(self, e: Input.Submitted) -> None:
        text = e.value.strip()
        if not text:
            return
        self._is_submitting = True
        try:
            self.query_one("#chat-input", Input).clear()
            self._hide_slash_panel()
            self._handle(text)
        finally:
            self._is_submitting = False

    @on(Input.Changed, "#chat-input")
    def _input_changed(self, e: Input.Changed) -> None:
        value = e.value.strip()
        if value.startswith("/"):
            self._show_slash_panel(value)
        else:
            self._hide_slash_panel()
        if not getattr(self, "_is_submitting", False) and self._attachments.prune(e.value):
            self._update_input_meta()

    @on(OptionList.OptionSelected, "#slash-panel")
    def _slash_selected(self, e: OptionList.OptionSelected) -> None:
        command = e.option.id or ""
        inp = self.query_one("#chat-input", Input)
        inp.value = f"{command} " if command in ("/skill", "/p", "/paste") else command
        inp.focus()
        if command not in ("/skill", "/p", "/paste"):
            self._hide_slash_panel()

    def _check_mcp_vlm_fallback(self, text: str) -> bool:
        has_images = self._attachments.has_images
        self._auto_attach_clipboard_image_for_visual_query(text)
        if not has_images:
            has_images = self._attachments.has_images
        llm_cfg = self._cfg.get("llm") or {}
        has_vision = llm_cfg.get("has_vision", False) or _model_has_vision(llm_cfg.get("model_name") or "")
        if has_images and not has_vision and not self._attachments.has_non_image_attachments:
            image_path = self._attachments.first_image_path
            if image_path:
                self._attachments.reset()
                self._update_input_meta()
                self._query_mcp_vlm_directly(text, image_path)
                return True
        return False

    def _handle(self, text: str) -> None:
        if text.startswith("/"):
            self._handle_slash(text)
            return
        scroll = self.query_one("#chat-scroll", VerticalScroll)
        scroll.mount(Message("user", text))
        self.call_after_refresh(scroll.scroll_end, animate=False)

        if self._check_mcp_vlm_fallback(text):
            self.call_after_refresh(scroll.scroll_end, animate=False)
            return

        attached_contexts = self._consume_attachment_contexts()
        q_combined = "\n\n".join(attached_contexts + [f"User Question: {text}"]) if attached_contexts else text
        if attached_contexts:
            self._update_input_meta()

        self._record_context_text(q_combined)
        self._route_handle(text, q_combined)
        self.call_after_refresh(scroll.scroll_end, animate=False)

    def _route_handle(self, text: str, q_combined: str) -> None:
        if _is_url(q_combined):
            self._mount_analysis_plan(q_combined)
            self._pipeline(q_combined)
        elif _is_media_path(q_combined):
            normalized = _normalize_media_input(q_combined)
            self._mount_msg("step", f"[dim]📁 检测到本地媒体文件 → 开始分析[/]\n[#888888]{normalized}[/]")
            self._mount_analysis_plan(normalized)
            self._pipeline(normalized)
        else:
            self._search(q_combined, search_query=text)

    @work(thread=True)
    def _query_mcp_vlm_directly(self, question: str, image_path: str) -> None:
        try:
            from omnisee_every.backend import describe_image
            vlm_label = _vision_model_label(self._cfg)
            progress = self.app.call_from_thread(self._mount_msg, "step", f"[dim]MCP 视觉模型 ({vlm_label}) 正在看图思考中…[/]")
            cfg_copy = dict(self._cfg)
            cfg_copy["vlm_prompt"] = question
            ok, reply = describe_image(image_path, cfg_copy)
            self.app.call_from_thread(progress.remove)
            if ok:
                self.app.call_from_thread(self._mount_msg, "result", reply)
                self.app.call_from_thread(self._record_context_text, reply)
            else:
                self.app.call_from_thread(self._mount_msg, "error", f"[bold]MCP 视觉分析失败[/]\n[dim]{reply}[/]")
        except Exception as e:
            self.app.call_from_thread(self._mount_msg, "error", f"[bold]MCP 视觉分析出错[/]\n[dim]{e}[/]")

    def _auto_attach_clipboard_image_for_visual_query(self, text: str) -> None:
        if self._attachments.pending_attachments or getattr(self, "_attached_image_context", None):
            return
        if not _looks_like_visual_query(text):
            return
        try:
            from omnisee_every.backend import describe_image, get_clipboard_media
            m_type, m_path = get_clipboard_media()
            if m_type in {"image_data", "file", "text_path"} and m_path and Path(m_path).suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tif", ".tiff", ".heic"}:
                ok, desc = describe_image(m_path, self._cfg)
                self._add_image_attachment(m_path, desc if ok else "Attached clipboard image")
                self._update_input_meta()
        except Exception:
            pass

    def _show_slash_panel(self, value: str) -> None:
        panel = self.query_one("#slash-panel", OptionList)
        query = value[1:].strip().lower()
        panel.clear_options()
        matches = [(name, desc) for command, desc in get_slash_commands() for name in [command.split()[0]] if not query or query in name[1:]]
        if not matches:
            self._hide_slash_panel()
            return
        for name, desc in matches:
            t_obj = Text()
            t_obj.append("  ")
            t_obj.append(name.ljust(8), style=f"bold {_ACTIVE_THEME['accent']}")
            t_obj.append(desc, style=_ACTIVE_THEME["text_l3"])
            panel.add_option(Option(t_obj, id=name))
        panel.remove_class("hidden")

    def _hide_slash_panel(self) -> None:
        try:
            self.query_one("#slash-panel", OptionList).add_class("hidden")
        except Exception:
            pass

    def _handle_slash(self, text: str) -> None:
        from omnisee_every_v1.tui.chat_commands import execute_chat_command
        execute_chat_command(self, text)

    @work(thread=True)
    def _handle_paste(self) -> None:
        from omnisee_every.backend import get_clipboard_media
        m_type, m_path = get_clipboard_media()
        if not m_type or not m_path:
            try:
                import subprocess
                text_proc = subprocess.run(["pbpaste"], capture_output=True, text=True, timeout=2.0)
                text = text_proc.stdout.strip()
                if _is_url(text): m_type, m_path = "url", text
            except Exception:
                pass
        if not m_type or not m_path:
            self.app.call_from_thread(self._mount_msg, "error", "[bold][错误] 剪贴板中未检测到有效的文件、图片或视频链接！[/]\n[dim]提示：请先复制 Bilibili/YouTube 链接，或者在 Finder 中复制音视频文件，或截图到剪贴板。[/]")
            return
        if m_type == "url":
            self.app.call_from_thread(self._mount_msg, "step", f"[bold {_ACTIVE_THEME['success']}]✓ 成功获取剪贴板媒体！[/]\n[dim]类型: url · 内容: {m_path}[/]")
            self.app.call_from_thread(self._mount_analysis_plan, m_path)
            self.app.call_from_thread(self._pipeline, m_path)
        else:
            self._add_attachment_by_path(m_path, from_paste=True)

    def _update_input_meta(self) -> None:
        from omnisee_every_v1.tui.app import _chat_input_meta_markup
        try:
            self.query_one("#chat-input-meta", Static).update(
                _chat_input_meta_markup(self._cfg, self._input_meta(), getattr(self, "_running_progress_bar", None))
            )
        except Exception:
            pass
        self._update_attachment_bar()

    def _update_attachment_bar(self) -> None:
        try:
            bar = self.query_one("#chat-attachment-bar", Static)
            markup, visible = _build_attachment_bar_markup(self._attachments.pending_attachments, success_style=self._theme_color("success"))
            if visible:
                bar.update(markup)
                bar.remove_class("hidden")
            else:
                bar.update("")
                bar.add_class("hidden")
        except Exception:
            pass

    def _insert_placeholder_to_input(self, placeholder: str) -> None:
        try:
            inp = self.query_one("#chat-input", Input)
            inp.value = f"{inp.value.strip()} {placeholder}".strip()
            inp.focus()
            inp.cursor_position = len(inp.value)
        except Exception:
            pass

    def _add_image_attachment(self, image_path: str, description: str, placeholder: str = "") -> str:
        res = self._attachments.add_image(image_path, description, placeholder)
        if hasattr(self, "_attached_image_context"):
            self._attached_image_context = None
        return res

    def _add_file_attachment(self, file_path: str, description: str = "", placeholder: str = "") -> str:
        return self._attachments.add_file(file_path, _attachment_kind(file_path), description, placeholder)

    def _file_attachment_preview(self, file_path: str, *, limit: int = 8000) -> str:
        return _file_attachment_preview(file_path, limit=limit)

    def _consume_attachment_contexts(self) -> list[str]:
        legacy = getattr(self, "_attached_image_context", None)
        contexts = self._attachments.consume_contexts(legacy_image_context=str(legacy) if legacy else None)
        self._attached_image_context = None
        return contexts

    def _mount_msg(self, kind: str, initial: str = "") -> Message:
        from omnisee_every_v1.tui.app import _provider_for_cfg
        provider_name = None
        if kind == "result":
            provider = _provider_for_cfg(self._cfg)
            if provider:
                provider_name = provider.get("name")
            if not provider_name:
                llm = self._cfg.get("llm") or {}
                provider_name = llm.get("provider") or llm.get("provider_id") or "assistant"
        msg = Message(kind, initial, provider_name=provider_name)
        scroll = self.query_one("#chat-scroll", VerticalScroll)
        scroll.mount(msg)
        self.call_after_refresh(scroll.scroll_end, animate=False)
        return msg

    def _mount_analysis_plan(self, source: str) -> Message:
        return self._mount_msg(
            "plan",
            build_analysis_plan_markup(
                source,
                skill=self._skill,
                depth=self._depth_for_skill(),
                theme=_ACTIVE_THEME,
            ),
        )

    def _mimi_set(self, state: str, ticks: int = 0) -> None:
        m = self._mimi()
        if m:
            m.set_state(state, ticks)

    @work(thread=True)
    def _pipeline(self, url: str) -> None:
        from omnisee_every_v1.tui.app import _block_progress_bar
        self.app.call_from_thread(self._mimi_set, "work")
        progress = self.app.call_from_thread(self._mount_msg, "step", "[dim]准备开始分析…[/]")
        progress_lines: dict[str, str] = {}
        completed_steps = set()

        def cb(step: str, msg: str) -> None:
            is_done = "完成" in msg or "done" in msg.lower()
            is_skip = "跳过" in msg or "skip" in msg.lower()
            if is_done or is_skip: completed_steps.add(step)
            icon, c = ("✓", _ACTIVE_THEME["success"]) if is_done else (("⏭", "#555555") if is_skip else ("·", "#888888"))
            progress_lines[step] = f"[{c}]{icon}[/] [dim]{step}[/]  {msg}"
            pbar = _block_progress_bar(len(completed_steps), 7, width=16)
            lines = [progress_lines.get(s, "[dim]· 等待中…[/]") for s in ["probe", "acquire_subtitle", "transcribe", "extract_frames", "analyze_frames", "build_index", "execute_skill"]]
            self.app.call_from_thread(progress.set_text, f"[bold {_ACTIVE_THEME['accent']}]正在采集分析视频…[/]\n{pbar}\n\n" + "\n".join(lines))

        try:
            from omnisee_every.backend import analyze_source
            result = analyze_source(url, skill=self._skill, depth=self._depth_for_skill(), progress_cb=cb)
            self._handle_pipeline_result(result)
        except Exception as exc:
            self.app.call_from_thread(self._mimi_set, "error", 5)
            self.app.call_from_thread(self._mount_msg, "error", f"[bold {_ACTIVE_THEME['error']}]✗ 错误[/]\n{exc}")
        finally:
            self._running_progress_bar = None
            self.app.call_from_thread(self._refresh_vlm)

    def _handle_pipeline_result(self, result: any) -> None:
        if result.status == "done":
            self.app.call_from_thread(self._mimi_set, "done", 5)
            out = Path(result.output_path or "")
            preview = "\n".join(out.read_text(encoding="utf-8").splitlines()[:20]) if out.is_file() else ""
            self.app.call_from_thread(self._mount_msg, "result", f"[bold {_ACTIVE_THEME['success']}]✓ 完成[/]\n[dim]{out}[/]\n[dim]─────────────────────────[/]\n{preview}")
        else:
            self.app.call_from_thread(self._mimi_set, "error", 5)
            self.app.call_from_thread(self._mount_msg, "error", f"[bold {_ACTIVE_THEME['error']}]✗ 失败[/]\n{'; '.join(result.errors) or '未知错误'}")

    def _depth_for_skill(self) -> str:
        return _SKILLS_DEPTH_MAP.get(self._skill, "text_only")

    @work(thread=True)
    def _search(self, query: str, search_query: str | None = None) -> None:
        try:
            from omnisee_every.backend import search_corpus
            results = search_corpus(search_query or query, self._cfg, top_k=5)
            api_key = (self._cfg.get("llm") or {}).get("api_key", "").strip()
            if not api_key:
                body = f"[bold]找到 {len(results)} 条匹配[/]\n" + "\n".join(f"[#ff6b35][{int(r.get('start_time') or 0)//60:02d}:{int(r.get('start_time') or 0)%60:02d}][/]  {r['text'][:140]}" for r in results) if results else t("chat.search.none_explain")
                self.app.call_from_thread(self._mount_msg, "result", body)
                return
            self._search_with_ai(query, results)
        except Exception as exc:
            self.app.call_from_thread(self._mount_msg, "error", f"[bold]搜索失败[/]\n{exc}")

    def _search_with_ai(self, query: str, results: list) -> None:
        from omnisee_every.backend import answer_question
        progress = self.app.call_from_thread(self._mount_msg, "step", "[dim]AI 正在思考中…[/]")
        try:
            reply = answer_question(query, self._cfg, results=results)
            self.app.call_from_thread(progress.remove)
            self.app.call_from_thread(self._record_context_text, reply)
            if results:
                lines = [f"[#ff6b35][{int(r.get('start_time') or 0)//60:02d}:{int(r.get('start_time') or 0)%60:02d}][/]  {r['text'][:100]}..." for r in results]
                reply = f"[bold {_ACTIVE_THEME['success']}]✓ 检索到 {len(results)} 条本地相关片段：[/]\n" + "\n".join(lines) + "\n\n[dim]─────────────────────────[/]\n\n" + reply
            self.app.call_from_thread(self._mount_msg, "result", reply)
        except Exception as exc:
            self.app.call_from_thread(progress.remove)
            if results:
                lines = [f"[#ff6b35][{int(r.get('start_time') or 0)//60:02d}:{int(r.get('start_time') or 0)%60:02d}][/]  {r['text'][:140]}" for r in results]
                self.app.call_from_thread(self._mount_msg, "result", f"[bold {_ACTIVE_THEME['error']}]找到 {len(results)} 条匹配 (AI 回复出错: {exc})[/]\n" + "\n".join(lines))
            else:
                self.app.call_from_thread(self._mount_msg, "error", f"[bold {_ACTIVE_THEME['error']}]AI 回复失败[/]\n[dim]{exc}[/]\n\n{t('chat.search.none_explain')}")

    @work(thread=True)
    def _list_tasks(self) -> None:
        try:
            from omnisee_every.backend import list_recent_tasks
            tasks = list_recent_tasks(self._cfg, limit=10)
            if not tasks:
                self.app.call_from_thread(self._mount_msg, "step", "[dim]暂无已处理视频。[/]")
                return
            lines = ["[bold]最近处理视频[/]"]
            for task in tasks:
                lines.append(f"[#ff6b35]#{task['id']}[/] {task['state']} · {task['skill']} · [dim]{task.get('output_path') or '无输出文件'}[/]")
            self.app.call_from_thread(self._mount_msg, "result", "\n".join(lines))
        except Exception as exc:
            self.app.call_from_thread(self._mount_msg, "error", f"[bold]列表读取失败[/]\n{exc}")

    def action_clear_input(self) -> None:
        self.query_one("#chat-input", Input).clear()

    def action_paste_media(self) -> None:
        self._handle_paste()

    def action_open_setup(self) -> None:
        def _after(saved: bool) -> None:
            if saved:
                from omnisee_every_v1.tui.app import _get_config, _model_context_total
                self._cfg = _get_config()
                self._ctx_total = _model_context_total(self._cfg)
                self._refresh_context_bar()
                self.query_one("#chat-meta", Static).update(_top_status_markup(self._cfg))
                self._update_input_meta()
        from omnisee_every_v1.tui.app import SetupModal
        self.app.push_screen(SetupModal(cfg=self._cfg), _after)
