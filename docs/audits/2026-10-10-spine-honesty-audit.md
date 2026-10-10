# Spine honesty audit — PRs #3–#19 on `work/fresh-base-spine`

> **Date:** 2026-10-10
> **Base inspected:** `89b2e8a6` (`work/fresh-base-spine` after merged PR #19)
> **What this file is:** a review note. It does not promote a decision, open a wave, or change capability status. `DECISIONS-LEDGER.md`, `WAVE-MODULE-MAP.md`, and `OWNERSHIP-MATRIX.md` stay Lead-owned.
> **Handoff docs:** this checkout has no `交接` document. The handoff system is `docs/PARALLEL-AGENT-OPERATING-MODEL.md` plus `docs/agent-packets/`. No worker handoff report for PRs #3–#19 is committed in-tree.
>
> **Follow-up after PR #25 (2026-10-10):** this note still describes base `89b2e8a6`. It is not rewritten. Two gaps the later §13 relabel left open are closed in the checkout that carries this addendum:
> 1. `PluginsSettingsPage` does not construct `createPluginSettingsHost` and does not call `applyPluginMutationFromHuman` or `resolvePluginGrant`. Five views and market filters stay on the settings navigator. Install, enable, and disable are `Locked` until the `SessionManager` session kernel owns the loadout. The page does not render the Craft session permission card. `createPluginSettingsHost` is `test-only`. The production-caller row in §2.1 for that factory is historical for the audited base.
> 2. `cli-executors/capabilities.ts` marks Codex, ACP, and the Codex peer preset `display-only`. Locked effects stay `Locked`. No production path spawns those peers.
>
> **Follow-up after PR #28 (2026-10-10):** squash `12df4540` on `work/fresh-base-spine`. This note is not rewritten. The human Flag command admits `session.flag` on the session kernel. Admission refuses a plugin loadout, sidebar focus, DOM snapshot, or page-target write on a misowned frozen id. Settings writes stay Locked. W0.1 stays Locked. Nothing in that slice is `usable`. The §3 item 1 leftover is closed here: `AGENTS.md` uses the wave-map capability set, and `Locked` is the execution gate.

## Verdict

The post-merge spine is not a best-possible design, and the frontend/backend rectification is not sound as claimed.

`docs/modules/00-platform-spine.md` §13 labels about thirty slices `wired`. The same file's header still says capability `not implemented` and execution gate Locked. Its last sentence says the note does not open W1 and that product surfaces stay Locked. `docs/WAVE-MODULE-MAP.md` (still dated 2026-07-09) says every worker wave is Locked and every module is `not implemented`. `docs/DEVELOPMENT-PROCESS.md` says Locked is an execution gate, not a capability result. `AGENTS.md` lists `Locked` as if it were a capability label. Those four texts disagree, and the §13 table is the one that flatters the code.

Most of the "wired" hosts are unit-tested libraries that the running app never constructs. The ones that do run in Electron often keep a private `HostTurnKernel` and an in-memory journal, so they do not share Craft's session timeline or the existing permission card's authority. That violates the repo's own "one spine" rules and is weaker than the open-source patterns the repo already cites.

Parallel delivery did not happen. PRs #3–#19 are a serial stack. Nearly every one edits Lead-owned `app/packages/shared/src/protocol/` and the same M00 spec. The operating model says parallelism starts after the Lead freezes contracts and ownership, and that starting while Locked is a blocking violation. More agents on this tree will collide, not go faster.

Open PR #20 (`cursor/xlsx-pptx-canvas-cards-8bf2`) continues the canvas-card pattern this note rejects. It was not merged at audit time and should not be treated as spine.

## How status words are used below

| Word | Meaning in this note |
|---|---|
| `wired` | A user-visible or main-process path exercises the behavior without a test harness, and the behavior matches the claim. |
| `library-only` | The function and its tests exist. No production caller uses them. This is not `wired`. |
| `display-only` | UI renders. The claimed admission, save, or agent path does not run. |
| `Locked` | Execution gate. Do not build the next slice. Not a return value, not a capability badge for unfinished work. |

The wave map's capability labels remain `not implemented`, `display-only`, `wired but not visually checked`, and `usable`. Nothing in PRs #3–#19 is `usable`. Nothing here is promoted to `usable`.

---

## 1. Slices that are sound `wired`

These are the slices a reviewer can defend. They are small. They are not the creative-workspace loop in D45.

### 1.1 Human BrowserPane navigation controls

PR #10 routes the existing `BrowserPaneManager` methods `goBack`, `goForward`, `reload`, `stop`, and `findInPage` through `runGuestActionFromHuman`. The port calls `webContents.findInPage` and the matching guest methods. The desktop caller is `human_ui`, which `authorize()` allows on `persist:browser-pane`. Screenshot evidence and Chrome Store return Locked inside that same switch, which matches D10 and D30.

This is a thin adapter on Craft's browser, which is the right shape. Playwright and Chrome DevTools Protocol already own page find and navigation; wrapping the existing `webContents` is the correct reuse. It is `wired` for the human desktop controls only.

### 1.2 Office preview readers mounted in the shell

`FilePreviewRenderer` in `app/apps/electron/src/renderer/App.tsx` opens `.docx`, `.xlsx`, and `.pptx` in `DocxPreviewOverlay`, `XlsxPreviewOverlay`, and `PptxPreviewOverlay`. The link interceptor routes those extensions in-app. The readers show paragraph text, first-sheet cells, and first-slide text from the package XML.

That read path is `wired`. It is a lossy viewer (first sheet, first slide, paragraph text, hard size caps). It is not an editor. Section 2 covers the edit/save claim.

### 1.3 Subscription field mapper

`observeSubscription` is one function. The AI settings section and the agent DTO both call it. A missing field stays unknown. An explicit zero stays zero. Credentials are not copied. Live billing stays out. That matches D33 (do not invent a confident value) and is `wired` as a mapper. It is not an M11 quota ledger.

### 1.4 Release checks that refuse to publish

`renderThirdPartyNotices` writes no partial file when an admitted license is missing. `checkUpdateFeed` accepts a local dry-run document with relative artifact names and rejects a signed document, a production disposition, and an absolute update URL. `checkPackagingDryRun` checks version metadata and the artifact names the existing package scripts already expect. `publish` stays `never`. The Craft updater in `auto-update.ts` is untouched.

These checks are `wired` as local verification. They are not a Fleet release. The checked-in dry-run payloads under `app/scripts/build/` are layout fixtures, not installers.

### 1.5 Two constraints the code actually holds

- `turn-admission.ts` does not import Pi. Pi remains a provider turn client in `pi-agent.ts`. That matches the Pi boundary in `AGENTS.md`.
- Credential-shaped keys and token strings are stripped by `sealHostRecord` before a snapshot JSON is written, and unproven cache or price zeros are omitted. The tests cover that. The file store itself has no production caller (section 2.1), so this is a held library invariant, not a durable product timeline.

---

## 2. Weak or invented designs that should be reworked

### 2.1 One kernel on paper, one kernel per feature in code

`HostTurnKernel` defaults to `MemoryTurnJournal`, an array in the process. Each feature factory builds its own kernel:

| Factory | Production caller |
|---|---|
| `createDocumentSuiteHost` | tests only |
| `createAigcHost` | tests only |
| `createCanvasCardHost` | tests only |
| `CliExecutorHost` | tests only |
| `FileKernelSnapshotStore` | tests only |
| `SessionManager.attachHostTurnKernel` | tests only |
| `createPluginSettingsHost` | renderer `PluginsSettingsPage` |
| `createMcpAppsHost` | renderer settings page and `McpAppsSidePane` (two kernels) |
| `createBrowserGuestHost` | main-process `BrowserPaneManager` (DOM capture only) |

`admitHostTurn` returns `host_kernel_missing` when nothing attached a kernel. Nothing in app startup attaches one. Host events therefore never land in Craft `session.jsonl`. `docs/PERSISTENCE-AUTHORITY-MAP.md` gives sessions, permission decisions, and SessionEvents to one M00 authority and forbids a second product store. A per-screen memory journal is that second store, repeated.

Industry pattern this is weaker than:

- Craft's own session agent already has permission modes `safe` / `ask` / `allow-all` and `SessionManager.respondToPermission`.
- The Agent Client Protocol (`session/request_permission`) and Codex app-server (`item/*/requestApproval`) both send approval back to the session that owns the turn. The client does not approve itself, and it does not keep a private journal.
- VS Code runs extension permission and state in the extension host that owns the session, not in a fresh kernel inside each webview.

The admission *shape* (deny malformed actors, fail closed, human approves, stop before commit, reconcile without a second external submit) is worth keeping. The instantiation is not. Rework means one kernel per real Craft session, created in main, journaled to the session authority the persistence map names, attached before any feature admit.

`requireHumanApproval` on `TurnRequest` is an invented side channel. It upgrades a frozen L1 `file.update` to approval-required without a new action id and without the W0.1 re-freeze that `docs/contracts/action-ids.md` requires before downstream actions are implemented.

### 2.2 Frozen action ids are used as generic verbs

`docs/contracts/action-ids.md` says v1.2.0 predates ArtifactRef, workflow, and view contracts, and that W0.1 must reclassify risk, approval, undo, cancellation, retry, and evidence before any listed downstream action is implemented. PRs #3–#19 implemented those actions anyway, by overloading the smallest frozen ids:

| Real operation | Action id used | Why that is the wrong verb |
|---|---|---|
| DOCX / XLSX / PPTX create and edit | `file.create` / `file.update` | M05 file bytes. Skips ArtifactRef, lease, provenance (D44). |
| Plugin loadout install and enable | `file.update` | M12 loadout. A capability change is not a file edit. |
| Page `update-target` | `file.update` | Settings write smuggled as a file action. Renderer never calls `applyEditPageFromHuman`; only `selectPageModel` runs in `EditPopover`. |
| DOM snapshot | `file.create` | M06 evidence. `browser.screenshot` correctly stays unfrozen, then capture bypasses it. `captureGovernedDom` has no IPC or UI caller. |
| AIGC submit | `aigc.job_submit` | Implemented before the re-freeze the table itself demands. Undo is `not_supported` on an L1 row, so admission special-cases it. |
| MCP Apps open / focus | `canvas.node_select` | L0 canvas selection. The effect changes a sidebar slot and writes no canvas node. `workbench.view_open` stays unfrozen, so the code borrowed a canvas id. |

Returning `status: 'Locked'` for `.xls`, `.ppt`, formulas, and hooks uses the execution-gate word as an application error. That makes the gate word meaningless in logs.

Reference: a capability system with one executor projects callers from one manifest (D40). VS Code contribution points, MCP tool definitions, and the repo's own M12 `CapabilityManifest` all give each operation its own id, risk, and undo. Stuffing them into `file.update` hides the risk in the payload.

### 2.3 The document "suite" is a private OOXML subset, and the editor is not on the UI path

`zip-store.ts`, `docx-xml.ts`, `xlsx-xml.ts`, and `pptx-xml.ts` are a from-scratch ZIP and Office Open XML reader/writer. Caps are arbitrary: 200 rows, 26 columns, 20 slides, 40 text blocks, 4000 characters. ZIP64 and data descriptors fail closed. Formulas, rich text, charts, notes, and animation are refused or preserved unread.

`DocxPreviewOverlay` (and the XLSX/PPTX overlays) mutate the bytes they loaded. They call `onApply` only when a parent passes it. `FilePreviewRenderer` does not pass `onApply`. Edit and Undo in the shipping preview do not admit `file.update`. `createDocumentSuiteHost()` is never called outside tests. The §13 rows "human edit, agent edit, undo, save, and reopen through `file.update`" are `library-only`. The shipping UI is `display-only` for edits.

This also contradicts the product decision it claims to serve:

- D46 and `docs/modules/19-presentation-motion-surface.md`: the native document is a MotionDeck. PPTX, HTML, and video are exports. "The binary file is not used as an opaque editable state store."
- PR #19 and the M19 appendix call first-slide PPTX text replacement `wired` while the module header stays Locked. That appendix should not exist. A title-and-body PPTX writer is the Craft pptx tool's surface, reimplemented, and it is not M19.
- D14: `DesignAction/Patch` is an envelope. Native owners keep their models. A shared paragraph/cell/text-block command is a universal mini-editor.

Stronger references, which this repo already knows how to treat:

- Maintained OOXML libraries (SheetJS / exceljs for workbooks, `docx` or Mammoth for Word, PptxGenJS for deck *export*) behind an adapter, with license review under D20. MarkItDown is already in `REFERENCE-PROJECT-POLICY.md` as a black-box study of multi-format readers, not a license to paste a parser.
- For a real editor, OnlyOffice or Collabora, or a native model plus export (Univer for spreadsheets; the repo's own MotionDeck for decks).
- D46's own rule: import a declared subset, report unsupported constructs, keep the native document authoritative.

Rework: keep the preview readers if the caps stay visible. Remove edit buttons until a parent admits a write through the one session kernel and M05. Stop growing `zip-store.ts`. Do not call this a suite.

### 2.4 Canvas cards are not a spatial workspace

`ArtifactCanvasBoard` is a `relative` div with `absolute` children at `CanvasNode` `cx/cy`. No pan, zoom, edges, grouping, or selection model. `@xyflow/react` is not installed. The component is exported from `@craft-agent/ui` and is not mounted by the Electron shell. Its test reads the source file as text. `createCanvasCardHost` runs in tests only.

M07 requires an infinite canvas, SpatialDocument world coordinates, entity cards that reference M05 artifacts, and a renderer spike before implementation. D43 names `@xyflow/react` as the preferred candidate and forbids treating OpenPencil as the host. xyflow's model (nodes, edges, viewport, controlled state) and tldraw's scene-versus-asset split are the references. A list of absolutely positioned frames is neither.

D45's first creative loop is text to a real image job to an ArtifactRef to a canvas result. The card host binds a DOCX path and an in-memory `aigc_artifact` from a fake provider. There is no ArtifactRef.

The XLSX/PPTX card ban in the same host is an arbitrary lock on top of an unmounted board. Rework the board after the renderer spike. Do not add more card types (including PR #20) onto this component.

### 2.5 AIGC "wired" is a fake provider and a side file

`createAigcHost` is test-only. The provider in tests is fake. No live image or video call exists, which the Locked row for paid providers admits. The §13 row still says `` `aigc.job_submit` after host approval: fake provider, artifact file, stop, and recover by provider id `` is `wired`. A fake provider cannot be a wired product loop.

The job record is `{directory}/*.job.json`, written with the session.jsonl rename trick, and described as "not a second job database." `PERSISTENCE-AUTHORITY-MAP.md` says ExternalJob authority is M08 using M00 execution state, and it forbids prescribing an independent jobs file before the persistence ADR. A job JSON beside an arbitrary directory is that file. M08's spec says the ExternalJob contract must be promoted before implementation. It was not. Status, attempt, priority, ArtifactRef inputs/outputs, cost source, and workflow correlation from that spec are absent.

The recovery rule is the one piece worth keeping as a constraint: do not call the provider again after a provider job id is durable; inspect instead. That is how Temporal, Inngest, and any serious queue treat a paid side effect. It belongs in the M08 contract, not in a test double labeled `wired`.

The activity overlay can render an `aigc_artifact` tool result. With no production submitter, that preview is `display-only`.

### 2.6 Codex and ACP executors are unattached protocol clients

`cli-executors/codex-app-server.ts` and `acp-client.ts` speak a plausible subset of the public Codex app-server JSON-RPC and ACP newline JSON-RPC. Reverse tool calls admit a frozen file action and do not call `approve`. Command execution, PTY, dynamic client tools, and client filesystem writes stay Locked. Resume fails closed with `peer_resume_unsupported` when the peer does not advertise it. That fail-closed shape matches ACP and Codex, and it matches the green-light note for AionUi (adapt ACP into Craft session/permission/timeline; do not stand up a second runtime).

Tests drive a fake stdio pair. `CliExecutorHost` is never constructed by Electron or `SessionManager`. Gemini, Qwen, and Kimi are launch-string presets (`display-only`), which is the honest label the executor rows should have used too.

Rework: keep the clients as adapters. Attach them only to the one session kernel after W1, and do not call them `wired` until a real `codex app-server` or ACP peer runs a turn that shows up on the Craft timeline.

### 2.7 Plugins, the permission card, and MCP Apps

The Settings → Plugins page is on the real settings navigator. Five views and market filters render. That chrome can stay.

The authority under it should not:

- Writes go to `.claude-plugin/loadout.json` via a renderer-local kernel (`useMemo(() => createPluginSettingsHost(), [])`). That path is not Claude Code's plugin layout (`.claude/settings.json`, plugin marketplaces, skills as `SKILL.md` folders) and it is not M12's `CapabilityManifest` plus effective loadout. D25 separates install, loadout, and runtime. This file collapses them.
- Approval reuses the `PermissionRequest` React component and then calls `resolvePluginGrant` on that same renderer kernel. The session id is `PLUGIN_SETTINGS_SESSION_ID`, a constant, not a Craft session. `SessionManager.respondToPermission` is not involved. The visual component is shared. The authority is not. Calling this "the existing permission card" overstates the wiring.
- After Allow, the loadout stores `decision: 'approved'` and a later enable of that plugin skips the card. Host-turn Always Allow, in the same §13, does not store a standing grant. Two grant lifetimes in one week of PRs is an invented permission model. The plan even builds the approved-and-enabled document *before* the human answers; the write waits, but the grant record is the feature.
- M12 distribution (install, remote catalog, marketplace) is W4 and concept-maturity. PRs #11–#16 built it during a Locked W0.1.
- `readCatalogSource` may fetch the public MCP registry or an https skill index. Failure returns no entries, which is fail-closed and fine. The reader is not a trust or signing story.

MCP Apps: the [MCP Apps spec](https://github.com/modelcontextprotocol/ext-apps) (and the related MCP-UI work) is a sandboxed `ui://` HTML surface with a declared host bridge, tool calls, and audit of what the view may do. PR #15 lists enabled tools and resources and admits `canvas.node_select` to focus a sidebar slot. The sandboxed view, live `tools/list`, and tool invocation stay Locked, so the shipped pane is a list. Two `createMcpAppsHost()` instances (settings page and side pane) do not share focus state except by both writing navigation. That is not MCP Apps.

Reference for the plugin rework: one catalog already in Craft (skills and sources), projected into a view, with enablement decided by `SessionManager` and recorded on the session timeline. VS Code does this with contribution points and a single extension enablement state. A second `.claude-plugin/loadout.json` will drift from the skills the agent actually receives.

### 2.8 DOM capture skips the evidence contract

`captureGovernedDom` admits `file.create` and writes a JSON snapshot. M06 requires a versioned evidence bundle, redaction before external handoff, stale-selection behavior, and ArtifactRef provenance. None of that runs. No IPC handler calls `captureGovernedDom`; only `browser-pane-manager.test.ts` does. The method is `library-only`. Shipping it later as a silent `file.create` of page text would also fight D23 (no cookie/token harvesting): the capture path has a credential-material check on the invocation payload, not a redaction pass on the DOM text.

Playwright's `page.content()` / accessibility snapshot and Craft's existing `BrowserCDP` are the references. Evidence stays an M06 document through M05, after `browser.screenshot` or a successor id is actually frozen.

### 2.9 The status documents describe a different product than the code

| Source | What it says after PRs #3–#19 |
|---|---|
| `WAVE-MODULE-MAP.md` | W0.1 in progress. W1–W5 Locked. Every module `not implemented`. |
| `START-HERE.md` | Workers must not branch for Locked modules. |
| `OWNERSHIP-MATRIX.md` | `protocol/*.ts` is Lead-only. M06, M07, M08, M16, M19 paths are "Lead until a packet names them." |
| `PARALLEL-AGENT-OPERATING-MODEL.md` | No worker edits to `protocol/*.ts`. Starting while Locked is a blocking violation. Only the Lead promotes `usable`. |
| M00 header | `not implemented`, Locked. |
| M00 §13 table | dozens of `wired` rows. |
| M00 §13 last sentence | surfaces stay Locked; W1 is not open. |
| M06, M07, M08, M12, M13, M19 headers | still `not implemented` / Locked, with appendices that say slices are `wired`. |

Workers self-declared `wired`. The wave map's rule is that only the Lead changes capability status, and tests alone are not enough. There is no packet under `docs/agent-packets/` for host admission, document suites, canvas cards, plugins, or packaging. The packets that exist still describe Locked waves.

This is the mix the audit was asked to verify. It is real. The code moved. The gates did not. The flattering label lives in a changelog table that the header immediately disclaims.

---

## 3. Highest-priority corrections

Do these before any further feature PR stacks on `protocol/`.

1. **Relabel §13 from the code, not from the PR titles.** Lead edit, one commit. Use section 1's `wired` list. Mark section 2's hosts `library-only` or `display-only`. Delete the sentence that says product surfaces stay Locked while the table says they are `wired`, or delete the table. Do not leave both. Bring `AGENTS.md` in line with the wave map: Locked is a gate.

2. **Stop new protocol features until one session kernel exists.** Construct `HostTurnKernel` in main when a Craft session starts. Point the journal at the M00 session authority (today: the session log the persistence map already names). Call `attachHostTurnKernel` there. Delete renderer `useMemo(() => createXHost())` kernels. Until that lands, further `create*Host()` factories will keep inventing timelines.

3. **Freeze actions before the next verb overload.** Either re-freeze `action-ids.md` with separate risk, undo, and evidence columns, or stop. Remove `requireHumanApproval` as a silent upgrade. Stop using `canvas.node_select` for a sidebar. Leave `aigc.job_submit`, browser capture, and plugin enable unimplemented in production until their ids say what they do.

4. **Make the Office UI honest.** Keep the three preview readers. Remove Edit/Undo, or pass `onApply` into a main-process admit that writes through M05 and shows the same bytes after reopen. Do not extend `zip-store.ts`, `xlsx-xml.ts`, or `pptx-xml.ts`. PPTX stays an export target for a future MotionDeck (D46), not the deck's source of truth.

5. **Demote jobs, canvas, and CLI executors in the spec appendices.** Keep the "inspect, do not resubmit" rule as an M08 acceptance test for later. Do not mount `ArtifactCanvasBoard`. Do not merge further card types onto it. Leave Codex/ACP as adapters with `display-only` until a real peer is attached to the session kernel.

6. **Plugins: one catalog, one approver.** Drive enablement through `SessionManager.respondToPermission` and the skills/sources the agent already loads. Drop standing `decision: approved` grants, or document them as a Lead decision before any more plugins ship. Treat the MCP Apps pane as a list (`display-only` relative to the MCP Apps spec) until a sandboxed `ui://` view exists.

7. **Parallel work waits on disjoint packets.** The next agents need a Lead packet that names exact files and says the wave is Ready. `protocol/*.ts`, `protocol/index.ts`, and `00-platform-spine.md` stay Lead-owned. Safe parallelism looks like the operating model's checkpoints: M00 backbone merged first, then one module agent per already-usable contract, on paths the ownership matrix names. Seventeen agents editing the kernel barrel is how this spine got a status table that contradicts itself.

---

## 4. What must stay Locked

These stay Locked even if someone wants a follow-up PR tomorrow. "Locked" here means do not implement.

| Item | Why it stays Locked |
|---|---|
| W1–W5 execution gates, including M00 as a module | W0.1 exit in `WAVE-MODULE-MAP.md` is incomplete: migration ledger, contract parity, namespace (BLK-002), adapter spikes (BLK-003). Absence of a Lead Ready declaration means Locked. |
| Physical daemon, sandbox, portal | D22, D38. |
| Second session store, permission model, memory database, job database, workflow runtime | `AGENTS.md`, persistence map. The `*.job.json` and `.claude-plugin/loadout.json` files are examples to remove, not patterns to copy. |
| `@xyflow/react` or any other spatial renderer, OpenPencil as canvas host | D43. Spike plus explicit promotion. |
| MotionDeck, slide animation, HTML/video/PDF deck export, full slide editor | D46, M19. The first-slide text writer does not unlock these. |
| Live paid image/video providers, quota ledger, Fusion, account rotation | D4, D5, D23, M11. The fake provider must not grow a real billing call. |
| Screenshot evidence bundles, Chrome Store, stealth or anti-detection browser work | D10, D23, D30. |
| Sandboxed MCP App `ui://` view, live `tools/list`, tool calls from the pane | Not the MCP Apps spec yet, and M12 distribution is W4. |
| Remote plugin store and marketplace | M12 distribution, W4, concept spec. |
| Signed production update feed, a signed Fleet release, live auto-update | PRs #12 and #17 locked this on purpose. The dry run must not grow a publish path. |
| CLI command execution, PTY, dynamic client tools, client filesystem writes | Executor code locks these. AionUi may inform a later adapter; it is not a license to spawn shells from the test client. |
| Gemini, Qwen, and Kimi process launch | Presets are `display-only`. Launching them is a new runtime lane (M02/M04), which is Locked. |
| Pi as permission authority, or a full Pi SDK host | `AGENTS.md` Pi boundary. |
| Automatic admission of Pi tool calls into the permission card | M00 §13 already locks this. Wiring it by calling `approve` inside the driver would break the boundary the code currently holds. |
| Legacy `.xls`, `.xlsm`, `.ppt`, `.pptm`, formula editing, charts, a general spreadsheet | Explicit product limits. Also a reason not to keep writing a private OOXML stack. |
| M09 media, M17 workflows, M18 web projects | Dependency stop rules. No packet, no usable M05/M08. |
| Applying the gitignored `.fleet/zcode` tree | Tracked notes live in `patches/zcode/`. Do not delete `app/`. |
| `docs/contracts/action-ids.md` row adds, `OWNERSHIP-MATRIX.md`, `WAVE-MODULE-MAP.md`, `DECISIONS-LEDGER.md` | Lead-only. This audit must not be edited into those files by a worker. |

## PR map (for the Lead, not a scoreboard)

| PR | Claim on the tin | Honest label |
|---|---|---|
| #3 | Host admission, snapshot, usage sealing | Library-only kernel and snapshot. Credential/usage sealing is a real function with no production saver. Pi boundary held. |
| #4 | Permission card wires host approval | Bridge works in `SessionManager` tests. App startup never attaches a kernel. |
| #5 | Awaiting cards and project model reuse | Card publish is real once a kernel is attached. Attachment is test-only. `selectPageModel` in the popover is `wired`. |
| #6 | Codex and ACP executors | Unattached adapters. Fail-closed shape is sound. Not `wired`. |
| #7 | AIGC jobs and subscription observation | Jobs are a fake provider. Subscription mapper is `wired`. |
| #8 | DOCX suite | Preview reader `wired`. Edit/save `library-only`. |
| #9 | Canvas cards | Unmounted. Test-only host. |
| #10 | Chromium guest DOM snapshot | Navigation controls `wired`. DOM capture `library-only` and the wrong action id. |
| #11 | Settings Plugins page | Page chrome `wired`. Loadout authority invented. |
| #12 | Notices and update feed | Local checks `wired`. Publish stays Locked. |
| #13 | MCP registry and skill catalogs | Fail-closed reader. Not a marketplace. |
| #14 | Hook and MCP enablement | Renderer kernel, standing grant, `file.update`. Rework. |
| #15 | MCP Apps side pane | List UI on the real sidebar. Not MCP Apps. Wrong action id. |
| #16 | Agent Plugins 1.0.0 projection | Filter that drops unsafe fields. Not a plugin runtime. |
| #17 | Packaging dry run | Layout check `wired`. Not a release. |
| #18 | XLSX suite | Same split as DOCX. First-sheet viewer `wired`. Editor is not. |
| #19 | PPTX suite | Same split. Contradicts D46 if treated as M19. |

## What "best possible" would have meant

A best-possible slice on this base is boring: one Craft session, one permission decision, one timeline record, one native owner for the bytes, and a UI that calls that path. PRs #3–#19 repeatedly built a second path that tests can pass, then wrote `wired` in the module changelog. The references the repo already trusts (Craft session permission, ACP and Codex approval callbacks, xyflow for space, MotionDeck-plus-export for decks, MCP's own app spec, a durable job that inspects instead of resubmitting) are stronger than what landed. Use them when the Lead opens a wave. Do not grow this stack in the meantime.
