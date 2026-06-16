"""Path and attachment-kind helpers for the V1 TUI."""
from __future__ import annotations

import platform
import re
from pathlib import Path
from urllib.parse import unquote, urlparse


_MEDIA_URL_RE = re.compile(
    r"https?://(?:www\.)?(?:bilibili\.com|b23\.tv|youtube\.com|youtu\.be"
    r"|douyin\.com|kuaishou\.com)\S*",
    re.IGNORECASE,
)

MEDIA_EXTS = {
    ".mp4", ".mov", ".avi", ".mkv", ".flv", ".webm", ".m4v", ".wmv", ".mpg", ".mpeg",
    ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg", ".opus",
}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".heic"}
TEXT_ATTACHMENT_EXTS = {
    ".txt", ".md", ".markdown", ".rst", ".log",
    ".json", ".jsonl", ".yaml", ".yml", ".toml", ".xml", ".html", ".htm",
    ".csv", ".tsv", ".sql",
    ".py", ".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".sass",
    ".go", ".rs", ".java", ".kt", ".swift", ".c", ".cc", ".cpp", ".h", ".hpp",
    ".sh", ".bash", ".zsh", ".fish", ".ps1",
}


def is_url(text: str) -> bool:
    """Return True if the text represents a supported video-platform URL."""
    return bool(_MEDIA_URL_RE.search(text.strip()))


def clean_pasted_path(text: str) -> str:
    """Normalize a file path pasted by terminals, Finder, or file:// URLs."""
    s = text.strip()
    if not s:
        return ""
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1]
    if s.lower().startswith("file://"):
        parsed = urlparse(s)
        s = unquote(parsed.path or s[7:])
    else:
        s = unquote(s)
    if platform.system() != "Windows":
        s = re.sub(r"\\(.)", r"\1", s)
    return s.strip()


def is_media_path(text: str) -> bool:
    """Return True if `text` is a local path to an existing audio/video file."""
    s = clean_pasted_path(text)
    if not s:
        return False
    try:
        p = Path(s).expanduser()
        if not p.is_file():
            return False
        return p.suffix.lower() in MEDIA_EXTS
    except Exception:
        return False


def normalize_media_input(text: str, *, is_url) -> str:
    """Return a canonical form of media input: keep URLs as-is, unwrap local paths."""
    s = text.strip()
    if is_url(s):
        return s
    return clean_pasted_path(s)


def normalize_pasted_media(text: str) -> str:
    """Normalize pasted media input using the built-in video-platform URL detector."""
    return normalize_media_input(text, is_url=is_url)


def local_path_from_paste(text: str) -> Path | None:
    s = clean_pasted_path(text)
    if not s or re.match(r"^[a-z][a-z0-9+.-]*://", s, re.IGNORECASE):
        return None
    try:
        p = Path(s).expanduser()
    except Exception:
        return None
    return p if p.exists() else None


def attachment_kind(path: str) -> str:
    p = Path(path)
    if p.is_dir():
        return "directory"
    ext = p.suffix.lower()
    if ext in MEDIA_EXTS:
        return "media"
    if ext in IMAGE_EXTS:
        return "image"
    if ext == ".pdf":
        return "pdf"
    if ext in TEXT_ATTACHMENT_EXTS:
        return "text"
    return "file"
