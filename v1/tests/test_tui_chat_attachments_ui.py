"""Behavior tests for ChatScreen attachment bar UI helpers."""
from __future__ import annotations

from omnisee_every_v1.tui.chat_attachments_ui import (
    AttachmentState,
    attachment_summary,
    build_attachment_bar_markup,
    prune_pending_attachments,
)


def test_attachment_summary_groups_by_kind_without_extension_tags():
    pending = [
        {"type": "image", "path": "/tmp/one.png", "placeholder": "[Image 1]"},
        {"type": "image", "path": "/tmp/two.jpg", "placeholder": "[Image 2]"},
        {"type": "file", "path": "/tmp/readme", "placeholder": "[File 1]"},
    ]
    summary = attachment_summary(pending)
    assert summary == "2 张图片 · 1 个文件"
    assert "PNG*1" not in summary
    assert "JPG*1" not in summary


def test_build_attachment_bar_markup_empty():
    markup, visible = build_attachment_bar_markup([], success_style="#00ff00")
    assert markup == ""
    assert visible is False


def test_build_attachment_bar_markup_shows_sorted_tags():
    pending = [
        {"type": "image", "path": "/tmp/one.png", "placeholder": "[Image 1]"},
        {"type": "image", "path": "/tmp/two.jpg", "placeholder": "[Image 2]"},
    ]
    markup, visible = build_attachment_bar_markup(pending, success_style="#22c55e")
    assert visible is True
    assert "已附加 2 张图片" in markup
    assert "PNG*1" not in markup
    assert "JPG*1" not in markup
    assert "#22c55e" in markup


def test_prune_pending_attachments_keeps_placeholders_present_in_text():
    pending = [
        {"placeholder": "[Image 1]", "path": "/a.png"},
        {"placeholder": "[Image 2]", "path": "/b.jpg"},
    ]
    kept = prune_pending_attachments(pending, "Only [Image 2] remains")
    assert len(kept) == 1
    assert kept[0]["placeholder"] == "[Image 2]"


def test_prune_pending_attachments_clears_all_when_text_has_no_placeholders():
    pending = [{"placeholder": "[Image 1]", "path": "/a.png"}]
    assert prune_pending_attachments(pending, "no placeholders here") == []


def test_attachment_state_lifecycle():
    state = AttachmentState()
    assert state.pending_attachments == []
    assert state.next_image_id == 1

    # Add images
    p1 = state.add_image("/a.png", "desc 1")
    assert p1 == "[Image 1]"
    assert state.next_image_id == 2

    p2 = state.add_image("/b.png", "desc 2")
    assert p2 == "[Image 2]"

    # Add file/pdf
    f1 = state.add_file("/doc.txt", "text", "text note")
    assert f1 == "[File 1]"
    assert state.next_file_id == 2

    pdf1 = state.add_file("/brief.pdf", "pdf", "pdf note")
    assert pdf1 == "[PDF 1]"
    assert state.next_pdf_id == 2

    assert len(state.pending_attachments) == 4

    # Test new properties
    assert state.has_images is True
    assert state.has_non_image_attachments is True
    assert state.first_image_path == "/a.png"

    # Test update description
    state.update_description("[Image 1]", "updated desc 1")
    assert state.pending_attachments[0]["description"] == "updated desc 1"

    # Prune
    pruned = state.prune("Keeping [Image 2] and [PDF 1]")
    assert pruned is True
    assert len(state.pending_attachments) == 2
    assert state.pending_attachments[0]["placeholder"] == "[Image 2]"
    assert state.pending_attachments[1]["placeholder"] == "[PDF 1]"

    # Consume
    contexts = state.consume_contexts(legacy_image_context="legacy_ctx")
    assert len(contexts) == 3  # legacy_ctx + Image 2 + PDF 1
    assert "legacy_ctx" in contexts[0]
    assert "Image 2" in contexts[1]
    assert "PDF 1" in contexts[2]

    # After consume state is reset
    assert state.pending_attachments == []
    assert state.next_image_id == 1
    assert state.next_file_id == 1
    assert state.next_pdf_id == 1
    assert state.has_images is False
    assert state.has_non_image_attachments is False
    assert state.first_image_path == ""
