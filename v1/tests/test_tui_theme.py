"""Tests for the four-season theme system (v1 Python Textual TUI).

v1 status: FROZEN. New UI work happens in `v2/` (direct pi-tui).
These tests stay green to prevent v1 regressions only.
"""
from __future__ import annotations

import re

import pytest


def test_four_seasonal_themes_exist():
    from omnisee_every.tui.theme import THEMES, THEME_NAMES
    assert len(THEMES) == 4
    assert THEME_NAMES == ["spring", "summer", "autumn", "winter"]


def test_every_theme_has_complete_role_map():
    from omnisee_every.tui.theme import THEMES
    required = {
        "name", "name_zh", "glyph",
        "bg_base", "bg_panel", "bg_elev", "bg_input",
        "text_l1", "text_l2", "text_l3", "text_l4",
        "accent",
        "border_subtle", "border_strong",
        "success", "warning", "error",
        "user_bar", "ai_bar",
        "laser_color",
    }
    for tname, t in THEMES.items():
        missing = required - set(t.keys())
        assert not missing, f"Theme {tname} missing keys: {missing}"


def test_pure_black_or_white_only_in_qinhan_winter():
    from omnisee_every.tui.theme import THEMES
    pure = {"#000", "#000000", "#fff", "#ffffff"}
    for tname, t in THEMES.items():
        for key, color in t.items():
            if key in ("name", "name_zh", "glyph"):
                continue
            if tname != "winter":
                assert color.lower() not in pure, \
                    f"Theme {tname} uses pure color outside Qinhan winter in {key}: {color}"
    assert THEMES["winter"]["bg_base"] == "#000000"
    assert THEMES["winter"]["text_l2"] == "#FFFFFF"


def test_colors_are_valid_hex():
    from omnisee_every.tui.theme import THEMES
    HEX_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
    for tname, t in THEMES.items():
        for key, color in t.items():
            if key in ("name", "name_zh", "glyph"):
                continue
            assert HEX_RE.match(color), \
                f"Theme {tname} key {key} has invalid color: {color}"


def test_accepted_v1_palette_matches_swatch_board():
    """Lock the user-approved HTML swatch board so agents cannot restore old candidates."""
    from omnisee_every.tui.theme import DAY_THEMES, THEMES

    expected = {
        ("night", "spring"): {
            "bg_base": "#242226", "bg_panel": "#2E2C33", "bg_elev": "#37343D",
            "text_l1": "#B8A9C7", "text_l2": "#EAE6F1", "text_l3": "#A09AA8",
            "text_l4": "#746F7A", "accent": "#9A8BB6", "user_bar": "#C494A6",
            "ai_bar": "#8A94B6", "laser_color": "#D1C4E0",
        },
        ("night", "summer"): {
            "bg_base": "#222624", "bg_panel": "#2C332F", "bg_elev": "#343D37",
            "text_l1": "#A9C7B8", "text_l2": "#E6F1EA", "text_l3": "#9AA8A0",
            "text_l4": "#6F7A74", "accent": "#8BB69A", "user_bar": "#94A6C4",
            "ai_bar": "#94B68A", "laser_color": "#C4E0D1",
        },
        ("night", "autumn"): {
            "bg_base": "#1E1813", "bg_panel": "#292019", "bg_elev": "#322820",
            "text_l1": "#D4A24A", "text_l2": "#F1E7D4", "text_l3": "#A89A86",
            "text_l4": "#76695A", "accent": "#C9912F", "user_bar": "#E0A05A",
            "ai_bar": "#4A6FA5", "laser_color": "#F4D08A",
        },
        ("night", "winter"): {
            "bg_base": "#000000", "bg_panel": "#1A1714", "bg_elev": "#0E0C0B",
            "text_l1": "#D4524A", "text_l2": "#FFFFFF", "text_l3": "#9B938B",
            "text_l4": "#6A635C", "accent": "#C8453C", "user_bar": "#E07A5C",
            "ai_bar": "#5A5450", "laser_color": "#F08C84",
        },
        ("day", "spring"): {
            "bg_base": "#F0EDEC", "bg_panel": "#E6E2E6", "bg_elev": "#F7F4F8",
            "text_l1": "#7A6B8C", "text_l2": "#2D2A33", "text_l3": "#7D7885",
            "text_l4": "#A09BA8", "accent": "#8B7AA3", "user_bar": "#A87B8C",
            "ai_bar": "#7B86A8", "laser_color": "#B8A8CC",
        },
        ("day", "summer"): {
            "bg_base": "#ECF0EE", "bg_panel": "#E2E6E3", "bg_elev": "#F4F8F5",
            "text_l1": "#6B8C7A", "text_l2": "#2A332D", "text_l3": "#78857D",
            "text_l4": "#9BA8A0", "accent": "#7AA38B", "user_bar": "#7B8CA8",
            "ai_bar": "#86A87B", "laser_color": "#A8CCB8",
        },
        ("day", "autumn"): {
            "bg_base": "#F5EEDD", "bg_panel": "#EFE4CC", "bg_elev": "#FBF6EA",
            "text_l1": "#8A5E1C", "text_l2": "#2A2218", "text_l3": "#7A6B55",
            "text_l4": "#A8997F", "accent": "#9A6F1E", "user_bar": "#C2733A",
            "ai_bar": "#3A5A92", "laser_color": "#D9A845",
        },
        ("day", "winter"): {
            "bg_base": "#F7F3EC", "bg_panel": "#EDE7DD", "bg_elev": "#FCFAF4",
            "text_l1": "#B23B33", "text_l2": "#1A1714", "text_l3": "#6E665E",
            "text_l4": "#9C948B", "accent": "#B23B33", "user_bar": "#C8623F",
            "ai_bar": "#524C47", "laser_color": "#D9756B",
        },
    }

    for mode, name in expected:
        theme = THEMES[name] if mode == "night" else DAY_THEMES[name]
        for key, value in expected[(mode, name)].items():
            assert theme[key] == value, f"{mode}/{name}/{key} drifted"


def test_accents_are_distinct_across_themes():
    """User's spec: 每个主题的颜色不要重复 — at minimum each accent differs."""
    from omnisee_every.tui.theme import THEMES
    accents = [t["accent"].lower() for t in THEMES.values()]
    assert len(set(accents)) == len(accents), \
        f"Two themes share an accent: {accents}"


def test_user_bar_differs_from_ai_bar_within_each_theme():
    from omnisee_every.tui.theme import THEMES
    for tname, t in THEMES.items():
        assert t["user_bar"].lower() != t["ai_bar"].lower(), \
            f"Theme {tname}: user_bar == ai_bar = {t['user_bar']}"


def test_user_bar_differs_from_accent_within_each_theme():
    from omnisee_every.tui.theme import THEMES
    for tname, t in THEMES.items():
        assert t["user_bar"].lower() != t["accent"].lower(), \
            f"Theme {tname}: user_bar == accent = {t['user_bar']}"


def test_pick_theme_respects_explicit_name():
    from omnisee_every.tui.theme import pick_theme, THEMES
    for name in THEMES:
        result = pick_theme({"ui": {"theme": name}})
        assert result == THEMES[name]


def test_pick_theme_day_mode_keeps_season_identity_but_lightens_surface():
    from omnisee_every.tui.theme import pick_theme, THEMES

    result = pick_theme({"ui": {"theme": "summer", "theme_mode": "day"}})
    assert result["name"] == "summer"
    assert result["name_zh"] == THEMES["summer"]["name_zh"]
    assert result["glyph"] == THEMES["summer"]["glyph"]
    assert result["bg_base"] != THEMES["summer"]["bg_base"]
    assert result["text_l2"] != THEMES["summer"]["text_l2"]


def test_day_mode_keeps_dialogue_contrast_readable():
    from omnisee_every.tui.theme import pick_theme

    def rgb(color: str) -> tuple[int, int, int]:
        color = color.lstrip("#")
        return tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))

    def rel_luminance(color: str) -> float:
        vals = []
        for channel in rgb(color):
            c = channel / 255
            vals.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
        r, g, b = vals
        return 0.2126 * r + 0.7152 * g + 0.0722 * b

    def contrast(a: str, b: str) -> float:
        la, lb = sorted((rel_luminance(a), rel_luminance(b)), reverse=True)
        return (la + 0.05) / (lb + 0.05)

    for name in ("spring", "summer", "autumn", "winter"):
        theme = pick_theme({"ui": {"theme": name, "theme_mode": "day"}})
        assert contrast(theme["bg_panel"], theme["text_l2"]) >= 5.0
        assert contrast(theme["bg_base"], theme["text_l3"]) >= 3.0
        assert contrast(theme["bg_panel"], theme["accent"]) >= 2.0





def test_pick_theme_light_and_dark_aliases():
    from omnisee_every.tui.theme import pick_theme, THEMES

    light = pick_theme({"ui": {"theme": "spring", "theme_mode": "light"}})
    dark = pick_theme({"ui": {"theme": "spring", "theme_mode": "dark"}})
    assert light["bg_base"] != THEMES["spring"]["bg_base"]
    assert dark == THEMES["spring"]


def test_pick_theme_random_returns_one_of_four():
    from omnisee_every.tui.theme import pick_theme, THEME_NAMES
    result = pick_theme({"ui": {"theme": "random"}})
    assert result["name"] in THEME_NAMES


def test_theme_for_month_maps_to_meteorological_seasons():
    from omnisee_every.tui import theme as theme_mod

    expected = {
        3: "spring", 4: "spring", 5: "spring",
        6: "summer", 7: "summer", 8: "summer",
        9: "autumn", 10: "autumn", 11: "autumn",
        12: "winter", 1: "winter", 2: "winter",
    }
    for month, season in expected.items():
        assert theme_mod._theme_for_month(month) == season, \
            f"Month {month} should map to {season}"


def test_pick_theme_unknown_falls_back_to_month_based():
    from omnisee_every.tui.theme import pick_theme, THEME_NAMES
    result = pick_theme({"ui": {"theme": "non-existent"}})
    assert result["name"] in THEME_NAMES


def test_pick_theme_handles_no_ui_section():
    from omnisee_every.tui.theme import pick_theme, THEME_NAMES
    result = pick_theme({"llm": {"api_key": "x"}})
    assert result["name"] in THEME_NAMES


def test_theme_to_css_vars_renders_all_roles_including_bars():
    from omnisee_every.tui.theme import THEMES, theme_to_css_vars
    css = theme_to_css_vars(THEMES["spring"])
    for var in ("$theme-bg-base", "$theme-accent", "$theme-text-l1",
                "$theme-user-bar", "$theme-ai-bar",
                "$theme-success", "$theme-error", "$theme-laser-color"):
        assert var in css, f"Missing variable: {var}"


def test_next_theme_name_cycles_all_four():
    from omnisee_every.tui.theme import next_theme_name
    assert next_theme_name("spring") == "summer"
    assert next_theme_name("summer") == "autumn"
    assert next_theme_name("autumn") == "winter"
    assert next_theme_name("winter") == "spring"


def test_next_theme_name_unknown_returns_first():
    from omnisee_every.tui.theme import next_theme_name
    assert next_theme_name("does-not-exist") == "spring"


def test_next_theme_mode_toggles_day_and_night():
    from omnisee_every.tui.theme import next_theme_mode

    assert next_theme_mode("night") == "day"
    assert next_theme_mode("day") == "night"
    assert next_theme_mode("auto") == "day"
    assert next_theme_mode("unknown") == "day"


def test_mascot_has_distinct_season_and_day_night_variants():
    from omnisee_every.tui.widgets.mascot import mascot_variant

    pairs = [
        ("spring", "day"),
        ("spring", "night"),
        ("summer", "day"),
        ("summer", "night"),
        ("autumn", "day"),
        ("autumn", "night"),
        ("winter", "day"),
        ("winter", "night"),
    ]
    variants = [mascot_variant(season, mode) for season, mode in pairs]
    assert len({variant.animal for variant in variants}) == 8
    assert len({variant.idle[0] for variant in variants}) == 8


def test_mascot_variants_have_state_animation_frames():
    from omnisee_every.tui.widgets.mascot import mascot_variant

    for season in ("spring", "summer", "autumn", "winter"):
        for mode in ("day", "night"):
            variant = mascot_variant(season, mode)
            assert len(variant.idle) >= 2
            assert len(variant.work) >= 2
            assert variant.done[0] != variant.error[0]
            assert variant.interval >= 1.9


def test_mascot_variants_keep_frame_width_stable_per_state():
    from rich.cells import cell_len
    from omnisee_every.tui.widgets.mascot import mascot_variant

    for season in ("spring", "summer", "autumn", "winter"):
        for mode in ("day", "night"):
            variant = mascot_variant(season, mode)
            for state in ("idle", "work", "done", "error"):
                frames = getattr(variant, state)
                widths = {cell_len(frame) for frame in frames}
                assert len(widths) == 1, f"{season}/{mode}/{state}: {frames}"


def test_classic_mimi_frames_are_preserved_for_compatibility():
    from omnisee_every.tui.widgets.mascot import (
        CLASSIC_MIMI_FRAMES,
        LEGACY_MIMI_FRAMES,
        PetMascot,
    )

    assert LEGACY_MIMI_FRAMES["idle"] == "ʕ◕ᴥ◕ʔ"
    assert LEGACY_MIMI_FRAMES["work"] == "ʕ◉ᴥ◉ʔ"
    assert CLASSIC_MIMI_FRAMES["idle"][0] == "ʕ◕ᴥ◕ʔ"
    assert CLASSIC_MIMI_FRAMES["work"] == ("ʕ◓ᴥ◓ʔ", "ʕ◒ᴥ◒ʔ")
    assert PetMascot.FRAMES is LEGACY_MIMI_FRAMES


def test_chinese_names_present():
    """Each theme has a Chinese display name."""
    from omnisee_every.tui.theme import THEMES
    expected = {
        "spring": "魏晋幽兰",
        "summer": "唐宋青竹",
        "autumn": "明清金菊",
        "winter": "秦汉红梅",
    }
    for name, zh in expected.items():
        assert THEMES[name]["name_zh"] == zh


def test_default_theme_is_spring():
    from omnisee_every.tui.theme import DEFAULT_THEME
    assert DEFAULT_THEME == "spring"
