"""Live model list fetcher.

Strategies:
    openai        – GET {base_url}/models with Bearer auth (OpenAI-compatible)
    ollama_tags   – GET {base}/api/tags (no auth)
    manual        – return empty; caller shows manual input field

Each fetched model is annotated via pattern matching so the UI shows
🔤 / 🖼 / 🤔 / ⚡ tags without requiring per-model metadata.
"""
from __future__ import annotations

from typing import Iterable

from omnisee_every.backend import normalize_base_url


# ── annotation: pattern match model ID → (tag, short description) ────────────
# Design: use uppercase ASCII tags, no emoji (per user feedback). All tags are
# 6 chars to align vertically in option lists. The right-side description gives
# the human reading. Categories:
#   REASON  – uses CoT/reasoning_tokens (R1, o1/o3, v4-flash/pro, qwq, ...)
#   VISION  – multimodal vision (claude-3.5+, gpt-4o, gemini, *vl, *vision)
#   FAST    – lightweight / latency-optimized (claude-haiku-3.0, llama-8b, ...)
#   TEXT    – plain chat (default)
def annotate_model(mid: str) -> tuple[str, str]:
    """Classify a model by its ID. Returns (tag, description)."""
    m = mid.lower()

    # 1. Specific overrides first — these must match before the generic patterns
    #    e.g. `deepseek-v4-flash` contains "flash" but is actually a reasoning model.
    if "deepseek-v4" in m or "deepseek-reasoner" in m:
        return ("REASON", "Chain-of-thought")
    if "deepseek-chat" in m:
        return ("TEXT  ", "General chat")

    # 2. Reasoning / chain-of-thought models
    if any(x in m for x in ["r1", "reasoner", "thinking", "qwq", "o1", "o3", "-r-"]):
        return ("REASON", "Chain-of-thought")

    # 3. Vision-capable. Note: legacy Claude variants are text-only.
    if any(x in m for x in ["vl", "-v-", "vision", "omni", "4o", "qvq", "4v",
                            "claude", "sonnet", "opus", "haiku", "gemini"]):
        if any(legacy in m for legacy in ["claude-3-haiku", "claude-2", "claude-instant"]):
            return ("TEXT  ", "Text-only legacy")
        return ("VISION", "Image input")

    # 4. Lightweight / fast tier
    if any(x in m for x in ["flash", "mini", "turbo", "lite", "instant",
                            "3b", "7b", "8b", "1.5b", "free"]):
        return ("FAST  ", "Lightweight")

    return ("TEXT  ", "")


# ── filtering: exclude obviously non-chat models ─────────────────────────────
def filter_models(
    model_ids: Iterable[str],
    exclude_keywords: list[str] | None = None,
) -> list[str]:
    """Drop non-chat models like whisper, tts, embeddings."""
    DEFAULT_EXCLUDE = [
        "whisper", "tts", "dall-e", "embedding", "moderation",
        "image", "audio-", "babbage", "davinci", "curie", "ada",
    ]
    excludes = (exclude_keywords or []) + DEFAULT_EXCLUDE
    out = []
    for mid in model_ids:
        m = mid.lower()
        if any(x in m for x in excludes):
            continue
        out.append(mid)
    return out


# ── fetch ────────────────────────────────────────────────────────────────────
def fetch_models_sync(
    strategy: str,
    base_url: str,
    api_key: str = "",
    model_filter_exclude: list[str] | None = None,
    timeout: float = 8.0,
) -> tuple[bool, list[tuple[str, str, str]], str]:
    """Fetch model list. Returns (ok, [(id, tag, desc)], error_msg).

    On success: ok=True, models populated, error_msg="".
    On failure: ok=False, models=[], error_msg=<reason>.
    """
    if strategy == "manual":
        return (False, [], "此服务商不支持自动获取，请手填模型名")

    try:
        import httpx
    except ImportError:
        return (False, [], "httpx 未安装")

    try:
        if strategy == "ollama_tags":
            base = base_url.rstrip("/").rsplit("/v1", 1)[0]
            url = f"{base}/api/tags"
            resp = httpx.get(url, timeout=timeout)
            resp.raise_for_status()
            raw = [m["name"] for m in resp.json().get("models", [])]

        elif strategy == "openai":
            url = f"{normalize_base_url(base_url).rstrip('/')}/models"
            headers = {"Authorization": f"Bearer {api_key or 'x'}"}
            resp = httpx.get(url, headers=headers, timeout=timeout)
            resp.raise_for_status()
            data = resp.json()
            raw = [m.get("id", "") for m in data.get("data", []) if m.get("id")]

        else:
            return (False, [], f"未知 fetch_strategy: {strategy}")

    except Exception as exc:
        # Common HTTP error mapping
        msg = str(exc)
        if "401" in msg or "Unauthorized" in msg:
            msg = "API Key 无效（401）"
        elif "403" in msg or "Forbidden" in msg:
            msg = "无权限（403）"
        elif "404" in msg:
            msg = "接口地址错误（404）"
        elif "ConnectError" in type(exc).__name__ or "ConnectTimeout" in type(exc).__name__:
            msg = "无法连接服务器，检查网络或 URL"
        return (False, [], msg)

    if not raw:
        return (False, [], "服务器返回空列表")

    # filter + annotate + sort
    filtered = filter_models(raw, exclude_keywords=model_filter_exclude)
    annotated = []
    for mid in sorted(filtered):
        tag, desc = annotate_model(mid)
        annotated.append((mid, tag, desc))

    return (True, annotated, "")
