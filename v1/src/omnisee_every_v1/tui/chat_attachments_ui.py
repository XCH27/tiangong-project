"""Pure UI helpers for ChatScreen attachment bar and input sync."""
from __future__ import annotations


class AttachmentState:
    """State container for pending chat attachments and their indices."""

    def __init__(self) -> None:
        self.pending_attachments: list[dict[str, str]] = []
        self.next_image_id = 1
        self.next_file_id = 1
        self.next_pdf_id = 1

    def reset(self) -> None:
        """Reset all attachments and placeholder counter indices."""
        self.pending_attachments.clear()
        self.next_image_id = 1
        self.next_file_id = 1
        self.next_pdf_id = 1

    def allocate_image_placeholder(self) -> str:
        """Pre-allocate an image placeholder and advance counter."""
        placeholder = f"[Image {self.next_image_id}]"
        self.next_image_id += 1
        return placeholder

    def add_image(self, path: str, description: str, placeholder: str = "") -> str:
        """Add an image attachment and allocate placeholder name."""
        if not placeholder:
            placeholder = f"[Image {self.next_image_id}]"
            self.next_image_id += 1
        self.pending_attachments.append({
            "type": "image",
            "path": path,
            "description": description,
            "placeholder": placeholder,
        })
        return placeholder

    def add_file(self, path: str, kind: str, description: str = "", placeholder: str = "") -> str:
        """Add a file/document attachment and allocate placeholder name."""
        if not placeholder:
            if kind == "pdf":
                placeholder = f"[PDF {self.next_pdf_id}]"
                self.next_pdf_id += 1
            else:
                placeholder = f"[File {self.next_file_id}]"
                self.next_file_id += 1
        self.pending_attachments.append({
            "type": kind if kind in {"pdf", "text", "file"} else "file",
            "path": path,
            "description": description,
            "placeholder": placeholder,
        })
        return placeholder

    def prune(self, input_text: str) -> bool:
        """Drop attachments whose placeholder no longer appears in the input text."""
        original_count = len(self.pending_attachments)
        self.pending_attachments = [
            item for item in self.pending_attachments
            if item.get("placeholder") in input_text
        ]
        pruned = len(self.pending_attachments) != original_count
        if pruned and not self.pending_attachments:
            self.reset()
        return pruned

    def consume_contexts(self, legacy_image_context: str | None = None) -> list[str]:
        """Compile context text and reset attachment state."""
        from omnisee_every_v1.tui.attachments import attachment_contexts
        contexts = attachment_contexts(
            self.pending_attachments,
            legacy_image_context=legacy_image_context,
        )
        self.reset()
        return contexts

    def update_description(self, placeholder: str, description: str) -> None:
        """Update description for an attachment with a matching placeholder."""
        for item in self.pending_attachments:
            if item.get("placeholder") == placeholder:
                item["description"] = description
                break

    @property
    def has_images(self) -> bool:
        """Return True if there is at least one image attachment."""
        return any(item.get("type") == "image" for item in self.pending_attachments)

    @property
    def has_non_image_attachments(self) -> bool:
        """Return True if there is at least one non-image attachment."""
        return any(item.get("type") != "image" for item in self.pending_attachments)

    @property
    def first_image_path(self) -> str:
        """Return the path of the first image attachment, or empty string."""
        for item in self.pending_attachments:
            if item.get("type") == "image":
                return item.get("path") or ""
        return ""


def attachment_summary(pending_attachments: list[dict[str, str]]) -> str:
    """Return a stable human-readable summary without leaking extension counters."""
    image_count = 0
    file_count = 0
    for item in pending_attachments:
        if item.get("type") == "image":
            image_count += 1
        else:
            file_count += 1

    parts: list[str] = []
    if image_count:
        parts.append(f"{image_count} 张图片")
    if file_count:
        parts.append(f"{file_count} 个文件")
    if not parts:
        parts.append(f"{len(pending_attachments)} 个附件")
    return " · ".join(parts)


def build_attachment_bar_markup(
    pending_attachments: list[dict[str, str]],
    *,
    success_style: str,
) -> tuple[str, bool]:
    """Return Rich markup for the attachment bar and whether it should be visible."""
    if not pending_attachments:
        return "", False

    summary = attachment_summary(pending_attachments)
    return f"📎 [bold {success_style}]已附加 {summary}[/]", True


def prune_pending_attachments(
    pending_attachments: list[dict[str, str]],
    input_text: str,
) -> list[dict[str, str]]:
    """Drop attachments whose placeholder no longer appears in the input text."""
    return [
        item
        for item in pending_attachments
        if item.get("placeholder") in input_text
    ]
