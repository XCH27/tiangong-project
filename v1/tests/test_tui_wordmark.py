"""Logo-only tests — home title must not require app.py layout changes."""

from __future__ import annotations


def test_home_logo_is_readable_shaded_block():
    from omnisee_every.tui.app import _get_logo
    from omnisee_every.tui.wordmark import home_logo_text

    logo = home_logo_text()
    assert _get_logo() == logo
    lines = logo.splitlines()
    assert len(lines) == 11
    assert "___" not in logo
    assert "██████" in logo
    assert "▓▓▓▓▓▓" in logo
    assert "▒▒" in logo
    assert "░░░░" in logo
    assert sorted(set(len(line) for line in lines)) == [76]
    assert len(lines[0].strip()) >= 64
    assert lines[1].strip().startswith("██")
    assert lines[5].strip() == ""
    assert len(lines[6].strip()) >= 36
    assert lines[7].strip().startswith("██")


def test_home_tagline_copy_is_current():
    from omnisee_every.tui.i18n import STRINGS

    assert STRINGS["brand.tagline"]["zh"] == "视界无限，洞析万象"


def test_logo_uses_slow_irregular_rhythm_with_click_gradient_ripple():
    from omnisee_every.tui.app import BeamLogo
    from omnisee_every.tui.app import _ACTIVE_THEME
    from omnisee_every.tui import click_pulse_logo as pulse_logo
    from omnisee_every.tui.wordmark import home_logo_text

    def rgb(color: str) -> tuple[int, int, int]:
        return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))

    def distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> int:
        return sum(abs(a[i] - b[i]) for i in range(3))

    logo = BeamLogo(home_logo_text(), animate=False)
    assert logo._LOGO_COLOR == "#8d9e8b"
    assert logo._SHADE_RAMP == ("░", "▒", "▓", "█")
    assert logo._INTERVAL == 1 / 30
    assert logo._RHYTHM_FRAME_SPEED == 0.12
    assert logo._RHYTHM_COLUMN_PHASE == 0.24
    assert logo._RHYTHM_ROW_PHASE == 0.72
    assert logo._RIPPLE_LIFETIME_FRAMES == 105
    assert logo._MOSAIC_TILE_WIDTH == 3
    assert logo._MOSAIC_TILE_HEIGHT == 2
    assert logo._MOSAIC_BOOST_STEPS == 4
    assert logo._MOSAIC_RING_WIDTH == 5.2
    assert logo._RIPPLE_GREENS == (
        (92, 107, 90),
        (122, 119, 112),
        (163, 159, 150),
        (141, 158, 139),
        (191, 207, 189),
    )
    assert pulse_logo.INTRO_FRAMES == 58
    assert pulse_logo.CHARGE_RELEASE_SECONDS == 3.0
    assert pulse_logo.CHARGE_RELEASE_SPEED == 5.10
    assert not hasattr(logo, "_animated_logo_color")

    logo._frame_index = 8
    base = logo._logo_color(0, 10)
    ripple = pulse_logo.Ripple(10, 1, 8)
    logo._ripples.append(ripple)
    boosted = logo._logo_color(0, 10)
    base_r, base_g, base_b = rgb(base)
    boost_r, boost_g, boost_b = rgb(boosted)
    accent_rgb = rgb(_ACTIVE_THEME["accent"])

    assert logo._ripple_factor(10, 0, ripple) > 0.8
    assert base.lower() == _ACTIVE_THEME["accent"].lower()
    assert boosted != base
    assert (base_r, base_g, base_b) == accent_rgb
    assert (boost_r, boost_g, boost_b) != accent_rgb

    shades = set()
    patterns = set()
    for frame in range(0, 80, 8):
        logo._frame_index = frame
        shades.add(logo._rhythm_char("░", 10, 0))
        patterns.add((
            logo._rhythm_char("░", 10, 0),
            logo._rhythm_char("░", 30, 2),
            logo._rhythm_char("░", 55, 8),
        ))
    assert len(shades) > 1
    assert len(patterns) > 1
    assert shades <= set(logo._SHADE_RAMP)

    logo._frame_index = 8 + logo._RIPPLE_LIFETIME_FRAMES + 1
    assert logo._ripple_factor(10, 0, ripple) == 0.0


def test_logo_uses_original_press_release_state_machine():
    from omnisee_every.tui import click_pulse_logo as pulse_logo

    ripples, active, mouse_down = pulse_logo.handle_pointer_event(
        [], None, False, "press", 10, 1, 0, 30
    )
    assert mouse_down is True
    assert active is not None
    assert active.hold_start_frame == 0
    assert len(ripples) == 1

    ripples, active, mouse_down = pulse_logo.handle_pointer_event(
        ripples, active, mouse_down, "release", 10, 1, 15, 30
    )
    assert mouse_down is False
    assert active is None
    assert ripples[0].release_frame == 15
    assert pulse_logo.ripple_alive(ripples[0], 15)


def test_logo_mouse_hit_area_is_actual_glyphs_only():
    from omnisee_every.tui.app import BeamLogo
    from omnisee_every.tui.wordmark import home_logo_text

    logo = BeamLogo(home_logo_text(), animate=False)
    first_col = next(index for index, char in enumerate(logo._logo_lines[0]) if char != " ")
    assert logo._has_logo_cell(first_col, 0)
    assert not logo._has_logo_cell(0, 0)
    assert not logo._has_logo_cell(0, 5)
    assert not logo._has_logo_cell(999, 0)


def test_logo_can_pulse_from_external_clicks():
    from omnisee_every.tui.app import BeamLogo
    from omnisee_every.tui.wordmark import home_logo_text

    logo = BeamLogo(home_logo_text(), animate=False)
    before = len(logo._ripples)
    logo._logo_timer = object()
    logo.trigger_pulse_at(-20, 99)

    assert len(logo._ripples) == before + 1
    assert logo._ripples[-1].hold_start_frame is None
    assert logo._nearest_logo_cell(-20, 99) is not None


def test_logo_intro_color_avoids_user_bar_blue_sweep():
    from omnisee_every.tui.app import BeamLogo

    logo = (141, 158, 139)
    laser = (191, 207, 189)
    early = BeamLogo._intro_color(0.0, logo, logo, laser)
    mid = BeamLogo._intro_color(0.5, logo, logo, laser)
    late = BeamLogo._intro_color(1.0, logo, logo, laser)

    assert early == laser
    assert mid == (166, 182, 164)
    assert late == logo


def test_logo_laser_color_is_one_fixed_theme_color():
    from omnisee_every.tui.app import BeamLogo
    from omnisee_every.tui.theme import DAY_THEMES, THEMES

    def rgb(color: str) -> tuple[int, int, int]:
        return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))

    expected = {
        ("night", "spring"): "#d1c4e0",
        ("night", "summer"): "#c4e0d1",
        ("night", "autumn"): "#f4d08a",
        ("night", "winter"): "#f08c84",
        ("day", "spring"): "#b8a8cc",
        ("day", "summer"): "#a8ccb8",
        ("day", "autumn"): "#d9a845",
        ("day", "winter"): "#d9756b",
    }

    samples = {}
    for theme in THEMES.values():
        success = rgb(theme["success"])
        accent = rgb(theme["accent"])
        laser = BeamLogo._laser_rgb(theme["name"], accent, success)
        samples[("night", theme["name"])] = "#{:02x}{:02x}{:02x}".format(*laser)
        assert laser != accent
        assert BeamLogo._ripple_color_for_boost(1.0, theme["name"], success, accent, accent) == laser

    for theme in DAY_THEMES.values():
        success = rgb(theme["success"])
        accent = rgb(theme["accent"])
        laser = BeamLogo._laser_rgb(theme["name"], accent, success)
        samples[("day", theme["name"])] = "#{:02x}{:02x}{:02x}".format(*laser)
        assert laser != accent
        assert BeamLogo._ripple_color_for_boost(1.0, theme["name"], success, accent, accent) == laser

    assert samples == expected

    autumn = THEMES["autumn"]
    autumn_color = BeamLogo._ripple_color_for_boost(
        0.82, "autumn", rgb(autumn["success"]), rgb(autumn["accent"]), rgb(autumn["accent"])
    )
    spring = THEMES["spring"]
    spring_color = BeamLogo._ripple_color_for_boost(
        0.82, "spring", rgb(spring["success"]), rgb(spring["accent"]), rgb(spring["accent"])
    )
    assert autumn_color != spring_color


def test_logo_intro_starts_without_blank_delay():
    from omnisee_every.tui.app import BeamLogo
    from omnisee_every.tui.wordmark import home_logo_text

    logo = BeamLogo(home_logo_text(), animate=True)
    rendered = []
    logo.update = lambda value: rendered.append(value)
    logo._frame_index = 0
    logo._render_frame()

    assert rendered[-1].plain.strip()


def test_logo_original_intro_animation():
    from omnisee_every.tui.app import BeamLogo
    from omnisee_every.tui import click_pulse_logo as pulse_logo
    from omnisee_every.tui.wordmark import home_logo_text

    # Just mount and render to ensure the original intro branch is exercised.
    logo = BeamLogo(home_logo_text(), animate=True)
    rendered = []
    logo.update = lambda x: rendered.append(x)
    logo._frame_index = 15
    logo._render_frame()  # Should not raise any errors
    assert rendered[-1].plain

    logo._frame_index = pulse_logo.INTRO_FRAMES + 1
    logo._logo_timer = object()
    logo._tick()
    assert logo._logo_timer is not None


def test_logo_rhythm_timer_runs_even_without_intro():
    from omnisee_every.tui.app import BeamLogo
    from omnisee_every.tui.wordmark import home_logo_text

    logo = BeamLogo(home_logo_text(), animate=False)
    calls = []
    logo.set_interval = lambda interval, callback: calls.append((interval, callback)) or object()
    logo._render_frame = lambda: None

    logo.on_mount()

    assert calls
    assert logo._logo_timer is not None
