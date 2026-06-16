"""Internationalization (i18n) module for OmniVerse Vision TUI.

Supports both Simplified Chinese (zh) and English (en).
"""

from __future__ import annotations

import sys
from typing import Any

STRINGS: dict[str, dict[str, str]] = {
    # Setup Modal
    "setup.title": {"zh": "天视万象 · 配置 AI 大模型", "en": "OmniVerse Vision · Configure AI Model"},
    "setup.step1.title": {"zh": "选择服务商", "en": "Select Service Provider"},
    "setup.step2.title": {"zh": "填写 API Key", "en": "Enter API Key"},
    "setup.step3.title": {"zh": "选择模型", "en": "Select Model"},
    "setup.crumb.step1": {"zh": "Step 1/3", "en": "Step 1/3"},
    "setup.crumb.step2": {"zh": "Step 2/3", "en": "Step 2/3"},
    "setup.crumb.step3": {"zh": "Step 3/3", "en": "Step 3/3"},
    "setup.provider.footer": {"zh": "[#ff6b35]↑↓[/] 移动  [#ff6b35]enter[/] 选择  [#ff6b35]esc[/] 取消", "en": "[#ff6b35]↑↓[/] Move  [#ff6b35]enter[/] Select  [#ff6b35]esc[/] Cancel"},
    "setup.key.footer": {"zh": "[#ff6b35]enter[/] 下一步  [#ff6b35]esc[/] 上一步", "en": "[#ff6b35]enter[/] Next  [#ff6b35]esc[/] Back"},
    "setup.model.footer": {"zh": "[#ff6b35]↑↓[/] 移动  [#ff6b35]enter[/] 保存  [#ff6b35]esc[/] 上一步", "en": "[#ff6b35]↑↓[/] Move  [#ff6b35]enter[/] Save  [#ff6b35]esc[/] Back"},
    "setup.key.key_url": {"zh": "打开浏览器获取 Key  →", "en": "Get API Key in Browser  →"},
    "setup.key.nokey": {"zh": "（不需要 Key，直接按 enter）", "en": "(No Key needed, press Enter directly)"},
    "setup.key.err": {"zh": "请填写 API Key", "en": "Please enter API Key"},
    "setup.model.live_hint": {"zh": "可点击 [获取最新] 刷新列表", "en": "Click [Fetch] to refresh list"},
    "setup.model.fetch_btn": {"zh": "获取最新", "en": "Fetch"},
    "setup.model.none": {"zh": "（暂无）", "en": "(None)"},
    "setup.model.custom_lbl": {"zh": "输入自定义模型名称:", "en": "Enter Custom Model Name:"},
    "setup.model.custom_or_lbl": {"zh": "或输入自定义模型名称:", "en": "Or Enter Custom Model Name:"},
    "setup.model.custom_placeholder": {"zh": "自定义模型名称，例如: gpt-4o", "en": "Custom model name, e.g. gpt-4o"},
    "setup.model.fetch_fail": {"zh": "获取失败: {msg}", "en": "Fetch failed: {msg}"},
    "setup.save_fail": {"zh": "保存失败: {msg}", "en": "Save failed: {msg}"},
    "setup.protocol_lbl": {"zh": "模型兼容的API接口协议", "en": "Model-compatible API Protocol"},
    "setup.protocol.openai": {"zh": "OpenAI 兼容", "en": "OpenAI-compatible"},
    "setup.protocol.anthropic": {"zh": "Anthropic 原生", "en": "Anthropic native"},
    "setup.protocol.openai_hint": {
        "zh": "使用 /v1/chat/completions 格式，适合绝大多数 OpenAI 兼容接口。",
        "en": "Uses /v1/chat/completions; suitable for most OpenAI-compatible endpoints.",
    },
    "setup.protocol.anthropic_hint": {
        "zh": "使用 /v1/messages 格式，适合 Claude 原生接口；Base URL 填 https://api.anthropic.com。",
        "en": "Uses /v1/messages for Claude native API; Base URL should be https://api.anthropic.com.",
    },
    "setup.custom.description": {
        "zh": "",
        "en": "",
    },
    "setup.url.label": {"zh": "API Base URL", "en": "API Base URL"},
    "setup.key.label": {"zh": "API Key", "en": "API Key"},
 
    # Buttons
    "btn.back": {"zh": "← 上一步", "en": "← Back"},
    "btn.next": {"zh": "下一步 →", "en": "Next →"},
    "btn.save": {"zh": "保存 →", "en": "Save →"},
    "btn.cancel": {"zh": "取消", "en": "Cancel"},
 
    # brand.name — localized short name (chat bar, window title)
    # brand.wordmark — home-screen title, always English
    "brand.name": {"zh": "天视万象 ·", "en": "OmniVerse Vision"},
    "brand.wordmark": {"zh": "OmniVerse Vision", "en": "OmniVerse Vision"},
    "brand.tagline": {
        "zh": "视界无限，洞析万象",
        "en": "Infinite Vision, Universal Insight.",
    },

    # Slash commands — descriptions follow ui.language
    "slash.help.title":  {"zh": "命令列表", "en": "Commands"},
    "slash.help":        {"zh": "显示所有命令",                "en": "show all commands"},
        "slash.quit":        {"zh": "退出",                       "en": "quit"},
    "home.placeholder": {"zh": "粘贴视频链接，或描述你的任务…", "en": "paste a video link, or describe your task…"},
    "home.bottom": {
        "zh": "ctrl+v 智能粘贴   ·   F1 配置模型   ·   F2 四季   ·   F3 昼夜   ·   ctrl+q 退出",
        "en": "ctrl+v paste  ·  F1 config  ·  F2 season  ·  F3 day/night  ·  ctrl+q quit",
    },
    "home.bottom.mac": {
        "zh": "⌘+V 智能粘贴   ·   F1 配置模型   ·   F2 四季   ·   F3 昼夜   ·   ⌘+Q 退出",
        "en": "⌘+V Paste  ·  F1 Config  ·  F2 Season  ·  F3 Day/Night  ·  ⌘+Q Quit",
    },
    "home.bottom.win": {
        "zh": "ctrl+v 智能粘贴   ·   F1 配置模型   ·   F2 四季   ·   F3 昼夜   ·   F10 退出",
        "en": "ctrl+v Paste  ·  F1 Config  ·  F2 Season  ·  F3 Day/Night  ·  F10 Exit",
    },
    "home.needs_setup": {"zh": "未配置 LLM，分析过程将只生成粗糙 of 转写文本。按 F1 配置。", "en": "LLM not configured. Analysis will produce raw transcript only. Press F1 to configure."},
    "home.needs_setup.win": {"zh": "未配置 LLM，分析过程将只生成粗糙 of 转写文本。按 F1 配置。", "en": "LLM not configured. Analysis will produce raw transcript only. Press F1 to configure."},
    "home.model_hint": {"zh": "{reason}  按 F1 配置", "en": "{reason}  Press F1 to configure"},
    "home.model_hint.win": {"zh": "{reason}  按 F1 配置", "en": "{reason}  Press F1 to configure"},

    # Chat Screen
    "chat.meta": {"zh": "输入 / 查看指令  ·  ctrl+v 智能粘贴  ·  F1 配置模型  ·  F2 四季  ·  F3 昼夜  ·  ctrl+q 退出", "en": "Type / for commands  ·  ctrl+v Paste  ·  F1 Config  ·  F2 Season  ·  F3 Day/Night  ·  ctrl+q Quit"},
    "chat.meta.mac": {"zh": "输入 / 查看指令  ·  ⌘+V 智能粘贴  ·  F1 配置模型  ·  F2 四季  ·  F3 昼夜  ·  ⌘+Q 退出", "en": "Type / for commands  ·  ⌘+V Paste  ·  F1 Config  ·  F2 Season  ·  F3 Day/Night  ·  ⌘+Q Quit"},
    "chat.meta.win": {"zh": "输入 / 查看指令  ·  ctrl+v 智能粘贴  ·  F1 配置模型  ·  F2 四季  ·  F3 昼夜  ·  F10 退出", "en": "Type / for commands  ·  ctrl+v Paste  ·  F1 Config  ·  F2 Season  ·  F3 Day/Night  ·  F10 Exit"},
    "chat.placeholder": {"zh": "输入你的问题，或输入 / 查看指令...", "en": "Type your question, or / for commands..."},
    "chat.pipeline.preparing": {"zh": "[dim]准备开始分析…[/]", "en": "[dim]Preparing to analyze...[/]"},
    "chat.pipeline.analyzing": {"zh": "[dim]正在分析中…[/]", "en": "[dim]Analyzing...[/]"},
    "chat.pipeline.done": {"zh": "[bold #66bb6a]✓ 完成[/]", "en": "[bold #66bb6a]✓ Completed[/]"},
    "chat.pipeline.failed": {"zh": "[bold]✗ 失败[/]", "en": "[bold]✗ Failed[/]"},
    "chat.pipeline.error": {"zh": "[bold]✗ 错误[/]", "en": "[bold]✗ Error[/]"},
    "chat.search.searching": {"zh": "正在多模态检索：[italic]{query}[/]", "en": "Multimodal searching: [italic]{query}[/]"},
    "chat.search.done": {"zh": "✓ 检索到 {count} 个相关叙事片段：\n", "en": "✓ Retrieved {count} relevant narrative segments:\n"},
    "chat.search.none": {"zh": "x 未检索到相关片段", "en": "x No relevant segments retrieved"},
    "chat.clipboard.attaching": {"zh": "正在获取剪贴板媒体文件...", "en": "Fetching clipboard media file..."},
    "chat.clipboard.no_media": {"zh": "剪贴板上没有复制的媒体文件或图片数据", "en": "No media file or image data copied on the clipboard"},
    "chat.clipboard.attached_image": {"zh": "· 已绑定图片 context", "en": "· Attached image context"},
    "chat.clipboard.vlm_failed": {"zh": "VLM 图像描述生成失败，但图片已附加。", "en": "VLM image description generation failed, but image is attached."},
    "chat.search.none_explain": {
        "zh": "[bold]暂无相关内容[/]\n[dim]粘贴音视频链接或本地路径并按 Enter，分析完成后即可在这里提问。[/]",
        "en": "[bold]No relevant content[/]\n[dim]Paste a media link or local path, press Enter, then ask questions after analysis.[/]"
    },
    "chat.llm.fail_hint": {
        "zh": "[dim]请检查 API Key、模型名称与网络；按 F1 重新配置。[/]",
        "en": "[dim]Check API key, model name, and network; press F1 to reconfigure.[/]",
    },
    "chat.llm.fail_hint.win": {
        "zh": "[dim]请检查 API Key、模型名称与网络；按 F1 重新配置。[/]",
        "en": "[dim]Check API key, model name, and network; press F1 to reconfigure.[/]",
    },

    # Provider taglines (keyed by provider id). Fall back to catalog tagline if not listed.
    "provider.deepseek.tagline": {
        "zh": "国内推荐 · 注册送免费额度 · 价格约为 OpenAI 的 1/30",
        "en": "Recommended · Free credits on signup · Pricing ≈ 1/30 of OpenAI"
    },
    "provider.anthropic.tagline": {
        "zh": "Claude 系列 · Anthropic 原生 Messages API · 模型名手填或选择稳定项",
        "en": "Claude family · Native Anthropic Messages API · Enter a model name or choose a stable option"
    },
    "provider.openai.tagline": {
        "zh": "GPT/o 系列 · 自动拉取你账号实际可用模型",
        "en": "GPT/o family · Auto-fetches models available to your account"
    },
    "provider.gemini.tagline": {
        "zh": "Google AI Studio · OpenAI 兼容端点",
        "en": "Google AI Studio · OpenAI-compatible endpoint"
    },
    "provider.qwen.tagline": {
        "zh": "阿里云百炼 · OpenAI 兼容模式",
        "en": "Alibaba Cloud DashScope · OpenAI-compatible mode"
    },
    "provider.moonshot.tagline": {
        "zh": "Kimi · 长上下文 · 国内访问稳定",
        "en": "Kimi · Long context · Stable in mainland China"
    },
    "provider.zhipu.tagline": {
        "zh": "GLM 系列 · 国内访问快 · glm-4-flash 永久免费",
        "en": "GLM family · Fast in mainland China · glm-4-flash is free forever"
    },
    "provider.doubao.tagline": {
        "zh": "火山方舟 · 模型 ID 是控制台 endpoint ID（ep-xxxxx），必须手填",
        "en": "Volcengine Ark · Model ID is an endpoint ID (ep-xxxxx); must be entered manually"
    },
    "provider.siliconflow.tagline": {
        "zh": "托管开源模型 · 注册有免费额度",
        "en": "Hosted open-source models · Free credits on signup"
    },
    "provider.openrouter.tagline": {
        "zh": "聚合多厂商模型 · 自动拉取实际可用列表",
        "en": "Aggregator across providers · Auto-fetches available models"
    },
    "provider.groq.tagline": {
        "zh": "低延迟推理 · OpenAI 兼容",
        "en": "Low-latency inference · OpenAI-compatible"
    },
    "provider.ollama.tagline": {
        "zh": "完全本地·免费 · 无需 Key · 自动列出已 pull 模型",
        "en": "Fully local · Free · No key needed · Lists pulled models"
    },
    "provider.custom.tagline": {
        "zh": "任何 OpenAI 兼容接口 · 自填地址、Key 和模型名",
        "en": "Any OpenAI-compatible endpoint · Fill in URL, key, and model name"
    },
}

_current_lang = "zh"


def set_lang(lang: str) -> None:
    global _current_lang
    if lang in ("zh", "en"):
        _current_lang = lang
    else:
        _current_lang = "zh"


def get_lang() -> str:
    return _current_lang


def _resolve_key(key: str) -> str:
    """Prefer *.win variant on Windows and *.mac variant on macOS."""
    if sys.platform == "win32":
        win_key = f"{key}.win"
        if win_key in STRINGS:
            return win_key
    elif sys.platform == "darwin":
        mac_key = f"{key}.mac"
        if mac_key in STRINGS:
            return mac_key
    return key


def t(key: str, **fmt: Any) -> str:
    entry = STRINGS.get(_resolve_key(key), {})
    s = entry.get(_current_lang) or entry.get("zh") or key
    if fmt:
        return s.format(**fmt)
    return s


def localized_provider_tagline(pid: str, fallback: str) -> str:
    """Return language-aware tagline for a provider catalog entry."""
    key = f"provider.{pid}.tagline"
    entry = STRINGS.get(key)
    if entry:
        return entry.get(get_lang()) or entry.get("zh") or fallback
    return fallback
