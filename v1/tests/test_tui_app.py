"""Unit tests for the TUI app SetupModal config loading and provider matching."""

from __future__ import annotations

import ast
from pathlib import Path

import pytest
from omnisee_every.tui.app import SetupModal, PROVIDERS


def _ast_names_and_attrs(module) -> tuple[set[str], set[str]]:
    path = Path(module.__file__)
    tree = ast.parse(path.read_text(encoding="utf-8"))
    names: set[str] = set()
    attrs: set[str] = set()

    def attr_name(node: ast.AST) -> str | None:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            base = attr_name(node.value)
            return f"{base}.{node.attr}" if base else node.attr
        return None

    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            names.add(node.id)
        elif isinstance(node, ast.Attribute):
            name = attr_name(node)
            if name:
                attrs.add(name)
    return names, attrs


def test_setup_modal_matching_and_preloading():
    from omnisee_every.tui.app import _MODAL_CSS

    assert "#key-in, #url-in" in _MODAL_CSS
    assert "border: solid" in _MODAL_CSS
    assert "#model-in:focus { border: solid" in _MODAL_CSS
    assert "#proto-row" in _MODAL_CSS
    assert "#btn-proto-openai" in _MODAL_CSS
    assert "#btn-proto-anthropic" in _MODAL_CSS
    assert "#title-row {\n    height: 1;" in _MODAL_CSS
    assert "#opt-model {\n    height: 1fr;" in _MODAL_CSS
    assert "border-left: solid" in _MODAL_CSS
    assert "#btn-next" in _MODAL_CSS
    assert "#btn-eye" in _MODAL_CSS

    # Test 1: Empty config defaults to deepseek
    modal = SetupModal(cfg={})
    assert modal.state.pid == "deepseek"
    assert modal.state.key == ""
    assert modal.state.url == "https://api.deepseek.com/v1"
    assert modal.state.model == ""

    # Test 2: DeepSeek config matched
    cfg_ds = {
        "llm": {
            "api_key": "sk-deepseek-123",
            "base_url": "https://api.deepseek.com/v1",
            "model_name": "deepseek-reasoner",
        }
    }
    modal_ds = SetupModal(cfg=cfg_ds)
    assert modal_ds.state.pid == "deepseek"
    assert modal_ds.state.key == "sk-deepseek-123"
    assert modal_ds.state.url == "https://api.deepseek.com/v1"
    assert modal_ds.state.model == "deepseek-reasoner"
    # Ensure current model is highlighted
    assert any(m[0] == "deepseek-reasoner" for m in modal_ds.state.model_options)

    # Test 3: OpenAI config matched
    cfg_oa = {
        "llm": {
            "api_key": "sk-openai-abc",
            "base_url": "https://api.openai.com/v1",
            "model_name": "gpt-4o-mini",
        }
    }
    modal_oa = SetupModal(cfg=cfg_oa)
    assert modal_oa.state.pid == "openai"
    assert modal_oa.state.key == "sk-openai-abc"
    assert modal_oa.state.url == "https://api.openai.com/v1"
    assert modal_oa.state.model == "gpt-4o-mini"

    cfg_an = {
        "llm": {
            "api_key": "sk-ant",
            "base_url": "https://api.anthropic.com/v1",
            "model_name": "claude-3-5-sonnet-20241022",
        }
    }
    modal_an = SetupModal(cfg=cfg_an)
    assert modal_an.state.pid == "anthropic"
    assert modal_an.state.protocol == "anthropic"
    assert modal_an.state.url == "https://api.anthropic.com"

    # Test 4: Ollama config matched
    cfg_ol = {
        "llm": {
            "api_key": "",
            "base_url": "http://localhost:11434/v1",
            "model_name": "minicpm-v",
        }
    }
    modal_ol = SetupModal(cfg=cfg_ol)
    assert modal_ol.state.pid == "ollama"
    assert modal_ol.state.key == ""
    assert modal_ol.state.url == "http://localhost:11434/v1"
    assert modal_ol.state.model == "minicpm-v"

    # Test 5: Custom base url not in predefined list fallback to custom
    cfg_cust = {
        "llm": {
            "api_key": "custom-key",
            "base_url": "https://my-custom-proxy.org/v2",
            "model_name": "llama3",
        }
    }
    modal_cust = SetupModal(cfg=cfg_cust)
    assert modal_cust.state.pid == "custom"
    assert modal_cust.state.key == "custom-key"
    assert modal_cust.state.url == "https://my-custom-proxy.org/v2"
    assert modal_cust.state.model == "llama3"

    # Explicit custom provider must not be reclassified by URL substrings.
    cfg_cust_deepseek_proxy = {
        "llm": {
            "provider": "custom",
            "api_key": "custom-key",
            "base_url": "https://proxy.example.com/https://api.deepseek.com/v1",
            "model_name": "proxy-model",
        }
    }
    modal_proxy = SetupModal(cfg=cfg_cust_deepseek_proxy)
    assert modal_proxy.state.pid == "custom"
    assert modal_proxy.state.url == "https://proxy.example.com/https://api.deepseek.com/v1"


def test_setup_modal_toggle_preserves_original_values():
    cfg = {
        "llm": {
            "api_key": "sk-openai-orig",
            "base_url": "https://api.openai.com/v1",
            "model_name": "gpt-4o",
        }
    }
    modal = SetupModal(cfg=cfg)
    assert modal.state.pid == "openai"
    assert modal.state.key == "sk-openai-orig"

    # Mock selecting a different provider: siliconflow
    class MockOption:
        def __init__(self, option_id):
            self.id = option_id

    class MockEvent:
        def __init__(self, option_id):
            self.option = MockOption(option_id)

    # Mock _render_step as it queries Textual DOM which is not loaded during standalone unit test
    modal._render_step = lambda: None

    # 1. Select SiliconFlow
    modal._provider_chosen(MockEvent("siliconflow"))
    assert modal.state.pid == "siliconflow"
    assert modal.state.key == ""  # Cleared as expected for different provider
    assert modal.state.url == "https://api.siliconflow.cn/v1"
    assert modal.state.protocol == "openai"

    modal._provider_chosen(MockEvent("anthropic"))
    assert modal.state.pid == "anthropic"
    assert modal.state.url == "https://api.anthropic.com"
    assert modal.state.protocol == "anthropic"

    # 2. Select back OpenAI (should restore original configuration)
    modal._provider_chosen(MockEvent("openai"))
    assert modal.state.pid == "openai"
    assert modal.state.key == "sk-openai-orig"
    assert modal.state.url == "https://api.openai.com/v1"
    assert modal.state.model == "gpt-4o"


def test_ctx_bar_uses_middle_dot_not_slash():
    from omnisee_every.tui.app import _ctx_bar_markup

    markup = _ctx_bar_markup(0, 1_000_000)
    assert "· 1M" in markup
    assert "/ 1M" not in markup


def test_model_meta_separates_chat_and_vision_models():
    from omnisee_every.tui.app import _chat_input_meta_markup, _model_label, _vision_model_label

    cfg = {
        "asr": {"default_provider": "bcut"},
        "llm": {"model_name": "deepseek-v4-pro"},
        "vlm": {"default_provider": "minicpm_public"},
    }
    label = _model_label(cfg)
    assert "对话 deepseek-v4-pro" in label
    assert _vision_model_label({}) == "MiniCPM-V-4.6"

    meta = _chat_input_meta_markup(cfg, "ready")
    assert "deepseek-v4-pro" in meta
    assert "ready" not in meta


def test_chatscreen_slash_paste():
    from omnisee_every.tui.app import (
        _CHAT_CSS,
        _HOME_CSS,
        ChatScreen,
        Message,
        _estimate_message_tokens,
        _model_context_total,
        OmniSeeApp,
    )
    
    cfg = {
        "llm": {
            "api_key": "sk-test",
            "base_url": "https://api.deepseek.com",
            "model_name": "deepseek-v4-flash",
        }
    }
    assert _model_context_total(cfg) == 1_000_000
    assert _estimate_message_tokens("abcdef") == 2

    screen = ChatScreen(cfg=cfg)
    paste_called = 0
    refresh_count = 0

    def mock_handle_paste():
        nonlocal paste_called
        paste_called += 1

    def mock_refresh_context_bar():
        nonlocal refresh_count
        refresh_count += 1

    screen._handle_paste = mock_handle_paste
    screen._refresh_context_bar = mock_refresh_context_bar
    screen._record_context_text("abcdef", "你好世界")
    assert screen._ctx_total == 1_000_000
    assert screen._ctx_used == 4
    assert refresh_count == 1
    assert screen._input_meta() == "ready"

    # Test /paste command routing
    screen._handle_slash("/paste")
    assert paste_called == 1

    # Test /p command routing
    screen._handle_slash("/p")
    assert paste_called == 2

    assert "#home-input > .input--cursor" in _HOME_CSS
    assert "#chat-input > .input--cursor" in _CHAT_CSS
    assert "#home-input {\n    background: transparent;" in _HOME_CSS
    assert "#chat-input {\n    background: transparent;" in _CHAT_CSS
    assert "text-style: underline;" in _CHAT_CSS
    assert "HomeScreen {\n    background:" in _HOME_CSS and "height: 100%;" in _HOME_CSS
    assert "Screen {\n    background:" in OmniSeeApp.CSS and "height: 100%;" in OmniSeeApp.CSS
    assert "Button, Button.-style-default, Button.-style-flat" in OmniSeeApp.CSS
    assert "Button.-active" in OmniSeeApp.CSS
    assert "#home-input-frame" in _HOME_CSS and "border-left: heavy" in _HOME_CSS
    assert "#chat-input-frame" in _CHAT_CSS
    assert "#home-mascot" in _HOME_CSS
    assert "#chat-mascot" in _CHAT_CSS
    assert "#chat-input-frame" in _CHAT_CSS and "border-left: solid" in _CHAT_CSS
    assert "#slash-panel" in _CHAT_CSS
    assert "scrollbar-size-vertical: 0;" in _CHAT_CSS
    assert "Message.msg-user" in Message.DEFAULT_CSS
    assert "msg-gutter" in Message.DEFAULT_CSS
    assert "#chat-column" in _CHAT_CSS
    assert "#chat-footer" in _CHAT_CSS
    assert "scrollbar-size-vertical: 0;" in _CHAT_CSS
    assert "border-left: tall" not in Message.DEFAULT_CSS
    assert "border-left: heavy" not in Message.DEFAULT_CSS
    assert "width: 68%;" not in Message.DEFAULT_CSS
    from omnisee_every.tui.app import _CHAT_BUBBLE_MAX_WIDTH, _top_status_markup, PetMascot

    assert f"max-width: {_CHAT_BUBBLE_MAX_WIDTH};" in Message.DEFAULT_CSS
    assert Message.__bases__[0].__name__ == "HorizontalGroup"
    assert Message._HEADERS["user"] == ("▸ 你", "▸ you")
    assert "text-align: right" in Message.DEFAULT_CSS
    assert "MCP :" in _top_status_markup(cfg)
    assert "◜◝" not in PetMascot.FRAMES["idle"]


def test_chatscreen_collects_multiple_image_attachments():
    from omnisee_every.tui.app import ChatScreen

    screen = ChatScreen(cfg={"llm": {"model_name": "gpt-4o"}})
    screen._add_image_attachment("/tmp/one.png", "first image")
    screen._add_image_attachment("/tmp/two.png", "second image")

    assert len(screen._pending_attachments) == 2

    contexts = screen._consume_attachment_contexts()
    assert len(contexts) == 2
    assert "/tmp/one.png" in contexts[0]
    assert "first image" in contexts[0]
    assert "/tmp/two.png" in contexts[1]
    assert "second image" in contexts[1]
    assert screen._pending_attachments == []


def test_chatscreen_includes_image_descriptions_without_vision_model():
    from omnisee_every.tui.app import ChatScreen

    screen = ChatScreen(cfg={"llm": {"model_name": "deepseek-chat"}})
    screen._add_image_attachment("/tmp/one.png", "image description", "[Image 1]")

    contexts = screen._consume_attachment_contexts()
    assert len(contexts) == 1
    assert "[Attached Clipboard Image 1]" in contexts[0]
    assert "image description" in contexts[0]


def test_chatscreen_collects_text_and_pdf_attachments(tmp_path):
    from omnisee_every.tui.app import ChatScreen

    note = tmp_path / "notes.md"
    note.write_text("# Meeting\n\nImportant detail.", encoding="utf-8")
    pdf = tmp_path / "brief.pdf"
    pdf.write_bytes(b"%PDF-1.7")

    screen = ChatScreen(cfg={"llm": {"model_name": "gpt-4o"}})
    note_placeholder = screen._add_file_attachment(str(note), "Attached text file")
    pdf_placeholder = screen._add_file_attachment(str(pdf), "Attached pdf file")

    assert note_placeholder == "[File 1]"
    assert pdf_placeholder == "[PDF 1]"

    contexts = screen._consume_attachment_contexts()
    assert len(contexts) == 2
    assert "[Attached [File 1]]" in contexts[0]
    assert "Content Preview:" in contexts[0]
    assert "Important detail." in contexts[0]
    assert "[Attached [PDF 1]]" in contexts[1]
    assert "brief.pdf" in contexts[1]
    assert screen._pending_attachments == []
    assert screen._next_file_id == 1
    assert screen._next_pdf_id == 1


def test_visual_query_auto_attaches_clipboard_image(monkeypatch):
    from omnisee_every.tui.app import ChatScreen, _looks_like_visual_query

    assert _looks_like_visual_query("图片里面有什么")
    assert _looks_like_visual_query("describe this screenshot")
    assert not _looks_like_visual_query("你好")

    monkeypatch.setattr(
        "omnisee_backend.utils.os_clipboard.get_clipboard_media",
        lambda: ("image_data", "/tmp/shot.png"),
    )
    monkeypatch.setattr(
        "omnisee_backend.utils.vlm.describe_image_with_vlm",
        lambda _path, _cfg: (True, "a settings window"),
    )

    screen = ChatScreen(cfg={"llm": {"model_name": "gpt-4o"}})
    screen._update_input_meta = lambda: None

    screen._auto_attach_clipboard_image_for_visual_query("这张截图是什么")

    contexts = screen._consume_attachment_contexts()
    assert len(contexts) == 1
    assert "Path: /tmp/shot.png" in contexts[0]
    assert "a settings window" in contexts[0]


def test_terminal_background_sync_uses_osc_11_only_for_tty(monkeypatch):
    import io
    from omnisee_every.tui import app as tui_app

    class FakeTTY(io.StringIO):
        def isatty(self) -> bool:
            return True

    class FakePipe(io.StringIO):
        def isatty(self) -> bool:
            return False

    tty = FakeTTY()
    monkeypatch.setattr(tui_app.sys, "stdout", tty)
    monkeypatch.setattr(tui_app, "_TERMINAL_BG_RESET_REGISTERED", False)
    tui_app._set_terminal_background("#fbf5ed")
    assert tty.getvalue() == "\033]11;#fbf5ed\007"

    pipe = FakePipe()
    monkeypatch.setattr(tui_app.sys, "stdout", pipe)
    tui_app._set_terminal_background("#fbf5ed")
    assert pipe.getvalue() == ""


def test_chat_search_uses_llm_factory_not_direct_provider():
    import omnisee_every.tui.app as tui_app
    from omnisee_every.tui.app import (
        _CHAT_BUBBLE_MAX_WIDTH,
        _CHAT_CSS,
        _HOME_CSS,
        Message,
        PetMascot,
    )

    names, attrs = _ast_names_and_attrs(tui_app)
    assert "OpenAICompatibleProvider" not in names
    assert "LLMFactory.from_config" not in attrs
    assert f"width: {_CHAT_BUBBLE_MAX_WIDTH};" in Message.DEFAULT_CSS
    assert "◕" in PetMascot.FRAMES["idle"]
    assert "#home-input-meta-row" in _HOME_CSS
    assert "#chat-bottom-spacer" in _CHAT_CSS
    assert "#chat-mascot" in _CHAT_CSS
    assert "#home-bottom-spacer" in _HOME_CSS
    assert "#home-mascot" in _HOME_CSS
    assert "#home-mascot-row" not in _HOME_CSS


def test_setup_model_rows_are_compact_and_do_not_repeat_model_names():
    from omnisee_every.tui.app import _compact_model_desc, PROVIDERS

    desc = _compact_model_desc(
        "MiniCPM-V-4.6-Instruct",
        "VISION",
        "MiniCPM-V 4.6 (1.3B) · 免费公共 Key",
        PROVIDERS["modelbest"],
    )
    assert "MiniCPM-V 4.6" not in desc
    assert "免费公共 Key" in desc

    deepseek = _compact_model_desc(
        "deepseek-v4-pro",
        "REASON",
        "V4 Pro · 旗舰推理",
        PROVIDERS["deepseek"],
    )
    assert "上下文 1M" in deepseek


def test_setup_modal_custom_model_submission():
    cfg = {
        "llm": {
            "api_key": "custom-key",
            "base_url": "https://my-custom-proxy.org/v2",
            "model_name": "llama3",
        }
    }
    modal = SetupModal(cfg=cfg)
    assert modal.state.model == "llama3"

    # Mock _save_and_close as it writes to file
    save_called = False
    def mock_save_and_close():
        nonlocal save_called
        save_called = True

    modal._save_and_close = mock_save_and_close

    class MockInputEvent:
        def __init__(self, value):
            self.value = value

    modal._model_input_submitted(MockInputEvent("  my-custom-model-123  "))
    assert modal.state.model == "my-custom-model-123"
    assert save_called is True


def test_setup_modal_protocol_and_lang_toggle():
    cfg = {
        "llm": {
            "api_key": "custom-key",
            "base_url": "https://my-custom-proxy.org/v2",
            "model_name": "llama3",
            "protocol": "anthropic",
        },
        "ui": {
            "language": "zh",
        }
    }
    modal = SetupModal(cfg=cfg)
    assert modal.state.protocol == "anthropic"

    # Mock _render_step
    modal._render_step = lambda: None

    # Toggle language
    from omnisee_every.tui.i18n import get_lang, set_lang, t
    set_lang("zh")
    assert get_lang() == "zh"

    modal._toggle_lang()
    assert get_lang() == "en"

    modal._toggle_lang()
    assert get_lang() == "zh"
    assert t("setup.protocol.openai") != "setup.protocol.openai"
    assert t("setup.protocol.anthropic_hint") != "setup.protocol.anthropic_hint"


def test_setup_modal_model_highlighted_updates_input():
    cfg = {
        "llm": {
            "api_key": "custom-key",
            "base_url": "https://my-custom-proxy.org/v2",
            "model_name": "llama3",
        }
    }
    modal = SetupModal(cfg=cfg)
    
    # Mock textual query_one for input box
    class MockInput:
        def __init__(self):
            self.value = ""

    mock_input = MockInput()
    
    def mock_query_one(selector, expected_class=None):
        if selector == "#model-in":
            return mock_input
        raise Exception("Mock selector not matched")

    modal.query_one = mock_query_one

    class MockOption:
        def __init__(self, option_id):
            self.id = option_id

    class MockHighlightedEvent:
        def __init__(self, option_id):
            self.option = MockOption(option_id)

    # Trigger option highlighted
    modal._model_highlighted(MockHighlightedEvent("deepseek-chat"))
    assert mock_input.value == "deepseek-chat"

    modal._model_highlighted(MockHighlightedEvent("__none__"))
    assert mock_input.value == "deepseek-chat"  # Should remain unchanged


def test_chatscreen_attachment_bar_updates():
    from omnisee_every.tui.app import ChatScreen

    screen = ChatScreen(cfg={})
    
    class MockBar:
        def __init__(self):
            self.content = ""
            self.classes = set()

        def update(self, content):
            self.content = content

        def add_class(self, cls):
            self.classes.add(cls)

        def remove_class(self, cls):
            self.classes.discard(cls)

    mock_bar = MockBar()
    
    def mock_query_one(selector, expected_class=None):
        if selector == "#chat-attachment-bar":
            return mock_bar
        raise Exception("Mock selector not matched")
        
    screen.query_one = mock_query_one
    screen._pending_attachments = []
    
    # No attachments -> should hide
    screen._update_attachment_bar()
    assert mock_bar.content == ""
    assert "hidden" in mock_bar.classes

    # Add attachments -> should show a readable summary, not extension counters.
    screen._add_image_attachment("/tmp/one.png", "first")
    screen._add_image_attachment("/tmp/two.jpg", "second")
    screen._update_attachment_bar()
    
    assert "已附加 2 张图片" in mock_bar.content
    assert "PNG*1" not in mock_bar.content
    assert "JPG*1" not in mock_bar.content
    assert "hidden" not in mock_bar.classes


def test_chatscreen_attachment_placeholder_sync():
    from omnisee_every.tui.app import ChatScreen
    from textual.widgets import Input

    screen = ChatScreen(cfg={})
    assert screen._next_image_id == 1
    
    # Mock update helpers to avoid UI queries
    screen._update_input_meta = lambda: None

    # Add two attachments with stable placeholders
    screen._add_image_attachment("/tmp/one.png", "first", "[Image 1]")
    screen._add_image_attachment("/tmp/two.jpg", "second", "[Image 2]")
    assert len(screen._pending_attachments) == 2

    # Mock Input Changed Event
    class MockChangedEvent:
        def __init__(self, value):
            self.value = value

    # Text still has both placeholders -> nothing deleted
    screen._input_changed(MockChangedEvent("[Image 1] and [Image 2] test"))
    assert len(screen._pending_attachments) == 2

    # Delete [Image 1] placeholder -> first attachment should be deleted
    screen._input_changed(MockChangedEvent("Only [Image 2] test"))
    assert len(screen._pending_attachments) == 1
    assert screen._pending_attachments[0]["placeholder"] == "[Image 2]"

    # Verify context extraction aligns with the placeholder index [Image 2] -> [Attached Clipboard Image 2]
    screen._cfg = {"llm": {"has_vision": True}}
    contexts = screen._consume_attachment_contexts()
    assert len(contexts) == 1
    assert "[Attached Clipboard Image 2]" in contexts[0]
    assert "two.jpg" in contexts[0]

    # After consumption / clear, next_image_id can be reset or sync reset
    screen._add_image_attachment("/tmp/three.png", "third", "[Image 3]")
    screen._input_changed(MockChangedEvent("Clear everything"))
    assert len(screen._pending_attachments) == 0
    assert screen._next_image_id == 1


def test_chatscreen_add_btn_pressed():
    from omnisee_every.tui.app import ChatScreen
    from textual.widgets import Button

    screen = ChatScreen(cfg={})
    called = False

    def mock_handle_paste():
        nonlocal called
        called = True

    screen._handle_paste = mock_handle_paste

    class MockButtonPressedEvent:
        pass

    screen._add_btn_pressed(MockButtonPressedEvent())
    assert called is True


def test_message_copy_and_recall(monkeypatch):
    from omnisee_every.tui.app import Message
    from textual.containers import VerticalScroll
    from textual.widgets import Input

    msg1 = Message("user", "hello")
    msg2 = Message("result", "hi")
    
    # Mock clipboards
    clipboard_text = ""
    def mock_set_clipboard(text):
        nonlocal clipboard_text
        clipboard_text = text
        return True
    
    import sys
    try:
        import omnisee_every.backend as b1
    except Exception:
        pass
    try:
        import omnisee_backend.backend as b2
    except Exception:
        pass
    try:
        import omnisee_backend.utils.os_clipboard as c1
    except Exception:
        pass
    try:
        import omnisee_backend.utils.os_clipboard as c2
    except Exception:
        pass

    for name, module in list(sys.modules.items()):
        if "backend" in name or "clipboard" in name:
            try:
                setattr(module, "set_clipboard_text", mock_set_clipboard)
                setattr(module, "_set_clipboard_text", mock_set_clipboard)
            except Exception:
                pass

    msg1._raw = ["hello"]
    msg1.action_copy()
    assert clipboard_text == "hello"

    # Set up mock scroll container
    class MockScroll:
        def __init__(self, msgs):
            self.msgs = msgs

        def query(self, cls):
            return self.msgs

    scroll = MockScroll([msg1, msg2])
    
    # Set up mock screen with input box
    mock_input = Input()
    class MockScreen:
        def query_one(self, selector, cls):
            if selector == "#chat-input":
                return mock_input
            raise Exception("selector mismatch")

    screen = MockScreen()
    monkeypatch.setattr(Message, "screen", property(lambda self: screen))
    msg1.ancestor_of_type = lambda cls: scroll

    removed = []
    msg1.remove = lambda: removed.append(msg1)
    msg2.remove = lambda: removed.append(msg2)

    msg1._on_recall_pressed()

    # Both user and subsequent assistant message should be removed
    assert msg1 in removed
    assert msg2 in removed
    # Input box should be populated with the recalled text
    assert mock_input.value == "hello"
