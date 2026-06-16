"""Mimi — electronic pet mascot (小幽灵)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import ClassVar

from textual.widgets import Static

from omnisee_every_v1.tui.theme import pick_theme


@dataclass(frozen=True)
class MascotVariant:
    animal: str
    idle: tuple[str, ...]
    work: tuple[str, ...]
    done: tuple[str, ...]
    error: tuple[str, ...]
    interval: float = 2.4


LEGACY_MIMI_FRAMES: dict[str, str] = {
    "idle": "ʕ◕ᴥ◕ʔ",
    "blink": "ʕ-ᴥ-ʔ",
    "work": "ʕ◉ᴥ◉ʔ",
    "done": "ʕ✿ᴥ✿ʔ",
    "sleep": "ʕ‒ᴥ‒ʔ",
    "error": "ʕ╥ᴥ╥ʔ",
}

CLASSIC_MIMI_FRAMES: dict[str, tuple[str, ...]] = {
    "idle": ("ʕ◕ᴥ◕ʔ", "ʕ-ᴥ-ʔ"),
    "work": ("ʕ◓ᴥ◓ʔ", "ʕ◒ᴥ◒ʔ"),
    "done": ("ʕ✯ᴥ✯ʔ",),
    "error": ("ʕ>ᴥ<ʔ",),
}


_VARIANTS: dict[tuple[str, str], MascotVariant] = {
    ("spring", "day"): MascotVariant(
        "cat",
        idle=("^ • ⩊ • ^", "^ - ⩊ - ^"),
        work=("^ ⚆ ⩊ • ^", "^ • ⩊ ⚆ ^"),
        done=("^ ◡ ⩊ ◡ ^",),
        error=("^ ✖ ⩊ ✖ ^",),
        interval=3.0,
    ),
    ("spring", "night"): MascotVariant(
        "arctic_fox",
        idle=("ᶘ -ᴥ- ᶅ", "ᶘ ◡ᴥ◡ ᶅ"),
        work=("ᶘ ◉ᴥ• ᶅ", "ᶘ •ᴥ◉ ᶅ"),
        done=("ᶘ ✿ᴥ✿ ᶅ",),
        error=("ᶘ ╥ᴥ╥ ᶅ",),
        interval=3.4,
    ),
    ("summer", "day"): MascotVariant(
        "puppy",
        idle=("U ᵕ ﻌ ᵕ U", "U - ﻌ - U"),
        work=("U ⊙ ﻌ ⊙ U", "U º ﻌ º U"),
        done=("U ᵔ ﻌ ᵔ U",),
        error=("U ✖ ﻌ ✖ U",),
        interval=2.8,
    ),
    ("summer", "night"): MascotVariant(
        "bunny",
        idle=("૮ 0 ᆺ 0 ა", "૮ - ᆺ - ა"),
        work=("૮ ⍤ ᆺ ⍤ ა", "૮ 0 ᆺ 0 ა"),
        done=("૮ ᵔ ᆺ ᵔ ა",),
        error=("૮ ∅ ᆺ ∅ ა",),
        interval=3.6,
    ),
    ("autumn", "day"): MascotVariant(
        "hamster",
        idle=("ᘛ º ﻌ º ᘚ", "ᘛ - ﻌ - ᘚ"),
        work=("ᘛ ◯ ﻌ ◯ ᘚ", "ᘛ ◍ ﻌ ◍ ᘚ"),
        done=("ᘛ > ﻌ < ᘚ",),
        error=("ᘛ ✖ ﻌ ✖ ᘚ",),
        interval=2.9,
    ),
    ("autumn", "night"): MascotVariant(
        "wide_bear",
        idle=("ʕ ˘ᴥ˘ ʔ", "ʕ -ᴥ- ʔ"),
        work=("ʕ ◒ᴥ◒ ʔ", "ʕ ◓ᴥ◓ ʔ"),
        done=("ʕ ᵔᴥᵔ ʔ",),
        error=("ʕ ⍜ᴥ⍜ ʔ",),
        interval=3.8,
    ),
    ("winter", "day"): MascotVariant(
        "owl",
        idle=("[ ๏ ▾ ๏ ]", "[ - ▾ - ]"),
        work=("[ ◐ ▾ ◑ ]", "[ ◑ ▾ ◐ ]"),
        done=("[ ^ ▾ ^ ]",),
        error=("[ ✖ ▾ ✖ ]",),
        interval=3.2,
    ),
    ("winter", "night"): MascotVariant(
        "classic_mimi",
        idle=CLASSIC_MIMI_FRAMES["idle"],
        work=CLASSIC_MIMI_FRAMES["work"],
        done=CLASSIC_MIMI_FRAMES["done"],
        error=CLASSIC_MIMI_FRAMES["error"],
        interval=3.1,
    ),
}


def mascot_variant(season: str, mode: str) -> MascotVariant:
    season_key = season if season in {"spring", "summer", "autumn", "winter"} else "spring"
    mode_key = "day" if (mode or "").lower() in {"day", "light"} else "night"
    return _VARIANTS[(season_key, mode_key)]


def _mascot_accent() -> str:
    try:
        from omnisee_every.backend import load_config

        cfg = load_config()
    except Exception:
        cfg = {}
    return pick_theme(cfg)["accent"]



_MASCOT_CSS = (
    f"PetMascot {{ width: 10; height: 1; "
    f"color: {_mascot_accent()}; background: transparent; "
    f"content-align: right middle; }}"
)


class PetMascot(Static):
    """Mimi — single-line face (no ◜◝ corner frame)."""

    FRAMES: ClassVar[dict[str, str]] = LEGACY_MIMI_FRAMES
    DEFAULT_CSS = _MASCOT_CSS

    def __init__(self, slide_in: bool = False, compact: bool = False, **kwargs) -> None:
        del compact  # kept for call-site compatibility
        self._variant = self._active_variant()
        super().__init__(self._variant.idle[0], **kwargs)
        self._state = "idle"
        self._tick_count = 0
        self._override_ticks = 0
        self._frame_pos = 0
        self._slide_in = slide_in

    def _active_variant(self) -> MascotVariant:
        try:
            from omnisee_every.backend import load_config

            cfg = load_config()
        except Exception:
            cfg = {}
        ui = cfg.get("ui") if isinstance(cfg, dict) else {}
        mode = (ui or {}).get("theme_mode", "night") if isinstance(ui, dict) else "night"
        theme = pick_theme(cfg)
        return mascot_variant(theme["name"], mode)

    def on_mount(self) -> None:
        self.set_interval(self._variant.interval, self._tick)
        if self._slide_in:
            self.display = False
            self.set_timer(0.5, self._appear)

    def _appear(self) -> None:
        self.display = True

    def set_state(self, state: str, duration_ticks: int = 0) -> None:
        """Switch to state; auto-return to idle after duration_ticks (0 = permanent)."""
        self._state = state
        self._override_ticks = duration_ticks
        self._repaint()

    def _tick(self) -> None:
        import random

        self._tick_count += 1
        self._frame_pos += 1

        if self._override_ticks > 0:
            self._override_ticks -= 1
            if self._override_ticks == 0 and self._state not in ("idle", "sleep"):
                self._state = "idle"
                self._repaint()
            return

        if self._state == "idle":
            if self._tick_count % 7 == 0:
                self._state = "blink"
                self._override_ticks = 1
            elif random.random() < 0.03:
                self._state = "blink"
                self._override_ticks = 1
        self._repaint()

    def _repaint(self) -> None:
        frames = self._frames_for_state(self._state)
        self.update(frames[self._frame_pos % len(frames)])

    def _frames_for_state(self, state: str) -> tuple[str, ...]:
        if state == "blink":
            return self._variant.idle[1:] or self._variant.idle
        if state == "work":
            return self._variant.work
        if state == "done":
            return self._variant.done
        if state == "error":
            return self._variant.error
        if state == "sleep":
            return self._variant.idle[1:] or self._variant.idle
        return self._variant.idle
