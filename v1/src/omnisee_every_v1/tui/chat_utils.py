"""Chat utility helpers for the V1 TUI."""
from __future__ import annotations

import re

_VISUAL_QUERY_RE = re.compile(
    r"(图片|截图|图里|图中|画面|看图|识别|照片|image|screenshot|picture|photo|visual)",
    re.IGNORECASE,
)


def estimate_message_tokens(text: str) -> int:
    """Estimate the number of tokens in a message."""
    stripped = text.strip()
    if not stripped:
        return 0
    return max(1, (len(stripped) + 2) // 3)


def looks_like_visual_query(text: str) -> bool:
    """Return True when a plain user question is clearly asking to inspect an image."""
    return bool(_VISUAL_QUERY_RE.search(text or ""))
