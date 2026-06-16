"""OmniVerse Vision — Textual TUI.

Two-screen design (inspired by OpenCode):
  HomeScreen  – centered launch state, big logo + framed input
  ChatScreen  – conversation interface with left-bar message style

Setup uses a 3-step wizard modal (provider → key → model), inspired by
OpenCode's DialogSelect pattern: one focused list per step.
"""
from __future__ import annotations

import atexit
import os
import platform
import random
import sys
import webbrowser
from pathlib import Path
from string import Template
from typing import ClassVar

from rich.markup import escape as rich_escape
from rich.text import Text
from textual import events, on, work
from textual.app import App, ComposeResult
from textual.binding import Binding
from textual.containers import Container, Horizontal, HorizontalGroup, Vertical, VerticalScroll
from textual.screen import ModalScreen, Screen
from omnisee_every_v1.tui.theme import (
    pick_theme as _pick_theme,
    next_theme_name as _next_theme_name,
    next_theme_mode as _next_theme_mode,
    THEMES as _THEMES,
)
from textual.widgets import Button, Input, Label, OptionList, Static
from textual.widgets.option_list import Option
from omnisee_every_v1.tui.attachments import (
    file_attachment_preview as _file_attachment_preview,
)
from omnisee_every_v1.tui import click_pulse_logo as pulse_logo
from omnisee_every_v1.tui.chat_attachments_ui import (
    AttachmentState,
    build_attachment_bar_markup as _build_attachment_bar_markup,
    prune_pending_attachments as _prune_pending_attachments,
)
from omnisee_every_v1.tui.chat_utils import (
    estimate_message_tokens as _estimate_message_tokens,
    looks_like_visual_query as _looks_like_visual_query,
)
from omnisee_every_v1.tui.file_dialog import (
    choose_file_dialog as _choose_file_dialog,
    choose_file_linux as _choose_file_linux,
    choose_file_macos as _choose_file_macos,
    choose_file_windows as _choose_file_windows,
)
from omnisee_every_v1.tui.i18n import t, get_lang, localized_provider_tagline
from omnisee_every_v1.tui.logo_asset import get_logo as _get_logo
from omnisee_every_v1.tui.model_meta import (
    canonical_provider_url as _canonical_provider_url_for,
    compact_model_desc as _compact_model_desc_for,
    model_context_total as _model_context_total_for,
    model_has_vision as _model_has_vision,
    provider_for_cfg as _provider_for_cfg_for,
)
from omnisee_every_v1.tui.setup_state import resolve_setup_state
from omnisee_every_v1.tui.path_utils import (
    attachment_kind as _attachment_kind,
    is_media_path as _is_media_path,
    is_url as _is_url,
    normalize_pasted_media as _normalize_media_input,
)
from omnisee_every_v1.tui.progress_markup import (
    block_progress_bar as _render_block_progress_bar,
    ctx_bar_markup as _render_ctx_bar_markup,
)
from omnisee_every_v1.tui.slash_commands import get_slash_commands
from omnisee_every_v1.tui.widgets import Message, BeamLogo, ThemeBadge, VLMBadge, ChatMetaBadge, PetMascot, _model_label, _vision_model_label, _mcp_badge_markup, _top_status_markup, TUIInput, _clipboard_has_media


# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────



def _get_config() -> dict:
    try:
        from omnisee_every.backend import load_config
        return load_config()
    except Exception:
        return {}


def _llm_configured(cfg: dict) -> bool:
    return not _needs_setup(cfg)[0]


# ─────────────────────────────────────────────────────────────────────────────
# Active theme (resolved once at module load — relaunch to change theme)
# ─────────────────────────────────────────────────────────────────────────────
def _resolve_active_theme() -> dict:
    from omnisee_every_v1.tui.theme_runtime import resolve_active_theme
    return resolve_active_theme()


def _active_theme_mode() -> str:
    from omnisee_every_v1.tui.theme_runtime import active_theme_mode
    return active_theme_mode()


_ACTIVE_THEME = _resolve_active_theme()
_TERMINAL_BG_RESET_REGISTERED = False


def _set_terminal_background(color: str) -> None:
    from omnisee_every_v1.tui import theme_runtime
    global _TERMINAL_BG_RESET_REGISTERED
    theme_runtime._TERMINAL_BG_RESET_REGISTERED = _TERMINAL_BG_RESET_REGISTERED
    theme_runtime.set_terminal_background(color)
    _TERMINAL_BG_RESET_REGISTERED = theme_runtime._TERMINAL_BG_RESET_REGISTERED


def _reset_terminal_background() -> None:
    from omnisee_every_v1.tui.theme_runtime import reset_terminal_background
    reset_terminal_background()




def _needs_setup(cfg: dict) -> tuple[bool, str]:
    from omnisee_every_v1.tui.status_markup import needs_setup
    return needs_setup(cfg, t)




def _localize_model_tag(tag: str) -> str:
    from omnisee_every_v1.tui.status_markup import localize_model_tag
    return localize_model_tag(tag, get_lang)


def _chat_input_meta_markup(cfg: dict, input_meta: str, running_progress: str | None = None) -> str:
    from omnisee_every_v1.tui.status_markup import chat_input_meta_markup
    return chat_input_meta_markup(cfg, input_meta, _ACTIVE_THEME, PROVIDERS, get_lang, running_progress)



def _block_progress_bar(completed: int, total: int = 7, width: int = 12) -> str:
    return _render_block_progress_bar(completed, total, width, theme=_ACTIVE_THEME)


def _ctx_bar_markup(used: int, total: int, width: int = 14) -> str:
    return _render_ctx_bar_markup(used, total, width, theme=_ACTIVE_THEME)


# ─────────────────────────────────────────────────────────────────────────────
# Provider catalogue (official docs checked 2026-05)
# ─────────────────────────────────────────────────────────────────────────────
PROVIDERS: dict[str, dict] = {
    "deepseek": {
        "name":     "DeepSeek",
        "tagline":  "OpenAI 兼容 · deepseek-chat 默认稳妥 · 支持最新 V3 和 R1 模型",
        "url":      "https://api.deepseek.com/v1",
        "key_url":  "https://platform.deepseek.com/api-keys",
        "need_key": True,
        "models": [
            ("deepseek-chat",     "文本", "DeepSeek-V3 · 文本生成"),
            ("deepseek-reasoner", "推理", "DeepSeek-R1 · 推理模式"),
        ],
    },
    "anthropic": {
        "name":     "Anthropic Claude",
        "tagline":  "Claude · Anthropic 原生 Messages API · 模型名手填或选择稳定项",
        "url":      "https://api.anthropic.com",
        "key_url":  "https://console.anthropic.com/settings/keys",
        "need_key": True,
        "protocol": "anthropic",
        "models": [
            ("claude-3-5-sonnet-20241022", "文本", "Sonnet 3.5 · 平衡质量与速度"),
            ("claude-3-5-haiku-20241022",  "轻量", "Haiku 3.5 · 轻量低延迟"),
            ("claude-3-opus-20240229",     "推理", "Opus 3 · 高质量复杂分析"),
        ],
    },
    "moonshot": {
        "name":     "Moonshot Kimi",
        "tagline":  "Kimi · 长上下文 · 国内访问稳定",
        "url":      "https://api.moonshot.cn/v1",
        "key_url":  "https://platform.moonshot.cn/console/api-keys",
        "need_key": True,
        "models": [
            ("moonshot-v1-8k",   "文本", "8K 上下文 · 快速经济"),
            ("moonshot-v1-32k",  "文本", "32K · 适合中长文档"),
            ("moonshot-v1-128k", "文本", "128K · 超长文本首选"),
        ],
    },
    "openai": {
        "name":     "OpenAI",
        "tagline":  "GPT/o1 系列 · 当前主流模型",
        "url":      "https://api.openai.com/v1",
        "key_url":  "https://platform.openai.com/api-keys",
        "need_key": True,
        "models": [
            ("gpt-4o",       "视觉", "旗舰多模态 · 图像输入"),
            ("gpt-4o-mini",  "轻量", "经济高效多模态"),
            ("o1",           "推理", "旗舰推理模型"),
            ("o1-mini",      "推理", "经济推理模型"),
            ("o3-mini",      "推理", "最新低延迟推理模型"),
        ],
    },
    "gemini": {
        "name":     "Google Gemini",
        "tagline":  "Google AI Studio · OpenAI 兼容端点",
        "url":      "https://generativelanguage.googleapis.com/v1beta/openai/",
        "key_url":  "https://aistudio.google.com/apikey",
        "need_key": True,
        "models": [
            ("gemini-2.0-flash",      "视觉", "Gemini 2.0 Flash · 旗舰速度与多模态"),
            ("gemini-2.0-flash-lite", "轻量", "低延迟轻量"),
            ("gemini-1.5-pro",        "推理", "Gemini 1.5 Pro · 复杂推理"),
            ("gemini-1.5-flash",      "视觉", "Gemini 1.5 Flash · 性价比"),
        ],
    },
    "qwen": {
        "name":     "通义千问 (DashScope)",
        "tagline":  "阿里云百炼 · OpenAI 兼容模式",
        "url":      "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "key_url":  "https://dashscope.console.aliyun.com/apiKey",
        "need_key": True,
        "models": [
            ("qwen-plus",    "文本", "均衡文本模型"),
            ("qwen-max",     "文本", "更强文本能力"),
            ("qwen-turbo",   "轻量", "轻量快速"),
            ("qwen-vl-plus", "视觉", "视觉理解"),
            ("qwen-vl-max",  "视觉", "更强视觉理解"),
        ],
    },
    "siliconflow": {
        "name":     "SiliconFlow",
        "tagline":  "托管开源模型 · 注册有免费额度 · 模型选择丰富",
        "url":      "https://api.siliconflow.cn/v1",
        "key_url":  "https://cloud.siliconflow.cn/account/ak",
        "need_key": True,
        "models": [
            ("Qwen/Qwen2.5-72B-Instruct",   "文本", "Qwen2.5 · 综合能力强"),
            ("Qwen/Qwen2-VL-72B-Instruct",  "视觉", "可分析图片 · 不支持视频"),
            ("deepseek-ai/DeepSeek-V3",     "文本", "DeepSeek-V3"),
            ("deepseek-ai/DeepSeek-R1",     "推理", "DeepSeek-R1"),
            ("Qwen/Qwen2.5-7B-Instruct",    "轻量", "7B · 免费 · 速度快"),
        ],
    },
    "zhipu": {
        "name":     "智谱 GLM",
        "tagline":  "GLM 系列 · 国内访问快 · 新旧模型名并存",
        "url":      "https://open.bigmodel.cn/api/paas/v4",
        "key_url":  "https://bigmodel.cn/usercenter/apikeys",
        "need_key": True,
        "models": [
            ("glm-4-plus",   "文本", "旗舰文本 · 推理更强"),
            ("glm-4-flash",  "轻量", "永久免费 · 适合高频调用"),
            ("glm-4v-plus",  "视觉", "旗舰多模态 · 可分析图片"),
            ("glm-4v-flash", "视觉", "免费多模态 · 可分析图片"),
        ],
    },
    "doubao": {
        "name":     "豆包 (Volcengine Ark)",
        "tagline":  "火山方舟 · 模型名通常是控制台 endpoint ID，如 ep-xxxxx",
        "url":      "https://ark.cn-beijing.volces.com/api/v3",
        "key_url":  "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey",
        "need_key": True,
        "models": [
            ("ep-xxxxx", "文本", "占位示例 · 请替换为方舟控制台 endpoint ID"),
        ],
    },
    "openrouter": {
        "name":     "OpenRouter",
        "tagline":  "聚合多厂商模型 · 按 r 查询账号可用列表 · 模型 ID 需带 provider/ 前缀",
        "url":      "https://openrouter.ai/api/v1",
        "key_url":  "https://openrouter.ai/settings/keys",
        "need_key": True,
        "models": [
            ("anthropic/claude-3.5-sonnet",      "视觉", "Claude 3.5 Sonnet 聚合入口"),
            ("anthropic/claude-3.5-haiku",       "轻量", "Claude 3.5 Haiku 聚合入口"),
            ("openai/gpt-4o",                    "视觉", "OpenAI GPT-4o"),
            ("openai/gpt-4o-mini",               "视觉", "OpenAI GPT-4o-mini"),
            ("google/gemini-2.0-flash-exp:free", "视觉", "Gemini 2.0 Flash · 免费层"),
            ("deepseek/deepseek-chat",           "文本", "DeepSeek-V3 聚合入口"),
            ("meta-llama/llama-3.3-70b-instruct","文本", "Llama 3.3 70B"),
        ],
    },
    "groq": {
        "name":     "Groq (快速推理)",
        "tagline":  "低延迟推理 · OpenAI 兼容",
        "url":      "https://api.groq.com/openai/v1",
        "key_url":  "https://console.groq.com/keys",
        "need_key": True,
        "models": [
            ("llama-3.3-70b-versatile", "文本", "Llama 3.3 70B · 通用"),
            ("llama-3.1-8b-instant",    "轻量", "低延迟轻量"),
            ("gemma2-9b-it",            "轻量", "Gemma 2 9B"),
        ],
    },
    "ollama": {
        "name":     "本地 Ollama",
        "tagline":  "完全本地·免费 · 无需 Key · 需先 ollama pull 模型",
        "url":      "http://localhost:11434/v1",
        "key_url":  "https://ollama.com/library",
        "need_key": False,
        "models":   [],
    },
    "custom": {
        "name":     "自定义",
        "tagline":  "任何 OpenAI 兼容接口 · 自填地址和 Key",
        "url":      "",
        "key_url":  "",
        "need_key": True,
        "models":   [],
    },
}
# ── catalog-driven providers (replaces the hardcoded PROVIDERS dict above) ──
# The hardcoded dict above is kept for backwards-compat in case the catalog file
# fails to load. The lines below overwrite PROVIDERS/_PROVIDER_ORDER from the
# canonical source: tui/providers_catalog.json; remote override is opt-in via OMNISEE_CATALOG_URL.
from omnisee_every_v1.tui import catalog as _catalog
from omnisee_every_v1.tui import model_fetcher as _model_fetcher

_cat_providers = _catalog.get_providers()
if _cat_providers:
    # Normalize: alias fallback_models → models for code that uses p["models"]
    _normalized = []
    for _p in _cat_providers:
        _p2 = dict(_p)
        _p2.setdefault("models", _p.get("fallback_models", []))
        _normalized.append(_p2)
    PROVIDERS = {p["id"]: p for p in _normalized}
    _PROVIDER_ORDER = [p["id"] for p in _normalized]
from omnisee_every_v1.tui import skills_catalog as _skills_catalog

_SKILLS_LIST, _SKILLS_DEPTH_MAP = _skills_catalog.load_skills_and_depths()
SKILLS = _SKILLS_LIST

# Backwards-compat: keep SLASH_COMMANDS available as a property-like reference.
# Callers should prefer `get_slash_commands()` to get current-language strings.
SLASH_COMMANDS = get_slash_commands()


def _annotate_model(mid: str) -> tuple[str, str]:
    """Forward to model_fetcher.annotate_model (kept as alias for callers)."""
    return _model_fetcher.annotate_model(mid)


def _compact_model_desc(mid: str, tag: str, desc: str, provider: dict | None = None) -> str:
    return _compact_model_desc_for(mid, tag, desc, provider, lang=get_lang())


def _provider_for_cfg(cfg: dict) -> dict | None:
    return _provider_for_cfg_for(cfg, PROVIDERS)


def _canonical_provider_url(pid: str, current_url: str = "") -> str:
    return _canonical_provider_url_for(pid, PROVIDERS, current_url)


def _model_context_total(cfg: dict) -> int:
    return _model_context_total_for(cfg, PROVIDERS)


_CHAT_BUBBLE_MAX_WIDTH = 58
_CHAT_BUBBLE_MIN_WIDTH = 24






# ─────────────────────────────────────────────────────────────────────────────
# HomeScreen Screen Import
# ─────────────────────────────────────────────────────────────────────────────
from omnisee_every_v1.tui.screens.home import HomeScreen, _HOME_CSS


# ─────────────────────────────────────────────────────────────────────────────
# ChatScreen Screen Import & Method Injection
# ─────────────────────────────────────────────────────────────────────────────
from omnisee_every_v1.tui.screens.chat import ChatScreen, _CHAT_CSS
from omnisee_every_v1.tui.screens.setup import SetupModal, _MODAL_CSS


# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────
_APP_CSS = Template("""
App {
    background: ${bg_base};
    width: 100%;
    height: 100%;
}
Screen {
    background: ${bg_base};
    width: 100%;
    height: 100%;
}
Button, Button.-style-default, Button.-style-flat {
    background: ${bg_panel};
    color: ${text_l2};
    border: none;
    border-top: none;
    border-bottom: none;
}
Button:hover, Button:focus,
Button.-style-default:hover, Button.-style-default:focus,
Button.-style-flat:hover, Button.-style-flat:focus {
    background: ${bg_elev};
    color: ${accent};
    border: none;
    border-top: none;
    border-bottom: none;
}
Button.-active,
Button.-style-default.-active,
Button.-style-flat.-active {
    background: ${bg_panel};
    color: ${accent};
    border: none;
    border-top: none;
    border-bottom: none;
    tint: transparent;
}
""").safe_substitute(**_ACTIVE_THEME)


class OmniSeeApp(App[None]):
    TITLE = "OmniVerse Vision"   # zh users see 天视万象 via in-TUI branding
    CSS = _APP_CSS
    BINDINGS: ClassVar[list[Binding]] = [
        # App-level theme cycling: works on both Home and Chat screens.
        Binding("f2",     "cycle_theme", "四季"),
        Binding("f3",     "toggle_theme_mode", "昼夜"),
        Binding("ctrl+t", "cycle_theme", "切换主题", show=False),
        Binding("f4",     "cycle_theme", "切换主题(F4)", show=False),
        Binding("f5",     "toggle_theme_mode", "昼夜(F5)", show=False),
    ]

    def toggle_vlm(self) -> None:
        """Toggle the VLM model between MiniCPM-V-4.6, Ollama, and Disabled."""
        cfg = _get_config()
        vlm = cfg.setdefault("vlm", {})
        provider = (vlm.get("provider") or "").strip().lower()

        # Toggle cycle: public MiniCPM-V -> openai-compatible/Ollama local -> disabled -> public MiniCPM-V.
        if provider in {"modelbest", "minicpm_public"} or not provider:
            new_provider = "openai-compatible"
            new_model = "Ollama local"
        elif provider == "openai-compatible":
            new_provider = "disabled"
            new_model = "Disabled"
        else:
            new_provider = "minicpm_public"
            new_model = "MiniCPM-V-4.6-Instruct"

        vlm["provider"] = new_provider
        vlm["model"] = new_model
        vlm["model_name"] = new_model

        try:
            from omnisee_every.backend import save_user_config
            save_user_config({"vlm": {"provider": new_provider, "model": new_model, "model_name": new_model}})
        except Exception:
            pass

        # Update the configuration of the current active screen
        if isinstance(self.screen, HomeScreen):
            self.screen._cfg = _get_config()
            self.screen._refresh_vlm()
        elif isinstance(self.screen, ChatScreen):
            self.screen._cfg = _get_config()
            self.screen._refresh_vlm()

    def action_cycle_theme(self) -> None:
        """Persist the next theme and re-exec the process.

        Textual parses CSS at class-load time, so we can't hot-swap themes
        in place. We save the new theme to config, register an atexit hook
        that re-execs `oe` after the app's terminal cleanup runs, then exit.
        The user sees the new theme instantly, as if it were live-switched.
        """
        next_name = _next_theme_name(_ACTIVE_THEME["name"])
        try:
            from omnisee_every.backend import save_user_config
            save_user_config({"ui": {"theme": next_name}})
        except Exception:
            return
        import atexit
        import os
        import sys
        program = sys.argv[0]
        atexit.register(os.execv, program, list(sys.argv))
        self.exit()

    def action_toggle_theme_mode(self) -> None:
        """Toggle day/night mode and restart so Textual reloads CSS."""
        try:
            from omnisee_every.backend import save_user_config
            save_user_config({"ui": {"theme_mode": _next_theme_mode(_active_theme_mode())}})
        except Exception:
            return
        import atexit
        import os
        import sys
        program = sys.argv[0]
        atexit.register(os.execv, program, list(sys.argv))
        self.exit()

    def on_mount(self) -> None:
        cfg = _get_config()
        _set_terminal_background(_ACTIVE_THEME["bg_base"])

        from omnisee_every_v1.tui import i18n
        # Language resolution order (mirrors theme resolution):
        #   1. OMNISEE_LANG env var (zh | en)
        #   2. cfg.ui.language
        #   3. default zh
        env_lang = (os.environ.get("OMNISEE_LANG") or "").strip().lower()
        if env_lang in ("zh", "en"):
            i18n.set_lang(env_lang)
        else:
            ui_cfg = cfg.get("ui") or {}
            if not isinstance(ui_cfg, dict):
                ui_cfg = {}
            i18n.set_lang(ui_cfg.get("language", "zh"))

        # Update window title to match the active language brand name
        try:
            self.title = "天视万象" if i18n.get_lang() == "zh" else "OmniVerse Vision"
        except Exception:
            pass

        self.push_screen(HomeScreen(cfg=cfg))
        # Best-effort: refresh provider catalog from remote in the background.
        try:
            self.run_worker(_catalog.update_catalog_in_background(),
                            exclusive=False, name="catalog-update")
        except Exception:
            pass


def launch() -> None:
    _set_terminal_background(_ACTIVE_THEME["bg_base"])
    OmniSeeApp().run()
