"""Tests for the internationalization module."""

from __future__ import annotations

import sys

from omnisee_every.tui.i18n import STRINGS, set_lang, t


def test_all_strings_have_both_langs():
    for key, entry in STRINGS.items():
        assert "zh" in entry, f"{key} missing zh"
        assert "en" in entry, f"{key} missing en"


def test_set_lang_switches():
    set_lang("en")
    assert t("btn.save") == "Save →"
    set_lang("zh")
    assert t("btn.save") == "保存 →"

    zh = t("chat.search.none_explain")
    assert "如何开始" not in zh
    assert len(zh.splitlines()) <= 2

    set_lang("en")
    en = t("chat.search.none_explain")
    assert "How to start" not in en
    assert len(en.splitlines()) <= 2


def test_windows_shortcut_hints(monkeypatch):
    """Windows hints keep paste on ctrl+v and model config on F1."""
    monkeypatch.setattr(sys, "platform", "win32")
    set_lang("zh")
    home = t("home.bottom")
    chat = t("chat.meta")
    assert "F1 配置模型" in home
    assert "ctrl+v 智能粘贴" in home
    assert "F2 四季" in home
    assert "F3 昼夜" in home
    assert "F10 退出" in home
    assert "ctrl+k" not in home
    assert "F1 配置模型" in chat
    assert "ctrl+q" not in chat

    set_lang("en")
    assert "F1 Config" in t("home.bottom")
    assert "ctrl+v Paste" in t("home.bottom")
    assert "F2 Season" in t("home.bottom")
    assert "F3 Day/Night" in t("home.bottom")
    assert "F10 Exit" in t("home.bottom")


def test_non_windows_keeps_ctrl_hints(monkeypatch):
    monkeypatch.setattr(sys, "platform", "linux")
    set_lang("zh")
    assert "F1 配置模型" in t("home.bottom")
    assert "ctrl+v 智能粘贴" in t("home.bottom")
    assert "F2 四季" in t("home.bottom")
    assert "F3 昼夜" in t("home.bottom")


def test_mac_keeps_cmd_hints(monkeypatch):
    monkeypatch.setattr(sys, "platform", "darwin")
    set_lang("zh")
    assert "F1 配置模型" in t("home.bottom")
    assert "⌘+V 智能粘贴" in t("home.bottom")
    assert "F2 四季" in t("home.bottom")
    assert "F3 昼夜" in t("home.bottom")
