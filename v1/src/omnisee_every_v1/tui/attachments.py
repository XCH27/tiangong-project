"""Attachment context helpers for the V1 TUI."""
from __future__ import annotations

from pathlib import Path

from omnisee_every_v1.tui.path_utils import attachment_kind


def _placeholder_index(placeholder: str, fallback: int = 1) -> int:
    """Extract a placeholder index from current and legacy placeholder formats."""
    digits = "".join(char for char in placeholder if char.isdigit())
    if not digits:
        return fallback
    try:
        return int(digits)
    except ValueError:
        return fallback


def file_attachment_preview(file_path: str, *, limit: int = 8000) -> str:
    if attachment_kind(file_path) != "text":
        return ""
    try:
        p = Path(file_path)
        size = p.stat().st_size
        if size > 1_000_000:
            return f"[Text preview skipped: file is {size} bytes]"
        text = p.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""
    if len(text) > limit:
        return text[:limit] + "\n...[truncated]"
    return text


def attachment_contexts(
    pending_attachments: list[dict[str, str]],
    *,
    legacy_image_context: str | None = None,
) -> list[str]:
    contexts: list[str] = []
    if legacy_image_context:
        contexts.append(str(legacy_image_context))

    for item in pending_attachments:
        if item.get("type") != "image":
            continue
        placeholder = item.get("placeholder", "[Image 1]")
        num = _placeholder_index(placeholder)
        contexts.append(
            f"[Attached Clipboard Image {num}]\n"
            f"Path: {item.get('path', '')}\n"
            f"Visual Description: {item.get('description', '')}"
        )

    for item in pending_attachments:
        if item.get("type") == "image":
            continue
        path = item.get("path", "")
        placeholder = item.get("placeholder", "[File 1]")
        preview = file_attachment_preview(path)
        lines = [
            f"[Attached {placeholder}]",
            f"Type: {item.get('type', 'file')}",
            f"Path: {path}",
        ]
        description = item.get("description", "")
        if description:
            lines.append(f"Note: {description}")
        if preview:
            lines.append("Content Preview:")
            lines.append(preview)
        contexts.append("\n".join(lines))
    return contexts
