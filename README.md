# Fleet

A **local-first desktop workbench where a person and their agents work on the same artifacts in the
same place** — not a chat window that drives other applications from outside. Fleet is a fork of
[Craft Agents](https://github.com/craft-ai-agents/craft-agents-oss) (Apache-2.0).

Targets: **Windows, macOS and Linux** desktop; a later phone connector for a user-owned desktop.

## Status

`app/` is **unmodified official Craft Agents v0.13.4**. Fleet's product work restarts from this
baseline, one approved slice at a time; the current slice is R1 shell and context rectification.
What is planned and in progress: [`TODO.md`](TODO.md). What changed and why the project restarted:
[`CHANGELOG.md`](CHANGELOG.md).

## Technology stack

| Layer | Choice |
|---|---|
| Desktop shell | Electron 39 (`app/apps/electron`) |
| UI | React 18, Tailwind CSS 4, Jotai (`app/packages/ui`, renderer) |
| Language / runtime | TypeScript 5, Bun 1.3 |
| Agent runtime | Claude Agent SDK and Craft's Pi runtime (`app/packages/shared`, `app/packages/pi-agent-server`) |
| Server | Craft server core over WebSocket RPC (`app/packages/server-core`, `app/packages/server`) |
| Other clients | Web UI, CLI, viewer (`app/apps/webui`, `app/apps/cli`, `app/apps/viewer`) |

## Quick start

```bash
bash scripts/init.sh            # wire the commit gates, check toolchain and Craft pins
cd app && bun install
bun run electron:dev            # run the desktop app in development mode
```

Development mode never auto-updates. **Do not hand out a packaged build yet**: packaged Craft
downloads and installs upstream Craft updates on its own — see
[`docs/engineering.md`](docs/engineering.md#building-and-packaging).

Full verification: `bash scripts/fleet-verify.sh`.

## Repository layout

| Path | What it is |
|---|---|
| `app/` | Craft Agents source. Every difference from upstream is declared in `docs/UPSTREAM-DELTA.tsv`. |
| `docs/` | Product and engineering documentation (tree below). |
| `scripts/` | Repository gates and tooling; kept outside `app/` so `app/` can stay identical to upstream. |
| `源码参考/` | Reference source checkouts (symlink to `/Volumes/AIGC/天工参考/源码参考/`, untracked). |
| `UI参考/` | UI kits and captures (symlink, untracked). Not product authority. |

## Documentation

```
AGENTS.md                     collaboration and code-development rules (agents start here)
README.md                     this file
DESIGN.md                     visual style, layout and interaction specification
CHANGELOG.md                  releases and major changes
TODO.md                       development plan and current progress
docs/
  product.md                  what Fleet is and is not: scope, rules, vision, glossary
  capabilities.md             the register: capabilities, acceptance, matrix, pages, Craft map
  decisions.md                decisions, hard constraints, the owner's exact words
  architecture.md             cross-module invariants, authorities, code map
  engineering.md              workflow, gates, tests, components, packaging and updates
  references.md               which open-source project to reference for what, and where
  UPSTREAM-DELTA.tsv          every declared difference from upstream Craft
  modules/                    one self-contained document per module
    baseline.md shell.md services.md          active release slices R0, R1, R2
    agent-core.md context.md browser.md       feature modules, each with its
    canvas.md media.md workflow.md            execution rows and references
    remote.md marketplace.md components.md
  research/                   raw research evidence
```

## License

Craft Agents is Apache-2.0; see `app/LICENSE` and `app/NOTICE`. Reference projects keep their own
licenses, recorded in [`docs/references.md`](docs/references.md).
