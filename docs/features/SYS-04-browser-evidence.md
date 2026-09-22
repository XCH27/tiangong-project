# SYS-04 — Governed browser and evidence

**Rows:** INFO-03, INFO-07, EXEC-01, EXEC-15, ORCH-07. **Owner:** BrowserPane capture/evidence
adapter. **Development order:** R3/R5 evidence; R16 local-app control belongs to SYS-02; general Core control stays excluded. **Depends on:** SYS-01 policy and INFO-02 ArtifactRef.

## Closed loop

Permitted target → navigation/automation → annotation/capture/download → evidence ArtifactRef →
session/task/document/media consumer, with approval and failure state at every consequential action.

## First proof

Capture one page with URL, timestamp, source identity and annotation; link it to a session; exercise
denied credential action, blocked external effect, offline target and failed-download recovery.

## Acceptance and references

Use `BRW-001..004`, `INFO-03-A`, `INFO-07-A`, `EXEC-01-A`, `EXEC-15-A`. Craft BrowserPane is the
baseline; audit agent-browser, browser-use/video-use, Chrome DevTools MCP and crawl candidates only
as replaceable executors. ChatCut is product behavior evidence only.

## Stop conditions

Stop on policy bypass, credential leakage, untraceable capture, or browser code writing directly to
another suite's authority.

---

## Module boundary — Browser automation and evidence module


First-slice readiness: see the capability register and the execution contracts below. implementation status: `not implemented`; development order: R3/R5
evidence path; no general computer-environment module.

The browser module must separate navigation/automation, evidence capture, downloads and local
artifacts. Remote pages are not silently editable documents. All consequential actions use the
core permission and timeline paths; captured screenshots, text and downloads become explicit
ArtifactRefs with provenance.

#### Frontend and backend boundary

- P-15 extends Craft BrowserPane for tab, URL, navigation, loading, blocked, crashed, offline and
  credential-request states. P-16 inspects captures and downloads; neither surface owns artifacts.
- `browser-pane-manager.ts` remains the native window/session authority. `browser-tools.ts` remains
  the Agent-facing seam. Renderer code issues typed commands and receives state/events; it never
  calls CDP, Playwright or a remote browser provider directly.
- A capture adapter normalizes text/DOM snapshot, screenshot and download into one provenance-
  bearing ArtifactRef containing source URL, capture time, Session/actor correlation, media type and
  integrity metadata. Native storage owns the bytes; Library/ArtifactRef indexes the capture and its lifecycle without
  creating another hidden content copy.
- Credential use and every external side effect pass core policy at execution time. A stored grant
  does not prove the current page or observation is fresh.

#### Executor candidates and evidence limits

Playwright MCP and Browser Use remain executor candidates, not selected dependencies. The inspected
Playwright MCP checkout delegates execution to playwright-core; reading its wrapper does not verify
that runtime. Browser Use's navigation watchdog checks redirects after navigation completes; this
does not establish pre-request network isolation. Current source locks and narrower candidates are in
the [browser comparison](../REFERENCES.md#browser-and-interface-development-comparison).
Screenshots support coordinate actions for canvas-only pages when fresh geometry is available;
they do not grant permission or replace stale-target checks; page-derived accessibility text is untrusted
external content and cannot issue instructions or bypass policy.

The current BrowserPane authority is traced below. The browser route is `CRAFT_REUSE/EXTEND`,
not a new browser framework. External automation projects
remain optional executors until their permission, credential, evidence and download paths are
compared against this existing seam.

Compatibility gates:

- existing BrowserPane and browser tool paths audited first;
- sandbox and full-CDP escalation boundaries defined;
- download, cookie/credential and external-side-effect policies are explicit;
- offline, denied, blocked and evidence-unavailable states have recovery behavior;
- no browser-owned duplicate Library, task or permission authority.
- executor removal falls back to the unchanged native BrowserPane path.

Activation acceptance: `BRW-001` opens a permitted target with session correlation; `BRW-002`
captures a provenance-bearing evidence ArtifactRef; `BRW-003` denies credentials/external effects
through core policy; `BRW-004` handles blocked, offline and evidence-unavailable states honestly.

#### Reality and activation sequence

The Craft browser baseline exists at `app/apps/electron/src/main/browser-pane-manager.ts` and
`app/packages/shared/src/agent/browser-tools.ts`; capture-to-ArtifactRef does not.
Activation is: audit current BrowserPane/tool permissions, define the evidence adapter, add a
fixture capture and denial/offline tests, then wire the P-15/P-16 surfaces. The baseline must not
be reported as the Fleet evidence module. From `app/`, run
`bun test apps/electron/src/main/__tests__/browser-pane-manager.test.ts` for the baseline.

## Capture and trust details

Keep the retained BrowserPane lifecycle/profile manager. Before adding an annotation overlay,
verify pointer/keyboard routing and capture coordinates in Electron; no second browser manager or
profile is introduced. Selection anchors bind navigation/frame identity, quote or structural hints,
geometry and capture time. Re-resolve after page changes; stale/unresolvable anchors never silently
select another target. Annotations belong to Fleet, not permanent external-page DOM edits.

Capture freezes identity, applies permission and redaction, validates the output, then registers
provenance. Mid-capture navigation or failed redaction aborts the affected handoff. Browser crashes,
blocked sites, missing download permissions and unavailable evidence expose recovery. Owned local
web previews use real workspace files and do not grant trust to external origins. Keep browser
preferences in one settings schema; no recovered design note may redefine current browser actions
or treat app policy as an OS/network sandbox. EXEC-15-A belongs to SYS-02 and verifies the scoped local-app Component; browser acceptance stays INFO-03-A.

## Observed browser baseline and capability wording

Source comparison on 2026-09-21: current Fleet matches Craft v0.13.4 in
`BrowserEmptyStateCard.tsx`, `BrowserToolbar.tsx`, `browser-tools.ts` and `browser-cdp.ts`.
The owner-requested restoration removed the manager teardown correction; there is no current
Fleet browser delta. Its former tests are not current evidence.
Both the v0.10.5 look pin and v0.13.4 use a compact empty-state card with example tasks.
The browser is an auxiliary native window with address/navigation controls; main-window badges
represent browser instances and link them to their Session. These are not a conventional tab strip
inside a single browser window, nor the future in-workbench host.

| User-facing claim | Observed implementation / limit | Capability status |
|---|---|---|
| Open pages and switch browsing targets | `open`, `navigate`, `windows`, `focus`; native browser instances with Session ownership | `wired but not visually checked` |
| Read text/elements and take screenshots | accessibility `snapshot`/`find`, `evaluate`, screenshots and region capture; canvas content may need image/coordinate handling | `wired but not visually checked` |
| Click, type, fill, select and scroll | CDP/input-backed commands, plus drag/upload/clipboard; execution permission correction remains an R0 concern | `wired but not visually checked` |
| Test layout at another size | `window-resize` changes the native viewport, reporting clamping. The browser window minimum width is 700px; no device-metrics/touch/UA emulation was found in this path. Phone simulation and a device preset UI are `not implemented` | `wired but not visually checked` for desktop resizing only |
| Search browsing/download history | navigation back/forward and instance-local `downloads list/wait` exist. Download records live in the instance array; no durable cross-instance history/search consumer was found | `not implemented` for the advertised history search |
| Watch and take control at any time | foreground/focus and Agent activity overlay exist; `release` restores manual interaction. While Agent control is active the overlay intercepts page input and resize is locked. No dedicated immediate user-takeover command/button was found | `wired but not visually checked` for watch/release; immediate takeover `not implemented` |

A five-item welcome page cannot establish these capabilities. Do not label viewport resizing as
phone emulation, back/forward as history search, screenshot element labels as human annotations,
or Agent-controlled release as immediate human takeover. New capabilities require their own
bounded acceptance after R0; this inventory does not add them to the baseline.

The Fleet `browser-tool-policy.ts` correction and its tests were withdrawn by restoration.
Audit original mode-manager/session-tool metadata and PreToolUse against the execution parser,
including batches and foreign tools with similar names. Per-action permission correction remains
an R0 review proposal; neither that proposal nor the original browser proves governed evidence,
human takeover or durable history.

## Recommended browser rectification

Keep Craft's native `WebContentsView`/manager/CDP path. Electron 39.2.7 already exposes
`capturePage`, `inspectElement` and device emulation; another browser engine, Python agent runtime
or Chromium fork has no demonstrated benefit for these gaps. This is a design recommendation;
the additions below are `not implemented`, and no external dependency is admitted.

| Need | Recommended bounded mechanism | Required proof beyond source review |
|---|---|---|
| Window/panel lifecycle | Compare Cindy's stale guest-release guard, early crash listeners and explicit ownership with the existing manager. Preserve native views when a future host moves them. | Switch/move/close/restart without wrong-Session targeting or orphan processes. Do not transplant its DOM webview pool: when all five entries are pinned, it still evicts one. |
| Responsive layout | OpenChamber's separate CSS viewport dimensions and display scale inform the controls; implement with existing Electron/CDP facilities. Chrome DevTools MCP informs explicit viewport/DPR/touch/UA fields and reset behavior. | A 375px viewport must measure 375 CSS pixels, with accurate screenshot/annotation coordinates at multiple display scales. Touch/UA emulation is separately declared and reset; neither proves Safari/iOS fidelity. |
| Point at a page and request a change | Cindy's selection/pending/capture/commit/cancel flow plus OpenChamber's annotation-to-composer attachment path. | Freeze page/frame/Session identity before capture; navigation, Session switching or capture failure preserves the draft and cannot attach another page. Removing an annotation removes its marker/context. |
| History and downloads | Small browser-owned metadata extension first. OpenChamber supplies recent-address suggestions; Min supplies a persistent visited-page/search comparison. Index downloaded bytes through the existing artifact path. | Restart/search/delete; unknown/interrupted download and missing file; credential-bearing URLs redacted. Neither OpenChamber's 50-address list nor Min's in-memory download bar is durable download history. Full-text page retention needs a separate demonstrated need. |
| Human takeover | Extend the current manager and core permission path with explicit user takeover and revocable execution ownership. | Revoke queued actions before accepting manual input; reject late actions against the old ownership generation. In-flight external effects can be uncertain, not undone. Resume requires a fresh observation and valid grant. OpenChamber's request claim prevents duplicate execution but does not cancel a claimed client action. |

R0 first corrects the whole-tool permission bypass and misleading inherited claims. The existing
post-baseline host/evidence slices then prove the corresponding additions; this research does not
activate a parallel browser release. The UI-contract guard is absent after restoration; record
that limitation and restore it only within an approved correction slice before rendered work.

## Interface annotation for development

The owner also requires precise feedback on Fleet and other Electron interfaces. Share the
annotation payload/capture lifecycle with browser evidence, but identify the target explicitly:

- **Fleet itself:** use its existing React renderer for element selection and an allowlisted main-
  process capture bridge. No nested Electron runtime or public debugging port is needed. During
  selection, intercept input so selecting a destructive button does not activate it. Native menus,
  window chrome and separate guest views are not part of that renderer's DOM.
- **A project web/Electron app:** use its permitted preview or explicitly enabled development
  adapter. React Grab is a candidate for component/source context. Prefer build-time source hints
  for code Fleet owns; test Fiber/source-map extraction against the actual React/build version.
  Missing maps, non-React UI, canvas or native widgets retain screenshot/region feedback with an
  explicit unavailable source location. A production app cannot be assumed to expose its source.
- **Another installed app without a development bridge:** screenshot/AX evidence belongs to the
  bounded [local-app Component](SYS-02-remote-office.md#local-app-computer-use-contract), not arbitrary
  DOM injection or an embedded copy of that application's Electron process.

Recommended user loop: select one or more elements/regions → write feedback and optionally preview
style changes → attach to the current draft → submit → review source diff and refreshed interface.
The evidence includes target/window/frame identity, observation time, viewport/scale, bounded
DOM/AX anchors, optional component/file location, screenshot and requested change. Capture only
needed attributes/styles; avoid raw props or form values that may contain secrets. A temporary
style preview is reversible and is never reported as a saved source edit. Source edits still use
the existing project/file/permission path. No annotation creates a new task automatically.

Codex's page comments/style feedback, Claude's preview-and-verify loop and Cursor's element plus
frozen-screenshot Design Mode are product references in the registry. Their closed desktop
implementations are not source evidence. Acceptance must cover portal/iframe/scroll/zoom geometry,
HMR while feedback is pending, missing source maps, cancellation and draft deletion before this
loop can be called `usable`.

## Execution contracts

These sections own the next step for the listed capability IDs. Read the
[common execution contract](../COMPONENT-GUIDELINES.md#executable-next-step-contract)
and the release/spec anchor in [capability register](../PROJECT-SPEC.md#capability-register). Gates do not open merely
because this packet has instructions. Planned regression targets below do not exist yet unless
implementation has added them; extend a matching existing behavioral test instead of duplicating it.

### Execution INFO-01

**Workspace files and file tools**

- **Next:** `IMPLEMENT` — R0 retained files; R3/R5 provenance extension.
- **Sources:** [`apps/electron/src/renderer/components/right-sidebar/SessionFilesSection.tsx`](../../app/apps/electron/src/renderer/components/right-sidebar/SessionFilesSection.tsx); [`packages/server-core/src/handlers/rpc/resources.ts`](../../app/packages/server-core/src/handlers/rpc/resources.ts); [`packages/shared/src/workspaces/storage.ts`](../../app/packages/shared/src/workspaces/storage.ts); [`packages/shared/src/agent/core/pre-tool-use.ts`](../../app/packages/shared/src/agent/core/pre-tool-use.ts).
- **Deliver:** Preserve current file browsing/read/write and enforce real-path containment at the server; link later immutable artifact versions without replacing workspace files.
- **Data:** Workspace filesystem owns bytes. File request names scoped path, operation and expected version when writing; renderer selection contains references only.
- **Failure:** Symlink escape/denial/locked file/stale write are explicit. Failed save preserves original bytes and draft; delete requires real authorization and is distinct from removing a view binding.
- **Proof:** INFO-01-A — Read/write/save conflict against disposable roots, symlink swap, rename/delete during read and restart; no foreign bytes exposed and no silent overwrite. Planned regression/probe target relative to `app/`: `apps/electron/src/renderer/components/right-sidebar/__tests__/fleet-info-01.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/renderer/components/right-sidebar/__tests__/fleet-info-01.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft resource/file and SessionFilesSection paths; native OS/file semantics before any Library import. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution INFO-02

**Library and ArtifactRef**

- **Next:** `IMPLEMENT` — R5 after real R3 outputs; R4 action seam.
- **Sources:** [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../app/packages/server-core/src/handlers/rpc/resources.ts); [`packages/shared/src/sessions/storage.ts`](../../app/packages/shared/src/sessions/storage.ts).
- **Deliver:** Extract ArtifactRef from real capture and deliverable consumers: register original bytes, immutable derived versions and provenance, then expose a Library projection.
- **Data:** Native file owners retain bytes; ArtifactRef identifies workspace, artifact ID/version, locator/content digest, media type, creator operation and input versions. Catalog/index is a rebuildable projection.
- **Failure:** Stage output and validate before receipt publication; missing bytes or interrupted commit is unavailable/reconciling. Delete binding is not source deletion; old versions remain inspectable.
- **Proof:** INFO-02-A — Two producers reference the same input; revise one result, restart and resolve all versions. Inject missing file, write failure and evidence failure without duplicate artifact or false receipt. Planned regression/probe target relative to `app/`: `packages/shared/src/resources/__tests__/fleet-info-02.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/resources/__tests__/fleet-info-02.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft resources/session evidence; Open Design version/lineage and Hyperframes staged artifact commit are bounded comparisons, not imported storage. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution INFO-03

**Browser evidence and capture**

- **Next:** `IMPLEMENT` — R0 claims/permission fixes; R3/R5 evidence additions.
- **Sources:** [`apps/electron/src/main/browser-pane-manager.ts`](../../app/apps/electron/src/main/browser-pane-manager.ts); [`apps/electron/src/main/browser-cdp.ts`](../../app/apps/electron/src/main/browser-cdp.ts); [`packages/shared/src/agent/browser-tools.ts`](../../app/packages/shared/src/agent/browser-tools.ts).
- **Deliver:** Correct advertised capabilities against actual BrowserPane commands; then add capture provenance, responsive emulation, annotation and takeover as separately accepted slices through the same manager.
- **Data:** Manager owns browser instance/Session, native view, partition and control generation. Capture binds URL/frame/viewport/time and bytes to INFO-02; history metadata cannot become another browser owner.
- **Failure:** Navigation/reparent/crash invalidates stale targets. User takeover revokes queued work; unknown in-flight effect requires observation. Missing history/device emulation stays explicitly unavailable until proven.
- **Proof:** INFO-03-A — Local test site: capture, navigate during annotation, 375-CSS-pixel emulation, scale change, download failure and takeover with queued actions. Browser inspection and real saved evidence must agree. Planned regression/probe target relative to `app/`: `apps/electron/src/main/__tests__/fleet-info-03.test.ts`. After adding the target, run from `app/`: `bun test apps/electron/src/main/__tests__/fleet-info-03.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft WebContentsView/CDP first; Cindy lifecycle/selection, OpenChamber viewport/annotation and Min history. Chrome DevTools MCP is protocol evidence, not another engine. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution INFO-04

**Document ingestion and conversion**

- **Next:** `IMPLEMENT` — R3 existing ingestion; R5 versioned receipts.
- **Sources:** [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../app/packages/server-core/src/handlers/rpc/resources.ts).
- **Deliver:** Use current bundled conversion tools for one actual source; retain original and produce readable derived content with converter/version/fidelity receipt.
- **Data:** Source owns credential/access; workspace/artifact owner keeps originals and derived versions. Receipt records input digest, tool revision, output type, warnings and unsupported constructs.
- **Failure:** Unsupported/encrypted/oversized/failed conversion is explicit and leaves original untouched. Retry reuses operation identity; optional converter installation is separate from reading a file.
- **Proof:** INFO-04-A — Document containing tables/images/non-Latin text, encrypted or malformed input and missing converter; verify retained bytes, warnings, cancellation and reopen of derived output. Planned regression/probe target relative to `app/`: `packages/shared/src/sources/__tests__/fleet-info-04.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/sources/__tests__/fleet-info-04.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft bundled doc tools first; MarkItDown dispatch/recovery. Extraction is not native Office editing. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution INFO-06

**Search indexing and retrieval**

- **Next:** `IMPLEMENT` — R0 Session search; R5 domain search.
- **Sources:** [`packages/server-core/src/services/search.ts`](../../app/packages/server-core/src/services/search.ts); [`packages/shared/src/views/storage.ts`](../../app/packages/shared/src/views/storage.ts); [`packages/shared/src/sources/storage.ts`](../../app/packages/shared/src/sources/storage.ts).
- **Deliver:** Keep searchSessions as baseline; expose other domains through typed result adapters only when real owners exist. Add incremental/rebuildable indexes without copying authority.
- **Data:** Result carries source kind, owner ID/version, locator, excerpt and freshness. Scope/permission filtering precedes retrieval; index has a schema/source watermark and is disposable.
- **Failure:** Missing index triggers bounded rebuild or direct search. Deleted/revoked sources disappear from retrieval; stale result cannot authorize access.
- **Proof:** INFO-06-A — Index/rebuild twice, modify/delete a source, switch Workspace mid-query and revoke a Source; results are scoped, cancelable and resolve to current or visibly stale evidence. Planned regression/probe target relative to `app/`: `packages/server-core/src/services/__tests__/fleet-info-06.test.ts`. After adding the target, run from `app/`: `bun test packages/server-core/src/services/__tests__/fleet-info-06.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft ripgrep search; Repomix is packaging evidence and Context7 is optional source evidence, neither is Fleet search truth. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution INFO-07

**Provenance and citation**

- **Next:** `IMPLEMENT` — R5 with INFO-02 and real browser/document evidence.
- **Sources:** [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts); [`packages/shared/src/sessions/storage.ts`](../../app/packages/shared/src/sessions/storage.ts); [`apps/electron/src/main/browser-pane-manager.ts`](../../app/apps/electron/src/main/browser-pane-manager.ts).
- **Deliver:** Attach citations to exact captured/file versions with native locators and show the evidence in existing preview surfaces.
- **Data:** Citation contains ArtifactRef version plus page/range/time/frame locator and acquisition context. It is a reference to immutable evidence, not a duplicate content store.
- **Failure:** Source deletion, denied access or locator mismatch reports unavailable/stale; never redirect silently to newer content or invent a citation from a URL alone.
- **Proof:** INFO-07-A — Change live URL/file after capture, remove original and revoke access; citation still resolves preserved permitted snapshot or reports the precise limitation. Planned regression/probe target relative to `app/`: `packages/shared/src/resources/__tests__/fleet-info-07.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/resources/__tests__/fleet-info-07.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft file/browser capture; native format locator semantics. Research prose is not a citation validator. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).

### Execution INFO-08

**Import/export and migration**

Current local export: `SessionManager.exportMarkdown` → `sessions/export-markdown.ts` →
`renderer/utils/export-session.ts`. The download toast reports initiation, not a completed save.
Existing tests are `sessions/__tests__/export-markdown.test.ts` and the real
`server-core/src/sessions/session-export.test.ts`; the production-backend smoke also calls the RPC.
Do not recreate these helpers or describe the old export as absent.

- **Next:** `IMPLEMENT` — R5/R10 format adapters after the R0/R2 baseline exit. Local export RPC is wired; its desktop download/cancel/destination acceptance remains in R2-C3 before that gate.
- **Sources:** [`packages/shared/src/sessions/storage.ts`](../../app/packages/shared/src/sessions/storage.ts); [`packages/server-core/src/handlers/rpc/resources.ts`](../../app/packages/server-core/src/handlers/rpc/resources.ts); [`packages/shared/src/resources/resource-bundle.ts`](../../app/packages/shared/src/resources/resource-bundle.ts).
- **Deliver:** Verify the wired local Markdown export (including attachment references) in the actual desktop/WebUI download path. The current SessionManager RPC and formatter have real storage tests; a Blob click is not proof of a completed destination write. Later imports/exports use the owning domain adapter and common format receipt.
- **Data:** Export is a new workspace/destination artifact from a fixed source version. Import preserves original and records adapter version, supported features and fidelity class.
- **Failure:** Partial/locked destination never counts as delivered. Preserve explicit unpublish cleanup for prior remote copies; local export does not delete remote data or original files.
- **Proof:** INFO-08-A — Export Session with attachments and non-Latin content, cancel/deny/lock destination, reopen output and verify source unchanged. Per-format round-trip cases are owned by SYS-05/06. Planned regression/probe target relative to `app/`: `packages/shared/src/sessions/__tests__/fleet-info-08.test.ts`. After adding the target, run from `app/`: `bun test packages/shared/src/sessions/__tests__/fleet-info-08.test.ts`; apply the isolated-profile rule for configuration writes.
- **Reference:** Craft Session storage and bundled converters; GenOffice/Open Design/OTIO only for their tested format subsets. Source locks and limits: [reference registry](../REFERENCES.md#bounded-source-review--2026-09-21).
