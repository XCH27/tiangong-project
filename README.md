# Fleet / AI Work Workbench

A local-first AI work platform built by simplifying and extending **Craft Agents v0.11**.

## Where to start

Read **[docs/00-START-HERE.md](docs/00-START-HERE.md)** — the single entry point for humans and
executing agents. It is short and links to everything else in one hop.

The active document set is nine numbered plan documents under `docs/` (00–08), plus two short helper
files: `docs/OWNER-CHECKPOINTS.md` (owner-facing — when an agent must stop and ask you) and
`docs/FEATURE-REGISTRY.md` (live state — which big features are in flight). High-risk slices may keep a
short code-grounded design delta at a location natural to the existing monorepo; it links to rather than
copies recovered material from `docs/design-library/`. Those recovered designs are historical source
material, not active plans. There is
no Wave system, no packet system, and no readiness gate; the previous planning corpus was reset on
2026-07-11 and moved to `_trash/` (recoverable) because the plan had outrun the code.

This is a product fork of Craft Agents v0.11. Before building anything, agents must check
[docs/08-CRAFT-CAPABILITY-MAP.md](docs/08-CRAFT-CAPABILITY-MAP.md) — most needed capability already
exists in Craft and must be reused or extended, not rebuilt.

For agent execution rules, see [docs/07-AGENT-RULES.md](docs/07-AGENT-RULES.md).

## Current state (honest)

The runnable application is Craft v0.11-derived, but the current working tree is **not yet a clean
verified baseline**: it contains the v0.11.1 alignment, removal of speculative Fleet protocol staging,
and this document reset as uncommitted work. No Fleet feature loop is currently implemented. Stabilize
and verify that baseline before beginning Milestone 1; then the next action is code, not more planning — see
[docs/04-MILESTONES.md](docs/04-MILESTONES.md) and
[docs/05-MILESTONE-1-ACTION-SPINE.md](docs/05-MILESTONE-1-ACTION-SPINE.md).
