"""Unit tests for V1 TUI provider tagline localization."""
from __future__ import annotations

from omnisee_every_v1.tui import i18n


def test_localized_provider_tagline_uses_registered_translation(monkeypatch):
    monkeypatch.setattr(i18n, "get_lang", lambda: "en")
    result = i18n.localized_provider_tagline("deepseek", "fallback zh")
    assert result == i18n.STRINGS["provider.deepseek.tagline"]["en"]


def test_localized_provider_tagline_falls_back_to_catalog_text():
    result = i18n.localized_provider_tagline("unknown-provider", "catalog fallback")
    assert result == "catalog fallback"
