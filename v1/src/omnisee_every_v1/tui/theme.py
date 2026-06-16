"""Four-season theme system for OmniVerse Vision.

Final palette: 梅兰竹菊 · 四大时代 · 水墨宣纸雅致版.

Art references:
  - 冬梅 / 秦汉: 双色极致对立，玄黑 vs 丹朱
  - 春兰 / 魏晋: 柔雅灰青 + 淡紫调
  - 夏竹 / 唐宋: 柔雅竹青调
  - 秋菊 / 明清: 栗褐底 + 明黄点睛，朱橙 vs 藏蓝

Resolution order:
  1. OMNISEE_THEME env var (e.g. `OMNISEE_THEME=spring oe`)
  2. cfg.ui.theme  ("spring" | "summer" | "autumn" | "winter" | "random")
  3. Current month-of-year → season

Design notes:
  - This is the accepted V1 palette previewed in the pasted HTML swatch board.
  - User-bar / AI-bar must be visually different from each other AND from accent
    so message ownership is unmistakable at a glance.
"""
from __future__ import annotations

import datetime
import random
from typing import TypedDict


class Theme(TypedDict):
    name: str
    name_zh: str
    glyph: str
    # surfaces (darkest → lightest)
    bg_base: str         # main screen background
    bg_panel: str        # message bubble / input frame background
    bg_elev: str         # modal background
    bg_input: str        # text input fill
    # text (most → least prominent)
    text_l1: str         # logo / titles / headings
    text_l2: str         # body text
    text_l3: str         # meta (model · provider · skill)
    text_l4: str         # placeholders / hints
    # interactive
    accent: str          # primary CTA / focus border
    border_subtle: str   # default box border (very low contrast)
    border_strong: str   # focused element border (= accent in most cases)
    # semantic
    success: str
    warning: str
    error: str
    # message ownership distinction (must be visually different from accent)
    user_bar: str        # user's message left bar
    ai_bar: str          # AI's message left bar
    # effects
    laser_color: str     # logo intro / click pulse bloom color


# ─────────────────────────────────────────────────────────────────────────────
# Four seasonal palettes
# ─────────────────────────────────────────────────────────────────────────────
THEMES: dict[str, Theme] = {

    # ═══ SPRING 春兰 ═══ 魏晋风 · 柔雅灰青 + 淡紫调
    "spring": {
        "name":    "spring",
        "name_zh": "魏晋幽兰",
        "glyph":   "❀",
        "bg_base":       "#242226",
        "bg_panel":      "#2E2C33",
        "bg_elev":       "#37343D",
        "bg_input":      "#2E2C33",
        "text_l1":       "#B8A9C7",
        "text_l2":       "#EAE6F1",
        "text_l3":       "#A09AA8",
        "text_l4":       "#746F7A",
        "accent":        "#9A8BB6",
        "border_subtle": "#3E3B42",
        "border_strong": "#9A8BB6",
        "success":       "#A1B98F",
        "warning":       "#CCB17E",
        "error":         "#C48698",
        "user_bar":      "#C494A6",
        "ai_bar":        "#8A94B6",
        "laser_color":   "#D1C4E0",
    },

    # ═══ SUMMER 夏竹 ═══ 唐宋风 · 柔雅竹青调
    "summer": {
        "name":    "summer",
        "name_zh": "唐宋青竹",
        "glyph":   "❋",
        "bg_base":       "#222624",
        "bg_panel":      "#2C332F",
        "bg_elev":       "#343D37",
        "bg_input":      "#2C332F",
        "text_l1":       "#A9C7B8",
        "text_l2":       "#E6F1EA",
        "text_l3":       "#9AA8A0",
        "text_l4":       "#6F7A74",
        "accent":        "#8BB69A",
        "border_subtle": "#3B423E",
        "border_strong": "#8BB69A",
        "success":       "#B98FA1",
        "warning":       "#B17ECC",
        "error":         "#8698C4",
        "user_bar":      "#94A6C4",
        "ai_bar":        "#94B68A",
        "laser_color":   "#C4E0D1",
    },

    # ═══ AUTUMN 秋菊 ═══ 明清风 · 明黄藏蓝
    "autumn": {
        "name":    "autumn",
        "name_zh": "明清金菊",
        "glyph":   "✺",
        "bg_base":       "#1E1813",
        "bg_panel":      "#292019",
        "bg_elev":       "#322820",
        "bg_input":      "#261E17",
        "text_l1":       "#D4A24A",
        "text_l2":       "#F1E7D4",
        "text_l3":       "#A89A86",
        "text_l4":       "#76695A",
        "accent":        "#C9912F",
        "border_subtle": "#3A2E23",
        "border_strong": "#C9912F",
        "success":       "#7FA15A",
        "warning":       "#D97A33",
        "error":         "#C75A4D",
        "user_bar":      "#E0A05A",
        "ai_bar":        "#4A6FA5",
        "laser_color":   "#F4D08A",
    },

    # ═══ WINTER 冬梅 ═══ 秦汉风 · 丹朱玄黑
    "winter": {
        "name":    "winter",
        "name_zh": "秦汉红梅",
        "glyph":   "❄",
        "bg_base":       "#000000",
        "bg_panel":      "#1A1714",
        "bg_elev":       "#0E0C0B",
        "bg_input":      "#171311",
        "text_l1":       "#D4524A",
        "text_l2":       "#FFFFFF",
        "text_l3":       "#9B938B",
        "text_l4":       "#6A635C",
        "accent":        "#C8453C",
        "border_subtle": "#2C2826",
        "border_strong": "#C8453C",
        "success":       "#6FA06A",
        "warning":       "#C99A3F",
        "error":         "#D8453A",
        "user_bar":      "#E07A5C",
        "ai_bar":        "#5A5450",
        "laser_color":   "#F08C84",
    },
}

DAY_THEMES: dict[str, Theme] = {
    # ═══ SPRING 春兰 ═══ 魏晋风 · 暖柔紫灰调
    "spring": {
        "name":    "spring",
        "name_zh": "魏晋幽兰",
        "glyph":   "❀",
        "bg_base":       "#F0EDEC",
        "bg_panel":      "#E6E2E6",
        "bg_elev":       "#F7F4F8",
        "bg_input":      "#FAF7FA",
        "text_l1":       "#7A6B8C",
        "text_l2":       "#2D2A33",
        "text_l3":       "#7D7885",
        "text_l4":       "#A09BA8",
        "accent":        "#8B7AA3",
        "border_subtle": "#D4CCD3",
        "border_strong": "#8B7AA3",
        "success":       "#7A996B",
        "warning":       "#A88C4B",
        "error":         "#A86B7C",
        "user_bar":      "#A87B8C",
        "ai_bar":        "#7B86A8",
        "laser_color":   "#B8A8CC",
    },

    # ═══ SUMMER 夏竹 ═══ 唐宋风 · 暖柔竹青调
    "summer": {
        "name":    "summer",
        "name_zh": "唐宋青竹",
        "glyph":   "❋",
        "bg_base":       "#ECF0EE",
        "bg_panel":      "#E2E6E3",
        "bg_elev":       "#F4F8F5",
        "bg_input":      "#FAFDFB",
        "text_l1":       "#6B8C7A",
        "text_l2":       "#2A332D",
        "text_l3":       "#78857D",
        "text_l4":       "#9BA8A0",
        "accent":        "#7AA38B",
        "border_subtle": "#CDD4CF",
        "border_strong": "#7AA38B",
        "success":       "#996B7A",
        "warning":       "#8C4BA8",
        "error":         "#6B7CA8",
        "user_bar":      "#7B8CA8",
        "ai_bar":        "#86A87B",
        "laser_color":   "#A8CCB8",
    },

    # ═══ AUTUMN 秋菊 ═══ 明清风 · 明黄藏蓝
    "autumn": {
        "name":    "autumn",
        "name_zh": "明清金菊",
        "glyph":   "✺",
        "bg_base":       "#F5EEDD",
        "bg_panel":      "#EFE4CC",
        "bg_elev":       "#FBF6EA",
        "bg_input":      "#FFFDF6",
        "text_l1":       "#8A5E1C",
        "text_l2":       "#2A2218",
        "text_l3":       "#7A6B55",
        "text_l4":       "#A8997F",
        "accent":        "#9A6F1E",
        "border_subtle": "#E0D2AE",
        "border_strong": "#9A6F1E",
        "success":       "#5C7A38",
        "warning":       "#B5702A",
        "error":         "#A8473A",
        "user_bar":      "#C2733A",
        "ai_bar":        "#3A5A92",
        "laser_color":   "#D9A845",
    },

    # ═══ WINTER 冬梅 ═══ 秦汉风 · 丹朱玄黑
    "winter": {
        "name":    "winter",
        "name_zh": "秦汉红梅",
        "glyph":   "❄",
        "bg_base":       "#F7F3EC",
        "bg_panel":      "#EDE7DD",
        "bg_elev":       "#FCFAF4",
        "bg_input":      "#FFFFFF",
        "text_l1":       "#B23B33",
        "text_l2":       "#1A1714",
        "text_l3":       "#6E665E",
        "text_l4":       "#9C948B",
        "accent":        "#B23B33",
        "border_subtle": "#E2DACE",
        "border_strong": "#B23B33",
        "success":       "#4E7A48",
        "warning":       "#9A7430",
        "error":         "#B83229",
        "user_bar":      "#C8623F",
        "ai_bar":        "#524C47",
        "laser_color":   "#D9756B",
    },
}

THEME_NAMES = ["spring", "summer", "autumn", "winter"]
DEFAULT_THEME = "spring"


def _theme_for_month(month: int) -> str:
    """Return a theme name based on month-of-year (1-12).

    Northern-hemisphere meteorological seasons:
      Mar-May → spring · Jun-Aug → summer · Sep-Nov → autumn · Dec-Feb → winter
    """
    if month in (3, 4, 5):
        return "spring"
    if month in (6, 7, 8):
        return "summer"
    if month in (9, 10, 11):
        return "autumn"
    return "winter"  # 12, 1, 2


def pick_theme(cfg: dict | None = None) -> Theme:
    """Resolve the active theme.

    Priority:
      1. cfg.ui.theme is a known theme name → use it
      2. cfg.ui.theme == "random" → uniform random pick
      3. Current month selects the matching season
    """
    cfg = cfg or {}
    ui = cfg.get("ui") if isinstance(cfg, dict) else None
    pref = ""
    if isinstance(ui, dict):
        pref = (ui.get("theme") or "").strip().lower()

    mode = ""
    if isinstance(ui, dict):
        mode = (ui.get("theme_mode") or "").strip().lower()

    if pref in THEMES:
        return _apply_theme_mode(THEMES[pref], mode)
    if pref == "random":
        return _apply_theme_mode(THEMES[random.choice(THEME_NAMES)], mode)

    month = datetime.datetime.now().month
    return _apply_theme_mode(THEMES[_theme_for_month(month)], mode)


def _hex_to_rgb(color: str) -> tuple[int, int, int]:
    value = color.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def _rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def _mix(color: str, target: str, amount: float) -> str:
    src = _hex_to_rgb(color)
    dst = _hex_to_rgb(target)
    return _rgb_to_hex(tuple(
        max(1, min(254, round(src[i] + (dst[i] - src[i]) * amount)))
        for i in range(3)
    ))


def _apply_theme_mode(theme: Theme, mode: str) -> Theme:
    """Return night theme as-is, or a readable light/day variant."""
    mode = (mode or "night").strip().lower()
    if mode in ("", "auto", "night", "dark"):
        return theme
    if mode not in ("day", "light"):
        return theme

    return DAY_THEMES.get(theme["name"], theme)


def theme_to_css_vars(t: Theme) -> str:
    """Render a Theme as $variable declarations for Textual CSS.

    All keys are kebab-cased and prefixed `theme-`, e.g. `$theme-bg-base`.
    """
    keys = (
        "bg_base", "bg_panel", "bg_elev", "bg_input",
        "text_l1", "text_l2", "text_l3", "text_l4",
        "accent",
        "border_subtle", "border_strong",
        "success", "warning", "error",
        "user_bar", "ai_bar", "laser_color",
    )
    return "\n".join(
        f"$theme-{k.replace('_', '-')}: {t[k]};" for k in keys
    )


def next_theme_name(current: str) -> str:
    """Return the next theme in the four-season rotation."""
    if current not in THEME_NAMES:
        return THEME_NAMES[0]
    idx = THEME_NAMES.index(current)
    return THEME_NAMES[(idx + 1) % len(THEME_NAMES)]


def next_theme_mode(current: str) -> str:
    """Toggle between day and night theme modes."""
    mode = (current or "").strip().lower()
    if mode in ("day", "light"):
        return "night"
    return "day"
