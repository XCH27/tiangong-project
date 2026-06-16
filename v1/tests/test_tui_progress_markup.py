"""Unit tests for the V1 TUI progress and context bar markup helpers."""
from __future__ import annotations

from omnisee_every_v1.tui.progress_markup import block_progress_bar, ctx_bar_markup

DUMMY_THEME = {
    "accent": "accent_color",
    "text_l4": "t4_color",
    "text_l3": "t3_color",
    "success": "success_color",
    "warning": "warning_color",
    "text_l2": "text_l2_color",
}


def test_block_progress_bar():
    # zero or negative total for block progress returns empty string
    assert block_progress_bar(5, total=0, width=12, theme=DUMMY_THEME) == ""
    assert block_progress_bar(5, total=-1, width=12, theme=DUMMY_THEME) == ""

    # progress clamps below 0 and above 100 percent
    p1 = block_progress_bar(-1, total=10, width=10, theme=DUMMY_THEME)
    assert "0%" in p1
    p2 = block_progress_bar(15, total=10, width=10, theme=DUMMY_THEME)
    assert "100%" in p2

    # output contains expected percent labels
    p3 = block_progress_bar(5, total=10, width=10, theme=DUMMY_THEME)
    assert "50%" in p3
    assert "accent_color" in p3


def test_ctx_bar_markup():
    # context bar returns empty/unknown marker when total is zero
    c0 = ctx_bar_markup(100, total=0, width=14, theme=DUMMY_THEME)
    assert "context" in c0
    assert "─" in c0

    # context bar color thresholds are preserved:
    # 1. pct < 0.60: success
    c_success = ctx_bar_markup(50, total=100, width=14, theme=DUMMY_THEME)
    assert "success_color" in c_success
    assert "50%" in c_success

    # 2. pct < 0.85: text_l2
    c_normal = ctx_bar_markup(80, total=100, width=14, theme=DUMMY_THEME)
    assert "text_l2_color" in c_normal
    assert "80%" in c_normal

    # 3. pct < 0.95: warning
    c_warning = ctx_bar_markup(90, total=100, width=14, theme=DUMMY_THEME)
    assert "warning_color" in c_warning
    assert "90%" in c_warning

    # 4. pct >= 0.95: accent
    c_full = ctx_bar_markup(98, total=100, width=14, theme=DUMMY_THEME)
    assert "accent_color" in c_full
    assert "98%" in c_full

    # Small widths should not raise
    c_small = ctx_bar_markup(50, total=100, width=1, theme=DUMMY_THEME)
    assert "50%" in c_small
