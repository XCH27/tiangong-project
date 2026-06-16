from __future__ import annotations
from rich.markup import escape as rich_escape

KNOWN_INVALID_MODELS = {
    "",
    "your-key-here",
    "REPLACE_ME",
}

_TAG_LOCALIZATION = {
    "REASON": {"zh": "推理", "en": "REASON"},
    "VISION": {"zh": "视觉", "en": "VISION"},
    "FAST": {"zh": "轻量", "en": "FAST"},
    "TEXT": {"zh": "文本", "en": "TEXT"},
}


def needs_setup(cfg: dict, t_func, invalid_models=KNOWN_INVALID_MODELS) -> tuple[bool, str]:
    """Return (needs_modal, reason)."""
    llm = cfg.get("llm")
    if not isinstance(llm, dict):
        llm = {}
    key = (llm.get("api_key") or "").strip()
    model = (llm.get("model_name") or "").strip()
    if not key or key in invalid_models:
        return True, t_func("home.needs_setup")
    if not model:
        return True, t_func("setup.step3.title")
    if model in invalid_models:
        return True, f"模型名 '{model}' 已失效，请重新选择"
    return False, ""


def model_label(cfg: dict, lang_func) -> str:
    asr_cfg = cfg.get("asr")
    if not isinstance(asr_cfg, dict):
        asr_cfg = {}
    asr = asr_cfg.get("default_provider", "bcut")

    llm_cfg = cfg.get("llm")
    if not isinstance(llm_cfg, dict):
        llm_cfg = {}
    chat_model = (llm_cfg.get("model_name") or "").strip()
    if not chat_model:
        chat_model = "未配置" if lang_func() == "zh" else "not set"

    if lang_func() == "zh":
        return f"{asr} · 对话 {chat_model}"
    return f"{asr} · chat {chat_model}"


def vision_model_label(cfg: dict) -> str:
    vlm_cfg = cfg.get("vlm")
    if not isinstance(vlm_cfg, dict):
        vlm_cfg = {}
    provider = (vlm_cfg.get("provider") or "").strip().lower()
    model = (vlm_cfg.get("model") or "").strip()

    if provider == "disabled":
        return "Disabled"
    if provider == "openai-compatible":
        return "Ollama local"
    if not model or provider == "modelbest":
        model = "MiniCPM-V-4.6"
    return model.replace("-Instruct", "")


def get_mcp_green_color(active_theme: dict, is_day: bool) -> str:
    theme_name = active_theme.get("name")
    if theme_name == "winter" and not is_day:
        return "#a5ffd6"  # Aurora green for winter night
    return active_theme["success"]


def mcp_badge_markup(cfg: dict, active_theme: dict, is_day: bool, t_func, invalid_models=KNOWN_INVALID_MODELS) -> str:
    needs, _ = needs_setup(cfg, t_func, invalid_models=invalid_models)
    vlm_label = vision_model_label(cfg)
    if needs or vlm_label == "Disabled":
        err_color = active_theme["error"]
        return f"[s bold {err_color}]MCP : {vlm_label}[/]"
    else:
        green_color = get_mcp_green_color(active_theme, is_day)
        return f"[bold {green_color}]MCP : {vlm_label}[/]"


def top_status_markup(cfg: dict, active_theme: dict, is_day: bool, t_func, invalid_models=KNOWN_INVALID_MODELS) -> str:
    """Top-bar MCP / setup status (right side of chat header)."""
    return mcp_badge_markup(cfg, active_theme, is_day, t_func, invalid_models=invalid_models)


def localize_model_tag(tag: str, lang_func) -> str:
    tag_clean = tag.strip().upper()
    lang = lang_func()
    return _TAG_LOCALIZATION.get(tag_clean, {}).get(lang, tag_clean)


def resolve_model_tag(model: str, provider: dict) -> str:
    """Resolve model strength tag (FAST/VISION/REASON/TEXT)."""
    tag = ""
    for m_id, m_tag, _ in provider.get("models", []):
        if m_id == model:
            tag = m_tag
            break
    if not tag:
        for m_id, m_tag, _ in provider.get("models", []):
            if m_id.lower() == model.lower():
                tag = m_tag
                break
    if not tag:
        model_lower = model.lower()
        if any(kw in model_lower for kw in ("reasoner", "r1", "o1", "o3", "opus", "deepseek-r1")):
            tag = "推理"
        elif any(kw in model_lower for kw in ("vl", "vision", "multimodal", "4o", "gemini-2.0-flash", "gemini-1.5-flash")):
            tag = "视觉"
        elif any(kw in model_lower for kw in ("flash", "mini", "haiku", "turbo", "lite", "speed", "fast", "8k", "deepseek-v4-flash")):
            tag = "轻量"
        else:
            tag = "文本"
    return tag


def get_model_and_provider(cfg: dict, providers: dict) -> tuple[str, dict]:
    """Retrieve model name and provider configurations safely."""
    llm = cfg.get("llm")
    if not isinstance(llm, dict):
        llm = {}
    model = (llm.get("model_name") or "deepseek").strip()
    provider_id = llm.get("provider")
    if not provider_id:
        provider_id = llm.get("provider_id")
    if not provider_id:
        provider_id = "deepseek"
    provider = providers.get(provider_id)
    if not provider:
        provider = {}
    return model, provider


def get_state_display(input_meta: str, accent: str, normal: str) -> str:
    """Format input metadata according to context state."""
    if "分析" in input_meta or "progress" in input_meta or "processing" in input_meta:
        return f"[{accent}]{rich_escape(input_meta)}[/]"
    return f"[{normal}]{rich_escape(input_meta)}[/]"


def chat_input_meta_markup(
    cfg: dict,
    input_meta: str,
    active_theme: dict,
    providers: dict,
    lang_func,
    running_progress: str | None = None
) -> str:
    """Model + ready/skill line under chat input."""
    accent = active_theme["accent"]
    model, provider = get_model_and_provider(cfg, providers)
    tag = resolve_model_tag(model, provider)

    tag_disp = f"[bold {accent}]{localize_model_tag(tag, lang_func)}[/]"
    
    bright = active_theme.get("text_l1", "")
    normal = active_theme.get("text_l2", "")
    
    model_disp = f"[{bright}]{rich_escape(model)}[/]"
    
    if running_progress:
        return f"[{accent}]▸[/] {tag_disp}  ·  {model_disp}  ·  {running_progress}"
        
    if input_meta and input_meta != "ready":
        state_disp = get_state_display(input_meta, accent, normal)
        return f"[{accent}]▸[/] {tag_disp}  ·  {model_disp}  ·  {state_disp}"
        
    return f"[{accent}]▸[/] {tag_disp}  ·  {model_disp}"
