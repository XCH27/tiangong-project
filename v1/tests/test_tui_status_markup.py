from __future__ import annotations
import pytest
from omnisee_every_v1.tui.status_markup import (
    needs_setup,
    model_label,
    vision_model_label,
    mcp_badge_markup,
    top_status_markup,
    localize_model_tag,
    chat_input_meta_markup,
)

def mock_t(key: str) -> str:
    return f"localized_{key}"

def mock_lang_zh() -> str:
    return "zh"

def mock_lang_en() -> str:
    return "en"


def test_needs_setup():
    # 1. Invalid api_key
    cfg = {"llm": {"api_key": "your-key-here", "model_name": "deepseek-chat"}}
    needs, reason = needs_setup(cfg, mock_t)
    assert needs is True
    assert reason == "localized_home.needs_setup"

    # 2. Missing model_name
    cfg = {"llm": {"api_key": "valid-key", "model_name": ""}}
    needs, reason = needs_setup(cfg, mock_t)
    assert needs is True
    assert reason == "localized_setup.step3.title"

    # 3. Invalid model_name
    cfg = {"llm": {"api_key": "valid-key", "model_name": "REPLACE_ME"}}
    needs, reason = needs_setup(cfg, mock_t)
    assert needs is True
    assert "已失效" in reason

    # 4. Valid setup
    cfg = {"llm": {"api_key": "valid-key", "model_name": "deepseek-chat"}}
    needs, reason = needs_setup(cfg, mock_t)
    assert needs is False
    assert reason == ""


def test_model_label():
    cfg = {
        "asr": {"default_provider": "groq"},
        "llm": {"model_name": "gpt-4o"},
    }
    assert model_label(cfg, mock_lang_zh) == "groq · 对话 gpt-4o"
    assert model_label(cfg, mock_lang_en) == "groq · chat gpt-4o"

    # Fallback to defaults
    assert model_label({}, mock_lang_zh) == "bcut · 对话 未配置"


def test_vision_model_label():
    # Disabled provider
    assert vision_model_label({"vlm": {"provider": "disabled"}}) == "Disabled"
    # OpenAI-compatible provider
    assert vision_model_label({"vlm": {"provider": "openai-compatible"}}) == "Ollama local"
    # Public MiniCPM provider does not require a private ModelBest key
    assert vision_model_label({"vlm": {"provider": "minicpm_public"}}) == "MiniCPM-V-4.6"
    # Modelbest default model name normalization
    assert vision_model_label({"vlm": {"provider": "modelbest", "model": "MiniCPM-V-4.6-Instruct"}}) == "MiniCPM-V-4.6"
    assert vision_model_label({"vlm": {"provider": "modelbest", "model": ""}}) == "MiniCPM-V-4.6"


def test_mcp_badge_markup():
    theme = {"error": "red", "success": "green", "name": "spring"}
    # Case 1: needs setup
    cfg = {"llm": {"api_key": ""}}
    markup = mcp_badge_markup(cfg, theme, is_day=True, t_func=mock_t)
    assert "[s bold red]MCP" in markup

    # Case 2: valid, disabled vision
    cfg = {
        "llm": {"api_key": "valid", "model_name": "gpt-4o"},
        "vlm": {"provider": "disabled"},
    }
    markup = mcp_badge_markup(cfg, theme, is_day=True, t_func=mock_t)
    assert "[s bold red]MCP : Disabled" in markup

    # Case 3: valid, enabled vision
    cfg = {
        "llm": {"api_key": "valid", "model_name": "gpt-4o"},
        "vlm": {"provider": "modelbest"},
    }
    markup = mcp_badge_markup(cfg, theme, is_day=True, t_func=mock_t)
    assert "[bold green]MCP : MiniCPM-V-4.6" in markup

    # Case 4: winter night green color override
    theme_winter = {"error": "red", "success": "green", "name": "winter"}
    markup_winter = mcp_badge_markup(cfg, theme_winter, is_day=False, t_func=mock_t)
    assert "[bold #a5ffd6]MCP" in markup_winter


def test_top_status_markup():
    theme = {"error": "red", "success": "green", "name": "spring"}
    cfg = {"llm": {"api_key": ""}}
    assert top_status_markup(cfg, theme, is_day=True, t_func=mock_t) == mcp_badge_markup(cfg, theme, is_day=True, t_func=mock_t)


def test_localize_model_tag():
    assert localize_model_tag("reason", mock_lang_zh) == "推理"
    assert localize_model_tag("reason", mock_lang_en) == "REASON"
    assert localize_model_tag("UNKNOWN", mock_lang_zh) == "UNKNOWN"


def test_chat_input_meta_markup():
    theme = {
        "accent": "green",
        "text_l1": "white",
        "text_l2": "gray",
    }
    providers = {
        "deepseek": {
            "models": [("deepseek-chat", "FAST", "")]
        }
    }
    cfg = {
        "llm": {
            "provider": "deepseek",
            "model_name": "deepseek-chat",
        }
    }

    # Standard meta markup
    markup = chat_input_meta_markup(cfg, "ready", theme, providers, mock_lang_zh)
    assert "deepseek-chat" in markup
    assert "轻量" in markup

    # Custom input meta state
    markup_state = chat_input_meta_markup(cfg, "分析中...", theme, providers, mock_lang_zh)
    assert "分析中..." in markup_state

    # Running progress
    markup_progress = chat_input_meta_markup(cfg, "ready", theme, providers, mock_lang_zh, running_progress="50%")
    assert "50%" in markup_progress
