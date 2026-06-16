"""Interactive and server commands for the CLI."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import typer

interactive_app = typer.Typer(help="Interactive sessions and server.")


def _run_dispatcher(source: str, options: dict[str, Any]) -> str:
    """Call the core dispatcher lazily so CLI startup stays lightweight."""
    from omnisee_every.backend import analyze_source_with_options

    def _cb(step: str, msg: str) -> None:
        typer.echo(f"  {msg} [{step}]")

    result = analyze_source_with_options(source, options, progress_cb=_cb)
    if result.status == "done":
        return result.output_path or "done"
    return f"FAILED: {'; '.join(result.errors)}"


def describe_image_with_vlm(image_path: str, config: dict) -> tuple[bool, str]:
    """Backward-compatible wrapper for CLI visual paste support."""
    from omnisee_every.backend import describe_image

    return describe_image(image_path, config)


@interactive_app.command()
def chat(
    source: str = typer.Option(None, "--source", "-s", help="Video URL, local path, or source hash to chat with"),
):
    """Start an interactive conversational session with a video's content."""
    from omnisee_every.backend import (
        ask_source_question,
        clean_dragged_path,
        compute_source_hash,
        get_clipboard_media,
        list_completed_sources,
        list_skills,
        load_config,
        print_block_centered,
        print_left_bar,
        source_has_index,
        source_title,
        workspace_dir,
    )

    config = load_config()

    # 1. Clear screen and print the stylish OpenCode-style ASCII Logo
    os.system("clear")
    logo_block = (
        "\n"
        "    \033[1;37m██████  ██    ██  ██    ██  ██  ██████  ████████  ████████\033[0m\n"
        "    \033[1;37m██  ██  ███  ███  ███   ██  ██  ██      ██        ██      \033[0m\n"
        "    \033[38;5;209m██  ██  ████████  ████  ██  ██  ██████  ██████    ██████  \033[0m\n"
        "    \033[38;5;209m██  ██  ██ ██ ██  ██ ██ ██  ██      ██  ██        ██      \033[0m\n"
        "    \033[38;5;209m██████  ██    ██  ██  ████  ██  ██████  ████████  ████████\033[0m\n"
        "                   \033[90mE   V   E   R   Y\033[0m\n\n"
        "    \033[38;5;209m● Tip\033[0m \033[90mType '/' to list slash commands or '/paste' to attach media from clipboard!\033[0m\n"
    )
    print_block_centered(logo_block)

    # Fetch available runs to help user choose if source not provided
    ws_base = workspace_dir(config)

    def get_completed_runs():
        return list_completed_sources(config)

    completed_runs = get_completed_runs()
    chosen_hash = None
    chosen_title = None

    def print_menu_and_select(source_param):
        nonlocal chosen_hash, chosen_title
        runs = get_completed_runs()
        if not source_param:
            if not runs:
                typer.echo("\033[90m▌\033[0m \033[38;5;209m[提示] 您目前尚未处理过任何音视频。\033[0m")
                typer.echo("\033[90m▌\033[0m \033[90m提示：您可以在 Finder 中复制视频文件，然后在此处输入 '/paste' 直接粘贴它！\033[0m")
                source_param = typer.prompt("\033[36m▌\033[0m 请输入视频 URL 或本地音视频文件绝对路径 (支持 '/paste')", prompt_suffix=": ")
                source_param = clean_dragged_path(source_param)
            else:
                typer.echo("    \033[38;5;209m▌\033[0m \033[1;37m欢迎使用 OmniVerse Vision 视频对话会话！最近已处理视频：\033[0m")
                typer.echo("    \033[90m▌\033[0m")
                for idx, (_, title) in enumerate(runs[:10]):
                    t_truncated = title[:45] + "..." if len(title) > 45 else title
                    typer.echo(f"    \033[90m▌\033[0m  \033[38;5;209m[{idx + 1}]\033[0m {t_truncated}")
                typer.echo("    \033[90m▌\033[0m  \033[38;5;209m[N]\033[0m 对话一个新的视频（输入链接或本地路径，或输入 '/paste'）")
                typer.echo("    \033[90m▌\033[0m \033[90m提示：支持直接拖拽视频文件或输入 '/paste' 自动读取剪贴板！\033[0m")
                typer.echo("")

                try:
                    choice = typer.prompt("\033[36m▌\033[0m 请选择视频序号或输入全新视频链接/路径", default="1", prompt_suffix=": ")
                except (KeyboardInterrupt, EOFError):
                    raise typer.Exit(code=0)

                choice_clean = clean_dragged_path(choice)
                if choice_clean.strip() in ("/paste", "/p"):
                    typer.echo("    \033[36m▌\033[0m 正在读取系统剪贴板...")
                    m_type, m_path = get_clipboard_media()
                    if not m_type or not m_path:
                        try:
                            import subprocess
                            text_proc = subprocess.run(["pbpaste"], capture_output=True, text=True, timeout=2.0)
                            text = text_proc.stdout.strip()
                            if text.startswith(("http://", "https://")):
                                m_type, m_path = "url", text
                        except Exception:
                            pass
                    if m_type and m_path:
                        typer.echo(f"    \033[32m▌ [成功] 在剪贴板中检测到：{m_path}\033[0m")
                        source_param = m_path
                    else:
                        typer.echo("    \033[31m▌ [失败] 剪贴板中未检测到有效的文件、链接或截图路径，返回默认菜单。\033[0m")
                        source_param = None
                elif choice_clean.strip().isdigit() and 1 <= int(choice_clean) <= len(runs):
                    chosen_hash, chosen_title = runs[int(choice_clean) - 1]
                else:
                    source_param = choice_clean

        if source_param and not chosen_hash:
            if source_param.strip() in ("/paste", "/p"):
                # Double-check clipboard if they just typed /paste directly
                m_type, m_path = get_clipboard_media()
                if not m_type or not m_path:
                    try:
                        import subprocess
                        text_proc = subprocess.run(["pbpaste"], capture_output=True, text=True, timeout=2.0)
                        text = text_proc.stdout.strip()
                        if text.startswith(("http://", "https://")):
                            m_type, m_path = "url", text
                    except Exception:
                        pass
                if m_type and m_path:
                    source_param = m_path
            chosen_hash = compute_source_hash(source_param) if source_param.startswith("http") or "/" in source_param or "." in source_param else source_param
            chosen_title = source_param
        return source_param

    source = print_menu_and_select(source)

    if not chosen_hash:
        typer.echo("\033[31m▌ 错误：未选择合法的音视频源。\033[0m")
        raise typer.Exit(code=1)

    has_index = source_has_index(chosen_hash, config)

    if not has_index:
        typer.echo(f"\n\033[90m▌\033[0m [提示] 视频 《{chosen_title}》 尚未构建语义索引。")
        confirm = typer.confirm("\033[36m▌\033[0m 是否现在立刻自动为您转写并建立语义索引？", default=True, prompt_suffix=" ")
        if not confirm:
            typer.echo("\033[90m▌\033[0m 会话已退出。请先运行 'oe build-corpus <source>' 建立索引后再试。")
            raise typer.Exit(code=0)

        options = {
            "skill": "corpus-build",
            "language": "zh",
            "format_flags": [],
        }
        typer.echo("\n\033[36m▌\033[0m 正在自动分析并建立索引中...")
        _run_dispatcher(source, options)

        if not source_has_index(chosen_hash, config):
            typer.echo("\033[31m▌ 错误：建立语义索引失败！请检查您的网络或视频源。\033[0m")
            raise typer.Exit(code=1)

    chosen_title = source_title(chosen_hash, config, fallback=chosen_title)

    # 4. Start interactive session loop!
    def _chat_loop():
        nonlocal chosen_hash, chosen_title, source
        llm_cfg = config.get("llm", {})
        api_key = llm_cfg.get("api_key", "")
        model_name = llm_cfg.get("model_name", "gpt-4o")

        if not api_key:
            typer.echo("\033[31m▌ Error: no LLM API key configured. Run 'oe setup' first to configure your API key.\033[0m")
            raise typer.Exit(code=1)

        conversation_memory: list[tuple[str, str]] = []

        typer.echo("")
        t_trunc = chosen_title[:40] + "..." if len(chosen_title) > 40 else chosen_title
        typer.echo(f"    \033[38;5;209m▌\033[0m 进入与视频《{t_trunc}》的对话会话！")
        typer.echo("    \033[90m▌\033[0m 输入问题实时为您检索回答。支持输入 '/' 查看指令菜单。")
        typer.echo("    \033[90m▌\033[0m 支持直接输入 '/paste' (或 '/p') 智能粘贴系统剪贴板中的视频或截图！")
        typer.echo("")

        attached_image_context = None

        while True:
            typer.echo(f"\033[90m─\033[0m" * 60)

            # Signature OpenCode layout card!
            typer.echo(f"    \033[38;5;209m▌\033[0m \033[1;37mAsk anything...\033[0m")
            t_trunc_current = chosen_title[:45] + "..." if len(chosen_title) > 45 else chosen_title

            status_line = f"Active: 视频 {t_trunc_current} · 模型 {model_name}"
            if attached_image_context:
                status_line += " · [已绑定剪贴板图片 context]"
            typer.echo(f"    \033[90m▌\033[0m \033[90m{status_line}\033[0m")
            typer.echo("    \033[90m▌\033[0m \033[90mtab agents  / commands  /paste clipboard  ctrl+c exit\033[0m")

            try:
                question = typer.prompt("    \033[36m▌\033[0m 您 ", prompt_suffix=" > ")
            except (KeyboardInterrupt, EOFError):
                typer.echo("\n\033[90m▌\033[0m 会话已关闭，再见！")
                break

            q_clean = question.strip()
            if not q_clean:
                continue

            if q_clean.lower() in ("/paste", "/p"):
                typer.echo("\n    \033[36m▌\033[0m 正在读取系统剪贴板...")
                media_type, media_path = get_clipboard_media()
                if not media_type or not media_path:
                    try:
                        import subprocess
                        text_proc = subprocess.run(["pbpaste"], capture_output=True, text=True, timeout=2.0)
                        text = text_proc.stdout.strip()
                        if text.startswith(("http://", "https://")):
                            media_type, media_path = "url", text
                    except Exception:
                        pass
                if not media_type or not media_path:
                    typer.echo("    \033[31m▌ [错误] 剪贴板中未检测到有效的文件、链接或图片截图像素！\033[0m")
                    typer.echo("    \033[90m▌ 提示：请先在 macOS Finder 中复制音视频文件，或者复制视频链接，或者使用快捷键截图到剪贴板中。\033[0m\n")
                    continue

                typer.echo("    \033[32m▌ [成功] 获取剪贴板媒体！\033[0m")
                typer.echo(f"    \033[90m▌ 路径: {media_path} ({media_type})\033[0m")

                ext = Path(media_path).suffix.lower()
                is_video_audio = media_type == "url" or ext in (
                    ".mp4", ".mov", ".avi", ".mkv", ".flv", ".webm",
                    ".mp3", ".wav", ".m4a", ".aac", ".flac", ".ogg"
                )

                if is_video_audio:
                    typer.echo("    \033[36m▌ 检测到复制的是音视频文件，正在自动切换焦点并构建索引...")
                    new_hash = compute_source_hash(media_path)

                    if not source_has_index(new_hash, config):
                        typer.echo("    \033[90m▌ 该音视频尚未建立索引，正在为您自动转写并开始提取语料 (可能需要几十秒)... \033[0m")
                        options = {
                            "skill": "corpus-build",
                            "language": "zh",
                            "format_flags": [],
                        }
                        _run_dispatcher(media_path, options)

                    chosen_hash = new_hash
                    source = media_path
                    chosen_title = source_title(chosen_hash, config, fallback=Path(media_path).name)
                    conversation_memory.clear()
                    typer.echo(f"    \033[32m▌ [成功] 已成功切换当前对话视频为：《{chosen_title}》！\033[0m\n")
                    continue
                else:
                    # Clipboard Image!
                    typer.echo("    \033[36m▌ 检测到截图或图片，正在调用视觉模型 (VLM) 自动解析图片内容...")
                    vlm_ok, desc = describe_image_with_vlm(media_path, config)

                    if not vlm_ok:
                        typer.echo(f"    \033[31m▌ [警告] VLM 视觉模块不可用或未配置: {desc}\033[0m")
                        manual_desc = typer.prompt("    \033[36m▌ 请手动为此截图/图片输入一段文字描述", default="", prompt_suffix=": ")
                        if manual_desc.strip():
                            desc = manual_desc.strip()
                        else:
                            desc = "Attached clipboard image"
                    else:
                        typer.echo("    \033[32m▌ [成功] 视觉模型描述提取成功！\033[0m")

                    attached_image_context = f"[Attached Clipboard Image]\nPath: {media_path}\nVisual Description: {desc}"
                    typer.echo("    \033[90m▌ 图片已成功绑定至下一次对话提问中！\033[0m")
                    typer.echo(f"    \033[38;5;209m▌ 语义提取: {desc[:80]}...\033[0m\n")
                    continue

            # Slash commands processing!
            if q_clean.startswith("/"):
                cmd = q_clean.lower().split()[0]
                if cmd in ("/exit", "/quit", "/q"):
                    typer.echo("\033[90m▌\033[0m 会话已关闭，再见！")
                    break
                elif cmd == "/":
                    typer.echo("    \033[38;5;209m▌\033[0m \033[1;37m可用快捷指令 / Slash Commands\033[0m")
                    typer.echo("    \033[90m▌\033[0m")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/paste\033[0m    智能粘贴剪贴板视频/图片 (Paste from clipboard)")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/chat\033[0m     切换视频对话 (Switch active video chat)")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/list\033[0m     列出已分析视频 (List processed videos)")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/export\033[0m   导出当前笔记到 Obsidian (Export to vault)")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/status\033[0m   查看当前视频分析状态 (Check run status)")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/skills\033[0m   列出已加载的推理技能 (List skills)")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/setup\033[0m    重新配置 LLM 大模型 / ASR (Reconfigure)")
                    typer.echo("    \033[90m▌\033[0m  \033[38;5;209m/exit\033[0m     退出当前会话 (Exit the chat session)")
                    typer.echo("")
                    continue
                elif cmd == "/help":
                    typer.echo("\033[90m▌ 可用指令：/paste, /chat, /list, /export, /status, /skills, /setup, /exit\033[0m")
                    continue
                elif cmd == "/list":
                    typer.echo("\033[90m▌ 正在读取当前已处理的所有视频任务...\033[0m")
                    try:
                        from omnisee_every_v1.cli.commands.media import list_tasks as _list_tasks
                        _list_tasks()
                    except Exception as e:
                        print_left_bar(f"获取任务列表错误: {e}", color_code="\033[31m")
                    continue
                elif cmd == "/skills":
                    print_left_bar("已加载的系统分析推理技能：")
                    for skill in list_skills():
                        print_left_bar(f"- {skill['name']}: {skill['description']}")
                    continue
                elif cmd == "/setup":
                    typer.echo("\033[90m▌ 启动配置模块...\033[0m")
                    setup()
                    continue
                elif cmd == "/status":
                    typer.echo(f"\033[90m▌ 视频哈希: {chosen_hash}\033[0m")
                    try:
                        from omnisee_every_v1.cli.commands.media import status as _status
                        _status(source=chosen_hash)
                    except Exception as e:
                        print_left_bar(f"获取状态错误: {e}", color_code="\033[31m")
                    continue
                elif cmd == "/export":
                    typer.echo("\033[90m▌ 正在自动导出当前视频笔记至 Obsidian...\033[0m")
                    try:
                        from omnisee_every_v1.cli.commands.media import export_obsidian as _export_obsidian
                        _export_obsidian(source=chosen_hash)
                    except Exception as e:
                        print_left_bar(f"导出 Obsidian 错误: {e}", color_code="\033[31m")
                    continue
                elif cmd == "/chat":
                    chosen_hash = None
                    chosen_title = None
                    source = None
                    source = print_menu_and_select(source)
                    if chosen_hash:
                        conversation_memory.clear()
                        typer.echo(f"\033[32m▌ 已成功切换到新视频对话：《{chosen_title}》\033[0m")
                    continue
                else:
                    print_left_bar(f"未知指令: {cmd}。输入 '/' 查看所有可用指令。", color_code="\033[31m")
                    continue

            typer.echo("    \033[36m▌\033[0m \033[90mAI 思考中...\033[0m", nl=False)

            # Attach image context to prompt if present, then consume it
            q_combined = q_clean
            if attached_image_context:
                q_combined = f"{attached_image_context}\n\nUser Question: {q_clean}"
                attached_image_context = None

            conversation_memory.append(("user", q_combined))

            try:
                answer = ask_source_question(q_combined, chosen_hash, config)
                typer.echo("\r" + " " * 30 + "\r", nl=False)
                typer.echo("    \033[38;5;209m▌\033[0m \033[1;37mAI 回复：\033[0m")
                print_left_bar(answer, color_code="    \033[38;5;209m")
                typer.echo("")
                conversation_memory.append(("assistant", answer))
            except Exception as exc:
                typer.echo("\r" + " " * 30 + "\r", nl=False)
                print_left_bar(f"发生错误: {exc}", color_code="    \033[31m")
                typer.echo("")

    _chat_loop()


@interactive_app.command("setup")
def setup():
    """Interactive first-time setup: detect capabilities and configure providers."""
    import shutil

    import httpx
    from omnisee_every.backend import save_user_config

    typer.echo("OmniVerse Vision setup")

    ffmpeg_path = shutil.which("ffmpeg")
    typer.echo(f"ffmpeg: {ffmpeg_path or 'not found'}")

    ollama_online = False
    ollama_models: list[str] = []
    try:
        resp = httpx.get("http://localhost:11434/api/tags", timeout=3.0)
        resp.raise_for_status()
        data = resp.json()
        ollama_models = [m.get("name", "") for m in data.get("models", []) if m.get("name")]
        ollama_online = True
    except Exception:
        pass

    typer.echo(f"Ollama: {'online' if ollama_online else 'offline'}")
    if ollama_models:
        typer.echo("Ollama models: " + ", ".join(ollama_models))
    if ollama_online and not any("minicpm" in model.lower() for model in ollama_models):
        typer.echo("MiniCPM-V not found. Recommended: ollama pull minicpm-v")

    asr_choice = typer.prompt(
        "ASR provider [bcut/faster-whisper/groq]",
        default="bcut",
    )
    llm_choice = typer.prompt(
        "LLM provider [ollama/deepseek/custom]",
        default="deepseek",
    )
    vlm_choice = typer.prompt(
        "VLM provider [minicpm-local/siliconflow/gemini/skip]",
        default="minicpm-local" if ollama_online else "skip",
    )
    translate_choice = typer.prompt(
        "Translate mode [llm/google/never]",
        default="llm",
    )

    config: dict[str, Any] = {
        "asr": {"default_provider": asr_choice},
        "translate": {
            "enabled": "never" if translate_choice == "never" else "auto",
            "target_lang": "zh",
            "provider": "google" if translate_choice == "google" else "llm",
        },
    }

    if llm_choice == "ollama":
        config["llm"] = {
            "api_key": "ollama",
            "base_url": typer.prompt("Ollama OpenAI base URL", default="http://localhost:11434/v1"),
            "model_name": typer.prompt("Ollama LLM model", default="qwen2.5"),
        }
    elif llm_choice == "custom":
        config["llm"] = {
            "api_key": typer.prompt("LLM API key", default="", hide_input=True),
            "base_url": typer.prompt("LLM base URL", default="https://api.openai.com/v1"),
            "model_name": typer.prompt("LLM model", default="gpt-4o-mini"),
        }
    else:
        config["llm"] = {
            "api_key": typer.prompt("DeepSeek API key", default="", hide_input=True),
            "base_url": "https://api.deepseek.com",
            "model_name": "deepseek-v4-flash",
        }

    if asr_choice == "groq":
        config.setdefault("asr", {})["groq_api_key"] = typer.prompt(
            "Groq API key",
            default="",
            hide_input=True,
        )

    if vlm_choice == "minicpm-local":
        config["vlm"] = {
            "provider": "openai_compat",
            "model_name": "minicpm-v",
            "openai_base_url": "http://localhost:11434/v1",
            "openai_api_key": "",
        }
    elif vlm_choice == "siliconflow":
        config["vlm"] = {
            "provider": "openai_compat",
            "model_name": "OpenBMB/MiniCPM-V-2_6",
            "openai_base_url": "https://api.siliconflow.cn/v1",
            "openai_api_key": typer.prompt("SiliconFlow API key", default="", hide_input=True),
        }
    elif vlm_choice == "gemini":
        config["vlm"] = {
            "default_provider": "gemini",
            "model_name": "gemini-2.5-flash",
            "gemini_api_key": typer.prompt("Gemini API key", default="", hide_input=True),
        }
    else:
        config["vlm"] = {"default_provider": "none"}

    save_user_config(config)
    typer.echo("Wrote config: tmp/config/config.yaml")
    if not ffmpeg_path:
        typer.echo("Install ffmpeg before running ASR or frame extraction.")
    if vlm_choice == "minicpm-local" and not any("minicpm" in model.lower() for model in ollama_models):
        typer.echo("Run: ollama pull minicpm-v")


@interactive_app.command("wizard")
def wizard():
    """交互式智能向导：一步步引导您完成配置、视频分析与语义对话！"""
    from omnisee_every.backend import (
        compute_source_hash,
        export_markdown_to_obsidian,
        print_block_centered,
        print_left_bar,
    )

    # Stylish OpenCode-style ASCII Logo
    logo_block = (
        "\n"
        "    \033[1;37m██████  ██    ██  ██    ██  ██  ██████  ████████  ████████\033[0m\n"
        "    \033[1;37m██  ██  ███  ███  ███   ██  ██  ██      ██        ██      \033[0m\n"
        "    \033[38;5;209m██  ██  ████████  ████  ██  ██  ██████  ██████    ██████  \033[0m\n"
        "    \033[38;5;209m██  ██  ██ ██ ██  ██ ██ ██  ██      ██  ██        ██      \033[0m\n"
        "    \033[38;5;209m██████  ██    ██  ██  ████  ██  ██████  ████████  ████████\033[0m\n"
        "                   \033[90mE   V   E   R   Y\033[0m\n\n"
        "    \033[38;5;209m● Tip\033[0m \033[90mThemes support dark/light variants for both modes\033[0m\n"
    )
    print_block_centered(logo_block)

    while True:
        wizard_menu = (
            "    \033[38;5;209m▌\033[0m \033[1;37m欢迎使用 OmniVerse Vision 交互式智能向导！\033[0m\n"
            "    \033[90m▌\033[0m\n"
            "    \033[90m▌\033[0m   \033[38;5;209m[1]\033[0m 一键配置大模型 API & 音频转写 (Setup API)\n"
            "    \033[90m▌\033[0m   \033[38;5;209m[2]\033[0m 一键分析单个视频 (Analyze Video & Write Notes)\n"
            "    \033[90m▌\033[0m   \033[38;5;209m[3]\033[0m 视频对话式 RAG 交互会话 (Conversational QA)\n"
            "    \033[90m▌\033[0m   \033[38;5;209m[4]\033[0m 批量视频一键建库 (Batch Video Indexing)\n"
            "    \033[90m▌\033[0m   \033[38;5;209m[5]\033[0m 跨视频语义 / 关键字混合检索 (Search Index)\n"
            "    \033[90m▌\033[0m   \033[38;5;209m[6]\033[0m 查看当前已处理的所有视频任务 (List Processed)\n"
            "    \033[90m▌\033[0m   \033[38;5;209m[0]\033[0m 退出智能向导 (Exit the Wizard)\n"
        )
        print_block_centered(wizard_menu)

        try:
            choice = typer.prompt("\033[36m▌\033[0m 请输入数字选择", default="2", prompt_suffix=": ")
        except (KeyboardInterrupt, EOFError):
            typer.echo("\n\033[90m▌\033[0m 再见！")
            break

        choice = choice.strip()

        if choice == "1":
            typer.echo("\n\033[90m▌\033[0m 正在启动一键配置模块...\n")
            setup()
        elif choice == "2":
            typer.echo("\n\033[90m▌\033[0m 正在启动一键视频分析模式...")
            try:
                source = typer.prompt("\033[36m▌\033[0m 请输入音视频链接 (如B站URL) 或本地音视频文件的绝对路径", prompt_suffix=": ")
            except (KeyboardInterrupt, EOFError):
                continue
            source = source.strip()
            if not source:
                typer.echo("\033[31m▌ [错误] 视频源不能为空！\033[0m")
                continue

            typer.echo("\n\033[90m▌\033[0m 请选择您希望生成的内容类型 (Skill)：")
            typer.echo("\033[90m▌\033[0m   \033[38;5;209m[1]\033[0m 视频结构化学习笔记 (video-note) [推荐]")
            typer.echo("\033[90m▌\033[0m   \033[38;5;209m[2]\033[0m 影视分镜与视觉分析 (shot-breakdown)")
            typer.echo("\033[90m▌\033[0m   \033[38;5;209m[3]\033[0m 播客/音频内容大纲转写 (podcast-outline)")
            typer.echo("\033[90m▌\033[0m   \033[38;5;209m[4]\033[0m 提取提示词反推设计 (reverse-prompt)")
            try:
                skill_choice = typer.prompt("\033[36m▌\033[0m 请选择序号或直接输入自定义技能名称", default="1", prompt_suffix=": ")
            except (KeyboardInterrupt, EOFError):
                continue

            skill_map = {
                "1": "video-note",
                "2": "shot-breakdown",
                "3": "podcast-outline",
                "4": "reverse-prompt"
            }
            skill = skill_map.get(skill_choice.strip(), skill_choice.strip())

            try:
                enable_visual = typer.confirm("\033[36m▌\033[0m 是否启用视频视觉截图？(需要较长时间，且需配置好本地 VLM 或 API)", default=False, prompt_suffix=" ")
                export_obsidian_opt = typer.confirm("\033[36m▌\033[0m 分析完成后，是否直接自动导出至 Obsidian 笔记本？", default=True, prompt_suffix=" ")
            except (KeyboardInterrupt, EOFError):
                continue

            flags_list = []
            if enable_visual:
                flags_list.extend(["screenshots", "source_links"])
            else:
                flags_list.append("source_links")

            typer.echo(f"\n\033[90m▌\033[0m 开始分析: {source}")
            typer.echo(f"\033[90m▌\033[0m    采用技能: {skill}")
            typer.echo(f"\033[90m▌\033[0m    视觉特征: {'已开启 (含截图)' if enable_visual else '未开启 (纯音频字幕+时间戳)'}")
            typer.echo("    \033[90m▌\033[0m")

            options = {
                "skill": skill,
                "language": "zh",
                "format_flags": flags_list,
            }

            try:
                output = _run_dispatcher(source, options)
                if output.startswith("FAILED"):
                    print_left_bar(f"分析失败: {output}", color_code="\033[31m")
                else:
                    print_left_bar(f"分析成功！输出文件已保存在: {output}", color_code="\033[32m")

                    if export_obsidian_opt:
                        typer.echo("\n\033[90m▌\033[0m 正在自动导出至 Obsidian...")
                        try:
                            source_hash = compute_source_hash(source)

                            # Find candidate path
                            candidate = Path(output)
                            if not candidate.is_file():
                                candidate = Path(output) / "outputs" / "scene_markdown.md"

                            if candidate.is_file():
                                try:
                                    note_title = typer.prompt("\033[36m▌\033[0m 请输入导出的笔记标题", default=source_hash[:8], prompt_suffix=": ")
                                except (KeyboardInterrupt, EOFError):
                                    note_title = source_hash[:8]
                                note_path = export_markdown_to_obsidian(candidate, note_title)
                                print_left_bar(f"[成功] 成功导出至 Obsidian: {note_path}", color_code="\033[32m")
                            else:
                                print_left_bar("找不到生成的 scene_markdown.md，导出失败", color_code="\033[31m")
                        except Exception as e:
                            print_left_bar(f"导出 Obsidian 发生错误: {e}", color_code="\033[31m")
            except Exception as e:
                print_left_bar(f"分析发生未知错误: {e}", color_code="\033[31m")

        elif choice == "3":
            typer.echo("\n\033[90m▌\033[0m 正在启动视频对话会话...\n")
            try:
                chat()
            except Exception as e:
                print_left_bar(f"对话发生错误: {e}", color_code="\033[31m")

        elif choice == "4":
            typer.echo("\n\033[90m▌\033[0m 正在启动批量视频一键建库...")
            try:
                sources_input = typer.prompt("\033[36m▌\033[0m 请输入视频链接或路径（多个以逗号 ',' 分隔）", prompt_suffix=": ")
            except (KeyboardInterrupt, EOFError):
                continue
            sources = [s.strip() for s in sources_input.split(",") if s.strip()]
            if not sources:
                typer.echo("\033[31m▌ [错误] 未提供任何视频源！\033[0m")
                continue

            typer.echo(f"\n\033[90m▌\033[0m 开始为 {len(sources)} 个视频提取语料并构建语义索引...")
            try:
                for s in sources:
                    typer.echo(f"\n\033[36m▌\033[0m ▶ 正在处理: {s}")
                    options = {
                        "skill": "corpus-build",
                        "language": "zh",
                        "format_flags": [],
                    }
                    _run_dispatcher(s, options)
                print_left_bar("批量建库与语义索引构建全部完成！", color_code="\033[32m")
            except Exception as e:
                print_left_bar(f"批量建库发生错误: {e}", color_code="\033[31m")

        elif choice == "5":
            typer.echo("\n\033[90m▌\033[0m 正在启动跨视频语义/关键字混合检索...")
            try:
                query = typer.prompt("\033[36m▌\033[0m 请输入您的搜索关键词或语义问题", prompt_suffix=": ")
            except (KeyboardInterrupt, EOFError):
                continue
            query = query.strip()
            if not query:
                typer.echo("\033[31m▌ [错误] 搜索词不能为空！\033[0m")
                continue

            try:
                source_filter = typer.prompt("\033[36m▌\033[0m 是否只过滤特定视频源？(直接回车代表搜索所有视频, 输入'BVxxx'或链接以过滤)", default="", prompt_suffix=": ")
            except (KeyboardInterrupt, EOFError):
                source_filter = ""
            source_filter = source_filter.strip()

            try:
                from omnisee_every_v1.cli.commands.search import corpus_search as _corpus_search
                _corpus_search(query=query, source=source_filter if source_filter else None)
            except Exception as e:
                print_left_bar(f"检索发生错误: {e}", color_code="\033[31m")

        elif choice == "6":
            typer.echo("\n\033[90m▌\033[0m 正在读取当前已处理的所有视频任务...\n")
            try:
                from omnisee_every_v1.cli.commands.media import list_tasks as _list_tasks
                _list_tasks()
            except Exception as e:
                print_left_bar(f"获取任务列表错误: {e}", color_code="\033[31m")

        elif choice == "0" or choice.lower() == "q":
            typer.echo("\n\033[90m▌\033[0m 感谢使用 OmniVerse Vision，再见！")
            break
        else:
            typer.echo("\033[31m▌ [警告] 选项无效，请输入 0 到 6 之间的数字！\033[0m")


@interactive_app.command("serve")
def serve(
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Host to bind the server to"),
    port: int = typer.Option(8000, "--port", "-p", help="Port to bind the server to"),
    reload: bool = typer.Option(False, "--reload", help="Enable auto-reload (development)"),
):
    """Start the REST API server using Uvicorn."""
    import uvicorn
    from omnisee_every.backend import load_config
    from omnisee_every_v1.cli.worker_process import start_worker_process, stop_worker_process

    config = load_config()
    api_key = config.get("api", {}).get("key", "")

    typer.echo(f"Starting OmniVerse Vision REST API server at http://{host}:{port}")
    if api_key:
        typer.echo("API Key authentication is ENABLED via X-API-Key header.")
    else:
        typer.echo("WARNING: API Key authentication is DISABLED (frictionless local developer mode).")

    worker = start_worker_process()
    typer.echo(f"Worker subprocess started (pid={worker.pid}).")
    try:
        uvicorn.run("omnisee_every.api.router:app", host=host, port=port, reload=reload)
    finally:
        stop_worker_process(worker)
