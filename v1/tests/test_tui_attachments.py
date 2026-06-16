"""Unit tests for V1 TUI attachment utilities."""
from __future__ import annotations

from omnisee_every_v1.tui.attachments import attachment_contexts, file_attachment_preview


def test_file_attachment_preview_text_and_truncation(tmp_path):
    # Create a small text file
    txt_file = tmp_path / "small.txt"
    txt_file.write_text("Hello World", encoding="utf-8")
    assert file_attachment_preview(str(txt_file), limit=5) == "Hello\n...[truncated]"
    assert file_attachment_preview(str(txt_file), limit=100) == "Hello World"

    # Large text file (> 1,000,000 bytes) returns skipped-preview marker
    large_file = tmp_path / "large.txt"
    with open(large_file, "wb") as f:
        f.write(b"a" * 1_000_001)

    preview = file_attachment_preview(str(large_file))
    assert "[Text preview skipped:" in preview
    assert "1000001 bytes" in preview


def test_file_attachment_preview_non_text(tmp_path):
    # Non-text attachments do not read file content (should return empty string)
    png_file = tmp_path / "image.png"
    png_file.write_bytes(b"PNG fake data")
    assert file_attachment_preview(str(png_file)) == ""


def test_attachment_contexts_rendering(tmp_path):
    # Create dummy files for tests
    txt_file = tmp_path / "notes.txt"
    txt_file.write_text("Secret notes", encoding="utf-8")

    pending = [
        {
            "type": "file",
            "path": str(txt_file),
            "placeholder": "[File 1]",
            "description": "My notes",
        },
        {
            "type": "image",
            "path": "/tmp/screenshot.png",
            "placeholder": "[Image 3]",
            "description": "A settings dashboard",
        },
    ]

    # Mixed image/file attachments preserve expected ordering:
    # 1. Legacy context (if present)
    # 2. Image attachments
    # 3. Non-image attachments
    contexts = attachment_contexts(pending, legacy_image_context="Legacy Info")
    assert len(contexts) == 3

    # Check legacy context first
    assert contexts[0] == "Legacy Info"

    # Check image context second (rendered with proper numbering)
    assert "[Attached Clipboard Image 3]" in contexts[1]
    assert "Path: /tmp/screenshot.png" in contexts[1]
    assert "Visual Description: A settings dashboard" in contexts[1]

    # Check file context third
    assert "[Attached [File 1]]" in contexts[2]
    assert "Type: file" in contexts[2]
    assert "Path: " + str(txt_file) in contexts[2]
    assert "Note: My notes" in contexts[2]
    assert "Content Preview:" in contexts[2]
    assert "Secret notes" in contexts[2]
