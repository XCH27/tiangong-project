# OmniVerse Vision V2 Client

V2 is the interactive TUI client for the shared OmniVerse Vision backend. It is a user-facing terminal application, not a second backend and not a separate video-processing CLI.

The current runtime is a direct `@earendil-works/pi-tui` terminal app. It does not depend on Ink, React rendering, or a generated shim.

The normal entrypoint is the repository-level `ov` launcher:

```bash
uv run ov
uv run ov serve --port 8000
uv run ov --live --api-url http://127.0.0.1:8000
```

`uv run ov` reads the saved V2 setup config at `~/.config/omniverse-vision/v2.json`. If no live/mock preference is saved and the configured backend health endpoint is online, it auto-enters live mode; otherwise it opens demo/mock mode. CLI flags such as `--live`, `--mock`, and `--api-url` are one-shot overrides.

## Development

```bash
npm run check:ui
npm run typecheck
npm run build
npm run dev
```

Visual review requires a visible artifact, not just source inspection. From the
repository root, generate terminal fixture snapshots with:

```bash
uv run python scripts/capture_v2_ui_fixture.py --output-dir tmp/ui-fixtures/v2/default --json
uv run python scripts/capture_v2_ui_fixture.py --output-dir tmp/ui-fixtures/v2/default --viewport 120x30 --png --json
```

Keep manual UI artifacts under repository `tmp/` so they are visible in Finder
and ignored by git. Use `--png` when the host has `sips`, `rsvg-convert`, or
ImageMagick and you need an image file for MCP `capture_ui` or VLM review.

To verify live mode without touching the user's real queue or workspace, run:

```bash
uv run python scripts/run_v2_live_smoke.py
```

That smoke starts the real `uv run ov serve` entrypoint against a temporary
workspace/db and checks V2 `RestTransport` health, skills, recent tasks, and run
result loading.

To verify the real terminal launcher path and key interactions without writing
the user's config, run:

```bash
uv run python scripts/run_v2_tty_smoke.py
```

That smoke uses a temporary `XDG_CONFIG_HOME`, launches `uv run ov --mock
--no-install` in a PTY, types a video URL, drives plan -> run -> done, opens
Setup, saves config, hot-swaps theme, and exits.

When the composer receives `URL :: handoff.json`, V2 validates the local
handoff/subtitle first, skips remote probe for planning, and submits the task as
`text_only` with `client_provided.subtitle`.

`npm run dev` is for frontend development only. It should not be documented as the end-user path; use `uv run ov` for real startup.
