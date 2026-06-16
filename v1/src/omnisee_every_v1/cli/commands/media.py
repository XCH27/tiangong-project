"""Media and asset management commands for the CLI."""

from __future__ import annotations

from typing import Any

import typer

media_app = typer.Typer(help="Media analysis and asset management.")


def _run_dispatcher(source: str, options: dict[str, Any]) -> str:
    """Call the core dispatcher lazily so CLI startup stays lightweight."""
    from omnisee_every.backend import analyze_source_with_options

    def _cb(step: str, msg: str) -> None:
        typer.echo(f"  {msg} [{step}]")

    result = analyze_source_with_options(source, options, progress_cb=_cb)
    if result.status == "done":
        return result.output_path or "done"
    return f"FAILED: {'; '.join(result.errors)}"


def _parse_flags(flags: str | None) -> list[str]:
    if not flags:
        return []
    return [flag.strip() for flag in flags.split(",") if flag.strip()]


@media_app.command()
def probe(
    source: str = typer.Argument(..., help="Video URL or path to local file"),
):
    """Probe video/audio source metadata."""
    from omnisee_every.backend import load_config, probe_source_metadata

    metadata = probe_source_metadata(source, load_config())
    typer.echo(metadata.model_dump_json(indent=2))


@media_app.command()
def analyze(
    source: str = typer.Argument(..., help="Video URL or path to local file"),
    skill: str = typer.Option("video-note", "--skill", "-s", help="Skill to run"),
    flags: str = typer.Option(
        None,
        "--flags",
        "-f",
        help="Comma-separated format flags (e.g., source_links,screenshots)",
    ),
    language: str = typer.Option("zh", "--language", "-l", help="Target language"),
    workspace: str = typer.Option(
        None, "--workspace", "-w", help="Workspace directory override"
    ),
):
    """Analyze video/audio source and generate semantic assets."""
    options: dict[str, Any] = {
        "skill": skill,
        "language": language,
        "format_flags": _parse_flags(flags),
    }
    if workspace:
        import os
        os.environ["OMNISEE_WORKSPACE_DIR"] = workspace

    output = _run_dispatcher(source, options)
    if output.startswith("FAILED"):
        typer.echo(output, err=True)
        raise typer.Exit(code=1)
    typer.echo(f"Analysis complete. Output: {output}")


@media_app.command()
def status(
    source: str = typer.Argument(..., help="Video URL or path to local file"),
):
    """Get the processing status of a source."""
    from omnisee_every.backend import read_source_run_statuses

    statuses = read_source_run_statuses(source)
    if not statuses:
        typer.echo("No runs found for this source.")
        return

    for run_id, skill, state, status_record in statuses:
        typer.echo(f"run={run_id} skill={skill} state={state}")
        typer.echo(status_record.model_dump_json(indent=2))


@media_app.command()
def clean_cache(
    source: str = typer.Argument(..., help="Video URL or path to local file"),
    keep_finals: bool = typer.Option(
        True, "--keep-finals", help="Keep final outputs"
    ),
    force: bool = typer.Option(
        False, "--force", "-f", help="Force deletion without confirmation"
    ),
):
    """Clean cached files for a specific source."""
    from omnisee_every.backend import clean_source_cache

    if not force:
        if not typer.confirm("This action is irreversible. Do you want to continue?"):
            raise typer.Abort()

    source_hash, removed, existed = clean_source_cache(source, keep_finals=keep_finals, force=force)
    if not existed:
        typer.echo("No cache found for this source.")
        return

    if keep_finals:
        typer.echo(
            f"Cleaned intermediate files for {source_hash[:8]}: {', '.join(removed) or 'nothing to clean'}"
        )
    else:
        typer.echo(f"Cleaned all cache for {source_hash[:8]}")


@media_app.command(name="list")
def list_tasks():
    """List all processed tasks."""
    from omnisee_every.backend import list_processed_task_rows

    rows = list_processed_task_rows()
    if not rows:
        typer.echo("No tasks found.")
        return

    for row in rows:
        typer.echo(
            f"[{row.get('state', '?')}] {row.get('skill', '?')} "
            f"| source={row.get('source_hash', '?')[:8]} | run={row.get('run_id', '?')}"
        )


@media_app.command("export-obsidian")
def export_obsidian(
    source: str = typer.Argument(..., help="Video URL or source hash"),
    title: str = typer.Option("", "--title", "-t", help="Note title (default: video title)"),
):
    """Export the latest processed note for a source into the Obsidian vault."""
    from omnisee_every.backend import export_markdown_to_obsidian, latest_scene_markdown

    source_hash, markdown_path = latest_scene_markdown(source)
    if markdown_path is None:
        typer.echo(f"No runs found for {source_hash[:8]}", err=True)
        raise typer.Exit(code=1)

    note_path = export_markdown_to_obsidian(markdown_path, title or source_hash[:8])
    typer.echo(f"Exported to: {note_path}")
