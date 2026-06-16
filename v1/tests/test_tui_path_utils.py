"""Unit tests for V1 TUI path and attachment utilities."""
from __future__ import annotations

from omnisee_every_v1.tui.path_utils import (
    attachment_kind,
    is_media_path,
    is_url,
    local_path_from_paste,
    normalize_media_input,
    normalize_pasted_media,
    clean_pasted_path,
)


def test_clean_pasted_path(monkeypatch):
    # 1. quoted paths are unwrapped
    assert clean_pasted_path('"hello world"') == "hello world"
    assert clean_pasted_path("'hello world'") == "hello world"

    # 2. file:// paths are decoded
    assert clean_pasted_path("file:///path/to/some%20file.mp4") == "/path/to/some file.mp4"

    # 3. shell-escaped spaces are unescaped on non-Windows
    monkeypatch.setattr("platform.system", lambda: "Darwin")
    assert clean_pasted_path("hello\\ world") == "hello world"

    monkeypatch.setattr("platform.system", lambda: "Windows")
    # On Windows, backslashes shouldn't be blindly removed because they are path separators
    assert clean_pasted_path("C:\\Program\\ Files") == "C:\\Program\\ Files"


def test_normalize_media_input():
    def fake_is_url(s):
        return s.startswith("http")

    assert normalize_media_input("https://example.com/video.mp4", is_url=fake_is_url) == "https://example.com/video.mp4"
    assert normalize_media_input('"hello.mp4"', is_url=fake_is_url) == "hello.mp4"


def test_is_url():
    assert is_url("https://www.bilibili.com/video/BV1xx") is True
    assert is_url("http://youtube.com/watch?v=123") is True
    assert is_url("/local/path/to/video.mp4") is False


def test_normalize_pasted_media(tmp_path):
    video = tmp_path / "v.mp4"
    video.write_bytes(b"x")
    expected = str(video)
    assert normalize_pasted_media(f'"{video}"') == expected
    assert normalize_pasted_media("https://www.bilibili.com/video/BV1") == "https://www.bilibili.com/video/BV1"


def test_local_path_from_paste(tmp_path):
    # Create a temp file
    temp_file = tmp_path / "video.mp4"
    temp_file.touch()

    # 4. URLs do not become local paths
    assert local_path_from_paste("https://example.com/video.mp4") is None
    assert local_path_from_paste("http://localhost:8000/file") is None

    # Local path from paste works for existing file
    p = local_path_from_paste(str(temp_file))
    assert p is not None
    assert p.resolve() == temp_file.resolve()

    # Non-existing file returns None
    assert local_path_from_paste("/nonexistent/file.txt") is None


def test_attachment_kind(tmp_path):
    # 5. attachment kind classifies media, image, pdf, text, directory, and generic file
    dir_path = tmp_path / "mydir"
    dir_path.mkdir()
    assert attachment_kind(str(dir_path)) == "directory"

    media_file = tmp_path / "audio.mp3"
    media_file.touch()
    assert attachment_kind(str(media_file)) == "media"

    img_file = tmp_path / "pic.png"
    img_file.touch()
    assert attachment_kind(str(img_file)) == "image"

    pdf_file = tmp_path / "doc.pdf"
    pdf_file.touch()
    assert attachment_kind(str(pdf_file)) == "pdf"

    txt_file = tmp_path / "notes.md"
    txt_file.touch()
    assert attachment_kind(str(txt_file)) == "text"

    generic_file = tmp_path / "unknown.xyz"
    generic_file.touch()
    assert attachment_kind(str(generic_file)) == "file"


def test_is_media_path(tmp_path):
    # Check media path returns True for existing media
    media_file = tmp_path / "video.mp4"
    media_file.touch()
    assert is_media_path(str(media_file)) is True

    # Check non-media path returns False
    text_file = tmp_path / "doc.txt"
    text_file.touch()
    assert is_media_path(str(text_file)) is False
