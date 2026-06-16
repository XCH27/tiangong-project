import argparse
import ctypes
from dataclasses import dataclass
import math
import os
import re
import sys
import time


ANSI_RESET = "\033[0m"


def hex_to_rgb(value):
    value = value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in range(0, 6, 2))


BG_BASE = hex_to_rgb("#2B2925")
BG_PANEL = hex_to_rgb("#383631")
BG_ELEV = hex_to_rgb("#3F3D38")
BG_INPUT = hex_to_rgb("#383631")
TEXT_L1 = hex_to_rgb("#8D9E8B")
TEXT_L2 = hex_to_rgb("#E8E3D9")
TEXT_L3 = hex_to_rgb("#A39F96")
TEXT_L4 = hex_to_rgb("#7A7770")
ACCENT = hex_to_rgb("#8D9E8B")
BORDER_SUBTLE = hex_to_rgb("#4A4843")
BORDER_STRONG = hex_to_rgb("#8D9E8B")
SUCCESS = hex_to_rgb("#8D9E8B")
WARNING = hex_to_rgb("#BEAC8A")
ERROR = hex_to_rgb("#AC7A7A")
USER_BAR = hex_to_rgb("#9EAF9C")
AI_BAR = hex_to_rgb("#6B665C")

PINK = ACCENT
RIPPLE_GREEN = SUCCESS
RIPPLE_DEEP_GREEN = hex_to_rgb("#5C6B5A")
RIPPLE_PALE_GREEN = hex_to_rgb("#BFCFBD")
RIPPLE_GREENS = (
    RIPPLE_DEEP_GREEN,
    TEXT_L4,
    TEXT_L3,
    SUCCESS,
    RIPPLE_PALE_GREEN,
)
RIPPLE_LIFETIME_FRAMES = 105
MOSAIC_TILE_WIDTH = 3
MOSAIC_TILE_HEIGHT = 2
MOSAIC_BOOST_STEPS = 4
MOSAIC_RING_WIDTH = 5.2
CHARGE_RELEASE_SECONDS = 3.0
CHARGE_SPEEDUP_SECONDS = 1.0
CHARGE_COLORS = RIPPLE_GREENS
CHARGE_START_RADIUS = 0.8
CHARGE_END_RADIUS = 120.0
CHARGE_START_RING_WIDTH = 1.4
CHARGE_PREVIEW_RING_WIDTH = 12.0
CHARGE_SLOW_SPEED = 0.04
CHARGE_RELEASE_SPEED = 5.10
CHARGE_RELEASE_RING_WIDTH = 6.8
CHARGE_RELEASE_MIN_RING_WIDTH = 3.0
CHARGE_RELEASE_LIFETIME_FRAMES = 83
SHADE_RAMP = ("░", "▒", "▓", "█")
RHYTHM_FRAME_SPEED = 0.12
RHYTHM_COLUMN_PHASE = 0.24
RHYTHM_ROW_PHASE = 0.72
INTRO_BASE_FRAMES = 10
INTRO_BUILD_FRAMES = 48
INTRO_FRAMES = INTRO_BASE_FRAMES + INTRO_BUILD_FRAMES
INTRO_FORM_FRAMES = 18
INTRO_DISTANCE_SPEED = 1.7
INTRO_COLUMN_SCALE = 0.34
INTRO_ROW_SCALE = 2.15
MOUSE_EVENT_PATTERN = re.compile(r"\033\[<(?P<button>\d+);(?P<x>\d+);(?P<y>\d+)(?P<state>[Mm])")

LOGO = (
    r" █████  ██     ██ ██    ██ ██ ██   ██ ██████ ██████  ██████ ██████ ",
    r"██   ██ ████ ████ ███   ██ ██ ██   ██ ██     ██   ██ ██     ██     ",
    r"▓▓   ▓▓ ▓▓ ▓▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓ ▓▓   ▓▓ ▓▓▓▓▓  ▓▓▓▓▓▓  ▓▓▓▓▓▓ ▓▓▓▓▓  ",
    r"▒▒   ▒▒ ▒▒  ▒  ▒▒ ▒▒   ▒▒▒ ▒▒  ▒▒ ▒▒  ▒▒     ▒▒   ▒▒     ▒▒ ▒▒     ",
    r" ░░░░░  ░░     ░░ ░░    ░░ ░░   ░░░   ░░░░░░ ░░   ░░ ░░░░░░ ░░░░░░ ",
    r"                                                                   ",
    r"               ██   ██ ██ ██████ ██  █████  ██    ██               ",
    r"               ██   ██ ██ ██     ██ ██   ██ ███   ██               ",
    r"               ▓▓   ▓▓ ▓▓ ▓▓▓▓▓▓ ▓▓ ▓▓   ▓▓ ▓▓ ▓▓ ▓▓               ",
    r"                ▒▒ ▒▒  ▒▒     ▒▒ ▒▒ ▒▒   ▒▒ ▒▒   ▒▒▒               ",
    r"                 ░░░   ░░ ░░░░░░ ░░  ░░░░░  ░░    ░░               ",
)


@dataclass(frozen=True)
class Ripple:
    x: int
    y: int
    start_frame: int
    speed: float = 1.48
    ring_width: float = MOSAIC_RING_WIDTH
    lifetime_frames: int = RIPPLE_LIFETIME_FRAMES
    initial_radius: float = 0.0
    hold_start_frame: int | None = None
    release_frame: int | None = None
    release_radius: float = 0.0
    release_ring_width: float = 0.0


@dataclass(frozen=True)
class Charge:
    x: int
    y: int
    start_frame: int


def clamp(value, low, high):
    return max(low, min(high, value))


def scale_rgb(color, factor):
    return tuple(int(round(clamp(channel * factor, 0, 255))) for channel in color)


def blend_rgb(start, end, amount):
    amount = clamp(amount, 0.0, 1.0)
    return tuple(
        int(round(start[channel] + (end[channel] - start[channel]) * amount))
        for channel in range(3)
    )


def foreground_ansi(rgb):
    return f"\033[38;2;{rgb[0]};{rgb[1]};{rgb[2]}m"


def background_ansi(rgb):
    return f"\033[48;2;{rgb[0]};{rgb[1]};{rgb[2]}m"


def colorize(char, rgb):
    return f"{foreground_ansi(rgb)}{background_ansi(BG_BASE)}{char}"


def style_text(text, rgb, background=BG_BASE):
    return f"{foreground_ansi(rgb)}{background_ansi(background)}{text}{ANSI_RESET}"


def stable_noise(column, row):
    value = math.sin((column + 1) * 12.9898 + (row + 1) * 78.233) * 43758.5453
    return value - math.floor(value)


def mosaic_sample_cell(column, row):
    sample_column = (column // MOSAIC_TILE_WIDTH) * MOSAIC_TILE_WIDTH + MOSAIC_TILE_WIDTH // 2
    sample_row = (row // MOSAIC_TILE_HEIGHT) * MOSAIC_TILE_HEIGHT + MOSAIC_TILE_HEIGHT // 2
    return sample_column, sample_row


def ripple_green_for_cell(boost):
    index = int(round(clamp(boost, 0.0, 1.0) * (len(RIPPLE_GREENS) - 1)))
    return RIPPLE_GREENS[clamp(index, 0, len(RIPPLE_GREENS) - 1)]


def ripple_green_for_block(column, row, frame_index, boost):
    sample_column, sample_row = mosaic_sample_cell(column, row)
    base_index = int(round(clamp(boost, 0.0, 1.0) * (len(RIPPLE_GREENS) - 1)))
    tick = frame_index // 4
    noise = stable_noise(sample_column + tick * 7, sample_row + tick * 11)
    if noise < 0.18:
        offset = -2
    elif noise < 0.42:
        offset = -1
    elif noise < 0.72:
        offset = 0
    elif noise < 0.9:
        offset = 1
    else:
        offset = 2
    return RIPPLE_GREENS[clamp(base_index + offset, 0, len(RIPPLE_GREENS) - 1)]


def ripple_color(column, row, frame_index, boost):
    return blend_rgb(PINK, ripple_green_for_block(column, row, frame_index, boost), boost)


def charge_color_for_cell(column, row, frame_index, charge):
    sample_column, sample_row = mosaic_sample_cell(column, row)
    age = max(0, frame_index - charge.start_frame)
    flicker_tick = frame_index // 2
    noise = stable_noise(sample_column + flicker_tick * 17, sample_row + flicker_tick * 31)
    charge_level = min(1.0, age / max(int(CHARGE_RELEASE_SECONDS * 30), 1))
    index = int(noise * len(CHARGE_COLORS))
    index = clamp(index + int(charge_level * 1.5), 0, len(CHARGE_COLORS) - 1)
    return CHARGE_COLORS[index]


def charge_radius(charge, frame_index, fps):
    age = max(0, frame_index - charge.start_frame)
    speedup_frame = int(CHARGE_SPEEDUP_SECONDS * max(fps, 1))
    slow_age = min(age, speedup_frame)
    fast_age = max(0, age - speedup_frame)
    return CHARGE_START_RADIUS + slow_age * CHARGE_SLOW_SPEED + fast_age * CHARGE_RELEASE_SPEED


def charge_ring_width(charge, frame_index, fps):
    age = max(0, frame_index - charge.start_frame)
    progress = min(1.0, age / max(CHARGE_SPEEDUP_SECONDS * max(fps, 1), 1))
    return CHARGE_START_RING_WIDTH + (CHARGE_PREVIEW_RING_WIDTH - CHARGE_START_RING_WIDTH) * progress


def charge_effect(column, row, frame_index, charge, fps):
    sample_column, sample_row = mosaic_sample_cell(column, row)
    radius = charge_radius(charge, frame_index, fps)
    ring_width = charge_ring_width(charge, frame_index, fps)
    distance = math.hypot(sample_column - charge.x, (sample_row - charge.y) * 2.0)
    ring_delta = abs(distance - radius)
    if ring_delta > ring_width:
        return 0.0, RIPPLE_GREENS[0]

    edge = 1.0 - ring_delta / ring_width
    boost = clamp(edge * 1.15, 0.0, 1.0)
    return boost, ripple_green_for_cell(boost)


def charge_progress(charge, frame_index, fps):
    age = max(0, frame_index - charge.start_frame)
    return min(1.0, age / max(CHARGE_RELEASE_SECONDS * max(fps, 1), 1))


def charge_ripple(charge, frame_index, fps):
    age = max(1, frame_index - charge.start_frame)
    radius = charge_radius(charge, frame_index, fps)
    return Ripple(
        x=charge.x,
        y=charge.y,
        start_frame=frame_index - age,
        speed=radius / age,
        ring_width=charge_ring_width(charge, frame_index, fps),
        lifetime_frames=max(RIPPLE_LIFETIME_FRAMES, int(CHARGE_RELEASE_SECONDS * max(fps, 1) * 3)),
        initial_radius=0.0,
    )


def charge_ready_to_release(charge, frame_index, fps):
    return False


def force_ripple(x, y, start_frame):
    return Ripple(
        x=x,
        y=y,
        start_frame=start_frame,
        speed=CHARGE_RELEASE_SPEED,
        ring_width=CHARGE_RELEASE_RING_WIDTH,
        lifetime_frames=CHARGE_RELEASE_LIFETIME_FRAMES,
        initial_radius=0.0,
    )


def charge_release_ripple(charge, frame_index, fps):
    progress = charge_progress(charge, frame_index, fps)
    current_radius = charge_radius(charge, frame_index, fps)
    current_width = charge_ring_width(charge, frame_index, fps)

    return Ripple(
        x=charge.x,
        y=charge.y,
        start_frame=frame_index,
        speed=CHARGE_RELEASE_SPEED,
        ring_width=current_width + (CHARGE_RELEASE_RING_WIDTH - current_width) * progress,
        lifetime_frames=int(
            RIPPLE_LIFETIME_FRAMES
            + (CHARGE_RELEASE_LIFETIME_FRAMES - RIPPLE_LIFETIME_FRAMES) * progress
        ),
        initial_radius=current_radius,
    )


def press_ripple(x, y, start_frame):
    return Ripple(
        x=x,
        y=y,
        start_frame=start_frame,
        speed=CHARGE_RELEASE_SPEED,
        ring_width=CHARGE_START_RING_WIDTH,
        lifetime_frames=CHARGE_RELEASE_LIFETIME_FRAMES,
        initial_radius=CHARGE_START_RADIUS,
        hold_start_frame=start_frame,
    )


def release_interactive_ripple(ripple, frame_index, fps):
    if ripple.hold_start_frame is None:
        return ripple

    return Ripple(
        x=ripple.x,
        y=ripple.y,
        start_frame=ripple.start_frame,
        speed=CHARGE_RELEASE_SPEED,
        ring_width=CHARGE_RELEASE_RING_WIDTH,
        lifetime_frames=CHARGE_RELEASE_LIFETIME_FRAMES,
        initial_radius=ripple.initial_radius,
        hold_start_frame=ripple.hold_start_frame,
        release_frame=frame_index,
        release_radius=ripple_radius(ripple, frame_index, fps),
        release_ring_width=CHARGE_RELEASE_RING_WIDTH,
    )


def should_auto_release(ripple, frame_index, fps):
    if ripple is None or ripple.hold_start_frame is None or ripple.release_frame is not None:
        return False
    return frame_index - ripple.hold_start_frame >= int(CHARGE_SPEEDUP_SECONDS * max(fps, 1))


def handle_mouse_event(ripples, active_ripple, event_type, x, y, frame_index, fps):
    if event_type == "press":
        if active_ripple is not None:
            return ripples, active_ripple
        active_ripple = press_ripple(x, y, frame_index)
        return ripples + [active_ripple], active_ripple

    if event_type == "release":
        if active_ripple is None:
            return ripples, active_ripple
        released = release_interactive_ripple(active_ripple, frame_index, fps)
        return [released if ripple is active_ripple else ripple for ripple in ripples], None

    if event_type == "tick" and should_auto_release(active_ripple, frame_index, fps):
        released = release_interactive_ripple(active_ripple, frame_index, fps)
        return [released if ripple is active_ripple else ripple for ripple in ripples], None

    return ripples, active_ripple


def handle_pointer_event(ripples, active_ripple, mouse_down, event_type, x, y, frame_index, fps):
    if event_type == "press":
        if mouse_down:
            return ripples, active_ripple, mouse_down
        ripples, active_ripple = handle_mouse_event(
            ripples, active_ripple, event_type, x, y, frame_index, fps
        )
        return ripples, active_ripple, True

    if event_type == "release":
        if active_ripple is not None:
            ripples, active_ripple = handle_mouse_event(
                ripples, active_ripple, event_type, x, y, frame_index, fps
            )
        return ripples, active_ripple, False

    ripples, active_ripple = handle_mouse_event(
        ripples, active_ripple, event_type, x, y, frame_index, fps
    )
    return ripples, active_ripple, mouse_down


def ripple_radius(ripple, frame_index, fps=30):
    if ripple.hold_start_frame is None:
        age = frame_index - ripple.start_frame
        return ripple.initial_radius + max(0, age) * ripple.speed

    if ripple.release_frame is not None and frame_index >= ripple.release_frame:
        return ripple.release_radius + (frame_index - ripple.release_frame) * CHARGE_RELEASE_SPEED

    charge = Charge(ripple.x, ripple.y, ripple.hold_start_frame)
    return charge_radius(charge, frame_index, fps)


def ripple_ring_width(ripple, frame_index, fps=30):
    if ripple.hold_start_frame is None:
        return ripple.ring_width

    if ripple.release_frame is not None and frame_index >= ripple.release_frame:
        age = frame_index - ripple.release_frame
        return max(CHARGE_RELEASE_MIN_RING_WIDTH, ripple.release_ring_width - age * 0.16)

    charge = Charge(ripple.x, ripple.y, ripple.hold_start_frame)
    return charge_ring_width(charge, frame_index, fps)


def ripple_alive(ripple, frame_index):
    if ripple.hold_start_frame is not None and ripple.release_frame is None:
        return True

    if ripple.release_frame is not None:
        return frame_index - ripple.release_frame <= ripple.lifetime_frames

    return frame_index - ripple.start_frame <= ripple.lifetime_frames


def quantize_boost(boost):
    if boost < 0.12:
        return 0.0
    boost = clamp(boost, 0.0, 1.0)
    return max(0.5, round(boost * MOSAIC_BOOST_STEPS) / MOSAIC_BOOST_STEPS)


def rhythm_char(char, column, frame_index, row=0):
    if char not in SHADE_RAMP:
        return char

    base_index = SHADE_RAMP.index(char)
    height_offset = stable_noise(column, row)
    beat = (
        math.sin(
            frame_index * RHYTHM_FRAME_SPEED
            + column * RHYTHM_COLUMN_PHASE
            + row * RHYTHM_ROW_PHASE
            + height_offset * math.tau
        )
        + 1.0
    ) / 2.0
    accent = (math.sin(frame_index * 0.05 + height_offset * math.tau) + 1.0) / 2.0
    height_gain = 0.55 + height_offset * 0.45
    lift = int(math.floor((beat * height_gain + accent * 0.22) * 2.8))
    return SHADE_RAMP[min(len(SHADE_RAMP) - 1, base_index + lift)]


def intro_cell_progress(row, column, frame_index, logo_height, logo_width):
    if frame_index >= INTRO_FRAMES:
        return 1.0
    if frame_index < INTRO_BASE_FRAMES:
        return 0.0

    build_frame = frame_index - INTRO_BASE_FRAMES
    sample_column, sample_row = mosaic_sample_cell(column, row)
    center_column = (logo_width - 1) / 2.0
    center_row = (logo_height - 1) / 2.0
    distance = math.hypot(
        (sample_column - center_column) * INTRO_COLUMN_SCALE,
        (sample_row - center_row) * INTRO_ROW_SCALE,
    )
    tile_stagger = stable_noise(sample_column, sample_row) * 2.2
    start_frame = distance * INTRO_DISTANCE_SPEED + tile_stagger
    linear = clamp((build_frame - start_frame) / INTRO_FORM_FRAMES, 0.0, 1.0)
    return linear * linear * (3.0 - 2.0 * linear)


def intro_density_char(char, progress):
    if char not in SHADE_RAMP:
        return char

    if progress >= 0.96:
        return char

    stage_index = int(clamp(math.floor(progress * 4.0), 0, 3))
    return ("░", "▒", "▓", "█")[stage_index]


def intro_cell_style(char, row, column, frame_index, logo_height, logo_width):
    progress = intro_cell_progress(row, column, frame_index, logo_height, logo_width)
    if progress <= 0.0:
        return "░", RIPPLE_DEEP_GREEN, progress

    display_char = intro_density_char(char, progress)
    return display_char, PINK, progress


def extract_sgr_mouse_clicks(text):
    return [(x, y) for event_type, x, y in extract_sgr_mouse_events(text) if event_type == "press"]


def extract_sgr_mouse_events(text):
    events = []
    for match in MOUSE_EVENT_PATTERN.finditer(text):
        button = int(match.group("button"))
        is_left_button = button < 64 and button & 3 == 0
        if not is_left_button:
            continue

        event_type = "press" if match.group("state") == "M" else "release"
        events.append((event_type, int(match.group("x")), int(match.group("y"))))
    return events


def ripple_boost(
    column,
    row,
    frame_index,
    ripple,
    speed=1.45,
    ring_width=2.1,
    intensity=1.15,
    lifetime_frames=RIPPLE_LIFETIME_FRAMES,
):
    age = frame_index - ripple.start_frame
    if age < 0 or age > lifetime_frames:
        return 0.0

    radius = age * speed
    distance = math.hypot(column - ripple.x, (row - ripple.y) * 2.0)
    ring = math.exp(-((distance - radius) ** 2) / (2.0 * ring_width**2))
    fade = 1.0 - age / lifetime_frames
    return intensity * ring * fade


def mosaic_ripple_boost(column, row, frame_index, ripple):
    return mosaic_ripple_effect(column, row, frame_index, ripple)[0]


def mosaic_ripple_effect(column, row, frame_index, ripple, fps=30):
    sample_column, sample_row = mosaic_sample_cell(column, row)
    if not ripple_alive(ripple, frame_index):
        return 0.0, RIPPLE_GREENS[0]

    radius = ripple_radius(ripple, frame_index, fps)
    ring_width = ripple_ring_width(ripple, frame_index, fps)
    distance = math.hypot(sample_column - ripple.x, (sample_row - ripple.y) * 2.0)

    if ripple.hold_start_frame is not None and ripple.release_frame is None:
        outer_radius = radius + ring_width
        if distance > outer_radius:
            return 0.0, RIPPLE_GREENS[0]

        if distance <= radius:
            fill = 0.82 if radius > 1.0 else 1.0
        else:
            fill = 1.0 - (distance - radius) / max(ring_width, 0.01)
            fill = max(0.55, fill)
        return fill, ripple_green_for_block(column, row, frame_index, fill)

    ring_delta = abs(distance - radius)
    if ring_delta > ring_width:
        return 0.0, RIPPLE_GREENS[0]

    edge = 1.0 - ring_delta / ring_width
    fade_age = (
        frame_index - ripple.release_frame
        if ripple.release_frame is not None
        else frame_index - ripple.start_frame
    )
    fade = 1.0 - max(0, fade_age) / ripple.lifetime_frames
    boost = quantize_boost(edge * fade)
    return boost, ripple_green_for_block(column, row, frame_index, boost)


def render_frame(logo, frame_index, ripples, rhythm=True, charge=None, fps=30, intro=False):
    rendered_lines = []
    active_ripples = list(ripples)
    logo_height = len(logo)
    logo_width = max((len(line) for line in logo), default=0)

    for row, line in enumerate(logo):
        pieces = []
        for column, char in enumerate(line):
            if char == " ":
                pieces.append(f"{background_ansi(BG_BASE)} ")
                continue

            effects = [mosaic_ripple_effect(column, row, frame_index, ripple, fps=fps) for ripple in active_ripples]
            boost, green = max(effects, default=(0.0, RIPPLE_GREENS[0]), key=lambda effect: effect[0])
            base_color = PINK
            if intro and frame_index < INTRO_FRAMES:
                display_char, base_color, intro_progress = intro_cell_style(
                    char, row, column, frame_index, logo_height, logo_width
                )
                if display_char == " ":
                    pieces.append(f"{background_ansi(BG_BASE)} ")
                    continue
                if rhythm and intro_progress >= 1.0:
                    display_char = rhythm_char(display_char, column, frame_index, row=row)
            else:
                display_char = rhythm_char(char, column, frame_index, row=row) if rhythm else char
            color = blend_rgb(base_color, green, boost)
            pieces.append(colorize(display_char, color))
        rendered_lines.append("".join(pieces) + ANSI_RESET)

    return "\n".join(rendered_lines) + "\n"


def configure_terminal_encoding():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    if os.name != "nt":
        return

    kernel32 = ctypes.windll.kernel32
    kernel32.SetConsoleOutputCP(65001)
    kernel32.SetConsoleCP(65001)


def enable_windows_ansi():
    if os.name != "nt":
        return

    kernel32 = ctypes.windll.kernel32
    output_handle = kernel32.GetStdHandle(-11)
    mode = ctypes.c_ulong()
    if kernel32.GetConsoleMode(output_handle, ctypes.byref(mode)):
        kernel32.SetConsoleMode(output_handle, mode.value | 0x0004)


class TerminalMouse:
    def __init__(self):
        self.restore_mode = None
        self.restore_termios = None
        self.input_handle = None

    def __enter__(self):
        if os.name == "nt":
            self._enable_windows_input()
        else:
            self._enable_posix_input()

        sys.stdout.write("\033[?1000h\033[?1006h")
        sys.stdout.flush()
        return self

    def __exit__(self, exc_type, exc, traceback):
        sys.stdout.write("\033[?1000l\033[?1006l")
        sys.stdout.flush()

        if os.name == "nt" and self.restore_mode is not None:
            ctypes.windll.kernel32.SetConsoleMode(self.input_handle, self.restore_mode)
        elif self.restore_termios is not None:
            import termios

            termios.tcsetattr(sys.stdin.fileno(), termios.TCSADRAIN, self.restore_termios)

    def _enable_windows_input(self):
        kernel32 = ctypes.windll.kernel32
        self.input_handle = kernel32.GetStdHandle(-10)
        mode = ctypes.c_ulong()
        if not kernel32.GetConsoleMode(self.input_handle, ctypes.byref(mode)):
            return

        self.restore_mode = mode.value
        enable_virtual_terminal_input = 0x0200
        enable_extended_flags = 0x0080
        enable_quick_edit_mode = 0x0040
        new_mode = (mode.value | enable_virtual_terminal_input | enable_extended_flags) & ~enable_quick_edit_mode
        kernel32.SetConsoleMode(self.input_handle, new_mode)

    def _enable_posix_input(self):
        import termios
        import tty

        fd = sys.stdin.fileno()
        self.restore_termios = termios.tcgetattr(fd)
        tty.setcbreak(fd)

    def read_available(self):
        if os.name == "nt":
            import msvcrt

            chars = []
            while msvcrt.kbhit():
                chars.append(msvcrt.getwch())
            return "".join(chars)

        import os as posix_os
        import select

        fd = sys.stdin.fileno()
        chunks = []
        while select.select([sys.stdin], [], [], 0)[0]:
            chunks.append(posix_os.read(fd, 4096).decode("utf-8", errors="ignore"))
        return "".join(chunks)


def clear_screen():
    sys.stdout.write(f"{background_ansi(BG_BASE)}\033[2J\033[H")
    sys.stdout.flush()


def draw_frame(logo, frame_index, logo_top, logo_left, ripples, charge=None, fps=30, intro=True):
    sys.stdout.write(f"\033[{logo_top};{logo_left}H")
    for line in render_frame(logo, frame_index, ripples, charge=charge, fps=fps, intro=intro).splitlines():
        sys.stdout.write(line + background_ansi(BG_BASE) + "\033[K" + ANSI_RESET + "\n")


def animate_click_pulse(logo, fps=30, logo_top=3, logo_left=1):
    delay = 1.0 / max(fps, 1)
    frame_index = 0
    ripples = []
    active_ripple = None
    mouse_down = False

    sys.stdout.write("\033[?25l")
    sys.stdout.flush()

    try:
        with TerminalMouse() as mouse:
            while True:
                raw_input = mouse.read_available()
                if "q" in raw_input.lower():
                    break

                for event_type, screen_x, screen_y in extract_sgr_mouse_events(raw_input):
                    logo_x = screen_x - logo_left
                    logo_y = screen_y - logo_top
                    ripples, active_ripple, mouse_down = handle_pointer_event(
                        ripples,
                        active_ripple,
                        mouse_down,
                        event_type,
                        logo_x,
                        logo_y,
                        frame_index,
                        fps,
                    )

                ripples, active_ripple, mouse_down = handle_pointer_event(
                    ripples,
                    active_ripple,
                    mouse_down,
                    "tick",
                    0,
                    0,
                    frame_index,
                    fps,
                )

                ripples = [
                    ripple
                    for ripple in ripples
                    if ripple_alive(ripple, frame_index)
                ]
                draw_frame(logo, frame_index, logo_top, logo_left, ripples, fps=fps)
                sys.stdout.flush()
                frame_index += 1
                time.sleep(delay)
    finally:
        sys.stdout.write(ANSI_RESET + "\033[?25h")
        sys.stdout.flush()


def parse_args():
    parser = argparse.ArgumentParser(description="Click-only terminal pulse animation.")
    parser.add_argument("--fps", type=int, default=30, help="frames per second")
    parser.add_argument("--no-clear", action="store_true", help="do not clear the terminal first")
    return parser.parse_args()


def main():
    args = parse_args()
    configure_terminal_encoding()
    enable_windows_ansi()

    if not args.no_clear:
        clear_screen()

    print(style_text("[ 短按释放小波，长按慢速扩散，1 秒后加速，松开释放，按 q 退出 ]", TEXT_L3))
    animate_click_pulse(LOGO, fps=args.fps)
    print(style_text("\n[ 已退出 ]\n", TEXT_L4))


if __name__ == "__main__":
    main()
