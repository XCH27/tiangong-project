"""Progress and context bar markup rendering helpers for the V1 TUI."""
from __future__ import annotations


def block_progress_bar(
    completed: int,
    total: int = 7,
    width: int = 12,
    *,
    theme: dict[str, str],
) -> str:
    """Render a smooth block progress bar: `███▒╌╌╌╌╌╌╌╌ 42%`.

    Uses Unicode shade blocks: ░ (light), ▒ (medium), ▓ (dark), █ (full) for a fading edge.
    """
    if total <= 0:
        return ""
    fraction = min(max(completed / total, 0.0), 1.0)
    filled_width = fraction * width
    filled_int = int(filled_width)
    remainder = filled_width - filled_int
    
    bar = "█" * filled_int
    if filled_int < width:
        if remainder > 0.75:
            bar += "▓"
        elif remainder > 0.5:
            bar += "▒"
        elif remainder > 0.25:
            bar += "░"
        else:
            bar += "╌"
        bar += "╌" * (width - filled_int - 1)
        
    accent = theme["accent"]
    pct = round(fraction * 100)
    return f"[{accent}]{bar}[/]  [{accent}]{pct}%[/]"


def ctx_bar_markup(
    used: int,
    total: int,
    width: int = 14,
    *,
    theme: dict[str, str],
) -> str:
    """Render context usage bar: `context ━━━━━╌╌╌╌  62% · 1M`.

    Shows a dim all-empty bar when total is unknown (0).
    Colors: green ≤60%, neutral ≤85%, yellow ≤95%, accent >95%.
    """
    if total <= 0:
        t4 = theme["text_l4"]
        return f"[{t4}]context {'╌' * width}  ─[/]"
    pct = min(used / total, 1.0)
    t4 = theme["text_l4"]
    t3 = theme["text_l3"]
    success = theme["success"]
    warning = theme["warning"]
    text_l2 = theme["text_l2"]
    accent = theme["accent"]

    if pct < 0.60:
        bar_color = success
    elif pct < 0.85:
        bar_color = text_l2
    elif pct < 0.95:
        bar_color = warning
    else:
        bar_color = accent

    filled = round(pct * width)
    empty = width - filled
    bar = "━" * filled + "╌" * empty

    if total >= 1_000_000:
        ctx_label = f"{total // 1_000_000}M"
    elif total >= 1_000:
        ctx_label = f"{total // 1_000}K"
    else:
        ctx_label = str(total)

    pct_str = f"{round(pct * 100)}%"
    return (
        f"[{t4}]context [/]"
        f"[{bar_color}]{bar}[/]"
        f"  [{t3}]{pct_str} · {ctx_label}[/]"
    )
