"""Provider catalog loader.

Load order (each falls back to next):
    1. tmp/providers_catalog.json    – project-local cached remote copy
    2. src/omnisee_every/tui/providers_catalog.json – bundled with package
    3. minimal hardcoded list                       – last-resort safety net

Remote update is non-blocking: started on app launch, completed in background.
Next launch picks up the cached newer version.
"""
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any

# ── locations ────────────────────────────────────────────────────────────────
_BUNDLED_PATH = Path(__file__).parent / "providers_catalog.json"
_USER_CACHE_PATH = Path(__file__).resolve().parents[3] / "tmp" / "providers_catalog.json"

# Allow override via env var (for testing or custom catalog hosting)
_REMOTE_URL_ENV = "OMNISEE_CATALOG_URL"


# ── data classes (kept as plain dicts for JSON-friendliness) ──────────────────
def _minimal_fallback() -> dict:
    """Last-resort catalog if both cache and bundled file are missing/corrupt."""
    return {
        "version": "fallback",
        "providers": [
            {
                "id": "deepseek",
                "name": "DeepSeek",
                "tagline": "（最小兜底列表）",
                "url": "https://api.deepseek.com",
                "key_url": "https://platform.deepseek.com/api-keys",
                "need_key": True,
                "fetch_strategy": "openai",
                "fallback_models": [["deepseek-chat", "🔤 文本", ""]],
            },
            {
                "id": "custom",
                "name": "自定义",
                "tagline": "OpenAI 兼容接口",
                "url": "",
                "key_url": "",
                "need_key": True,
                "fetch_strategy": "openai",
                "supports_protocols": ["openai", "anthropic"],
                "fallback_models": [],
            },
        ],
    }


def _parse_version(v: str) -> tuple:
    """Compare ISO-like version strings ('2026-05-25')."""
    try:
        return tuple(int(x) for x in v.split("-"))
    except Exception:
        return (0,)


def _safe_load_json(path: Path) -> dict | None:
    try:
        if not path.is_file():
            return None
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict) or "providers" not in data:
            return None
        return data
    except Exception:
        return None


def load_catalog() -> dict:
    """Return the active catalog: cache > bundled > minimal fallback."""
    cached = _safe_load_json(_USER_CACHE_PATH)
    bundled = _safe_load_json(_BUNDLED_PATH)

    if cached and bundled:
        # Prefer whichever is newer
        if _parse_version(cached.get("version", "")) >= _parse_version(bundled.get("version", "")):
            return cached
        return bundled

    return cached or bundled or _minimal_fallback()


def get_providers() -> list[dict]:
    """Convenience: return just the provider list."""
    return load_catalog().get("providers", [])


def get_provider_map() -> dict[str, dict]:
    """Convenience: provider id → provider dict."""
    return {p["id"]: p for p in get_providers()}


def get_provider_order() -> list[str]:
    """Provider IDs in display order."""
    return [p["id"] for p in get_providers()]


# ── remote update (best-effort, non-blocking) ────────────────────────────────
def _remote_url() -> str | None:
    env = os.getenv(_REMOTE_URL_ENV)
    if env:
        return env
    bundled = _safe_load_json(_BUNDLED_PATH) or {}
    return bundled.get("remote_url")


async def _fetch_remote_async() -> dict | None:
    """Fetch remote catalog with short timeout. Returns None on any failure."""
    url = _remote_url()
    if not url:
        return None
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        if not isinstance(data, dict) or "providers" not in data:
            return None
        return data
    except Exception:
        return None


async def update_catalog_in_background() -> bool:
    """Try to fetch the latest catalog and cache it if newer.

    Returns True if cache was updated. Safe to call without await on result.
    Designed to run as a fire-and-forget task on app startup.
    """
    remote = await _fetch_remote_async()
    if not remote:
        return False

    current = load_catalog()
    if _parse_version(remote.get("version", "")) <= _parse_version(current.get("version", "")):
        return False

    try:
        _USER_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(_USER_CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(remote, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False


def schedule_background_update() -> None:
    """Schedule update if an event loop exists, else no-op."""
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(update_catalog_in_background())
    except RuntimeError:
        pass
