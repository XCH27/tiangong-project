"""SetupModal — 3-step setup wizard screen (provider → key → model)."""

from __future__ import annotations
import os
import platform
import webbrowser
from typing import ClassVar
from string import Template

from textual import events, on, work
from textual.app import ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal, Vertical
from textual.screen import ModalScreen
from textual.widgets import Button, Input, Label, OptionList, Static
from textual.widgets.option_list import Option
from rich.text import Text

from omnisee_every_v1.tui.theme_runtime import resolve_active_theme
from omnisee_every_v1.tui.i18n import t, get_lang, localized_provider_tagline
from omnisee_every_v1.tui.setup_state import resolve_setup_state
from omnisee_every_v1.tui.model_meta import model_has_vision as _model_has_vision
from omnisee_every_v1.tui.widgets import VisionToggle

_CSS_RULES = [
    "SetupModal { align: center middle; background: rgba(0, 0, 0, 0.68); } #mbox { width: 68; height: 25; background: ${bg_elev}; border: solid ${border_subtle}; padding: 1 2; }",
    "#title-row {\n    height: 1; margin-bottom: 2; } #crumb { color: ${text_l4}; height: 1; width: auto; margin-right: 2; } #title { color: ${text_l1}; text-style: bold; height: 1; width: 1fr; } #title-esc { background: transparent; color: ${text_l4}; border: none; height: 1; min-width: 5; padding: 0; margin: 0; margin-left: 2; } #title-esc:hover { color: ${error}; text-style: bold; } #btn-lang { background: transparent; color: ${accent}; border: none; height: 1; min-width: 10; margin: 0; padding: 0; } #btn-lang:hover { color: ${text_l1}; } #reason { color: ${accent}; height: auto; margin-bottom: 1; } #content { height: 1fr; scrollbar-color: ${accent}; scrollbar-background: ${bg_panel}; scrollbar-size-vertical: 1; } #key-row { height: auto; width: 100%; } #key-row Input { width: 1fr; } #btn-eye { min-width: 8; margin-left: 1; height: 3; background: ${bg_input}; color: ${text_l2}; border: none; } #btn-eye:hover { background: ${bg_panel}; color: ${text_l1}; } OptionList { background: ${bg_input}; border: none; padding: 0 1; height: 1fr; scrollbar-color: ${accent}; scrollbar-background: ${bg_panel}; scrollbar-size-vertical: 1; } OptionList:focus { border: none; } OptionList > .option-list--option { padding: 0 1; } OptionList > .option-list--option-hover { background: ${bg_panel}; } OptionList > .option-list--option-highlighted { background: ${accent} 25%; text-style: bold; } #search-row { height: 3; width: 100%; margin-top: 1; margin-bottom: 1; } #search-row Input { width: 1fr; margin: 0; } #model-search-in { background: ${bg_input}; border: solid ${border_subtle}; color: ${text_l2}; height: 3; } #model-search-in:focus { border: solid ${accent}; } #btn-fetch-models { min-width: 10; margin-left: 1; height: 3; background: ${bg_input}; color: ${text_l2}; border: none; } #btn-fetch-models:hover { background: ${bg_panel}; color: ${text_l1}; } #key-info { color: ${text_l3}; height: auto; margin-bottom: 1; } #link-btn { background: ${bg_input}; color: ${text_l2}; border: none; height: 1; width: auto; margin-bottom: 1; padding: 0 2; } #link-btn:hover { background: ${bg_panel}; color: ${accent}; } .field { color: ${text_l3}; margin-top: 1; } .field-hint { color: ${text_l4}; } #key-in, #url-in { background: ${bg_input}; border: solid ${border_subtle}; color: ${text_l2}; height: 3; } #key-in:focus, #url-in:focus { border: solid ${accent}; } #opt-provider { height: 1fr; margin-bottom: 1; }",
    "#opt-model {\n    height: 1fr; margin-bottom: 1; background: ${bg_input}; border-left: solid ${border_subtle}; } #model-in { background: ${bg_input}; border: solid ${border_subtle}; color: ${text_l2}; height: 3; } #model-in:focus { border: solid ${accent}; } #proto-row { height: 1; width: 100%; margin-bottom: 1; } #btn-proto-openai, #btn-proto-anthropic { width: 1fr; height: 1; background: ${bg_input}; color: ${text_l3}; border: none; padding: 0 1; } #btn-proto-openai { margin-right: 1; } #btn-proto-openai.active, #btn-proto-anthropic.active { background: ${accent}; color: ${bg_base}; text-style: bold; } #btn-proto-openai:hover, #btn-proto-anthropic:hover { background: ${bg_panel}; color: ${text_l1}; } #protocol-hint { color: ${text_l4}; height: auto; margin-bottom: 1; } #err { color: ${error}; height: 1; } #step-buttons { margin-top: 1; height: 1; align: center middle; } #btn-back, #btn-next { min-width: 10; height: 1; background: ${bg_input}; color: ${text_l2}; border: none; padding: 0 1; } #btn-next { background: ${accent}; color: ${bg_base}; text-style: bold; } #btn-back:hover { background: ${bg_panel}; color: ${text_l1}; } #btn-next:hover { background: ${text_l1}; color: ${bg_base}; } #btn-spacer { width: 1fr; } #vision-toggle { margin-top: 1; height: 1; color: ${text_l2}; } #vision-toggle:hover { color: ${accent}; text-style: bold; }",
]

_ACTIVE_THEME = resolve_active_theme()
_MODAL_CSS = Template("\n".join(_CSS_RULES)).safe_substitute(**_ACTIVE_THEME)


class SetupModal(ModalScreen[bool]):
    """3-step setup wizard: provider → key → model."""

    CSS = _MODAL_CSS
    BINDINGS: ClassVar[list[Binding]] = [
        Binding("escape", "back", "返回", show=False),
        Binding("ctrl+q", "app.quit", "退出", show=False),
        Binding("super+q", "app.quit", "退出", show=False),
        Binding("cmd+q", "app.quit", "退出", show=False),
    ]

    def __init__(self, reason: str = "", cfg: dict | None = None) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS
        super().__init__()
        self._cfg = cfg or {}
        self.state = resolve_setup_state(self._cfg, PROVIDERS, reason)

    def _clear_content(self, container) -> None:
        for child in list(container.children):
            child.remove()
            try: container._nodes._remove(child)
            except Exception: pass

    def compose(self) -> ComposeResult:
        with Vertical(id="mbox"):
            with Horizontal(id="title-row"):
                yield Static(t("setup.crumb.step1"), id="crumb")
                yield Static(t("setup.title"), id="title")
                yield Label("中 / EN", id="btn-lang")
                yield Button("esc", id="title-esc")
            yield Static(self.state.reason, id="reason")
            yield Vertical(id="content")
            with Horizontal(id="step-buttons"):
                yield Button(t("btn.back"), id="btn-back", variant="default")
                yield Static("", id="btn-spacer")
                yield Button(t("btn.next"), id="btn-next", variant="primary")

    def on_mount(self) -> None:
        self._render_step()

    def _render_step_provider(self, content: Container, crumb: Static, title: Static, step_buttons: Horizontal) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS, _PROVIDER_ORDER
        step_buttons.styles.display = "none"
        crumb.update(t("setup.crumb.step1"))
        title.update("◈  " + t("setup.step1.title"))
        options = []
        for pid in _PROVIDER_ORDER:
            p = PROVIDERS[pid]
            t_text = Text().append(p["name"], style=f"bold {_ACTIVE_THEME['text_l2']}").append("\n   ").append(localized_provider_tagline(pid, p.get("tagline", "")), style=_ACTIVE_THEME["text_l4"])
            options.append(Option(t_text, id=pid))
        ol = OptionList(*options, id="opt-provider")
        content.mount(ol)
        ol.focus()
        h_idx = _PROVIDER_ORDER.index(self.state.pid) if self.state.pid in _PROVIDER_ORDER else 0
        ol.highlighted = h_idx

    def _render_protocol_row(self, box: Container) -> None:
        box.mount(Label(t("setup.protocol_lbl"), classes="field"))
        if not getattr(self.state, "protocol", None):
            llm_cfg = self._cfg.get("llm") or {}
            self.state.protocol = llm_cfg.get("protocol", "openai") if isinstance(llm_cfg, dict) else "openai"
        proto_row = Horizontal(id="proto-row")
        box.mount(proto_row)
        openai_btn = Button(t("setup.protocol.openai"), id="btn-proto-openai")
        anthropic_btn = Button(t("setup.protocol.anthropic"), id="btn-proto-anthropic")
        if self.state.protocol == "anthropic": anthropic_btn.add_class("active")
        else: openai_btn.add_class("active")
        proto_row.mount(openai_btn)
        proto_row.mount(anthropic_btn)
        hint_key = "setup.protocol.anthropic_hint" if self.state.protocol == "anthropic" else "setup.protocol.openai_hint"
        box.mount(Static(t(hint_key), id="protocol-hint"))

    def _render_url_row(self, box: Container, p: dict, is_custom: bool) -> None:
        if is_custom and self.state.protocol == "anthropic" and not self.state.url:
            self.state.url = "https://api.anthropic.com"
        box.mount(Label(t("setup.url.label"), classes="field"))
        url_in = Input(value=self.state.url or p["url"], id="url-in", disabled=False)
        box.mount(url_in)

    def _render_key_row(self, box: Container, p: dict) -> None:
        box.mount(Label(t("setup.key.label"), classes="field"))
        key_row = Horizontal(id="key-row")
        box.mount(key_row)
        ki = Input(
            placeholder="sk-..." if p["need_key"] else t("setup.key.nokey"),
            password=True if p["need_key"] else False,
            value=self.state.key or ("ollama" if not p["need_key"] else ""),
            id="key-in",
        )
        key_row.mount(ki)
        if p["need_key"]: key_row.mount(Button("显示", id="btn-eye", variant="default"))
        box.mount(Static("", id="err"))

    def _render_protocol_and_fields(self, box: Container, p: dict) -> None:
        if p.get("supports_protocols"):
            self._render_protocol_row(box)
        is_custom = self.state.pid == "custom"
        self._render_url_row(box, p, is_custom)
        self._render_key_row(box, p)
        url_in = box.query_one("#url-in", Input)
        ki = box.query_one("#key-in", Input)
        url_in.focus() if is_custom else ki.focus()

    def _render_step_key(self, content: Container, crumb: Static, title: Static, step_buttons: Horizontal, btn_back: Button, btn_next: Button) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS
        step_buttons.styles.display = "block"
        btn_back.label, btn_next.label, btn_next.variant = t("btn.back"), t("btn.next"), "primary"
        p = PROVIDERS[self.state.pid]
        crumb.update(t("setup.crumb.step2", name=p['name']))
        title.update("◈  " + t("setup.step2.title"))
        box = Vertical()
        content.mount(box)
        key_info = t("setup.custom.description") if self.state.pid == "custom" else localized_provider_tagline(self.state.pid, p.get("tagline", ""))
        if key_info.strip(): box.mount(Static(key_info, id="key-info"))
        if p["key_url"]: box.mount(Button(t("setup.key.key_url", url=p['key_url']), id="link-btn"))
        self._render_protocol_and_fields(box, p)

    def _render_step_model(self, content: Container, crumb: Static, title: Static, step_buttons: Horizontal, btn_back: Button, btn_next: Button) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS
        step_buttons.styles.display = "block"
        btn_back.label, btn_next.label, btn_next.variant = t("btn.back"), t("btn.save"), "primary"
        p = PROVIDERS[self.state.pid]
        crumb.update(t("setup.crumb.step3", name=p['name']))
        title.update("◈  " + t("setup.step3.title"))

        if p.get("fetch_strategy", "openai") == "manual":
            content.mount(Static(p.get("manual_hint", "请手填模型名"), classes="field"))
            mi = Input(placeholder=p.get("manual_hint", "模型名"), value=self.state.model or "", id="model-in")
            content.mount(mi)
            mi.focus()
            return

        if not self.state._fetch_attempted:
            self._render_fetching_state(content)
            self.state._fetch_attempted = True
            self._fetch_models()
            return
        self._render_model_list(content)

    def _render_step(self) -> None:
        content, crumb, title, reason = self.query_one("#content", Vertical), self.query_one("#crumb", Static), self.query_one("#title", Static), self.query_one("#reason", Static)
        if self.state.step == "provider":
            reason.update(f"[#ff6b35]{self.state.reason}[/]" if self.state.reason else "")
            reason.styles.display = "block"
        else:
            reason.update("")
            reason.styles.display = "none"

        btn_back, btn_next, step_buttons = self.query_one("#btn-back", Button), self.query_one("#btn-next", Button), self.query_one("#step-buttons", Horizontal)
        self._clear_content(content)

        if self.state.step == "provider":
            self._render_step_provider(content, crumb, title, step_buttons)
        elif self.state.step == "key":
            self._render_step_key(content, crumb, title, step_buttons, btn_back, btn_next)
        elif self.state.step == "model":
            self._render_step_model(content, crumb, title, step_buttons, btn_back, btn_next)

    def _render_fetching_state(self, content: Container) -> None:
        host = self.state.url.split("://")[-1].split("/")[0] or "服务器"
        if get_lang() == "en":
            line1, line2 = f"[dim]⏳ Fetching live model list from [#ff6b35]{host}[/]…[/]", "[#888888](press esc to skip · only models your account can actually use)[/]"
        else:
            line1, line2 = f"[dim]⏳ 正在从 [#ff6b35]{host}[/] 获取实时可用模型…[/]", "[#888888]（按 esc 跳过 · 该列表反映你账号实际可用的模型）[/]"
        content.mount(Static(line1, markup=True, classes="fetch-line"))
        content.mount(Static(line2, markup=True, classes="fetch-line"))

    def _make_model_option_text(self, mid: str, tag: str, desc: str) -> Text:
        from omnisee_every_v1.tui.app import PROVIDERS, _localize_model_tag, _compact_model_desc
        t_text = Text().append(f"{_localize_model_tag(tag):<6}", style=f"bold {_ACTIVE_THEME['accent']}").append("  ").append(mid, style=f"bold {_ACTIVE_THEME['text_l2']}")
        compact = _compact_model_desc(mid, tag, desc, PROVIDERS.get(self.state.pid))
        if compact: t_text.append("  ·  ").append(compact[:20] + ".." if len(compact) > 22 else compact, style=_ACTIVE_THEME["text_l4"])
        return t_text

    def _build_filtered_model_options(self, filtered: list) -> tuple[OptionList, int]:
        options, h_idx, found = [], 0, False
        for idx, (mid, tag, desc) in enumerate(filtered):
            options.append(Option(self._make_model_option_text(mid, tag, desc), id=mid))
            if self.state.model and mid == self.state.model:
                h_idx, found = idx, True
        if not found and filtered:
            self.state.model = filtered[0][0]
            h_idx = 0
        if not filtered:
            options.append(Option(Text("   无匹配的模型 / No matching models", style=_ACTIVE_THEME["error"]), id="__none__"))
        return OptionList(*options, id="opt-model"), h_idx

    def _render_model_list(self, content: Container) -> None:
        self._clear_content(content)
        search_row = Horizontal(id="search-row")
        content.mount(search_row)
        search_in = Input(placeholder="🔍 搜索模型 / Search...", id="model-search-in", value=self.state._model_search_query or "")
        search_row.mount(search_in)
        search_row.mount(Button(t("setup.model.fetch_btn"), id="btn-fetch-models"))

        if not self.state.model_options:
            content.mount(OptionList(Option(t("setup.model.none"), id="__none__"), id="opt-model"))
            content.mount(Label(t("setup.model.custom_lbl"), classes="field"))
            mi = Input(placeholder=t("setup.model.custom_placeholder"), value=self.state.model or "", id="model-in")
            content.mount(mi)
            content.mount(VisionToggle(self.state.has_vision))
            search_in.focus()
            return

        q = (self.state._model_search_query or "").strip().lower()
        filtered = [(m, tg, d) for m, tg, d in self.state.model_options if not q or q in m.lower() or q in tg.lower() or q in d.lower()]
        ol, h_idx = self._build_filtered_model_options(filtered)
        content.mount(ol)
        content.mount(VisionToggle(self.state.has_vision))
        search_in.focus()
        ol.highlighted = h_idx

    def on_key(self, event: events.Key) -> None:
        if self.state.step == "model":
            try:
                ol = self.query_one("#opt-model", OptionList)
                if event.key == "down" and ol.highlighted is not None and ol.highlighted < ol.option_count - 1:
                    ol.highlighted += 1
                    event.prevent_default()
                elif event.key == "up" and ol.highlighted is not None and ol.highlighted > 0:
                    ol.highlighted -= 1
                    event.prevent_default()
            except Exception:
                pass

    def _filter_match(self, m: str, tg: str, d: str, q_l: str) -> bool:
        if not q_l:
            return True
        return q_l in m.lower() or q_l in tg.lower() or q_l in d.lower()

    def _update_model_list_options(self, query: str) -> None:
        try:
            ol = self.query_one("#opt-model", OptionList)
        except Exception:
            return
        ol.clear_options()
        q_l = query.strip().lower()
        filtered = [(m, tg, d) for m, tg, d in self.state.model_options if self._filter_match(m, tg, d, q_l)]

        h_idx, found = 0, False
        for idx, (mid, tag, desc) in enumerate(filtered):
            ol.add_option(Option(self._make_model_option_text(mid, tag, desc), id=mid))
            if self.state.model and mid == self.state.model:
                h_idx, found = idx, True

        if not filtered:
            ol.add_option(Option(Text("✗ 无匹配的模型 / No matching models", style=_ACTIVE_THEME["error"]), id="__none__"))
            ol.highlighted = None
        else:
            if not found:
                h_idx = 0
                self.state.model = filtered[0][0]
            ol.highlighted = h_idx

    @on(Input.Changed, "#model-search-in")
    def _model_search_changed(self, e: Input.Changed) -> None:
        self.state._model_search_query = e.value.strip()
        self._update_model_list_options(self.state._model_search_query)

    @on(Input.Submitted, "#model-search-in")
    def _model_search_submitted(self, e: Input.Submitted) -> None:
        val = e.value.strip()
        if not val:
            return
        try:
            ol = self.query_one("#opt-model", OptionList)
            if ol.highlighted is not None and ol.highlighted >= 0:
                opt = ol.get_option_at_index(ol.highlighted)
                if opt.id and opt.id != "__none__":
                    self.state.model = opt.id
                    self._save_and_close()
                    return
        except Exception:
            pass
        self.state.model = val
        self._save_and_close()

    @on(Button.Pressed, "#btn-fetch-models")
    def _fetch_btn_pressed(self) -> None:
        self._render_fetching_state(self.query_one("#content", Vertical))
        self._fetch_models()

    @on(Button.Pressed, "#title-esc")
    def _esc_pressed(self) -> None:
        self.action_back()

    @on(OptionList.OptionSelected, "#opt-provider")
    def _provider_chosen(self, e: OptionList.OptionSelected) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS
        self.state.select_provider(e.option.id or "deepseek", PROVIDERS, self._cfg)
        self._render_step()

    @on(Input.Submitted, "#key-in")
    @on(Input.Submitted, "#url-in")
    def _key_submitted(self, e: Input.Submitted) -> None:
        self._advance_from_key()

    @on(OptionList.OptionSelected, "#opt-model")
    def _model_chosen(self, e: OptionList.OptionSelected) -> None:
        mid = e.option.id or ""
        if mid != "__none__":
            self.state.model = mid
            self._save_and_close()

    @on(OptionList.OptionHighlighted, "#opt-model")
    def _model_highlighted(self, e: OptionList.OptionHighlighted) -> None:
        mid = e.option.id or ""
        if mid and mid != "__none__":
            self.state.model = mid
            has_vision = _model_has_vision(mid)
            try:
                t_widget = self.query_one(VisionToggle)
                t_widget.value = has_vision
                t_widget._update_label()
            except Exception:
                pass
            try:
                self.query_one("#model-in", Input).value = mid
            except Exception:
                pass

    @on(Input.Submitted, "#model-in")
    def _model_input_submitted(self, e: Input.Submitted) -> None:
        val = e.value.strip()
        if val:
            self.state.model = val
            self._save_and_close()

    @on(Input.Changed, "#model-in")
    def _model_input_changed(self, e: Input.Changed) -> None:
        val = e.value.strip()
        if val:
            self.state.model = val
            has_vision = _model_has_vision(val)
            try:
                t_widget = self.query_one(VisionToggle)
                t_widget.value = has_vision
                t_widget._update_label()
            except Exception:
                pass

    @on(Button.Pressed, "#link-btn")
    def _link_pressed(self) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS
        url = PROVIDERS[self.state.pid]["key_url"]
        if url: webbrowser.open(url)

    @on(Button.Pressed, "#btn-back")
    def _btn_back_pressed(self) -> None:
        if self.state.step == "key":
            self.state.step = "provider"
            self._render_step()
        elif self.state.step == "model":
            self.state.step = "key"
            self._render_step()

    @on(Button.Pressed, "#btn-eye")
    def _toggle_eye(self, e: Button.Pressed) -> None:
        try:
            ki = self.query_one("#key-in", Input)
            ki.password = not ki.password
            e.button.label = "隐藏" if not ki.password else "显示"
        except Exception:
            pass

    @on(Button.Pressed, "#btn-proto-openai")
    def _select_openai_protocol(self, e: Button.Pressed) -> None:
        self._set_protocol("openai")

    @on(Button.Pressed, "#btn-proto-anthropic")
    def _select_anthropic_protocol(self, e: Button.Pressed) -> None:
        self._set_protocol("anthropic")

    def _set_protocol(self, protocol: str) -> None:
        current_key, current_url = "", ""
        try: current_key = self.query_one("#key-in", Input).value
        except Exception: pass
        try: current_url = self.query_one("#url-in", Input).value
        except Exception: pass
        self.state.set_protocol(protocol, current_key, current_url)
        self._render_step()

    def _try_advance_model_input(self) -> bool:
        try:
            mi = self.query_one("#model-in", Input)
            val = mi.value.strip()
            if val:
                self.state.model = val
                self._save_and_close()
                return True
        except Exception:
            pass
        return False

    def _try_advance_model_option(self) -> bool:
        try:
            ol = self.query_one("#opt-model", OptionList)
            if ol.highlighted is not None:
                mid = ol.get_option_at_index(ol.highlighted).id or ""
                if mid and mid != "__none__":
                    self.state.model = mid
                    self._save_and_close()
                    return True
        except Exception:
            pass
        return False

    def _try_advance_search_input(self) -> bool:
        try:
            search_in = self.query_one("#model-search-in", Input)
            val = search_in.value.strip()
            if val:
                self.state.model = val
                self._save_and_close()
                return True
        except Exception:
            pass
        return False

    def _advance_from_model(self) -> None:
        if self._try_advance_model_input():
            return
        if self._try_advance_model_option():
            return
        if self._try_advance_search_input():
            return

    @on(Button.Pressed, "#btn-next")
    def _btn_next_pressed(self) -> None:
        if self.state.step == "key":
            self._advance_from_key()
        elif self.state.step == "model":
            self._advance_from_model()

    @on(events.Click, "#btn-lang")
    def _toggle_lang(self, e: events.Click | None = None) -> None:
        from omnisee_every_v1.tui.i18n import get_lang, set_lang
        cur = get_lang()
        new_lang = "en" if cur == "zh" else "zh"
        set_lang(new_lang)
        try:
            from omnisee_every.backend import save_user_config
            save_user_config({"ui": {"language": new_lang}})
        except Exception: pass
        self._render_step()

    def _advance_from_key(self) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS
        try:
            ki = self.query_one("#key-in", Input)
            url_in = self.query_one("#url-in", Input)
        except Exception: return
        if not self.state.submit_key_and_url(ki.value, url_in.value, PROVIDERS):
            try: self.query_one("#err", Static).update(f"[red]{t('setup.key.err')}[/]")
            except Exception: pass
            return
        self._render_step()

    @work(thread=True)
    def _fetch_models(self) -> None:
        from omnisee_every_v1.tui.app import PROVIDERS, _model_fetcher
        p = PROVIDERS[self.state.pid]
        strategy = p.get("fetch_strategy", "openai")
        filter_excludes = p.get("model_filter_exclude") or []

        ok, models, err = _model_fetcher.fetch_models_sync(
            strategy=strategy,
            base_url=self.state.url,
            api_key=self.state.key,
            model_filter_exclude=filter_excludes,
        )

        if ok:
            known = {mid: (tag, desc) for mid, tag, desc in p.get("fallback_models", [])}
            merged = []
            for mid, tag, desc in models:
                if mid in known:
                    ktag, kdesc = known[mid]
                    merged.append((mid, ktag, kdesc))
                else:
                    merged.append((mid, tag, desc))
            self.app.call_from_thread(self._apply_fetched, merged, False, "")
        else:
            self.app.call_from_thread(self._apply_fetched, [], True, err)

    def _apply_fetched(self, options: list, used_fallback: bool, err: str) -> None:
        self.state.model_options = options
        self.state._fetch_used_fallback = used_fallback
        self.state._fetch_error = err
        content = self.query_one("#content", Vertical)
        self._render_model_list(content)
        title = self.query_one("#title", Static)
        if err: title.update(f"◈  " + t("setup.step3.title") + f"   [dim {_ACTIVE_THEME['error']}]· {t('setup.model.fetch_fail', msg=err[:40])}[/]")
        else: title.update(f"◈  " + t("setup.step3.title"))

    def action_back(self) -> None:
        if self.state.step == "provider":
            self.dismiss(False)
        elif self.state.step == "key":
            self.state.step = "provider"
            self._render_step()
        elif self.state.step == "model":
            self.state.step = "key"
            self._render_step()

    def _save_and_close(self) -> None:
        try:
            from omnisee_every.backend import save_user_config
            has_vision = False
            try: has_vision = self.query_one(VisionToggle).value
            except Exception: has_vision = _model_has_vision(self.state.model)

            save_user_config({
                "llm": {
                    "provider": self.state.pid,
                    "api_key": self.state.key,
                    "base_url": self.state.url,
                    "model_name": self.state.model,
                    "protocol": getattr(self.state, "protocol", "openai") or "openai",
                    "has_vision": has_vision,
                }
            })
            self.dismiss(True)
        except Exception as exc:
            title = self.query_one("#title", Static)
            title.update(f"◈  {t('setup.save_fail', msg=exc)}")
