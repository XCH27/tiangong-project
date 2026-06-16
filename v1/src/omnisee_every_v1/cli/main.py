"""OmniVerse Vision Typer CLI.

Ensures lazy-loading of heavy dependencies for sub-100ms startup times.
No torch/whisper/faster_whisper/mlx_whisper imports at module level.
"""

from __future__ import annotations

import typer

app = typer.Typer(
    name="oe",
    help="OmniVerse Vision: A local-first semantic layer for video agentic workflows.",
    no_args_is_help=False,
)


@app.callback(invoke_without_command=True)
def main_callback(ctx: typer.Context):
    """OmniVerse Vision: A local-first semantic layer for video agentic workflows."""
    if ctx.invoked_subcommand is None:
        try:
            from omnisee_every_v1.tui.app import launch
            launch()
        except ImportError:
            # Textual not installed — fall back to static banner
            menu_block = (
                "\n"
                "    \033[1;37m██████  ██    ██  ██    ██  ██  ██████  ████████  ████████\033[0m\n"
                "    \033[1;37m██  ██  ███  ███  ███   ██  ██  ██      ██        ██      \033[0m\n"
                "    \033[38;5;209m██  ██  ████████  ████  ██  ██  ██████  ██████    ██████  \033[0m\n"
                "    \033[38;5;209m██  ██  ██ ██ ██  ██ ██ ██  ██      ██  ██        ██      \033[0m\n"
                "    \033[38;5;209m██████  ██    ██  ██  ████  ██  ██████  ████████  ████████\033[0m\n"
                "                   \033[90mE   V   E   R   Y\033[0m\n\n"
                "    \033[38;5;209m● Tip\033[0m \033[90m输入\033[0m \033[38;5;209moe wizard\033[0m \033[90m启动交互向导，免记命令一键分析与对话视频！\033[0m\n\n"
                "    \033[38;5;209m▌\033[0m \033[1;37m一键工作流 / Core Workflows\033[0m\n"
                "    \033[90m▌\033[0m\n"
                "    \033[90m▌\033[0m   \033[38;5;209moe wizard\033[0m          一键智能交互式向导 (最推荐初学者)\n"
                "    \033[90m▌\033[0m   \033[38;5;209moe chat\033[0m            与任意视频进行对话式聊天 (本地 RAG)\n"
                "    \033[90m▌\033[0m   \033[38;5;209moe setup\033[0m           交互式环境能力探测与 LLM/ASR 接口配置\n"
                "    \033[90m▌\033[0m   \033[38;5;209moe serve\033[0m           启动本地 REST API 服务 (8000端口)\n"
                "    \033[90m▌\033[0m\n"
                "    \033[36m▌\033[0m \033[1;37m进阶原子指令 / Advanced Commands\033[0m\n"
                "    \033[90m▌\033[0m\n"
                "    \033[90m▌\033[0m   \033[36moe analyze <url>\033[0m    开始自动化分析视频 (提取字幕、视觉截帧)\n"
                "    \033[90m▌\033[0m   \033[36moe ask <q> -s <h>\033[0m   提出具体的视频内容问题 (RAG 检索)\n"
                "    \033[90m▌\033[0m   \033[36moe build-corpus\033[0m     分析视频并写入本地全文搜索 FTS5 语义库\n"
                "    \033[90m▌\033[0m   \033[36moe export-obsidian\033[0m 将视频场景笔记导出至您的 Obsidian 笔记本\n"
                "    \033[90m▌\033[0m   \033[36moe list\033[0m             列出当前本地已处理的全部音视频任务\n"
                "    \033[90m▌\033[0m   \033[36moe status <h>\033[0m       查询某个视频的后台流式处理运行进度\n"
                "    \033[90m▌\033[0m   \033[36moe clean-cache <h>\033[0m  清除某个视频的中间缓存以释放磁盘空间\n"
                "    \033[90m▌\033[0m   \033[36moe probe <url>\033[0m      高速获取视频基础元数据 (时长、清晰度等)\n"
            )
            from omnisee_every.backend import print_block_centered

            print_block_centered(menu_block)
        raise typer.Exit()


# ── Mount all sub-command modules ─────────────────────────────────────────────
from omnisee_every_v1.cli.commands.search import search_app  # noqa: E402
from omnisee_every_v1.cli.commands.media import media_app  # noqa: E402
from omnisee_every_v1.cli.commands.interactive import interactive_app  # noqa: E402

for _sub_app in (search_app, media_app, interactive_app):
    for _cmd in _sub_app.registered_commands:
        app.registered_commands.append(_cmd)
# ─────────────────────────────────────────────────────────────────────────────


def main():
    app()


if __name__ == "__main__":
    main()
