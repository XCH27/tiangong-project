"""Model/provider metadata helpers for the V1 TUI."""
from __future__ import annotations

import re


MODEL_CONTEXT_FALLBACKS = {
    "deepseek-v4-flash": 1_000_000,
    "deepseek-v4-pro": 1_000_000,
    "deepseek-chat": 1_000_000,
    "deepseek-reasoner": 1_000_000,
    "gpt-4o": 128_000,
    "gpt-4o-mini": 128_000,
    "claude-3-5-sonnet-20241022": 200_000,
    "claude-3-5-haiku-20241022": 200_000,
    "gemini-1.5-pro": 1_000_000,
    "gemini-1.5-flash": 1_000_000,
    "moonshot-v1-8k": 8_000,
    "moonshot-v1-32k": 32_000,
    "moonshot-v1-128k": 128_000,
}


def model_has_vision(model_name: str) -> bool:
    """Return True if the main dialogue LLM model has vision/VLM capability."""
    model = (model_name or "").lower()
    vision_keywords = {
        "gpt-4o", "gpt-4-vision", "claude-3-5", "claude-3-opus",
        "gemini-1.5", "gemini-2.0", "gemini-2.5", "llava",
        "minicpm-v", "qwen-vl", "qwen2-vl", "yi-vision",
    }
    return any(kw in model for kw in vision_keywords)


def positive_int(value: object) -> int:
    try:
        n = int(value)
    except (TypeError, ValueError):
        return 0
    return n if n > 0 else 0


def context_label(tokens: int) -> str:
    if tokens >= 1_000_000:
        return f"{tokens // 1_000_000}M"
    if tokens >= 1_000:
        return f"{tokens // 1_000}K"
    return str(tokens)


def compact_model_desc(
    mid: str,
    tag: str,
    desc: str,
    provider: dict | None = None,
    *,
    lang: str,
) -> str:
    """Return compact one-line model metadata without repeating the model id."""
    provider = provider or {}
    mid_norm = re.sub(r"[^a-z0-9]+", "", mid.lower())
    kept = _kept_desc_parts(desc, mid_norm)
    _append_model_context(kept, mid, provider, lang)
    tag_clean = tag.strip()
    if tag_clean and not kept:
        kept.append(tag_clean.lower())
    return " · ".join(kept[:3])


def provider_for_cfg(cfg: dict, providers: dict[str, dict]) -> dict | None:
    llm = cfg.get("llm") or {}
    if not isinstance(llm, dict):
        return None

    pid = _configured_provider_id(llm)
    if pid and pid in providers:
        return providers[pid]

    base_url = (llm.get("base_url") or "").strip().rstrip("/")
    if not base_url:
        return None
    return _provider_by_url(base_url, providers)


def _kept_desc_parts(desc: str, mid_norm: str) -> list[str]:
    kept: list[str] = []
    for part in _split_desc_parts(desc):
        cleaned = _clean_desc_part(part, mid_norm)
        if cleaned and cleaned not in kept:
            kept.append(cleaned)
    return kept


def _split_desc_parts(desc: str) -> list[str]:
    return [part.strip() for part in (desc or "").split("·") if part.strip()]


def _clean_desc_part(part: str, mid_norm: str) -> str:
    part_norm = re.sub(r"[^a-z0-9]+", "", part.lower())
    if _desc_repeats_model(part_norm, mid_norm):
        return ""
    if "minicpm" in mid_norm and "minicpm" in part_norm:
        return _clean_minicpm_part(part)
    return part


def _desc_repeats_model(part_norm: str, mid_norm: str) -> bool:
    return bool(part_norm and (part_norm in mid_norm or mid_norm in part_norm))


def _clean_minicpm_part(part: str) -> str:
    cleaned = re.sub(r"(?i)MiniCPM[-\s]*V\s*4\.6", "", part).strip()
    return cleaned.strip("() ·")


def _append_model_context(kept: list[str], mid: str, provider: dict, lang: str) -> None:
    total = _model_context_from_provider(mid, provider)
    if total:
        kept.append(("上下文 " if lang == "zh" else "ctx ") + context_label(total))


def _model_context_from_provider(mid: str, provider: dict) -> int:
    model_contexts = provider.get("model_context_lengths") or {}
    if isinstance(model_contexts, dict):
        total = positive_int(model_contexts.get(mid))
        if total:
            return total
    return positive_int(provider.get("context_length"))


def _configured_provider_id(llm: dict) -> str:
    return (llm.get("provider") or llm.get("provider_id") or "").strip()


def _provider_by_url(base_url: str, providers: dict[str, dict]) -> dict | None:
    for provider in providers.values():
        url = (provider.get("url") or "").strip().rstrip("/")
        if url and url == base_url:
            return provider
    return None


def canonical_provider_url(
    pid: str,
    providers: dict[str, dict],
    current_url: str = "",
) -> str:
    """Return the current official URL for known providers."""
    provider = providers.get(pid)
    if not provider:
        return current_url
    official = (provider.get("url") or "").strip()
    return official or current_url


def model_context_total(cfg: dict, providers: dict[str, dict]) -> int:
    """Return context window for the configured chat model, or 0 if unknown."""
    llm = cfg.get("llm") or {}
    if not isinstance(llm, dict):
        return 0

    explicit = _explicit_context_total(llm)
    if explicit:
        return explicit
    model = (llm.get("model_name") or "").strip()
    if not model:
        return 0

    provider = provider_for_cfg(cfg, providers)
    if provider:
        provider_total = _provider_context_total(provider, model)
        if provider_total:
            return provider_total

    return MODEL_CONTEXT_FALLBACKS.get(model, 0)


def _explicit_context_total(llm: dict) -> int:
    for key in ("context_length", "context_window", "max_context_tokens"):
        explicit = positive_int(llm.get(key))
        if explicit:
            return explicit
    return 0


def _provider_context_total(provider: dict, model: str) -> int:
    model_contexts = provider.get("model_context_lengths") or {}
    if isinstance(model_contexts, dict):
        total = positive_int(model_contexts.get(model))
        if total:
            return total

    total = _provider_model_entry_context(provider, model)
    if total:
        return total
    return positive_int(provider.get("context_length"))


def _provider_model_entry_context(provider: dict, model: str) -> int:
    for entry in provider.get("models") or provider.get("fallback_models") or []:
        total = _model_entry_context(entry, model)
        if total:
            return total
    return 0


def _model_entry_context(entry: object, model: str) -> int:
    if isinstance(entry, dict) and entry.get("id") == model:
        return positive_int(entry.get("context_length"))
    if isinstance(entry, (list, tuple)) and entry and entry[0] == model and len(entry) >= 4:
        return positive_int(entry[3])
    return 0
