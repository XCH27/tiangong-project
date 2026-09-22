# SPEC — R2 Independence (no silent Craft-operated dependencies)

> Spec status: `draft` — R2 remains DEP and R0 is ACTIVE. The v0.13.4 rebuild restored inherited
> hosted defaults; previous fixes are candidates, not evidence for the current tree.
> Required R2 corrections execute inside R0 before its feature gate opens.
> The owner-requested restoration removed the Fleet updater/export/help/relay/telemetry patches.
> These corrections are `not implemented` in the current original source. Preparation and a joint
> owner review precede any new software changes; previous smoke/desktop results do not transfer.
> Owner acceptance date: —

## Selective-intake evidence

Earlier fixes remain inspectable in Git: updater `445e11b92` (harness fix `09c59e7f7`), sharing
`18bf53415`, docs `3ddbe59fe` / `58a033d51`, OAuth `61045ebb9` / `8678c7501`. Compare each with the
current caller before reuse. The reset restored inherited services; none of these commits closes
current acceptance. The earlier unguarded headless bootstrap does not prove R2-C1. The old guarded smoke targeted withdrawn Fleet handlers and is not current baseline evidence.

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
3. Packaged startup, manual update check and normal quit: either a verified
   Fleet-controlled/user-configured channel, or updates are unavailable before any download or
   install. Dismissing a notification is not disabling the updater. Pending downloaded packages
   must not bypass this boundary on quit.
4. Session sharing: implement the approved local Markdown replacement with conversation content
   and attachment references. Verify the desktop download as well as the RPC. Existing
   published copies retain explicit cleanup; new hosted conversation/Pages publication is refused.

## Scope

One slice per service row from [`../ARCHITECTURE.md`](../ARCHITECTURE.md#code-map) "Craft-operated service
boundaries" — updater, sharing/viewer, help/docs links + docs MCP, WebUI OAuth relay, Slack OAuth
relay, sources/connectors audit, branding/support text (deliberate rename pass with
license/trademark review), telemetry and Pages publication. Trace UI → handler → persistence → recovery per slice; never several
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

The original updater has automatic download and quit installation enabled, with the Craft feed.
This is inherited Craft behavior, not a completed Fleet service boundary. Trace launch, manual
check, ignored versions and already-downloaded packages before implementing the approved correction.
Use disposable lifecycle fixtures; do not download/install an upstream binary during verification.
For Pages, check the absent-override default as well as direct publish RPC and preserved unpublish.
For telemetry, cover main, renderer/preload and build-time ingest injection; retaining a crash
fallback must not retain the uploader. For docs, inspect the final assembled Agent prompt and its
profile-local paths, not just the presence of bundled files.

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
| R2-C2 | Updater never installs a non-Fleet binary; channel is verified Fleet-controlled/user-configured, otherwise automatic/manual download and install are disabled, including pending-update application on quit | isolated packaged-lifecycle, dismissal, manual-action and pending-update tests + updater state check |
| R2-C3 | No new hosted conversation or Pages publication; local Markdown is the conversation-export path. Remove publish/upload controls and handlers; preserve an explicit cleanup/unpublish route for existing remote copies until resolved. | publish/upload absence + local export + cleanup-path tests |
| R2-C4 | Help/docs and assembled Agent guidance default to matching bundled/profile-local content; external links visibly external | prompt/path tests + offline guidance check + owner check |
| R2-C5 | OAuth relays configurable/self-hosted or explicitly unavailable; desktop local callback preserved | targeted tests |
| R2-C6 | Telemetry is removed; every remaining inherited endpoint is an explicit optional connector with a visible class | endpoint inventory vs `源码参考/craft-docs/` service list |
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
Required independence corrections run under this contract during R0; the release labels do not
defer the baseline exit. R0 references R2 evidence rather than rebuilding a second checklist.

## Risks and rollback

- **Risk:** removing a URL breaks a hidden dependent flow → per-slice UI→persistence→recovery
  trace is mandatory; slices land independently and revert independently.
- **Risk:** branding rename collides with trademark/license → deliberate review pass, owner
  checkpoint before shipping the rename.
- **Rollback:** each service slice is one revertable commit.

## Verification plan

After each approved implementation, run the relevant source and behavior checks. The retained
root smoke script contains expectations for removed Fleet handlers and needs review before reuse;
its existence is not current proof. Verify network-blocked local behavior, real desktop/packaged
lifecycle and the owner's visible acceptance separately. Do not call a JavaScript HTTP guard an
OS firewall or imply that it covers provider subprocesses.

## Doc updates on completion

Capability rows (External services table), user-facing bundled docs for sharing/updates/help,
roadmap, this spec.
