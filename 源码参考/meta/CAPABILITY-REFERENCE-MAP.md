# Source Capability Reference Map

> Cross-check facts in
> [`../../docs/references/REFERENCE-REGISTRY.md`](../../docs/references/REFERENCE-REGISTRY.md).
> “Primary” and “secondary” mean comparison order, not admission. Except for the Craft baseline,
> no project is formal until admission-v2 passes.

This map answers one question: after confirming a real Craft gap, which source should be read first?
Product authority, status and code entries remain in
[`../../docs/08-CRAFT-CAPABILITY-MAP.md`](../../docs/08-CRAFT-CAPABILITY-MAP.md). High-risk
file/symbol evidence is in
[`../../docs/references/ADMISSION-V2-AUDIT.md`](../../docs/references/ADMISSION-V2-AUDIT.md).

## Rules

- Confirm the `docs/08` row and Craft entry first, then the ACTIVE R0–R18 row.
- One primary reference per capability; secondary references must prove a different mechanism.
- Checkouts are read-only and rebuildable. Never develop or preserve patches inside them.
- Read external source only for a real gap in the current loop.
- Absorption is limited to mechanism evidence, a compatibility adapter, license-permitted local
  reuse, or an optional degradable dependency. Never copy a product shell.
- Verdicts are `FORMAL_REFERENCE | MODULE_REFERENCE | LOCAL_IMPROVEMENT | EVIDENCE_ONLY | REJECT`;
  missing horizontal comparison yields `INSUFFICIENT_COMPARISON`.

## Consumption by development order

| Order | Craft/Fleet path first | External evidence only when a gap remains |
|---|---|---|
| R0–R2 | Craft fork, Workspace/Session/settings/service paths | Craft official mirror; no external shell |
| TE1/R3 | Claude/Pi backends, prompt/tool assembly, UsageTracker, Sources, BrowserPane, TipTap | `pi-mono`; Databricks as experiment hypothesis; OpenHands only as weight/isolation contrast |
| R4–R6 | PreToolUse, session tools, TaskRunner, Session/Task tree | OpenCode and Codex protocol/Session mechanisms; OpenHands only for executor edges |
| R7 | Craft shell/views + R5 Artifact projection | xyflow first; FlowGram for editor seams; tldraw comparison-only with license gate |
| R8–R9 | TaskRunner, Session evidence, Workspace knowledge | FlowGram for editor/runtime separation; Mem0 and memory papers for operations/evaluation only |
| R10 | TipTap, previews, shell + R4/R5/R7 | Penpot transactional model; owner-provided design observations as product evidence |
| R11–R13 | Providers, files, previews, UsageTracker + landed Job/Artifact seams | OpenCut classic for NLE; HyperFrames for programmatic render; current OpenCut direction only |
| R14 | Craft transport, messaging, settings, TaskRunner, Git/process | Codex; Hermes for channels; OpenClaw for security/node comparison |
| R15 | Craft Skills/Sources/MCP/credentials/settings | Agent Skills specification and official MCP Registry; vendor markets as product evidence only |
| R16 | BrowserPane/CDP/file/shell/API/remote/permission | Playwright MCP structured actions; Browser Use lifecycle/snapshots; Hermes/OpenClaw only for unique security comparisons |
| R17 | Provider seam, UsageTracker, Task/Session traces | local measured policy mechanisms; otherwise `NO_GAP` |
| R18 | Craft process/isolation/shell/settings | OpenHands and retained docking primitives; implement-or-`NO_GAP` individually |

## Capability map

| Fleet capability | Primary reference | Secondary reference | Allowed absorption boundary |
|---|---|---|---|
| Craft product/interaction baseline | `software/craft-agents-oss-v0.10.5` pinned v0.10.5 | `software/craft-agents-oss` pinned v0.11.1 for selective updates | Preserve v0.10.5 product behavior; admit independent fixes or bounded backend mechanisms from v0.11.1 only after comparison; never recreate Session, permission, timeline, Task, settings, Workspace, credentials or Job authority |
| Craft/Pi harness and effective prompt/tool projection | Craft checkout + pinned `software/pi-mono` | Databricks same-model harness result; OpenHands weight contrast | TE1/R3 compare current-full and bounded Pi-light inside the existing backend; absorb narrow prompt/tool/extension mechanisms, never another kernel |
| Multi CLI/API runtimes | Craft provider/runtime seams | Codex, OpenHands | Adapter capability negotiation and process lifecycle; preserve one Task/credential/executor authority and label usage/quotas exact, estimated or unknown |
| Degradable external execution environment | OpenHands | Craft BrowserPane/process paths | R16/R18 executor interface, capability probe, events, cancel/recovery; reuse Craft permissions, Session and Job paths |
| Sandbox lifecycle | OpenHands | Craft isolation paths | create/exec/cancel/reclaim/error normalization through Fleet policy and evidence |
| Worktree isolation | Craft Git/process paths | Codex | occupancy, base-drift preflight, leases and cleanup; never import a Task system or run reset/clean outside TaskRunner-owned directories |
| Plan/execution separation | Fleet TaskBrief/RunReport | Codex | Plan artifact, execution contract and report; hierarchy must not become fixed token tax |
| Queue, isolation and CLI dispatch | Craft TaskRunner | Codex, OpenHands | capacity, attempt identity, stale-result discard, cancellation and evidence; extend TaskRunner/SessionEvents only |
| Goal integrity and drift control | Fleet TaskContract | Codex/OpenHands as partial comparison | Bind events to attempt/Session/criterion, invalidate stale attempts and halt after two no-progress mutations |
| Agent graph, mailbox and protocol | Codex | OpenClaw | Sparse protocol/storage evidence mapped into existing Fleet state |
| Child-agent lifecycle and Session Todo | OpenCode | Codex | Parent/child Session, resumable task ID, foreground/background transition, notification, depth, narrowed permission and cancel cascade; Fleet supplies TaskBrief, leases and team budget |
| Messaging channels | Hermes | OpenClaw | Channel adapter, routing and reconnect; credentials stay in Fleet and channel failure never blocks local core |
| Context/token optimization | Craft/Pi measured comparison | OpenCode, Repomix, Agent Skills | Preserve TaskContract/criterion/evidence index; exact/estimated/unknown usage; switchable measured optimizers; no semantic answer cache or second ledger |
| Reviewed memory operations | Fleet Session evidence | Mem0 plus LongMemEval/MemoryAgentBench | Explicit propose/review/retrieve/delete and evaluation only; never import a server, global store or hidden write-back |
| File/document ingestion | MarkItDown | — | Conversion adapter only; native bytes and permissions remain Fleet-owned |
| Document editing and agent collaboration | LobeHub product-flow candidate | Craft TipTap, lobe-editor candidate | Compare document tree/edit/preview/chat/agent loop; extend TipTap first and never add a second Markdown editor |
| Minimal Skill structure | Agent Skills specification | Craft Skills | Narrow, readable Skill organization with progressive disclosure |
| Open Skill format and discovery | Agent Skills specification | Craft Skills | `SKILL.md` metadata and progressive disclosure; Fleet owns grants, activation and receipts |
| MCP catalog/publication | official MCP Registry | Craft MCP settings/client | Namespace, typed metadata, validation and versions through an adapter; registry listing is not trust |
| Design documents and canvas | Penpot | tldraw | Domain model, collaboration and canvas mechanisms; never copy the product shell |
| AI design editing | Fleet local improvement over Penpot transactions | owner-provided Open Design observations | Structured edit actions at existing tool/source seams; no second editor authority |
| Node graph | xyflow (`INSUFFICIENT_COMPARISON`) | tldraw comparison-only | Nodes/edges/viewport interaction; business state remains Fleet-owned |
| Desktop multi-panel layout | dockview | react-resizable-panels, react-rnd | Dock/split/resize primitives under Fleet layout tokens and settings authority |
| Video timeline/NLE | archived OpenCut classic candidate | current OpenCut direction | Track/snap/edit/export mechanisms; never import the OpenCut shell |
| Programmatic video rendering | HyperFrames | current OpenCut direction; Remotion license-gated evidence | Deterministic composition, cancellable rendering and failure types behind Fleet Job/Artifact seams |
| Governed browser executor | Playwright MCP | Browser Use | Structured snapshot/action and lifecycle/recovery adapters behind BrowserPane; screenshots are evidence, not selectors |
| AI video generation | Fleet provider adapters | HyperFrames render seam | Generation/material flow; provider remains replaceable and degradable |

## LobeHub boundary

LobeHub is an owner-requested product-flow comparison, not an exemption from source audit. Review
the product chain separately from the editor kernel. Craft TipTap remains the editor authority. If
slash, mention, upload, table, block or agent-edit behavior can be matched by a bounded TipTap
extension, record `LOCAL_IMPROVEMENT` and do not retain a second editor. Verify product and editor
licenses at fixed commits separately.

## OpenCode evidence boundary (`c69abee0c732`, pending admission-v2)

Useful mechanisms to map into Craft/Fleet:

- `parentID` child Sessions, resumable `task_id`, shared foreground/background result path and cancel cascade;
- inherited deny/external-directory restrictions, disabled recursive task/Todo tools and depth limit;
- Session-local ordered Todo projection with events, never a second Task system;
- provider-step input/output/reasoning/cache usage and Decimal cost accumulation;
- usage-aware compaction, recent-tail preservation, old tool-output pruning and repeated-tool loop checks.

Do not copy these limitations:

- free-text task fields have no stable acceptance IDs, path policy, ArtifactRef, lease, criterion or team budget;
- “trust sub-agent output” is not a provider-neutral trust protocol;
- `BackgroundJob` is process-local and restart-lossy, so it cannot become Fleet's durable Job authority;
- identical-call doom-loop detection can be bypassed by changing the command and is weaker than criterion progress;
- chars/4 is only an estimate; billing and hard limits prefer provider usage, and parent cost does not
  automatically include child Sessions.

## Explicitly rejected standing references

- Another coding workbench, control plane, Session/Task/permission/memory system.
- Vendor cloud/account/telemetry/database as a Fleet core prerequisite.
- Universal permanent memory, semantic answer cache or invisible result-changing compression.
- External browser automation replacing BrowserPane.
- Superpowers-style mandatory phases/reports/plan-first process.
- Any reference selected only by stars, README, screenshot, test name or model marketing.

Retention and removal rules: [`RETENTION.md`](RETENTION.md). Operating process:
[`PLAYBOOK.md`](PLAYBOOK.md). Machine state: [`REVIEWED-HEADS.tsv`](REVIEWED-HEADS.tsv).
