# Audit — fresh-base spine after PRs #3–#19

**Date:** 2026-10-10
**Base:** `work/fresh-base-spine` at `89b2e8a6` (PPTX suite), plus the fail-closed package fixes in this PR
**Question:** Are the designs best-of-breed, and is the frontend/backend rectification sound?
**Answer:** The admission shape is sound. The product surfaces are not best-of-breed. Rectification is sound on the settings page, the existing permission card, and the existing browser navigation methods. It is incomplete wherever a tested host has no shell parent. Nothing in this audit is `usable`. Signed production update, a remote plugin store, and full Office editors stay `Locked`.

This file is the audit record. It does not close W0.1, does not move a wave gate, and does not replace `docs/WAVE-MODULE-MAP.md` or `docs/DECISIONS-LEDGER.md`.

## How this was judged

Read in order: `AGENTS.md`, `docs/START-HERE.md`, `docs/DECISIONS-LEDGER.md`, `docs/OWNERSHIP-MATRIX.md`, `docs/WAVE-MODULE-MAP.md`, `docs/REFERENCE-PROJECT-POLICY.md`, `docs/modules/00-platform-spine.md` §13, `docs/release/PACKAGING-REQUIREMENTS.md`, and `docs/UPSTREAM-DELTA.tsv`.

Protocol status tables come from the merged PR bodies and from the spine table those PRs appended:

| PR | Slice | Claim on merge |
|---|---|---|
| [#3](https://github.com/XCH27/tiangong-project/pull/3) | Host admission, snapshot, usage seal, native effect | `wired`. Approval UI, marketplace, full Pi host `Locked` |
| [#4](https://github.com/XCH27/tiangong-project/pull/4) | Permission card resolves host approval; page `update-target` | `wired` |
| [#5](https://github.com/XCH27/tiangong-project/pull/5) | Awaiting admit publishes the card; project model reuse | `wired` |
| [#6](https://github.com/XCH27/tiangong-project/pull/6) | Codex app-server and ACP behind admission | adapters `wired`; command, PTY, client writes `Locked`; Gemini, Qwen, Kimi `display-only` |
| [#7](https://github.com/XCH27/tiangong-project/pull/7) | AIGC job and subscription observation | `wired` with a fake provider |
| [#8](https://github.com/XCH27/tiangong-project/pull/8) | DOCX through `file.update` | `wired`. XLSX and PPTX were `Locked` in that PR; later PRs opened them |
| [#9](https://github.com/XCH27/tiangong-project/pull/9) | Canvas cards for DOCX and AIGC | `wired` |
| [#10](https://github.com/XCH27/tiangong-project/pull/10) | Chromium guest DOM snapshot | `wired`. Screenshot evidence and Chrome Store `Locked` |
| [#11](https://github.com/XCH27/tiangong-project/pull/11) | Settings Plugins page | views and local loadout `wired`. Registry, hook approval, MCP Apps, Agent Plugins `Locked` at that PR |
| [#12](https://github.com/XCH27/tiangong-project/pull/12) | Third-party notices and update-feed dry run | `wired`. Signed feed `Locked` |
| [#13](https://github.com/XCH27/tiangong-project/pull/13) | MCP Registry and skill-repository catalogs | catalog read `wired` |
| [#14](https://github.com/XCH27/tiangong-project/pull/14) | Hook and MCP enable on the permission card | `wired` |
| [#15](https://github.com/XCH27/tiangong-project/pull/15) | MCP Apps side pane | list, open, focus `wired`. Sandbox `Locked` |
| [#16](https://github.com/XCH27/tiangong-project/pull/16) | Local Agent Plugins 1.0.0 projection | local reader `wired`. Remote store `Locked` |
| [#17](https://github.com/XCH27/tiangong-project/pull/17) | Unsigned packaging dry run | `wired`. Signed publish `Locked` |
| [#18](https://github.com/XCH27/tiangong-project/pull/18) | XLSX first sheet | `wired`. Formulas, legacy, macros `Locked` |
| [#19](https://github.com/XCH27/tiangong-project/pull/19) | PPTX first slide | `wired`. Animations and a slide editor `Locked` |

[#20](https://github.com/XCH27/tiangong-project/pull/20) (XLSX and PPTX canvas cards) is open and is not part of this spine.

`docs/WAVE-MODULE-MAP.md` still records every module as `not implemented` and keeps W1–W5 `Locked`. `docs/modules/00-platform-spine.md` §13 records the same slices as `wired`. Both statements fit only when `wired` means a tested host function. Wave exit and `usable` require a shell parent, restart on the session store, and a clicked Electron path. Those are absent. The Docs correction below is to publish that split in one table.

Reference patterns used for the judgment are the ones already named in-repo: Craft Agents (`craft-agents-oss`) for the shell, permission card, and `session.jsonl`; AionUi and DeepSeek-Reasonix for ACP and process lifecycle; Craft's own docx, xlsx, and pptx tool surfaces for Office text; D30 Codex browser settings as a behavior reference; D43 and `docs/REFERENCE-PROJECT-POLICY.md` for `@xyflow/react` as the unpromoted spatial candidate and OpenPencil as a design-module candidate, not the canvas host; electron-builder scripts already in `app/scripts/build/` for packaging. MarkItDown and LobeHub stay no-copy.

## Slice judgments

| Slice | Judgment | Honest status |
|---|---|---|
| Kernel admission | Sound Wired | `wired` library and session bridge. Not `usable` |
| Page ops | Weak invent of a write the popover does not call | `set-model` wired on the existing control. `update-target` host `wired`, shell `display-only` |
| CLI executors | Sound Wired for the fake-stdio gate | Codex and ACP `wired` in tests. Launch presets `display-only`. Command, PTY, client writes `Locked` |
| AIGC / usage | Sound Wired for an approval-gated fake job and an unknown-preserving reader | `wired`. Live provider and live billing stay out |
| DOCX / XLSX / PPTX | Sound Wired as a bounded text loop. Weak if grown into an editor | text loops `wired`. Full editors, formulas, animations, legacy, macros `Locked` |
| Canvas | Should rework before more cards | host tests `wired`. Shell unmounted. Renderer spike `Locked` |
| Browser guest | Sound Wired for navigation on the existing manager | find, stop, back, forward, reload `wired`. DOM snapshot host `wired`, no IPC caller. Screenshot and Chrome Store `Locked` |
| Plugins Market | Sound Wired as a loadout projection | views, filters, local install `wired` |
| Plugin hooks | Sound Wired for the permission-card wait | enable wait `wired`. Hook execution stays out |
| MCP Apps pane | Sound Wired for the list. Sandbox correctly Locked | list, open, focus `wired`. `ui://`, live tools, invocation `Locked` |
| Agent Plugins 1.0.0 | Sound Wired as a local fail-closed reader | local projection `wired`. Remote store `Locked` |
| Packaging dry run | Sound Wired. Signed feed correctly Locked | notices and unsigned layout `wired`. Signed production feed `Locked` |

### Kernel admission — sound Wired

`HostTurnKernel` admits a frozen action, requires a human for L3 and for `requireHumanApproval`, refuses credential-shaped payloads, and runs a native effect only after admit or approve. `sealHostRecord` keeps unknown cache and unknown price unknown. `FileKernelSnapshotStore` round-trips version 1 beside `session.jsonl` and refuses another version. The permission card path in `SessionManager.respondToPermission` resolves `host:{invocationId}` and does not store Always Allow as a standing grant.

That matches the Craft pattern: one permission card, one session directory, Pi as a turn client rather than the permission authority.

The production gap: `attachHostTurnKernel` and `FileKernelSnapshotStore` are reached from tests. Session creation does not attach a kernel. Each later slice constructs `new HostTurnKernel(new MemoryTurnJournal(), …)`. Those journals are not the session timeline. The bridge is ready. The session does not use it yet.

### Page ops — weak invent

`selectPageModel` is the existing edit-popover model control. That part is a small adapter and is sound.

`update-target` admits `file.update` in `executePageLocalOp`. `EditPopover` imports `pageOpsForEditKey` and defaults `pageOps` to `['set-model', 'update-target']`. The popover never calls `applyEditPageFromHuman`. A listed op name is not a write. The spine table's "shared update-target" overclaims the shell. Keep the host. Connect the popover, or label the shell `display-only`.

### CLI executors — sound Wired, unmounted

Codex `app-server --stdio` and ACP newline JSON-RPC open a pipe only after admission. Reverse file requests admit frozen file actions. The adapters do not call `approve`. Command execution, dynamic client tools, client filesystem writes, and PTY stay `Locked`. Gemini, Qwen, and Kimi command lines stay `display-only`.

AionUi (Apache-2.0, green-light) is the named pattern for an ACP catalog and process lifecycle adapted into the Craft session. DeepSeek-Reasonix is the named pattern for ACP over stdio. `stdio-spawn.ts` can spawn a pipe. No Electron or server-core caller constructs `CliExecutorHost`. Nested file accepts remain permission records; the host does not record a native commit for the CLI's own write. That limit is already in the PR #6 handoff and should stay visible.

### AIGC and usage — sound Wired for a fake loop

`aigc.job_submit` waits for human approval. Stop before submit does not call the provider. Recovery inspects a stored provider id and does not submit again. The activity overlay treats `aigc_artifact` as media. `readSubscriptionForHuman` and the agent DTO share one observation. Missing fields stay unknown. Explicit zero stays known. Credentials are not copied.

D45's first creative loop is text, then a real image job, then an ArtifactRef, then a canvas result, with restart. This slice proves the approval and idempotency shape with an injected fake provider. It does not prove a provider, a durable M08 queue in the session store, or a mounted canvas. Live billing stays out. That boundary is correct.

### DOCX, XLSX, PPTX — sound Wired text loops

Human and agent callers share `executeDocumentOp`. DOCX paragraph edit, XLSX create and first-sheet cell update, and PPTX create and first-slide text update admit `file.create` or `file.update`. Legacy `.xls`, `.xlsm`, `.ppt`, and `.pptm` return `Locked`. Formulas, rich text, macros, field codes, and path targets that leave the package fail closed. Other zip parts stay in the package.

The named surface is Craft's existing tool behavior, recorded in the spine: docx paragraph text, one xlsx cell, pptx title and body. MarkItDown is a black-box study reference and is not a copy source. A custom zip reader plus regex XML is the right size only while the operations stay those three. Growing it into a spreadsheet or slide editor would be a second engine.

Preview rectification is incomplete. `DocxPreviewOverlay`, `XlsxPreviewOverlay`, and `PptxPreviewOverlay` edit the bytes they loaded and emit `DocumentPreviewCommand` when `onApply` is set. `FilePreviewRenderer` in `App.tsx` does not pass `onApply`. The buttons do not admit a disk write. PR #8 said a parent that admits calls `applyDocumentFromHuman`. That parent is still missing.

This PR closes two fail-closed holes in the package itself. A zip part whose name leaves the archive is refused on read and on write, including a name PPTX relationship checks did not cover when DOCX or XLSX rewrote every part. An out-of-range or surrogate numeric character reference returns `invalid_docx`, `invalid_xlsx`, or `invalid_pptx` instead of throwing `RangeError` out of `String.fromCodePoint`. Focused tests: 18 pass, 0 fail.

XLSX and PPTX still do not place canvas cards. That lock is correct on this branch. PR #20 is a separate, unmerged proposal.

### Canvas — should rework

`createCanvasCardHost` binds an admitted DOCX and an admitted image or video artifact to a `CanvasNode` frame. Hide and stop are view state. `canvas.node_delete` removes the binding after approval and leaves the file and the job. XLSX and PPTX return `Locked`.

`ArtifactCanvasBoard` is exported from the UI package and is not imported by `app/apps/electron`. Positions are absolute `div`s. `@xyflow/react` is the preferred spatial candidate in D43 and in `docs/REFERENCE-PROJECT-POLICY.md`, and it is not installed. OpenPencil is a professional design-module candidate, not this host. tldraw production licensing is not accepted.

More cards on an unmounted absolute-position board would invent a renderer the ledger already deferred. Keep the host tests. Do not mount a custom pan and zoom. The renderer spike stays `Locked` until it is promoted.

### Browser guest — sound Wired navigation

`BrowserPaneManager` sends find, loading stop, back, forward, and reload through `runGuestActionFromHuman` on the existing `persist:browser-pane` guest. An agent that does not own the guest does not read the page. Screenshot evidence and Chrome Store return `Locked`. That matches D10: extend Craft BrowserPane, and do not add a stealth browser.

`captureGovernedDom` admits `file.create` and is covered by the manager test. Nothing outside that test calls it. There is no IPC or renderer parent. The snapshot host is `wired`. The product capture path is unmounted.

D30's behavior reference is explicit browser enablement, open-target behavior, data clearing, screenshot policy, approval policy, site overrides, and a separate high-risk CDP toggle. This slice does not add those settings. Screenshot evidence stays `Locked` until that policy exists. Do not treat a DOM file as the screenshot policy.

### Plugins — Market, hooks, MCP pane, Agent Plugins 1.0.0

Settings → Plugins is one navigator subpage. The page calls `applyPluginMutationFromHuman` and `resolvePluginGrant`. Install, enable, and disable admit `file.update` on `.claude-plugin/loadout.json`. Third-party hook and MCP enable sets `requireHumanApproval`. Deny does not enable. An agent cannot approve. A stored grant is per plugin id. That is a sound use of the existing permission card.

The page kernel is `createPluginSettingsHost()` inside `useMemo`, a private `MemoryTurnJournal`, not the session kernel. The loadout file is real. The timeline for that approval is not the session timeline. Same rectification defect as the other private kernels.

Market content filters and catalog source filters narrow one list. Recorded MCP Registry and skill-index documents add entries. A failed read adds none. Install still writes only the loadout. Refresh may fetch `https://registry.modelcontextprotocol.io/v0.1/servers` and fails closed. Agent Plugins network URLs return false from `isAllowedCatalogUrl`. That refresh is a catalog read. It is not a remote marketplace and it does not download plugin bytes.

`skill_repository` with `allowNetwork` accepts any public `https` URL whose path ends in `.json`. That allowlist is wider than the official registry host. The settings page does not call it today. Leave network off for that source, or name one index, before any UI offers it.

MCP Apps: the side pane projects enabled tools and resources from the loadout plus a local inventory. Open and focus admit `canvas.node_select` and set the existing `sidebar=mcp-apps` slot. The sandboxed `ui://` view, live `tools/list`, and tool invocation stay `Locked`. That lock is correct.

Agent Plugins 1.0.0: `readAgentPluginPackage` reads a local `plugin.json` and lists a skill or MCP server only when the component maps onto the loadout. Credential-shaped text, unsafe paths, hooks, and commands add nothing. No schema fetch and no remote package. That reader is the right size. It is not a Claude Code plugin runtime, and the remote store stays `Locked`.

M12's pattern is one capability manifest and a scoped loadout. codegraph is the green-light reference for an MCP installer experience, not for a second catalog. LobeHub's marketplace UI is no-copy. The loadout file beside Craft skills and sources is a second list. Later work should project the existing skill and source records through the session kernel, not grow another store.

### Packaging dry run — sound Wired, signed feed Locked

`checkUpdateFeed` and `checkPackagingDryRun` accept a local fixture with relative artifact names, matching versions, `publish: never`, and signing-identity discovery off. A production disposition, a signed flag, or an absolute update URL returns `Locked` (`signed_production_feed`). Notices fail when an admitted license is missing. The dry-run command does not invoke electron-builder, does not upload, and does not change `auto-update.ts`. The Craft generic provider URL stays the Craft URL.

The named pattern is the packaging scripts already in the repo (`packageDarwin`, `packageLinux`, `packageWindows`, `electron-builder.yml`). The dry run checks the names those scripts already write. It does not prove a built installer. That is the correct stop. Do not unlock a signed Fleet feed or a Fleet update URL in a follow-up that only "finishes" this check.

## Frontend / backend rectification

| Surface | Backend host | Shell parent | Rectification |
|---|---|---|---|
| Permission card | `SessionManager.admitHostTurn` | Existing `permission_request` card, once a kernel is attached | Sound, unused by session create |
| Plugins page | `executePluginMutation` | `PluginsSettingsPage` calls it | Sound write. Private kernel |
| MCP Apps pane | `executeMcpAppsOp` | `AppShell` renders `McpAppsSidePane` when `sidebar=mcp-apps` | Sound slot. Sandbox `Locked` |
| Subscription rows | `readSubscriptionForHuman` | `SubscriptionUsageSection` | Sound reader. No live fetch |
| Browser navigation | `runGuestActionFromHuman` | Existing manager methods | Sound |
| DOM snapshot | `captureGovernedDom` | No IPC caller | Host only |
| Office preview | `executeDocumentOp` | Overlays edit memory. `onApply` omitted | Host `wired`, preview not admitted |
| Canvas board | `createCanvasCardHost` | No Electron import | Host only |
| Page `update-target` | `executePageLocalOp` | Popover lists the op | Host `wired`, shell `display-only` |
| CLI executors | `CliExecutorHost` | No session caller | Library only |
| AIGC submit | `aigc.job_submit` on a private kernel | Overlay classifies `aigc_artifact` | Fake provider only |
| About / dry run | `readReleaseDispositionForHuman` | About section | Sound. Signed feed `Locked` |

## Top 5 corrections for parallel agents

Ranked. Each item names the owner lane. None of them unlocks a signed update, a remote marketplace, or a full Office editor.

1. **Kernel — one session kernel.** On session create, attach one `HostTurnKernel` and persist it with `FileKernelSnapshotStore` at `host-kernel-snapshot.json` beside `session.jsonl`. Point document, plugin, canvas, AIGC, page, MCP Apps, and browser-guest admissions at that kernel. Delete the private `MemoryTurnJournal` constructors as those callers move. Do not add a database.

2. **UI — mount the admitting parent.** `FilePreviewRenderer` passes `onApply` into `applyDocumentFromHuman` for docx, xlsx, and pptx. `EditPopover` calls `applyEditPageFromHuman` for `update-target`, or the Docs table marks that op `display-only`. Browser IPC exposes `captureGovernedDom` on the existing pane channel, or the snapshot stays unmounted. `CliExecutorHost` is composed into the session kernel, or it stays a library. Do not mount `ArtifactCanvasBoard` until correction 5.

3. **Docs — one status table.** Reconcile `docs/WAVE-MODULE-MAP.md` (`not implemented`, W1 `Locked`) with `docs/modules/00-platform-spine.md` §13 (`wired`). Use three columns: host, shell parent, lock. `wired` requires the host test. A missing shell parent is `display-only` or unmounted, not a wave exit. Do not mark `usable`. Do not close W0.1 from a library test. `docs/OWNERSHIP-MATRIX.md` still has unassigned v0.11 paths for browser, canvas, jobs, and plugins; the Lead records the paths this spine actually touched before the next packet.

4. **Office — stay on the Craft tool surface.** Paragraph text, first-sheet cell, first-slide text. Legacy and macro packages stay `Locked`. Formulas, animations, and a slide or sheet editor stay `Locked`. XLSX and PPTX canvas cards stay `Locked` on this branch. PR #20 can land only as a preview binding through the same `onApply` parent, not as a second editor.

5. **Plugins and canvas — use the named references.** Canvas work stops at the D43 spike: `@xyflow/react` is the candidate and is not promoted; OpenPencil is not the host. Plugins stay a filter over the loadout and the existing skill and source lists. Hook execution, MCP Apps `ui://`, live tool invocation, and any remote plugin URL stay `Locked`. Narrow `skill_repository` network to a named index or keep `allowNetwork` off. Agent Plugins 1.0.0 remains the local reader.

## What this PR changed in code

Two fail-closed package bugs, found while reading the Office rewrite path:

- `zip-store.ts` refuses a part name that leaves the package (`..`, empty segment, absolute, backslash, NUL) on read and on write. A directory entry inside the package is still allowed. PPTX already rejected `..` in part names after the read. DOCX and XLSX rewrote every part, so a hostile name would have been emitted again.
- DOCX, XLSX, and PPTX character decoding rejects an out-of-range or surrogate numeric character reference. Open returns the suite failure and leaves the file unchanged. Previously `String.fromCodePoint` threw `RangeError`, and the document host rethrew that error.

No action id was added. No lock was opened.
