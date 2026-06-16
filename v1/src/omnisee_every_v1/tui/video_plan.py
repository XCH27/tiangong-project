"""Small V1 pre-flight analysis plan helpers.

This is a UI heuristic only. The real deterministic AnalysisPlan belongs to the
backend G1.5 work; V1 uses this card to set user expectations before pipeline.
"""

from __future__ import annotations

from pathlib import Path

from omnisee_every_v1.tui.path_utils import is_media_path

_MEDIA_SUFFIXES = {
    ".mp4",
    ".mov",
    ".mkv",
    ".webm",
    ".avi",
    ".mp3",
    ".m4a",
    ".wav",
    ".flac",
    ".srt",
    ".vtt",
    ".ass",
}

_DEFAULT_THEME = {
    "accent": "#8BB69A",
    "success": "#A9C7B8",
}


def _compact_source(source: str, *, limit: int = 42) -> str:
    value = source.strip()
    if len(value) <= limit:
        return value
    return f"{value[:limit - 1]}..."


def source_platform_label(source: str) -> str:
    lower = source.lower()
    path_like = source.startswith(("/", "~", ".")) or ":\\" in source
    if "bilibili.com" in lower or "b23.tv" in lower:
        return "B站"
    if "youtube.com" in lower or "youtu.be" in lower:
        return "YouTube"
    if "douyin.com" in lower:
        return "抖音"
    if "kuaishou.com" in lower:
        return "快手"
    if "xiaohongshu.com" in lower:
        return "小红书"
    if "instagram.com" in lower:
        return "Instagram"
    if "twitter.com" in lower or "x.com" in lower:
        return "X"
    if is_media_path(source) or (path_like and Path(source).suffix.lower() in _MEDIA_SUFFIXES):
        return "本地媒体"
    return "网页视频"


def _analysis_strategy_for(source: str, depth: str) -> tuple[str, str]:
    platform = source_platform_label(source)
    if platform in {"B站", "YouTube"}:
        route = "官方字幕优先 -> 跳过 ASR -> 生成学习笔记"
        cost = "0 MB 下载优先 · 本地脱水"
    elif platform == "本地媒体":
        route = "本地文件 -> 探测字幕 -> 必要时转写"
        cost = "无平台风控 · 仅读本地文件"
    elif platform in {"抖音", "快手"}:
        route = "短视频 -> 先探测字幕/音频 -> 必要时抽帧"
        cost = "可能需下载媒体 · 风控失败会提示上传"
    elif platform in {"小红书", "Instagram", "X"}:
        route = "高风控平台 -> 优先 Clipper/上传降级"
        cost = "不承诺裸抓 · 失败不静默 500"
    else:
        route = "probe -> 字幕/ASR -> 分段 -> 生成笔记"
        cost = "按探测结果决定是否下载"
    if depth != "text_only":
        route = f"{route} -> 锚点帧"
    return route, cost


def build_analysis_plan_markup(
    source: str,
    *,
    skill: str,
    depth: str,
    theme: dict[str, str] | None = None,
) -> str:
    palette = {**_DEFAULT_THEME, **(theme or {})}
    platform = source_platform_label(source)
    route, cost = _analysis_strategy_for(source, depth)
    steps = ["probe", "字幕/ASR", "分段", "生成笔记", "导出"]
    if depth != "text_only":
        steps.insert(3, "锚点帧")
    step_line = "  >  ".join(steps)
    return (
        f"[bold {palette['accent']}]视频分析计划[/]  "
        f"[dim]{_compact_source(source)}[/]\n"
        f"[bold]来源[/] {platform} · [bold]Skill[/] {skill} · [bold]深度[/] {depth}\n"
        f"[bold]策略[/] {route}\n"
        f"[bold]成本[/] {cost} · [dim]当前为 V1 本地预估，真实 plan_analysis 将在 G1.5 接入[/]\n\n"
        f"[{palette['success']}]{step_line}[/]"
    )
