"""Tests for the TUI providers catalog + model fetcher architecture."""
from __future__ import annotations

import json
from pathlib import Path

import pytest


def test_bundled_catalog_loads():
    """Bundled JSON catalog must load and have all expected providers."""
    from omnisee_every.tui import catalog
    cat = catalog.load_catalog()
    assert isinstance(cat, dict)
    assert "version" in cat
    assert "providers" in cat
    provs = cat["providers"]
    assert len(provs) >= 10, f"Expected ≥10 providers, got {len(provs)}"

    ids = [p["id"] for p in provs]
    # These 5 must always exist
    for required in ("deepseek", "anthropic", "openai", "ollama", "custom"):
        assert required in ids, f"Missing required provider: {required}"


def test_providers_have_required_fields():
    from omnisee_every.tui import catalog
    for p in catalog.get_providers():
        assert "id" in p
        assert "name" in p
        assert "url" in p
        assert "key_url" in p
        assert "need_key" in p
        assert "fetch_strategy" in p
        assert p["fetch_strategy"] in ("openai", "ollama_tags", "manual"), \
            f"Bad fetch_strategy: {p['fetch_strategy']} for {p['id']}"
        assert isinstance(p.get("fallback_models", []), list)


def test_doubao_is_manual_only():
    """Doubao uses endpoint IDs, not a fetchable model list."""
    from omnisee_every.tui import catalog
    pm = catalog.get_provider_map()
    assert pm["doubao"]["fetch_strategy"] == "manual"
    assert pm["doubao"]["fallback_models"] == []
    assert pm["doubao"].get("manual_hint"), "Manual provider must have hint"


def test_ollama_uses_tags_endpoint():
    from omnisee_every.tui import catalog
    pm = catalog.get_provider_map()
    assert pm["ollama"]["fetch_strategy"] == "ollama_tags"
    assert pm["ollama"]["need_key"] is False

    deepseek = pm["deepseek"]
    assert deepseek["url"] == "https://api.deepseek.com/v1"
    assert pm["anthropic"]["url"] == "https://api.anthropic.com"
    assert pm["anthropic"]["protocol"] == "anthropic"
    assert pm["anthropic"]["fetch_strategy"] == "manual"
    assert pm["custom"]["fetch_strategy"] == "manual"
    assert deepseek["model_context_lengths"]["deepseek-v4-flash"] == 1_000_000


def test_no_hardcoded_made_up_models():
    """Guard against bogus model names invented during past development.

    Note: `deepseek-v4-flash` and `deepseek-v4-pro` were on this list previously
    because we incorrectly assumed they were hallucinations. They are NOT —
    DeepSeek shipped them as real reasoning models (use `reasoning_tokens`).
    Verified live against api.deepseek.com on 2026-05-25.
    """
    from omnisee_every.tui import catalog
    BANNED = {
        # Plausibly-named but verified non-existent at time of writing
        "kimi-k2.5", "glm-4.7", "glm-4.7-flash", "glm-4.6v-flash",
        "gpt-5.2", "anthropic/claude-sonnet-4",
    }
    for p in catalog.get_providers():
        for m in p.get("fallback_models", []):
            mid = m[0] if isinstance(m, list) else m["id"]
            assert mid not in BANNED, f"Banned fictional model in {p['id']}: {mid}"


def test_annotate_model_pattern_matching():
    """The pattern-based annotator must classify common models correctly."""
    from omnisee_every.tui.model_fetcher import annotate_model
    # Tags are uppercase ASCII (no emoji), padded to 6 chars for alignment.
    cases = {
        "deepseek-chat":       "TEXT",     # V3 chat alias
        "deepseek-reasoner":   "REASON",   # R1
        "deepseek-v4-flash":   "REASON",   # V4 reasoning, NOT FAST (flash in name is misleading)
        "deepseek-v4-pro":     "REASON",   # V4 flagship reasoning
        "claude-3-5-sonnet":   "VISION",   # multimodal
        "claude-3-haiku":      "TEXT",     # legacy text-only haiku
        "gpt-4o":              "VISION",
        "gpt-4o-mini":         "VISION",
        "o1-mini":             "REASON",
        "o3-mini":             "REASON",
        "qwen-vl-plus":        "VISION",
        "gemini-1.5-pro":      "VISION",
        "llama-3.3-70b":       "TEXT",
        "glm-4-flash":         "FAST",
    }
    for model, expected in cases.items():
        tag, _ = annotate_model(model)
        assert tag.strip() == expected, \
            f"{model}: expected tag {expected!r}, got {tag.strip()!r}"


def test_filter_models_drops_junk():
    from omnisee_every.tui.model_fetcher import filter_models
    inputs = [
        "gpt-4o", "gpt-4o-mini",
        "whisper-1", "tts-1", "dall-e-3", "text-embedding-3-small",
        "babbage-002", "davinci-002",
    ]
    out = filter_models(inputs)
    assert "gpt-4o" in out
    assert "gpt-4o-mini" in out
    assert "whisper-1" not in out
    assert "text-embedding-3-small" not in out


def test_fetch_models_sync_manual_strategy():
    """Manual strategy short-circuits without network call."""
    from omnisee_every.tui.model_fetcher import fetch_models_sync
    ok, models, err = fetch_models_sync(strategy="manual", base_url="", api_key="")
    assert ok is False
    assert models == []
    assert "手填" in err or "manual" in err.lower()


def test_fetch_models_normalizes_full_chat_endpoint(monkeypatch):
    from omnisee_every.tui.model_fetcher import fetch_models_sync

    captured = {}

    class Response:
        def raise_for_status(self):
            return None

        def json(self):
            return {"data": [{"id": "deepseek-chat"}]}

    def fake_get(url, **kwargs):
        captured["url"] = url
        return Response()

    monkeypatch.setattr("httpx.get", fake_get)

    ok, models, err = fetch_models_sync(
        strategy="openai",
        base_url="https://api.deepseek.com/v1/chat/completions",
        api_key="sk-test",
    )

    assert ok is True
    assert err == ""
    assert models[0][0] == "deepseek-chat"
    assert captured["url"] == "https://api.deepseek.com/v1/models"


def test_provider_map_consistency():
    """get_provider_map() values must match get_providers() by content."""
    from omnisee_every.tui import catalog
    provs = catalog.get_providers()
    pmap = catalog.get_provider_map()
    assert len(provs) == len(pmap)
    for p in provs:
        assert pmap[p["id"]] == p


def test_remote_url_is_opt_in(monkeypatch):
    """Bundled catalog must not point at old remote projects by default."""
    from omnisee_every.tui import catalog

    cat = catalog.load_catalog()
    assert "remote_url" in cat
    assert cat["remote_url"] is None

    monkeypatch.setenv("OMNISEE_CATALOG_URL", "https://example.com/providers_catalog.json")
    assert catalog._remote_url() == "https://example.com/providers_catalog.json"


def test_app_module_PROVIDERS_backed_by_catalog():
    """The app's PROVIDERS dict must come from the catalog (not hardcoded)."""
    from omnisee_every.tui import app, catalog
    cat_providers = catalog.get_providers()
    assert len(app.PROVIDERS) == len(cat_providers)
    assert set(app.PROVIDERS.keys()) == {p["id"] for p in cat_providers}
    assert app._PROVIDER_ORDER == [p["id"] for p in cat_providers]
