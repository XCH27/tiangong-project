"""Click-pulse logo widget (BeamLogo) adapted from the standalone terminal prototype."""

from __future__ import annotations
from typing import ClassVar

from textual import events
from textual.widgets import Static

from omnisee_every_v1.tui import click_pulse_logo as pulse_logo
from omnisee_every_v1.tui.theme_runtime import resolve_active_theme

_ACTIVE_THEME = resolve_active_theme()


class BeamLogo(Static):
    """Click-pulse logo adapted from the standalone terminal prototype."""

    _INTERVAL = 1 / 30
    _LOGO_COLOR = "#{:02x}{:02x}{:02x}".format(*pulse_logo.PINK)
    _SHADE_RAMP: ClassVar[tuple[str, ...]] = pulse_logo.SHADE_RAMP
    _RIPPLE_LIFETIME_FRAMES = pulse_logo.RIPPLE_LIFETIME_FRAMES
    _MOSAIC_TILE_WIDTH = pulse_logo.MOSAIC_TILE_WIDTH
    _MOSAIC_TILE_HEIGHT = pulse_logo.MOSAIC_TILE_HEIGHT
    _MOSAIC_BOOST_STEPS = pulse_logo.MOSAIC_BOOST_STEPS
    _MOSAIC_RING_WIDTH = pulse_logo.MOSAIC_RING_WIDTH
    _RHYTHM_FRAME_SPEED = pulse_logo.RHYTHM_FRAME_SPEED
    _RHYTHM_COLUMN_PHASE = pulse_logo.RHYTHM_COLUMN_PHASE
    _RHYTHM_ROW_PHASE = pulse_logo.RHYTHM_ROW_PHASE
    _RIPPLE_GREENS: ClassVar[tuple[tuple[int, int, int], ...]] = pulse_logo.RIPPLE_GREENS
    _LASER_COLORS: ClassVar[dict[str, str]] = {
        # Final V1 ink-wash bloom colors from theme.py laser_color.
        "#9a8bb6": "#D1C4E0",  # 魏晋幽兰 night
        "#8b7aa3": "#B8A8CC",  # 魏晋幽兰 day
        "#8bb69a": "#C4E0D1",  # 唐宋青竹 night
        "#7aa38b": "#A8CCB8",  # 唐宋青竹 day
        "#c9912f": "#F4D08A",  # 明清金菊 night
        "#9a6f1e": "#D9A845",  # 明清金菊 day
        "#c8453c": "#F08C84",  # 秦汉红梅 night
        "#b23b33": "#D9756B",  # 秦汉红梅 day
    }

    def __init__(self, logo: str, animate: bool = True, **kwargs) -> None:
        super().__init__(logo, markup=True, **kwargs)
        self._logo_text = logo
        self._logo_lines = logo.splitlines()
        self._logo_max_width = max((len(ln) for ln in self._logo_lines), default=0)
        self._animate = animate
        self._frame_index = 0
        self._ripples: list[pulse_logo.Ripple] = []
        self._active_ripple: pulse_logo.Ripple | None = None
        self._mouse_down = False
        self._logo_timer = None
        self.can_focus = False

    def on_mount(self) -> None:
        self._render_frame()
        self._ensure_logo_timer()

    def _tick(self) -> None:
        self._frame_index += 1
        self._ripples, self._active_ripple, self._mouse_down = pulse_logo.handle_pointer_event(
            self._ripples,
            self._active_ripple,
            self._mouse_down,
            "tick",
            0,
            0,
            self._frame_index,
            30,
        )
        self._ripples = [
            ripple
            for ripple in self._ripples
            if pulse_logo.ripple_alive(ripple, self._frame_index)
        ]
        self._render_frame()

    def on_mouse_down(self, event: events.MouseDown) -> None:
        x = int(event.x)
        y = int(event.y)
        if self._has_logo_cell(x, y):
            self._ripples, self._active_ripple, self._mouse_down = pulse_logo.handle_pointer_event(
                self._ripples,
                self._active_ripple,
                self._mouse_down,
                "press",
                x,
                y,
                self._frame_index,
                30,
            )
            self._ensure_logo_timer()
            event.stop()

    def on_mouse_up(self, event: events.MouseUp) -> None:
        if self._active_ripple is None and not self._mouse_down:
            return
        self._ripples, self._active_ripple, self._mouse_down = pulse_logo.handle_pointer_event(
            self._ripples,
            self._active_ripple,
            self._mouse_down,
            "release",
            int(event.x),
            int(event.y),
            self._frame_index,
            30,
        )
        self._ensure_logo_timer()
        event.stop()

    def on_mouse_leave(self, event: events.MouseLeave) -> None:
        if self._active_ripple is None and not self._mouse_down:
            return
        self._ripples, self._active_ripple, self._mouse_down = pulse_logo.handle_pointer_event(
            self._ripples,
            self._active_ripple,
            self._mouse_down,
            "release",
            0,
            0,
            self._frame_index,
            30,
        )
        self._ensure_logo_timer()
        event.stop()

    def trigger_pulse_at(self, x: int, y: int) -> None:
        cell = self._nearest_logo_cell(x, y)
        if cell is None:
            return
        col, row = cell
        self._ripples.append(pulse_logo.force_ripple(col, row, self._frame_index))
        self._ensure_logo_timer()

    def _has_logo_cell(self, x: int, y: int) -> bool:
        return (
            0 <= y < len(self._logo_lines)
            and 0 <= x < len(self._logo_lines[y])
            and self._logo_lines[y][x] != " "
        )

    def _nearest_logo_cell(self, x: int, y: int) -> tuple[int, int] | None:
        candidates = [
            (abs(col - x) + abs(row - y), col, row)
            for row, line in enumerate(self._logo_lines)
            for col, char in enumerate(line)
            if char != " "
        ]
        if not candidates:
            return None
        _, col, row = min(candidates)
        return col, row

    def _ensure_logo_timer(self) -> None:
        if self._logo_timer is None:
            self._logo_timer = self.set_interval(self._INTERVAL, self._tick)

    def _stop_logo_timer(self) -> None:
        if self._logo_timer:
            self._logo_timer.stop()
            self._logo_timer = None

    def _render_frame(self) -> None:
        from rich.text import Text as RichText
        from rich.style import Style

        logo_rgb = self._hex_to_rgb(_ACTIVE_THEME["accent"])
        accent_rgb = self._hex_to_rgb(_ACTIVE_THEME["accent"])
        success_rgb = self._hex_to_rgb(_ACTIVE_THEME["success"])
        is_intro = self._animate and self._frame_index < pulse_logo.INTRO_FRAMES
        logo_height = len(self._logo_lines)
        intro_frame = self._frame_index + pulse_logo.INTRO_BASE_FRAMES

        text = RichText()
        for row, line in enumerate(self._logo_lines):
            if row:
                text.append("\n")
            for col, ch in enumerate(line):
                if ch == " ":
                    text.append(" ")
                    continue

                base_color = logo_rgb
                if is_intro:
                    display, _intro_color, intro_progress = pulse_logo.intro_cell_style(
                        ch,
                        row,
                        col,
                        intro_frame,
                        logo_height,
                        self._logo_max_width,
                    )
                    base_color = self._intro_color(intro_progress, logo_rgb, accent_rgb, success_rgb)
                    if intro_progress >= 1.0:
                        display = pulse_logo.rhythm_char(display, col, self._frame_index, row=row)
                else:
                    display = pulse_logo.rhythm_char(ch, col, self._frame_index, row=row)

                effects = [
                    pulse_logo.mosaic_ripple_effect(col, row, self._frame_index, ripple, fps=30)
                    for ripple in self._ripples
                ]
                boost, green = max(
                    effects,
                    default=(0.0, pulse_logo.RIPPLE_GREENS[0]),
                    key=lambda effect: effect[0],
                )
                green = self._ripple_color_for_boost(
                    boost, _ACTIVE_THEME["name"], success_rgb, accent_rgb, logo_rgb
                )

                color = pulse_logo.blend_rgb(base_color, green, boost)
                text.append(display, style=Style(bold=True, color=self._rgb_to_hex(color)))
        self.update(text)

    def _rhythm_char(self, ch: str, col: int, row: int) -> str:
        return pulse_logo.rhythm_char(ch, col, self._frame_index, row=row)

    def _logo_color(self, row: int, col: int) -> str:
        boost, green = self._ripple_signal(col, row)
        logo_rgb = self._hex_to_rgb(_ACTIVE_THEME["accent"])
        accent_rgb = self._hex_to_rgb(_ACTIVE_THEME["accent"])
        success_rgb = self._hex_to_rgb(_ACTIVE_THEME["success"])
        green = self._ripple_color_for_boost(
            boost, _ACTIVE_THEME["name"], success_rgb, accent_rgb, logo_rgb
        )
        color = pulse_logo.blend_rgb(logo_rgb, green, boost)
        return self._rgb_to_hex(color)

    def _ripple_signal(self, col: int, row: int) -> tuple[float, tuple[int, int, int]]:
        strongest = (0.0, pulse_logo.RIPPLE_GREENS[0])
        for ripple in self._ripples:
            effect = pulse_logo.mosaic_ripple_effect(col, row, self._frame_index, ripple)
            if effect[0] > strongest[0]:
                strongest = effect
        return strongest

    def _ripple_factor(self, col: int, row: int, ripple: pulse_logo.Ripple) -> float:
        return pulse_logo.mosaic_ripple_boost(col, row, self._frame_index, ripple)

    @staticmethod
    def _intro_color(
        progress: float,
        title: tuple[int, int, int],
        accent: tuple[int, int, int],
        success: tuple[int, int, int],
    ) -> tuple[int, int, int]:
        laser = BeamLogo._laser_rgb("", title, success)
        if progress <= 0.0:
            return laser
        # Add a burning bright white scan line highlight on the leading wavefront edge:
        if 0.05 < progress < 0.35:
            factor = 1.0 - abs(progress - 0.2) / 0.15
            factor = max(0.0, min(1.0, factor))
            bright_color = (255, 255, 255)
            temp = pulse_logo.blend_rgb(laser, title, progress)
            return pulse_logo.blend_rgb(temp, bright_color, factor * 0.7)
        return pulse_logo.blend_rgb(laser, title, progress)

    @staticmethod
    def _ripple_color_for_boost(
        boost: float,
        theme_name: str,
        success: tuple[int, int, int],
        accent: tuple[int, int, int],
        title: tuple[int, int, int],
    ) -> tuple[int, int, int]:
        boost = pulse_logo.clamp(boost, 0.0, 1.0)
        _ = theme_name
        return pulse_logo.blend_rgb(title, BeamLogo._laser_rgb(theme_name, accent, success), boost)

    @staticmethod
    def _hex_to_rgb(color: str) -> tuple[int, int, int]:
        value = color.lstrip("#")
        return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)

    @staticmethod
    def _complement_rgb(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
        return 255 - rgb[0], 255 - rgb[1], 255 - rgb[2]

    @staticmethod
    def _laser_rgb(
        theme_name: str,
        accent: tuple[int, int, int],
        fallback: tuple[int, int, int],
    ) -> tuple[int, int, int]:
        _ = theme_name
        color = "#{:02x}{:02x}{:02x}".format(*accent).lower()
        value = BeamLogo._LASER_COLORS.get(color)
        if value is None:
            return fallback
        return BeamLogo._hex_to_rgb(value)

    @staticmethod
    def _rgb_to_hex(rgb: tuple[int, int, int]) -> str:
        return "#{:02x}{:02x}{:02x}".format(*rgb)
