"""Search and RAG commands for the CLI."""

import json

import typer

search_app = typer.Typer(help="Search and RAG operations.")


@search_app.command("ask")
def ask(
    question: str = typer.Argument(..., help="Question about the video content"),
    source: str = typer.Option(None, "--source", "-s", help="Source URL or hash (auto-detected if omitted)"),
    top_k: int = typer.Option(8, "--top-k", "-k", help="Number of context chunks to retrieve"),
):
    """Ask a question about video content using RAG retrieval."""
    from omnisee_every.backend import ask_source_question, compute_source_hash

    if source is None:
        typer.echo("Error: --source is required for now.", err=True)
        raise typer.Exit(code=1)

    source_hash = compute_source_hash(source)
    typer.echo(ask_source_question(question, source_hash))


@search_app.command("corpus-build")
def corpus_build(
    sources: list[str] = typer.Argument(..., help="Source URLs or hashes to index"),
):
    """Build or update the corpus index for multiple videos."""
    from omnisee_every.backend import build_corpus_index

    summary = build_corpus_index(sources)
    typer.echo(json.dumps(summary, ensure_ascii=False, indent=2))


@search_app.command("corpus-search")
def corpus_search(
    query: str = typer.Argument(..., help="Search query"),
    source: str = typer.Option(None, "--source", "-s", help="Filter by source hash"),
    top_k: int = typer.Option(10, "--top-k", "-k", help="Number of results"),
):
    """Search the corpus index (keyword + semantic if embeddings available)."""
    from omnisee_every.backend import search_corpus_hybrid

    results = search_corpus_hybrid(query, source=source, top_k=top_k)
    for r in results:
        sim = r.get("similarity", "")
        sim_str = f" (similarity: {sim:.3f})" if sim else ""
        ts = ""
        if r.get("start_time") is not None:
            start = r["start_time"]
            end = r.get("end_time", start)
            ts = f" [{int(start // 60):02d}:{int(start % 60):02d}-{int(end // 60):02d}:{int(end % 60):02d}]"
        typer.echo(f"[{r.get('source_type', '?')}]{ts}{sim_str}")
        typer.echo(f"  {r['text'][:200]}")
        typer.echo()

    typer.echo(f"Found {len(results)} results.")


@search_app.command("corpus-status")
def corpus_status():
    """Show the current corpus index status."""
    from omnisee_every.backend import corpus_index_status

    data = corpus_index_status()
    if data is not None:
        typer.echo(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        typer.echo("Corpus index not found.")
