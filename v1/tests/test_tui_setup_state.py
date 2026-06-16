"""Unit tests for SetupState and resolve_setup_state logic."""
from __future__ import annotations

from omnisee_every_v1.tui.app import PROVIDERS
from omnisee_every_v1.tui.setup_state import resolve_setup_state


def test_setup_state_initial_resolution():
    # 1. Empty config defaults to deepseek
    state = resolve_setup_state(None, PROVIDERS)
    assert state.pid == "deepseek"
    assert state.key == ""
    assert state.url == "https://api.deepseek.com/v1"
    assert state.model == ""

    # 2. Explicit provider id wins over URL matching
    cfg = {
        "llm": {
            "provider": "custom",
            "api_key": "custom-key",
            "base_url": "https://api.deepseek.com/v1",
            "model_name": "custom-model",
        }
    }
    state = resolve_setup_state(cfg, PROVIDERS)
    assert state.pid == "custom"
    assert state.key == "custom-key"
    assert state.url == "https://api.deepseek.com/v1"

    # 3. URL matching handles /v1, Gemini, Doubao, custom
    # Gemini
    cfg_gemini = {
        "llm": {
            "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
        }
    }
    state_gemini = resolve_setup_state(cfg_gemini, PROVIDERS)
    assert state_gemini.pid == "gemini"

    # Doubao
    cfg_doubao = {
        "llm": {
            "base_url": "https://ark.cn-beijing.volces.com/api/v3",
        }
    }
    state_doubao = resolve_setup_state(cfg_doubao, PROVIDERS)
    assert state_doubao.pid == "doubao"

    # /v1 normalization
    cfg_ds = {
        "llm": {
            "base_url": "https://api.deepseek.com/v1/",
        }
    }
    state_ds = resolve_setup_state(cfg_ds, PROVIDERS)
    assert state_ds.pid == "deepseek"

    # custom fallback
    cfg_cust = {
        "llm": {
            "base_url": "https://custom-domain.com/v1",
        }
    }
    state_cust = resolve_setup_state(cfg_cust, PROVIDERS)
    assert state_cust.pid == "custom"


def test_setup_state_select_provider_restoration():
    cfg = {
        "llm": {
            "api_key": "sk-openai-orig",
            "base_url": "https://api.openai.com/v1",
            "model_name": "gpt-4o",
            "protocol": "openai",
        }
    }
    state = resolve_setup_state(cfg, PROVIDERS)
    assert state.pid == "openai"
    assert state.key == "sk-openai-orig"

    # Select different provider (siliconflow)
    state.select_provider("siliconflow", PROVIDERS, cfg)
    assert state.pid == "siliconflow"
    assert state.key == ""
    assert state.url == "https://api.siliconflow.cn/v1"

    # Select another (anthropic)
    state.select_provider("anthropic", PROVIDERS, cfg)
    assert state.pid == "anthropic"
    assert state.url == "https://api.anthropic.com"
    assert state.protocol == "anthropic"

    # Select back to original
    state.select_provider("openai", PROVIDERS, cfg)
    assert state.pid == "openai"
    assert state.key == "sk-openai-orig"
    assert state.url == "https://api.openai.com/v1"
    assert state.model == "gpt-4o"


def test_setup_state_custom_anthropic_protocol():
    cfg = {
        "llm": {
            "provider": "custom",
            "base_url": "",
        }
    }
    state = resolve_setup_state(cfg, PROVIDERS)
    assert state.pid == "custom"
    
    # Custom Anthropic protocol fills default URL only when URL is empty
    state.set_protocol("anthropic", "", "")
    assert state.protocol == "anthropic"
    assert state.url == "https://api.anthropic.com"

    # Switch back to openai protocol removes anthropic URL if it matches
    state.set_protocol("openai", "", "https://api.anthropic.com")
    assert state.protocol == "openai"
    assert state.url == ""

    # Custom Anthropic protocol with non-empty URL does NOT overwrite URL
    state.set_protocol("anthropic", "", "https://my-proxy.com")
    assert state.protocol == "anthropic"
    assert state.url == "https://my-proxy.com"


def test_setup_state_required_key_validation():
    # deepseek requires key
    cfg = {
        "llm": {
            "provider": "deepseek",
            "api_key": "",
        }
    }
    state = resolve_setup_state(cfg, PROVIDERS)
    assert state.step == "provider"

    # Simulate provider selection -> transitions to key step
    state.select_provider("deepseek", PROVIDERS, cfg)
    assert state.step == "key"

    # Try advancing with empty key -> should fail and remain on key step
    success = state.submit_key_and_url("", "https://api.deepseek.com/v1", PROVIDERS)
    assert not success
    assert state.step == "key"

    # Advancing with key -> transitions to model step
    success = state.submit_key_and_url("sk-valid", "https://api.deepseek.com/v1", PROVIDERS)
    assert success
    assert state.step == "model"
