# SPEC — R2 Independence (no silent Craft-operated dependencies)

> Spec status: `draft` — slices C2–C5 landed 2026-07-26 ahead of activation via the WORK-ORDER
> frontier (the R2 roadmap row remains READY; R0 is the ACTIVE release). See "Landed slices"
> below. Nothing is `usable` before owner acceptance (R2-C7).
> Owner acceptance date: —

## Landed slices and per-criterion state (2026-07-26)

| ID | State | Evidence |
|---|---|---|
| R2-C1 | **open** — docs MCP now defaults off and connects only through `FLEET_DOCS_MCP_URL`; C1 acceptance still requires the network-blocked smoke + traffic log. | code + targeted test; audit 2026-07-26 |
| R2-C2 | landed — `wired but not visually checked` | `445e11b92` (+ isolated-harness test fix `09c59e7f7`) |
| R2-C3 | landed — `wired but not visually checked` | `18bf53415` |
| R2-C4 | landed — `wired but not visually checked` | `3ddbe59fe` (+ ChatPage docs-link routing `58a033d51`) |
| R2-C5 | landed — `wired but not visually checked` | `61045ebb9` (OAuth relay) + `8678c7501` (Slack relay) |
| R2-C6 | open — endpoint inventory vs the refreshed `源码参考/craft-docs/` mirror not run | — |
| R2-C7 | open — owner acceptance pending; until it happens no R2 surface is `usable` | — |

## Outcome

Fleet's core runs and degrades honestly with **zero silent dependence on Craft-operated services**
(Decision P8). Every inherited endpoint is: replaced by a local/user-owned path, kept as an
**explicit optional connector**, or **honestly disabled** with a clear unavailable state. The
binary updater can no longer install a Craft binary over Fleet.

## Walkthrough (system + user)

1. Fresh start, network blocked: app launches; local Projects/sessions/files/permissions/
   labels/tasks/automations work; no error spam from unreachable Craft endpoints; optional
   features show honest "not configured / unavailable" states.
2. The user opens each affected surface and can tell which class every external connection is:
   local · self-hosted · third-party connector · unavailable (identity honesty: a connection says what it actually is).
3. Update check: either a Fleet-controlled/user-configured channel, or the updater UI states
   updates are disabled — it never offers a Craft binary.
4. Session sharing: **removed 2026-07-26 by owner decision.** Local export works; there is no
   online share control and no bundled viewer, so no Craft-operated share dependency can exist.

## Scope

One slice per service row from [`../06-CODE-MAP.md`](../06-CODE-MAP.md) "Craft-operated service
boundaries" — updater, sharing/viewer (closed by removal), help/docs links + docs MCP, WebUI OAuth relay, Slack OAuth
relay, sources/connectors audit, branding/support text (deliberate rename pass with
license/trademark review). Trace UI → handler → persistence → recovery per slice; never several
services in one patch.

- **Out (non-goals):** building replacement cloud services; upstream version bump; remote
  execution (P7/P9 — separate); marketing/rename beyond honest identity.
- **Reserved paths:** this spec; credential storage formats.

## Reality anchors and execution order

Audit the actual boundaries listed in `app/apps/electron/src/main/auto-update.ts`,
`app/apps/electron/electron-builder.yml`, `app/packages/shared/src/branding.ts`,
`app/packages/shared/src/auth/`, `app/packages/server-core/src/webui/`, and
`app/apps/electron/src/renderer/pages/ChatPage.tsx`. Execute one service row at a time: trace
renderer → RPC/handler → persistence → recovery, add the row's targeted test, then run
`bun run typecheck:electron` and the relevant shared test from `app/`. The network-blocked smoke
must record the target URL/process log; a code search alone does not prove C1 or C6.

## Pages touched

| Surface ID | Create/extend/wire | Adapter/data contract | Permission | States exercised | Owner visual checkpoint |
|---|---|---|---|---|---|
| P-08 | extend help/docs links | bundled docs + external-link descriptor | no hidden network call | loading/empty/offline/unavailable | help menu + external indicator |
| P-09 | extend updater state | updater manifest/channel adapter | update/install approval | loading/error/denied/unavailable/recovery | update dialog |
| P-17 | extend import/export only where a service slice needs it | existing file paths | file permission | empty/error/denied/recovery | migration dialog |
| P-28 | — | removed; local export only | n/a | n/a | n/a |

## Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| R2-C1 | Offline fresh start: core local behavior works; no silent Craft calls at startup or in core flows | network-blocked smoke + traffic log |
| R2-C2 | Updater never installs a non-Fleet binary; channel is Fleet-controlled/user-configured or install honestly disabled | code audit + updater state check |
| R2-C3 | Online sharing and the bundled viewer are removed; local export is the only session-export path | absence test (no share channel/handler) |
| R2-C4 | Help/docs default to bundled/local; external links visibly external | owner check |
| R2-C5 | OAuth relays configurable/self-hosted or explicitly unavailable; desktop local callback preserved | targeted tests |
| R2-C6 | Each remaining inherited endpoint is an explicit optional connector with a visible class | endpoint inventory vs `源码参考/craft-docs/` service list |
| R2-C7 | Owner accepts the changed surfaces (settings, update UI, help menu) | owner acceptance |

## References consumed

The Craft-operated service inventory in
[`../../源码参考/craft-docs/`](../../源码参考/craft-docs/README.md) (SYNC-MANIFEST + known service
dependencies) is the checklist this release audits against — refresh the mirror before the final
endpoint inventory (R2-C6). No external code reference is adopted.

## Dependencies and unresolved edges

Consumes the R0 baseline (and R1 wording where surfaces overlap). A Fleet release channel may not
exist yet — then C2 is satisfied by *honestly disabled install*, and creating the channel is a
recorded edge (owner checkpoint: production runtime commitment).

## Risks and rollback

- **Risk:** removing a URL breaks a hidden dependent flow → per-slice UI→persistence→recovery
  trace is mandatory; slices land independently and revert independently.
- **Risk:** branding rename collides with trademark/license → deliberate review pass, owner
  checkpoint before shipping the rename.
- **Rollback:** each service slice is one revertable commit.

## Verification plan

Ladder 1–3 per slice + one network-blocked smoke at the end. Owner CHECK THIS:
update UI, help menu, any settings surface that names an external service.

## Doc updates on completion

Capability rows (External services table), user-facing bundled docs for sharing/updates/help,
roadmap, this spec.
