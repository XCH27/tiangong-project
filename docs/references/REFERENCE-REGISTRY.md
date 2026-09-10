# Reference registry — evidence status, not dependency approval

Audit date: 2026-07-27

The current file-level evidence ledger for the highest-risk routes is
[`ADMISSION-V2-AUDIT.md`](ADMISSION-V2-AUDIT.md). It records what was actually found in source;
the rows below remain pending until the comparison, local-improvement and deletion tests pass.

This is the canonical cross-check between the reference map, the local read-only checkouts and
the product matrix. A row in this file does **not** authorize importing code. Admission status is
independent from cache retention: most `REVIEWED-HEADS.tsv` entries still use the legacy two-column
format; rows still marked `pending` have no structured source review. `plugins/xyflow`
has now completed a structured Grok source review but remains `INSUFFICIENT_COMPARISON`, not an
admitted reference. The local commit and license facts below were checked directly against the
checkout; they are not claims that the mechanism has passed product comparison.

## Admission vocabulary

| Status | Meaning |
|---|---|
| `FORMAL_REFERENCE` | Multiple mechanisms are needed repeatedly and all admission gates passed. |
| `MODULE_REFERENCE` | Only a bounded subtree/protocol/symbol passed; never the product shell. |
| `LOCAL_IMPROVEMENT` | A small Fleet change can meet or exceed the candidate; put the change in an active spec. |
| `EVIDENCE_ONLY` | Product or mechanism evidence only; no standing dependency or code import. |
| `candidate` | Not yet admitted; fixed commit, exact symbols, comparison, license and deletion test are incomplete. |
| `REJECT` | No gap, weaker, conflicting authority, or unacceptable license/dependency. |

## Local checkout cross-check

Every retained checkout path and short SHA in this table was checked against its recorded source;
the Craft tag commits were also verified against the official upstream tags. `pending` means the
new admission-v2 source audit has not been recorded; even an exact SHA and a readable LICENSE is
not a formal reference.

> **Pin integrity, 2026-09-10.** `software/craft-agents-oss-v0.10.5` was found checked out at
> `abdc281a` (v0.12.0) — the same commit as the rolling pin — so the two reference roots were
> byte-identical and the v0.10.5 product/interaction baseline did not exist on disk. It had been in
> that state since 2026-08-17, meaning every "compare against v0.10.5" instruction in `AGENTS.md`
> rule 1, `../UI-SPEC.md` and `specs/R1-one-boundary-language.md` R1-C1 silently compared
> against v0.12.0. Restored to `c9d9a26f`. The row below is the assertion to check: a fixed HEAD in
> this table is only true if the checkout is actually on it.

| Checkout | Fixed HEAD | License text at checkout root | Admission-v2 |
|---|---|---|---|
| `plugins/dockview` | `0eef758ef3bc` | MIT (text verified) | `pending` |
| `plugins/markitdown` | `e144e0a2be95` | MIT (text verified) | `pending` |
| `plugins/react-resizable-panels` | `a1eeb7aefdb0` | MIT (text verified) | `pending` |
| `plugins/react-rnd` | `fec7303134ab` | MIT (text verified) | `pending` |
| `plugins/repomix` | `a5577d5718b1` | MIT (text verified) | `pending` |
| `plugins/xyflow` | `dd308ab401d4` | MIT (text verified) | `source-reviewed / INSUFFICIENT_COMPARISON` |
| `plugins/agentskills` | `38a2ff82958a` | Apache-2.0 code; CC-BY-4.0 docs | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/hyperframes` | `6ad738b580ad` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `plugins/mem0` | `ddaa655edf41` | Apache-2.0 | `source-reviewed / EVIDENCE_ONLY` |
| `plugins/playwright-mcp` | `55679f5f3d4b` | Apache-2.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenHands` | `613406ca2bca` | MIT (text verified) | `pending` |
| `software/codex` | `38b064c31b1f` | Apache-2.0 | `pending` |
| `software/craft-agents-oss-v0.10.5` | `c9d9a26fbefa` | Apache-2.0 | `product/interaction baseline` |
| `software/craft-agents-oss` | `abdc281a7592` | Apache-2.0 | `selective-update reference (v0.12.0; repinned 2026-09-10 from v0.11.2, 97-file delta / +1751 −545, intake below)` |
| `software/hermes-agent` | `2ea39daeb1f6` | MIT (text verified) | `pending` |
| `software/openclaw` | `9f5609382b54` | MIT (text verified) | `pending` |
| `software/opencode` | `40e4d730cac3` (re-cloned 2026-07-27 sparse; prior incomplete snapshot retired) | MIT (text verified) | `pending` / mode evidence in `context/06-MODE-SELECTION-COMPARISON.md` §4.5 |
| `software/opencut-classic` | `cf5e79e91914` | MIT (text verified) | `pending` |
| `software/penpot` | `bdc078d5ea0c` | MPL-2.0 | `pending` |
| `software/pi-mono` | `13437ca82889` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |
| `software/tldraw` | `c26735e45258` | tldraw License (production restrictions) | `pending` |
| `software/browser-use` | `950eb03617e6` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/flowgram.ai` | `5afd287a989a` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/grok-build` | `b41c75a578f9` | Apache-2.0 first-party code; vendored code retains original licenses | `source-reviewed / EVIDENCE_ONLY` |
| `software/mcp-registry` | `29e32c39dcb5` | mixed Apache-2.0/MIT transition; docs CC-BY-4.0 | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/opencut` | `5e0696bc9b92` | MIT (text verified) | `source-reviewed / EVIDENCE_ONLY` |
| `software/waku` | `9500440002b4` (shallow `main`, owner-requested 2026-08-12) | GPL-3.0-only (text verified) | `source-reviewed / EVIDENCE_ONLY` — competing native host; no code import |
| `software/deepseek-harness` | `47f943859bef` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/spec-kit` | `bf88c9f9a82f` | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/OpenSandbox` | `f8ed8734ce1f` | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/openchamber` | `b63830545` (re-verified 2026-09-10) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — sync/permissionStore (2026-08-15); GitHub PR resolution + browser-control broker (2026-09-10) |
| `software/herdr` | `9166e07b` | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` |
| `software/orca` | `95633a788` (verified 2026-09-10) | MIT (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — max-lines ratchet (2026-08-15); subscription usage + managed accounts (2026-09-10) |
| `software/cindy` | `dfef7ea0a` (re-verified 2026-09-10) | Apache-2.0 (text verified) | `source-reviewed / MODULE_REFERENCE candidate` — model/agent split (2026-08-15); capability ownership, skill slot, store, right sidebar, creation, settings, remote (2026-09-10) |

The two Craft snapshots have different roles: v0.10.5 decides R1 product/interaction behavior;
the v0.11.x line (currently v0.11.2) is inspected only for independent fixes and bounded backend
mechanisms. Neither is merged wholesale.

**v0.11.2 intake audit (2026-07-26, delta 4289b1609→a60ebc1a5, 68 files).** Full `git apply
--check` against `app/`: clean except three Fleet-diverged files (SendToWorkspaceDialog,
shared/CLAUDE.md, zh-Hans locale). Verdicts:

- **TAKE — A. mid-stream queue correctness** (SessionManager `resolveMidStreamDeliveryOutcome` +
  `monotonic()` re-stamp; renderer `session.ts` timestamp copy; two upstream test files). Also
  removes a spurious injected "previous response was interrupted" reminder — aligns with the
  token-economy rules. The same upstream commit's `createTaskFn` hunks are create_task feature
  code and must be split out on cherry-pick.
- **TAKE — B. task_notification classifier unification** (new
  `backend/claude/task-notification.ts`; event-adapter + claude-agent route through it; malformed
  terminal notifications warn instead of silently stranding a chip; upstream test file).
- **CONDITIONAL — C. transfer request-timeout passthrough** (`handlers/workspace.ts`): take only
  while Fleet retains remote-workspace transfer; extract `TRANSFER_REQUEST_TIMEOUT_MS` alone —
  the surrounding `main/index.ts` hunk is out-of-scope product code.
- **OWNER CALL — D. background-chip stale lifecycle** (20-min no-signal → honest `stale` state +
  renderer-only Dismiss): fix-flavored but interaction-visible; needs the owner's product read.
- **DO NOT TAKE — product out of scope (29 files):** create_task board tool (incl. new
  `shared/src/tasks/slug.ts` — no Fleet collision; Fleet slugifiers are separate scopes),
  any-to-any workspace transfer + local targets, Arrow-Up empty-input recall,
  `background-finished` default flip. `prompts/system.ts` +3 lines is create_task tool-doc only
  (~120 tokens of dead prompt without the tool) — skip.
- **R2-RELEVANT: none.** No updater/telemetry/OAuth/docs-link/Craft-endpoint changes; no new
  phone-home. **Security: none required.** The earlier Aion, Omnigent, Multica, Golutra, Orca,
  DeepSeek-Reasonix, Open Pencil, Vibeframe, Headroom, CodeGraph, RTK, Ponytail, Open Design and
  react-timeline-editor checkouts were removed from standing retention on 2026-07-20. Their
  fixed-head findings remain historical `EVIDENCE_ONLY` in `ADMISSION-V2-AUDIT.md`; no active
  design may start from them without a new top-tier gate and temporary source intake. Grok Build
  was cloned again at the owner's request on 2026-07-27 and source-reviewed in
  [`context/05-GROK-BUILD-HARNESS-RESEARCH.md`](context/05-GROK-BUILD-HARNESS-RESEARCH.md); it
  remains `EVIDENCE_ONLY`, not an admitted runtime or product-shell reference.

## Top-tier source intake: exact mechanisms

| Checkout | Exact inspected evidence | Fleet verdict |
|---|---|---|
| `software/flowgram.ai` | `packages/client/editor`, `packages/canvas-engine/document`, `packages/common/command`, `packages/plugins/*`, `packages/runtime/interface` | workflow/canvas editor seam only; TaskRunner remains execution authority |
| `software/opencut` | `README.md`, `apps/web`, `apps/desktop`, `apps/api` | current rewrite has a real TS/Rust shell but Editor API, plugin-first, MCP and headless items are still roadmap claims; use classic for implemented timeline evidence |
| `plugins/hyperframes` | `packages/core`, `packages/engine/src/services`, `packages/studio-server/src/routes/render.ts`, cancellation/failure tests | primary programmatic-video renderer evidence; absorb deterministic composition and Job adapter behavior, not its Studio or cloud control plane |
| `plugins/mem0` | `mem0/memory/main.py`, `mem0/client/main.py`, tests/evaluation | explicit add/search/update/delete and evaluation mechanisms only; no Fleet service dependency |
| `plugins/agentskills` | `docs/specification.mdx`, `docs/client-implementation/adding-skills-support.mdx`, `docs/skill-creation/best-practices.mdx` | primary Skill format/progressive-disclosure evidence; Fleet adds trust, grants and receipts |
| `software/mcp-registry` | `pkg/api/v0/types.go`, `internal/service/registry_service.go`, `internal/validators`, publication/auth/version tests | primary MCP catalog/publication evidence; registry metadata is never install trust |
| `software/browser-use` | `browser_use/browser/session.py`, `browser_use/dom/enhanced_snapshot.py`, `browser_use/dom/views.py` | BrowserPane executor/recovery evidence only |
| `plugins/playwright-mcp` | `src`, accessibility-snapshot/action tools and tests | deterministic structured action seam; screenshots remain evidence, not selectors |
| `software/waku` | `src/driver/{mod,acp,claude,codex,opencode,pi}.rs`, `src/command_env.rs`, `src/model_catalog.rs`, `src/grok_session.rs` | CLI-host evidence only. Native protocol per vendor (Claude stream-json, Codex app-server, OpenCode HTTP, Pi RPC); ACP only where that *is* the long-lived session (Cursor, Grok). Login-shell PATH + last-good model cache. GPL-3.0-only forbids import. Do not take GPUI/app shell, persistence, or a second session store. Refines H6: ACP replaces *probes*, not native session transports Fleet already has (Claude SDK / Pi). |
| `software/deepseek-harness` | `README.md` ("everything is a plugin", Cordis); `packages/README.md` (39-group hierarchy, ~167 packages); `packages/AGENTS.md` (plugin export/injection rules); `.agents/notes/implemented/architecture/2026-06-13-capability-seams.md`; `2026-08-03-per-session-agent-presets.md`; `2026-08-09-cordis-event-walk-backstop.md`; `2026-07-29-package-regrouping.md`; `packages/{core,session,subagent,compaction,sandbox,acp,workflow,extensions}` | **Architecture verdict recorded as Decision E14 (2026-08-15): the plugin-first microkernel is rejected for Fleet; four bounded mechanisms are admitted as reference.** Admitted: the Service Definition / Service Provider / Consumer seam vocabulary; four per-session-composition invariants (created-with composition is durable and restored on resume, switching locked after the first turn, no process-global publish from a per-session composition, authoring is privileged while select/list stay ordinary); three enforcement rules (enforce in the operation that decides, publish at the commit point, one lifecycle controller per async operation). Rejected: Cordis as composition root, the 167-package split, property-proxy injection, and the live self-modification toolset (`packages/extensions`, contradicts C7 and the inspectability claim). Cost evidence Fleet must not ignore if it ever revisits: generated cordis catalog + independent AST walk + fail-closed exemption maps + per-package invariants exist because a plugin that fails to register is indistinguishable from one never written; measured ~1.31 MB / ~135 ms per composed agent with **no agent disposal path** in their host |
| `software/spec-kit` | `src/specify_cli`, `.spec-kit/templates`, `presets`, `bundles`, `prompts`, `docs` | Spec-Driven Development (SDD) contract evidence, executable specification generation, constitution/principles, task decomposition templates, and role presets/bundles |
| `software/OpenSandbox` | `specs/`, `server/`, `components/{ingress,egress}`, `sdks/`, `kubernetes/`, `cli/` | General-purpose sandbox platform, unified sandbox lifecycle/execution protocol, Docker/K8s/gVisor runtime adapters, network ingress/egress policy, and credential vault |
| `software/openchamber` | `electron/`, `web/`, `vscode/`, `mobile/`, `ui/` | Multi-surface workspace, Session Goals auto-continuation, multi-model parallel run & Fusion, guided changes walkthrough, and private relay remote pairing |
| `software/herdr` | `src/{app,client,server,ui,config}`, `tests/` | Rust native terminal multiplexer & background supervisor server, working/blocked/idle pane state detection, socket API / CLI orchestration, and persistent detach/reattach |
| `software/cindy` | `apps/{desktop,mobile}`, `packages/{maker-core,maker-cc-manager,maker-pi-manager,model-providers,device-link,browser-control-runtime,lizi-im}` | Multi-harness agent client, mid-task harness switching, device-link remote control, IM bridges (WeChat, Slack, Lizi), and local background automation |

## Newly cloned, not yet audited (recorded 2026-08-15)

These checkouts exist under `软件/software/` but have **no fixed HEAD, license verification, exact
symbols or comparison recorded**. They are `candidate` in the strict sense: a name in this section
is not evidence, and none of them may be cited as a reference in a matrix row, module packet or
spec until it passes the seven-item promotion record below. Recorded here so the gap is visible
rather than discovered later as an assumed audit.

| Checkout | Apparent domain (README-level only) | Which Fleet row would consume it |
|---|---|---|
| `AionCore` | companion core to the already-cited AionUi | EXEC-05 runtime adapters (H7 detection-vs-configuration already sourced from AionUi) |
| ~~`cindy`~~ | **audited — moved to the cross-check table**; source-level intake 2026-08-15 and 2026-09-10 | SYS-01, E15, R18 right workbench, R1 create flow, R14 remote |
| `omnigent` | self-described **meta-harness** over Claude Code/Codex/Cursor/OpenCode/Hermes/Pi, Python, alpha | EXEC-05 adapter contract; E13 second-kernel boundary evidence |
| `multica` | board-driven assignment to ~20 agent CLIs, self-hostable | EXEC-04/EXEC-13; the Board-versus-task-authority boundary (P10) |
| ~~`openchamber`~~ | **audited — moved to the cross-check table**; source-level intake 2026-08-15 and 2026-09-10 | SYS-02 remote office; P-54/P-60 review surfaces; R14 Git/PR; browser seam |
| `Kun` | local-first GUI **+ TUI over one shared runtime**, task/approval/plan/evidence continuity — **PolyForm Noncommercial licence** | Closest product-shape neighbour to Fleet. Licence forbids import; `PRODUCT_REFERENCE` ceiling at best |
| ~~`orca`~~, `herdr` | `orca` **audited — moved to the cross-check table** (2026-08-15, 2026-09-10); `herdr` audited 2026-08-15 | CORE-01/CORE-11 shell comparison; `orca` also serves usage/plan visibility and credential switching |
| `openclaw-latest`, `hermes-agent-latest`, `pi-mono-latest` | newer heads of already-pinned checkouts | re-pin decisions only; do not create a second standing reference |
| `kimi-code` | terminal coding agent CLI, MIT | EXEC-05 CLI-lane evidence (H6/H8 binary resolution) |
| `OpenSandbox` | sandbox/isolation platform, CNCF landscape entry | EXEC-08 / R18 sandbox gate — the strongest candidate to close that gate with evidence |
| `openpencil`, `open-design` | design-surface engines | CREATE-06 / E11; Penpot remains the pinned comparison |
| `OpenMontage`, `openreel-video`, `palmier-pro` | media/video production (palmier-pro is macOS-only, Apple-Silicon-only) | CREATE-02/CREATE-12; platform constraint is itself the finding for palmier-pro |
| `html-anything` | HTML/web artifact generation | CREATE-07 web artifact editor |
| `cc-switch`, `cockpit-tools` | provider/credential switching and operator tooling | E9a Settings → Model convergence; credential-path boundaries |
| `spec-kit` | GitHub's spec-driven development toolkit | process reference for `docs/specs/` discipline, **not** a product capability |

Intake order when the R-row that needs one activates — not before, and one at a time:
`OpenSandbox` (EXEC-08 gate) → `omnigent` + `cindy` (EXEC-05 adapter contract) → `openchamber` +
`multica` (SYS-02) → the design and media clusters at R10/R12. `Kun` is read for product shape
only and never for code.

## Source-level intake, 2026-08-15 (fourteen projects)

Read at source level, not from READMEs. Each row names the exact evidence and the Fleet row it
serves. **A licence column that forbids import is not a footnote** — it decides whether the entry is
a port target or a specification input. Fleet's F3 language rule stands: only TypeScript/JavaScript
under a permissive licence may be reworked locally; Rust, Go, Python and Swift are pattern reference
only, regardless of licence.

| Checkout | Licence / language | Exact evidence read | Verdict for Fleet |
|---|---|---|---|
| `software/cindy` | Apache-2.0 · TypeScript | `packages/model-providers/src/{types,registry,invocation,effortResolution,classification}.ts`; `packages/maker-core/src/{types/capabilities.ts, agents/base-agent.ts, agents/credential-mode.ts, session.ts}` | **The agent/model split is real and package-enforced**: `maker-core` and `model-providers` never import each other; `Provider.models[agent]` / `routing[agent]` fan one provider over many harnesses; `resolveRoute` is pure and reads no storage. Grounds Decision **E15**. Port candidates: `types/capabilities.ts` + the two-layer `NotSupportedError` guard (~330 lines, no deps); `invocation.ts` (its header records six duplicated implementations and a real security incident from divergent fallbacks — an unsupported permission mode must fall back to the **strictest**, never the scenario default). **Do not take** `session.ts` (84 KB) or `maker.ts` (47 KB): a second session/turn/permission authority with its own lease model; nor `agents/shared/auto-review.ts` (295 KB), a second approval-granting authority |
| `software/AionCore` | Apache-2.0 · **Rust** | `crates/aionui-session/src/backend/{mod,types,descriptor,cli_version}.rs`, `capability.rs` | Specification input for **E15**, not a port. `BackendConnection` + `SessionBackend` two-trait split; `CommandNotSupported`; `request_external_permission` defaults **Denied**; `CapabilityOrigin` + `effective_agent_capabilities` (constructed `false` beats stale ACP discovery); `mode_switch_effect: Immediate|NextTurn`; verified-CLI-version verdicts. **Do not take** the per-vendor connection modules (`claude_conn.rs` 352 KB, `codex_conn.rs` 472 KB) or its reducer/FSM — a second timeline |
| `software/omnigent` | Apache-2.0 · **Python** | `harness_capabilities.py`, `native_policy_hook.py`, `inner/executor.py`, `inner/policies.py`, `inner/sandbox.py`, `harness_plugins.py`, `designs/harness-plugin-interface.md` | Specification input for **E15** and **EXEC-08**. Declared capability with `None` = *no claim*, live-verified by a bench. One `POST /policies/evaluate` authority with per-harness hook translation, **fail-closed** with a bounded retry budget — six vendors, one permission path. Its `SandboxBackend.{resolve, wrap_launcher_argv, post_spawn}` is **daemonless and per-spawn** across bwrap/Seatbelt/JobObject, which disproves the premise that an OS sandbox needs a control plane. Its own Windows backend documents that it isolates nothing |
| `software/OpenSandbox` | Apache-2.0 · **Go + Python** | `components/execd/pkg/isolation/{isolator,bwrap,seccomp_gen,probe}.go`, `pkg/runtime/errors.go`, `pkg/web/router.go`, `configs/isolation.example.toml` | **Nothing adoptable.** bwrap-only, Linux-only (`bwrap_stub.go` is a no-op elsewhere); no Seatbelt, no Landlock, no gVisor in-tree — those are delegated to a container runtimeClass. Requires a resident in-sandbox daemon **plus** a FastAPI/Docker/K8s control plane. Useful only as vocabulary: `Capabilities`+`Probe` per-mode probing with a human diagnostic message, and the denial taxonomy in `runtime/errors.go`. **EXEC-08 recommendation: close as `NO_GAP`** on the evidence that Fleet's permission + process boundary already matches what these enforce on the platform Fleet ships; if ever reopened, the reference is omnigent's seam, not this |
| `software/AionUi` | Apache-2.0 · TypeScript | `tests/unit/acpConfigOptions.test.ts`, `tests/unit/settings/agentFilters.test.ts`, `docs/prds/conversations/acp/*.md`, `packages/desktop/src/index.ts` | Corrects **H7**'s citation (`ManagedAgent`, not `DetectedAgent` — see 02-DECISIONS). One portable invariant: a config write commits to UI state only when the backend **echoes** the value (`confirmation: 'observed'`); a bare `command_ack` must not mutate confirmed state. Its ACP PRDs enumerate per-backend behaviour differences as acceptance criteria. **Do not take** `ipcBridge.ts` (89 KB, a second IPC authority) or the `aioncore` subprocess pattern — it moves session state outside the one store |
| `software/Kun` | **PolyForm Noncommercial** · TypeScript | `src/renderer/src/AppShell.tsx`, `components/workbench/*`, `components/workbench-layout*.ts`, `store/chat-store.ts`, `kun/src/contracts/policy.ts`, `kun/src/server/approval-consent.ts` | **Licence forbids all import.** Pattern only — and it is the most valuable pattern found: a **155-line `AppShell`** that switches one route field over lazy children, a composition-root `Workbench` that owns nothing, ~40 single-purpose `useWorkbench*` controller hooks, layout as a hook with persistence isolated in one file, and a 190-line store that only spreads slice factories. This is the target shape for Fleet's S1 packet. Also: three product approval modes projected onto three raw axes with unknown combinations resolving to the **narrowest** mode, and approvals gated by a single-use HMAC consent token with the audit event written **before** the tool is released |
| `software/orca` | MIT · TypeScript | `config/scripts/check-max-lines-ratchet.mjs`, `config/max-lines-baseline.txt`, `.oxlintrc.json`, `src/renderer/src/store/{index,store-listener-census}.ts`, `AGENTS.md` | **The single most directly portable artefact in this intake.** A `max-lines` **ratchet**: the linter fails an over-budget file, so the only escape is a disable comment, and the script freezes the set of files holding one in a baseline that may only shrink. Budgets: 300 `.ts` / 400 `.tsx` / 800 tests. Counter-evidence that principles alone fail: Orca's own `App.tsx` is 2,831 lines opening with `/* eslint-disable max-lines */`, and slices reach 248 KB. Take the ratchet, not the code |
| `software/openchamber` | MIT · TypeScript | `packages/ui/src/sync/{DOCUMENTATION.md, event-reducer.ts, materialization.ts, session-event-router.ts}`, `stores/permissionStore.ts` | Port candidate: `permissionStore.ts` (207 lines) — a client **cache** of a server-owned policy fenced by `revision` + `generation` + `runtimeKey`, refusing to apply a snapshot older than the last applied. Its `sync/DOCUMENTATION.md` store-splitting rules are adoptable as review-checklist text. **Counter-evidence to itself**: `useUIStore.ts` 103 KB, `useConfigStore.ts` 170 KB, and a second layout host (`VSCodeLayout.tsx`) grown to serve a second surface — precisely Fleet's forbidden second shell, observed in the wild |
| `software/herdr` | Apache-2.0 · **Rust** | `src/app/runtime_mutations.rs`, `src/api/{mod,event_hub}.rs`, `src/events.rs`, `AGENTS.md` | Pattern only. One idea worth taking outright: **the local UI dispatches the same `Method` enum an external client would** — the TUI has no privileged mutation path — and `request_changes_ui` enumerates in one match everything that can move the UI. Also a bounded, sequence-numbered event ring clients resume from, and agent-state tiers separating an authoritative hook report from a heuristic screen detector from display-only metadata with a TTL |
| `software/open-design` | Apache-2.0 · TypeScript | `packages/contracts/src/api/{files,artifacts,live-artifacts}.ts`, `apps/web/src/edit-mode/{types,source-patches}.ts`, `artifacts/{version-origin,renderer-registry}.ts` | Best CREATE-07 port target. `ProjectFileVersion` carries `source: 'ai'|'manual'|'restore'`, `contentDigest`, `parentVersionId` and an `ArtifactOrigin` with `entrySurface` — Fleet's provenance need, in a contracts package whose only dependencies are `zod` and its own release helper. Preview isolation is correct: `sandbox="allow-scripts allow-downloads"` with **no** `allow-same-origin`, so the frame is opaque-origin and the host is the sole writer. **Do not take** `FileViewer.tsx` (776 KB) |
| `software/html-anything` | Apache-2.0 · TypeScript | `next/src/components/preview-pane.tsx`, `lib/history/db.ts`, `lib/extract-html.ts`, `lib/security/host-validation.ts` | **Negative finding, recorded so Fleet does not repeat it:** its preview iframe uses `sandbox="allow-scripts allow-same-origin"` on a `srcdoc` frame, which collapses the sandbox — agent-generated script inherits the app origin and can reach the parent window, local storage, the IndexedDB history and the loopback API routes. A Host-header allowlist mitigates DNS rebinding, not same-origin frame access. Fleet's CREATE-07 preview must follow open-design's pairing instead. Small port candidates: the IndexedDB version ring and `extractHtml`/`previewHtml` for streamed-LLM HTML recovery (delete its CDN `<script>` injection — local-first) |
| `software/openpencil` | MIT · **Rust** | `crates/op-editor-core/src/{command,command_batch,history,history_snapshot,edit_transaction}.rs` | Pattern only, and **the schema is not in the checkout**: `vendor/jian` is an empty submodule, so `jian_ops_schema::PenDocument` — the canonical `.op` document type — is absent and its licence unknown. Confirms **E11**'s shape (one DTO, one pre-validate-then-mutate apply path, an ordered batch landing as a single undo step, with an exhaustive `batchable()` gate that fails to compile on a new unclassified variant) but **rejects inverse-carrying change records** in favour of structurally-shared snapshots |
| `software/flowgram.ai` | MIT · TypeScript | `packages/runtime/{interface,js-core,nodejs}/package.json`, `runtime/interface/src/index.ts`, `canvas-engine/*/package.json`, `common/history/package.json` | **Narrows the existing MODULE_REFERENCE row.** The editor/runtime seam is real *only* for `runtime-interface` (one dependency: `zod`) and `runtime-js` (which keeps the contract as a devDependency and inlines types at build). The **document and history models are not liftable**: `@flowgram.ai/document` and `@flowgram.ai/history` both require `inversify` + `reflect-metadata` + the canvas-engine container. Take the packaging discipline, not the types |
| `software/openreel-video` | MIT · TypeScript (Electron) | `packages/core/src/export/{types,export-engine,encoder-backend,webcodecs-backend}.ts`, `device/export-estimator.ts`, `ai/cloud-job-types.ts` | **Best R11–R13 port target — same stack as Fleet.** `ExportEngine.exportVideo` is an `AsyncGenerator<ExportProgress, ExportResult>` polling an `AbortController` inside the frame loop; a closed error union (`CANCELLED | DISK_FULL | MEMORY_EXCEEDED | TIMEOUT | UNSUPPORTED_CODEC`) each carrying `phase` and `recoverable`; on abort the writable stream is discarded so no partial file survives; pre-flight clamping of resolution/frame-rate rather than freezing (**E8**); and an estimator returning `confidence: 'measured'|'estimated'|'rough'`. **Do not take** the bundled **GPL** ffmpeg fetch path — its own `DISTRIBUTION.md` records that as an unfinished legal decision — nor the prebuilt mac-only `.dylib` binaries |
| `software/palmier-pro` | **GPL-3.0** · **Swift**, macOS 26 + Apple Silicon only | `Sources/PalmierPro/Export/{ExportQueue,ExportService,ExportOptions}.swift`, `Models/MediaManifest.swift` | Platform lock confirmed. Specification input only, and the best **ORCH-05** reference: an explicit job status machine (`waiting/preparing/exporting/canceling/completed/failed/canceled`), enqueue returning a queue position and **refusing a duplicate destination**, state-aware cancel, and `finish()` always calling `startNext()` so the queue drains rather than stalls. Its staging idiom is the CREATE-12 rule Fleet should adopt: write to `.partial`, `defer` its removal, check cancellation, then atomically commit — and refuse to cancel once committed. `MediaManifestEntry` carries `MediaImportInput` **and** `GenerationInput` with references stored as **asset IDs**, making it a real source→operation→output graph |
| `software/OpenMontage` | **AGPL-3.0** · Python | `lib/{delivery_promise,media_profiles,events}.py`, `tools/{base_tool,cost_tracker}.py` | **AGPL: import is blocked.** One idea worth re-specifying for CREATE-12: a *delivery promise* that locks what a render claims and refuses a silent downgrade (`still_fallback_allowed: false`, `min_motion_ratio`, and a validator that reports "these are animated slides which do not count as motion"). Also a budget state machine of estimate → reserve → reconcile → refund. It has **no cancellable job**, only stage checkpoints |
| `software/cc-switch` | MIT · TypeScript + **Rust** | `src/config/{piThinkingProfiles,piModelCatalog}.ts`, `src/types.ts` | Direct **E9a** port target (TypeScript half only). A tri-state reasoning-profile map with the semantics documented in source: **key absent = the model does not support that level; key → `null` = the level exists but sends no wire value; key → string = the wire value; `{}` is reserved for the user's explicit "use provider defaults"**. Plus `CodexChatReasoning { thinkingParam, effortParam, effortValueMode, outputFormat }` declaring *how* reasoning is wired per provider, and `AppConfig { providers, current }` as a single-authority shape. **Do not take** `src-tauri/**` — a full MITM LLM proxy — nor `UsageScript`, which executes user-supplied JS to scrape provider billing pages |
| `software/cockpit-tools` | **CC-BY-NC-SA-4.0** · TypeScript + Rust | `src/services/codexModelProviderService.ts`, `CONTEXT.md`, `src-tauri/Cargo.toml` (licence) | **NonCommercial + ShareAlike; no root LICENSE file** — licence found only in `Cargo.toml` and the README. Nothing may be ported or derived. Two ideas to re-specify independently if wanted: N **named** API keys per connection, and a reference-count check before deleting a connection. **Do not take** its 16-IDE automated check-in/wake-up surface — automating vendor accounts is barred by F1 |
| `software/spec-kit` | MIT · Python + Markdown | `templates/commands/{analyze,converge}.md`, `templates/checklist-template.md`, `templates/spec-template.md`, `scripts/bash/check-prerequisites.sh` | **Process reference only — never a Fleet product capability.** One mechanism Fleet's spec discipline lacks: `analyze.md` is a *strictly read-only* cross-artifact pass that builds a requirements inventory keyed on stable IDs, maps every task to a requirement, and emits a coverage table with counts of ambiguity and critical issues — where a constitution conflict is automatically critical and "requires adjustment of the spec, plan, or tasks — not dilution, reinterpretation, or silent ignoring". Also: checklist markers are a gate the implement step may **read but not write** |

## Source-level intake, 2026-09-10 (owner-directed: product surfaces and capability ownership)

Read at owner direction against the areas Fleet expresses badly. Disjoint from the 2026-08-15
intake above, which covered these same three checkouts on different subtrees — nothing here
restates a row already recorded there. Same rules: a licence that forbids import decides port
target versus specification input, and F3 stands (only permissively-licensed TypeScript may be
reworked locally).

| Checkout | Licence / language | Exact evidence read | Verdict for Fleet |
|---|---|---|---|
| `software/cindy` | Apache-2.0 · docs | `docs/product-rules/core-product-principles.md` §§1–8; `docs/dev-rules/maker-core-and-agent-behavior.md` §2 | **Specification input, and the highest-value row in this intake.** Names the layer Fleet has no document for: **Core** carries only what the host must provide for everyone (shell, agent/model connection, session and task lifecycle, Skill/plugin runtime + permission + isolation, multi-device continuity, marketplace mechanism); a **Skill** describes *how work is done*; a **plugin** carries rich interaction. §6 「Core 永远保持纯粹」 bars any personal/team/industry workflow, data connection or interaction surface from Core, behind four conjunctive conditions, and defaults an unclear boundary to "prove it as a Skill or plugin first". §4.1 and §7 forbid replacing structured, operable results with long non-interactive LLM text. `maker-core` §2 requires branching, validation, state machines, orchestration, permission control, error handling, retry and fallback to live in **code**, with prompt carrying only what needs language. Grounds the open ruling recorded in `02-DECISIONS.md` on expert-kit layer ownership |
| `software/cindy` | Apache-2.0 · TypeScript | `apps/desktop/src/main/cindy-brain/skillSlot.ts` (532 lines); `main/maker-host/shared-global-skills.ts` (516) | **The runtime Fleet's expert kit is missing.** A declared skill reaches the agent as a link in the shared skill root pointing at an **approved snapshot** (`skill-snapshots/<id>/<revision>/<dir>`), never at the mutable install directory, then fanned into the harness's own skill directory. Invariant: 「确认框看到的 = Agent 读到的」 — manifest `skill.items` name/description must be byte-identical to the package's `SKILL.md` frontmatter, and `checkSkillMdConsistency` is the single judge shared by packing and loading, so the two ends cannot drift. Reconciliation is a single idempotent expected-vs-actual pass, so a crash leaves dangling links that self-heal next round; only links whose realpath falls inside one of two managed roots are ever removed. **Port the mechanism, not the file** — it is Node/Electron-specific and assumes Cindy's ghost-plugin model |
| `software/cindy` | Apache-2.0 · TypeScript | `renderer/router.tsx` (170); `components/settings/SettingsView.tsx` (619, 45 `*Section.tsx`); `features/skillhub/` (14,037) | **Navigation discipline, directly answering the owner's "no second-level pages".** Settings is one route with the tab in `?tab=`, composing 45 section components — not 45 detail routes; `billing` is a redirect into it. SkillHub market removed both its full-screen detail page and its separate management page in favour of a floating panel inside the list, and **kept every retired route as a redirect to the list** rather than a 404. That pairing — delete the page, keep the link resolving — is the concrete form of the owner's standing 「简化不等于删除」 rule. Store completeness for comparison: category filter, sort (trending/downloads/latest/created), in-list preview, publish, review verdict, security scan, visibility tiers, team permissions; `components/InstallTargetPicker.tsx` specifies install targets as global (shared by both engines), current project, or chosen directory |
| `software/cindy` | Apache-2.0 · TypeScript | `features/right-sidebar/` (47,609) — `registry.ts`, `RightSidebarShell.tsx`, `plugins/` | **Port target for the R18 modular right workbench.** Tabs render through `getTabKind(kind).TabBody` from an import-side-effect registry; adding a built-in is one line. Every open tab **stays mounted** and visibility switches by CSS alone, so changing tabs cannot lose a webview or editor's state. Third-party plugins register and unregister at runtime as `ghost:<id>` kinds following the installed manifest, with a version-counter subscription so the "+" menu and empty state notice. Nine built-ins: background tasks, file browser, iOS simulator, Orca workers, resource usage, review, subagents, terminal, web browser. The sidebar also detaches into its own window as a route peer to the main layout |
| `software/cindy` | Apache-2.0 · TypeScript | `features/cc-agent/NewMakerDraftRoute.tsx`; `components/new-chat/` (34,448) | **Answers R1's create-flow question.** `/cc-agent/new` is a transient draft with **no backend session** — creation happens on Send. One surface produces both kinds of work: `workingDir=null` **is** the conversation case, folder chosen is the project case, and the route deliberately draws neither a global sidebar nor a project selector. The retired `/new-dialogue` entry redirects here. `lastByVendor` restores each vendor's last model, effort and permission mode across switches; a vendor auth gate runs before send and routes to settings instead of failing at request time; the worktree path creates the session first, then the worktree in background, returning the message to that session's composer draft on failure |
| `software/cindy` | Apache-2.0 · docs | `docs/dev-rules/remote-and-mobile-adaptation.md` | **Adopt the rule now, ahead of R14.** Three remote shapes (SSH workspace via `maker-remote-ssh` + `remote-file-service`; device-link remote control with an IPC allowlist; mobile as a pure control client). Its governing invariant is **failure radius**: failure domains rank as one request / one peer's link / the whole relay connection / relay aggregate backpressure, and a recovery action may not act at a wider radius than the failure, with anything wider requiring a written reason that survives "what happens when one phone sleeps?". Backed by case law — escalating "reliable retry exhausted" into tearing down the whole relay connection passed wire-compat, unit tests and several reviews, then in production one sleeping phone repeatedly knocked every device on the account offline. Records that protocol compatibility, allowlists and unit tests are all immune to this class |
| `software/orca` | MIT · TypeScript | `src/main/rate-limits/` (9,582); `src/main/{claude,codex}-usage/`; `src/shared/{claude-usage-types,usage-percentage-display,status-bar-usage-mode}.ts` | **Port target — answers "how much of my plan is left", which Fleet cannot.** Usage is read from the CLI's own transcript files and plan limits from the CLI's own stored credentials (keychain, auth files, and where no API exists a hidden PTY whose output is parsed) across eight vendors. Model worth taking wholesale: `scope: 'orca' \| 'all'` separates usage this product caused from all usage on the machine; `scanState` makes the scan observable including `lastScanError`; `cacheReuseRate` and `zeroCacheReadTurns` are first-class summary fields (matching H12); `estimatedCostUsd` is nullable so unknown pricing shows as unknown; attribution is per worktree and per automation run. Display rules carry their own defects as tests: round the used value **before** taking the remaining complement, and invalid provider data must never render as 100% remaining |
| `software/orca` | MIT · TypeScript | `src/main/claude-accounts/{managed-auth-path,runtime-selection}.ts`; `src/main/codex-accounts/` | **Port target — the credential-switching design Fleet lacks.** Switching an account is selecting a pointer, never overwriting a token. Each account owns `<userData>/claude-accounts/<accountId>/auth/`, proved to be the app's by a marker file containing the account id created `0o600` with an exclusive `wx` flag; every read and write resolves the real path and refuses a symlink, a path outside the managed root, the wrong depth, or a mismatched account id, and writes atomically at `0600`. "Active" is a per-runtime pointer (`activeClaudeManagedAccountIdsByRuntime`: one for host, one per WSL distro). Because inactive accounts keep their own directories, their remaining quota is fetchable — so the user sees which account has headroom **before** switching. Alternative design in `software/cc-switch` (MIT): rewrite the CLI's config plus a local proxy transforming between responses/chat/codex-chat shapes — larger blast radius, already recorded above as "do not take `src-tauri/**`" |
| `software/openchamber` | MIT · JavaScript | `packages/web/server/lib/github/{pr-status,auth,device-flow,gh-cli-credential,rate-limit}.js` + its `DOCUMENTATION.md` | **Port target for R14's Git/PR half.** One resolver answers the product question — which PR belongs to this local branch — searching across remotes, forks and upstreams, then enriching with checks, mergeability and permissions; the result is cached once and shared between the session sidebar badge and the full Git view, so both read one entry. Auth is multi-account with an explicit `activateGitHubAuth(accountId)` and an OAuth **device flow** (no client secret in a desktop app); `gh-cli-credential.js` reuses the credentials the user's existing `gh` CLI already holds rather than asking for a pasted token. Storage is `0600` with atomic writes; client id, scopes and account id each have a documented resolution order |
| `software/openchamber` | MIT · JavaScript + TypeScript | `packages/web/server/lib/browser-control/{broker,routes}.js` + its `DOCUMENTATION.md`; `packages/ui/src/lib/browser/` | **Specification input for the browser seam, and the clearest statement of the pattern this whole intake keeps finding.** The server can never act on a page; it publishes one action and waits. Invariants, each naming the failure it prevents: **capability belongs to the connection, not to configuration** — a client declares it can drive a page by opening its event stream with `browser=1`, which only a Chromium host does, so there is no setting to enable and no restart to remember; exactly one client performs a request, claimed over a separate endpoint because deciding by whose result arrives first is too late — by then each has already clicked; nobody listening is answered immediately with a 503 describing the environment, because a blocked wait followed by a timeout cannot be told apart from a hung page; a client that accepted and vanished still times out, because assuming success reports an interaction that never happened. The UI half adds page annotation (overlay, screenshot, prompt, session) so a human can point at the page and hand that to the agent, plus dev-server discovery, dev tunnel and crash recovery |
| `software/craft-agents-oss` | Apache-2.0 · TypeScript | v0.11.2 → v0.12.0, 97 files / +1751 −545 (bun.lock +560 of it) | **Five bounded REUSE candidates, two unreviewed releases.** `session-tools-core/handlers/archive-session.ts` + `server-core/sessions/archive-guards.ts` make archive an agent-callable tool with guards rather than a UI-only action (R1 archive/labels). `shared/src/mcp/proxy-tool-name.ts` de-collides tool names across MCP servers — a prerequisite for any kit that projects a tool subset. `app-shell/inherited-filter-params.ts` gives sidebar filter inheritance, which is R1's "filters are states of one list". `server-core/bootstrap/lock-identity.ts` settles single-instance identity at bootstrap. Plus a startup migration in `shared/src/config/storage.ts`. No new authority in any of them |

## Owner-provided UI captures, 2026-09-10 (QoderWork CN · TRAE SOLO CN) — `EVIDENCE_ONLY`

**Licence status decides what these are.** Both are proprietary commercial desktop applications,
installed on the owner's own machine and captured there at owner direction. There is no licence
permitting reuse of their code or their visual design. They are therefore `EVIDENCE_ONLY` under the
same ceiling as `Kun` and `cockpit-tools`: **information architecture and interaction patterns may
be read and re-specified in Fleet's own terms; markup, styles, assets and visual design may not be
copied, and Fleet must not be made to look like either product.** Nothing in the captures is a port
target.

Captures live at `/Volumes/AIGC/Paper Clone Outputs/app-{qoderwork-cn,trae-work-cn}-2026-09-10T…/`
— renderer DOM over Electron CDP, with recovered stylesheets, an interaction graph, and a
reconstruction. The Qoder capture records 18,285 nodes, 488 localized materials, 4 stylesheets, 87
authored motion rules, 26 hover panels and a causality journal of 14 interactions / 64 reveals.

| Observation | Where | What Fleet does today, and the reading |
|---|---|---|
| **Three-tier token system** — palette (`--color-amber-500`, oklch) → semantic (`--color-bg-{base,layout,container,elevated,highlight,highlight-hover,mask,spotlight}`, `--color-text-{,secondary,tertiary,quaternary}`, `--color-fill-*`, `--color-border-{,secondary,tertiary}`, and a full family per status: `{base,hover,active,bg,bg-hover,border,border-hover,text}`) → component (`--agents-content-area-{bg,gap,radius}`). Four themes ship as alternate values on the semantic layer only | qoder `assets/styles/globals-*.css` (298 KB) | Fleet's `--spacing: .25rem` matches exactly; the structure does not. Fleet has one `--background` with `--card: var(--background)` — **card and page are literally the same value, so there is no elevation** — and expresses depth as `foreground` at an opacity step (UI-SPEC §1/§3). That is a defensible, simpler system and the six-colour rule is enforced by a guard after real violations (H34). The gap worth taking seriously is **surface elevation**: Fleet nests shell → workbench → panel → popover, and with one background token each layer either reads identically or someone reaches for a literal — which is exactly the H34 violation history. Adding elevation is a UI-SPEC authority change and is **not** taken here |
| **Kit cards state the payload as counts** — "8 个技能 · 3 个数据连接 · v1.1.1" in the card footer — and label the **action**, not the state: an installed kit's button reads 「定制此套件」, never "installed" | qoder 专家套件 page | Adopted in part (`fd47db6ae`): the kit payload block now reports resolved counts instead of a verdict over an empty array. The card/market layout is a later slice |
| **Market and installed are two counted tabs in one page** — 「套件广场 20 · 已安装 1」 — with horizontal category chips and a `>` overflow scroller, not a dropdown and not a second route | qoder | Fleet's `kit-gallery.ts` has `browseKits`/`admitInstall` written with no surface at all. This is the shape when one is built |
| **The authoring entry sits inside the marketplace banner** — 「+ 让 QoderWork 帮我创建」 — so creating a kit is an offer at the moment of browsing, not a separate flow | qoder | Fleet has no authoring flow. `skills/plugin-creator/SKILL.md` (read 2026-09-10, recorded above) is the conversational contract behind that button |
| **Left nav is flat and the market is one page.** Qoder: 扩展 → {专家套件, 技能, 连接器} as three peers. Trae: 新建任务 / 插件市场 / 模板库 / 自动化 / 办公助理 / 我的文件, no nesting, with a Work / Code / Design mode switcher above it | both | Corroborates the routing discipline already recorded from Cindy's source: settings is one route with `?tab=`, retired detail routes redirect to the list rather than 404 |
| **Trae's market is a conventional app store** — featured carousel, category sections, 3-column compact rows, per-row 「+ 安装」 / 「💬 使用」 | trae | Weaker for Fleet's purpose than Qoder's: it never says what an item carries. Recorded so the comparison is not re-run |

**What this does not license.** Fleet's visual identity, colour count, spacing ladder and motion
rules remain `UI-SPEC.md` and `design-library/22-motion.md`. Any change to the token structure is an
owner decision against that authority, not something an intake row can settle.

## Video candidate reality check

The owner's recovered list is valuable and remains intact in
[`video/00-CANDIDATE-INVENTORY.md`](video/00-CANDIDATE-INVENTORY.md). `opencut-classic`, current
`opencut` and `hyperframes` now exist as local video checkouts. The other names are **uncloned candidates**: no
commit, source path, license or implementation evidence has been established locally. Their rows
must not be used as “primary reference” claims until a temporary checkout passes the playbook.

| Candidate family | Local evidence | Current safe use |
|---|---|---|
| OpenCut | `software/opencut` @ `5e0696bc9b92`, MIT | architecture direction only; current editor mechanisms are incomplete |
| opencut-classic | `software/opencut-classic` @ `cf5e79e91914`, MIT text present | `MODULE_REFERENCE` candidate for timeline mechanisms; archived status and exact symbols still require admission-v2 |
| React Video Editor, Cutia, OpenReel Video | no checkout | candidate only |
| Shotcut, LosslessCut | no checkout | product/mechanism candidate only |
| Remotion | no checkout | source-available/license-gated product evidence only |
| HyperFrames | `plugins/hyperframes` @ `6ad738b580ad`, Apache-2.0 | `MODULE_REFERENCE` candidate for deterministic programmatic rendering and cancellation |
| Palmier Pro, waooowaoo, Toonflow, Storyboard | no checkout | product behavior candidate only |
| OpenMontage, video-use | no checkout | Agent-operation candidate only |
| claude-real-video, AutoClip, BibiGPT-v1, BiliNote | no checkout | analysis/highlight/knowledge candidate only |
| pyvideotrans, baocut | no checkout | caption/translation candidate only |
| ChatCut | commercial product, no source checkout | `PRODUCT_REFERENCE` only; never a code reference |

### Locally inspectable video mechanisms (not yet admitted)

The following paths are evidence targets, not a completed approval. They are recorded so the
matching R10–R13 review can be reproducible instead of relying on project names:

| Checkout | Exact evidence targets at the pinned HEAD | What remains unproved |
|---|---|---|
| `software/opencut-classic` @ `cf5e79e91914` | `apps/web/src/timeline/timeline-store.ts`, `apps/web/src/timeline/types.ts`, `apps/web/src/timeline/update-pipeline.ts`, `apps/web/src/commands/timeline/element/split-elements.ts`, `apps/web/src/commands/timeline/track/add-track.ts`, `apps/web/src/services/storage/service.ts`, `apps/web/src/services/renderer/scene-exporter.ts` | caller/error/recovery chain, Fleet gap and same-task comparison, and whether the archived architecture can be isolated without importing its project authority |
| `plugins/xyflow` @ `dd308ab401d4` | `packages/react/src/store/index.ts`, `packages/react/src/hooks/useVisibleNodeIds.ts`, `packages/react/src/components/NodeWrapper/index.tsx`, `packages/react/src/additional-components/NodeToolbar/NodeToolbar.tsx` | rich-card Electron benchmark, business-state seam, and admission-v2 review |

## Named external evidence without a local checkout

These names appear in the product matrix or capability notes but are not present under
`源码参考/software` or `源码参考/plugins`. They can support a product-behavior comparison only;
they have no immutable local source evidence and must not be described as admitted source
references.

| Name | Safe status | Missing before any promotion |
|---|---|---|
| LobeHub product | `PRODUCT_REFERENCE` candidate | dated product-flow capture, same-task comparison, and a clear TipTap local-improvement test |
| `lobehub/lobe-editor` | `MODULE_REFERENCE` candidate | fixed checkout, license/NOTICE, exact editor symbols and TipTap comparison |
| FlowGram | `software/flowgram.ai` source-reviewed candidate | editor/executor boundary is inspectable; same-task Electron comparison still required |
| MiniMax Hub / Hilo / TRAEWork analyses | `EVIDENCE_ONLY` | primary source or reproducible capture; public-bundle observations cannot prove source mechanisms |
| ChatCut | `PRODUCT_REFERENCE` candidate | reproducible product capture and explicit separation of observed behavior from vendor claims |
| Remotion | candidate; license gate | fixed checkout and current license terms for target distribution |
| Unabyss | `PRODUCT_REFERENCE` only | product behavior can inform source/structure/grant/freshness decomposition; no public source, no MCP-first internal architecture, and no hosted dependency admission |

## Required promotion record

Before any candidate is promoted in the product matrix or a module packet, add a row to the
admission record with all of the following:

1. repository URL, immutable commit and checkout path;
2. exact license/NOTICE and whether the target distribution is permitted;
3. exact files, symbols, caller and tests that prove the mechanism;
4. Fleet/Craft gap and at least one same-task alternative;
5. the mechanism-to-seam mapping and why a small local change cannot already surpass it;
6. failure, cancellation, recovery and deletion implications;
7. a dated Grok admission-v2 result and an owner-visible decision ID.

Until all seven are present, use `candidate`, `INSUFFICIENT_COMPARISON` or `EVIDENCE_ONLY` as
appropriate. A row in `CAPABILITY-REFERENCE-MAP.md` or `11-PRODUCT-MATRIX.md` is a pointer, not
evidence.

## Owner-provided product reverse-analysis reports (EVIDENCE_ONLY)

These are analysis documents, not local checkouts: no commit, no license to import, no code
copying. They ground product/mechanism decisions only.

| Report | Subject | Status | Grounds consumed by |
|---|---|---|---|
| [`canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md`](canvas/01-MAYI-CANVAS-PRODUCT-REVERSE.md) | Mayi Canvas v3.4.4 — custom DOM+translate3d+SVG infinite canvas; node/port/connection system; performance mode, workers, object pools; local HTTP agent bridge with self-describing capabilities, allowlisted/batch actions, and token; provider proxy layer; project ZIP format | `EVIDENCE_ONLY` | Decision E5a (DOM-family + in-family fallback), `13-ORCHESTRATION.md` §§4.5/7, matrix canvas/AIGC rows |
| [`plugins/00-MINIMAX-HUB-PLUGIN-STACK.md`](plugins/00-MINIMAX-HUB-PLUGIN-STACK.md) | MiniMax Hub 1.1.1 six official plugins — iframe sandbox, postMessage protocol-v2, `window.hub` SDK, BlobRef upload, placeholder→dag→insert with permanent IDs, three implementation patterns, host requirements | `EVIDENCE_ONLY` | `13-ORCHESTRATION.md` §§3/7 module registration, matrix plugins/extensions rows, R15 SYS-08 packet |
