# 02 — Decisions

> The promoted product/architecture decisions that still hold. This is the first place to check
> whether a design question is already answered.
>
> **Provenance:** these are carried forward as *substance* from the previous project's decision
> ledger (the durable judgments that survived review), re-expressed without the retired Wave / Loop /
> Gate machinery. Reversed, stale, or purely-process entries were dropped. A current owner request
> always outranks any entry here.
>
> **Write rule:** add an entry only when a durable direction is decided, with a date. When a decision
> changes, edit the entry in place and note the change — do not keep a diary of dead states.

## A. Product shape

- **P1 — Fleet is an AI work platform, not a chat tool.** Human owns the top ~10% of judgment and the
  bottom ~10% of common-sense guardrails; agents execute the middle ~80%. (2026-07-08)
- **P2 — Build on and simplify Craft v0.11; never fork a second app.** The preserved v0.10.5 tree is a
  behavior/design *reference* only, never a second base to merge or copy wholesale. (2026-07-08)
- **P3 — Retain the Craft shell.** The spatial canvas is a first-class *project surface* hosted inside
  the shell, not a replacement shell. (2026-07-09)
- **P4 — Fleet is open/free local software.** No Fleet account, login, or subscription in the active
  product. Remove/avoid account/upgrade flows for Fleet itself. (2026-07-08)
- **P5 — UI baseline is clean Craft v0.11; default work is simplify/optimize, not invent.** New
  surfaces only when a capability must be visible and no Craft surface can host it. (owner, binding,
  2026-07-10) — see `01-PRODUCT.md` §4 for the verbatim owner wording.

## B. The spine (agent-native execution)

- **S1 — Human UI, agent tools, and (later) workflow steps share one canonical invocation model.**
  They share the action definition, caller-aware policy evaluation, executor, state authority, and
  attributed evidence. `PreToolUse` remains an Agent adapter; UI callers do not simulate an Agent SDK
  lifecycle. Different caller identities may receive different policy decisions. (amended 2026-07-11)
- **S2 — Manual editing is an escape hatch, not the primary path.** Manual UI edits write through the
  same action + timeline path agents use. (2026-07-08)
- **S3 — Automatic decisions are risk-graded and replayable.** Low risk may be rule-automated; medium
  risk needs a rule or pre-authorization; high risk (destructive, credentials, external side effects)
  always needs explicit confirmation. Reuse Craft's existing permission modes rather than inventing a
  parallel scheme — see `05-MILESTONE-1-ACTION-SPINE.md`. (2026-07-08)
- **S4 — Structured-output validation is two-stage.** Structural validation (schema/types) first, then
  a semantic check that catches structurally-valid-but-wrong outputs (e.g. wrong permission scope,
  empty evidence without a low-confidence flag). Over-constraining a schema forces models to
  hallucinate compliant values; make judgment fields optional with an explicit `uncertain` value and
  default security fields to the most restrictive. (2026-07-08)
- **S5 — Risk, approval, and recovery are separate dimensions.** Risk describes the side effect;
  approval records `allow / ask / deny / owner_checkpoint`; recovery records `inverse /
  conditional_restore / snapshot_restore / none`. A low-risk label must never imply an undo path that
  does not exist. Historical `L0–L3` labels express intent only and are not a code-level permission
  engine. (2026-07-11)

## C. Identity, teams, and delegation

- **C1 — Two-layer agent identity.** A global low-context Manager Agent (coordinates software/memory/
  settings) and per-project Agents (execute project work) are separate identities. No privileged
  backdoor; the Manager never bypasses permission. (2026-07-08)
- **C2 — Fleet owns the team; a CLI owns one run.** Cross-runtime orchestration uses stable agent
  seats, runtime-specific lanes, and bounded team-run requests. A CLI leader may *request* a member
  run through a narrow authenticated bridge, but never directly owns another runtime's tools or
  bypasses permission. "Multi-agent" must not mean "multiple chat bubbles." (2026-07-08)
- **C3 — No bare subagent spawn.** Spawning a member run/subagent requires a **TaskBrief** (goal,
  scope paths, known facts, constraints, deliverable, budget). The child returns a **RunReport**
  (summary + artifact/evidence refs), not a raw transcript dump. Large outputs are passed as pointers,
  not re-embedded. Unscoped "explore the whole repo" is denied by default. Budgets are not merely
  visible — they **halt**: when a child or a team-run crosses its declared budget, execution pauses and
  requires explicit confirmation to continue; it does not burn on until someone notices. This is what
  keeps multi-agent from costing 15× a single agent. (2026-07-10; budget circuit-breaker added
  2026-07-11)
- **C4 — Land code via an agent-first Git/PR protocol.** A PR is a *remote delivery protocol*, not the
  product's task board and not an IDE. Agents run `git`/`gh` under permission. Concurrent local writes
  are protected by file leases (or branch/worktree), never by "git alone." **Merge to remote main is
  high-risk and requires explicit confirmation by default.** (2026-07-10, merge-risk level set here.)

## D. State and persistence

- **D1 — One logical authority per state class.** A JSON/SQLite/native file format is an
  implementation detail of that authority, never license to create a second product store. (2026-07-08)
- **D2 — Near-term persistence retains Craft v0.11 filesystem stores.** No product-wide SQLite control
  plane and no independent `jobs.json` / `memory.json` / `clips.json` authority in the near term.
  Introducing SQLite later requires a written decision with a concrete trigger — see the persistence
  rule in `03-NON-NEGOTIABLES.md`. (2026-07-09)
- **D3 — No long-lived background daemon in the near term.** The Electron main process owns the
  terminal/PTY lifecycle and the local spine. A future offline/background daemon requires its own
  decision covering lifecycle, local auth, single-instance, recovery, and upgrade. (2026-07-09)
- **D4 — Files and Library are separate layers.** Raw workspace files are not Library assets until
  selected, authorized, indexed, and provenance-tracked. Cross-surface handoff uses versioned
  artifact references; native owners keep content authority; fan-out reuses the same version rather
  than silently copying bytes. The same artifact version may be consumed by several later Agents or
  native surfaces (for example, a generated image used as a website reference and a video first frame),
  and every actual consumption records its purpose and provenance. (amended 2026-07-11)
- **D5 — Memory is local, partitioned, inspectable, and deletable.** Deletion is a high-risk action.
  Context efficiency + external review is *one* pipeline and ledger, not scattered buttons. The raw
  timeline never auto-promotes to long-term memory: experience is *proposed* by an agent, then retained
  only after human/rule review (see `01-PRODUCT.md` §8). This is the intended "experience distillation"
  moat and is scheduled deliberately late — its landing point is **Milestone 6** in `04-MILESTONES.md`,
  after a complete single-Agent chain and one real delegation loop. (amended 2026-07-11)
- **D6 — ArtifactRef is derived from real handoffs, not frozen speculatively.** Milestone 1 reserves no
  complete artifact protocol. The first runtime output may expose a minimal candidate envelope; it is
  versioned before the first cross-feature consumer, after at least one real producer and consumer have
  validated the fields. (2026-07-11)

## E. Capabilities, cost, and modules

- **E1 — Continuous extensibility without restructuring the spine.** New capabilities and views
  *register*; they do not rewire the core. One capability manifest, one canonical action owner, one
  view-contribution host. (2026-07-09)
- **E2 — Capability management separates install / loadout / runtime.** Agent attention is protected by
  scoped loadouts, not one global always-on tool pile. (2026-07-08)
- **E3 — One usage/cost ledger.** Real / estimated / unknown cost is tracked in one ledger; modules
  embed its fields rather than starting a second cost store. Auto-routing/cache/fusion apply only to
  API/OAuth lanes and are default-off; any CLI-runtime lane bypasses them. Batch/offline API work uses
  native batch endpoints, not platform-level concurrent loops. (2026-07-08)
- **E4 — Native engine per surface, one shared spine.** Any "design action/patch" is an *envelope* for
  handoff, never a universal internal document model that pretends to natively edit DOM, code, design,
  video, and decks at once. (2026-07-08)
- **E5 — The canvas projects the artifact relationship graph; it does not own domain truth.** Agent,
  session, file, job, artifact, workflow, and leadership truth remain in their native authorities. The
  canvas owns only spatial/layout presentation and invokes governed actions to change anything else.
  `spatial`, `reference`, actual execution `input`, immutable `derived-from` provenance, leadership, and
  executable `workflow` are distinct relationship classes with different owners. A visual connector is
  never automatically an executable edge or a provenance fact. v1 workflows remain finite DAGs of typed
  steps, stored as immutable versioned project documents when run. Full vision in
  `design-library/07-canvas-spatial-orchestration-VISION.md`. (amended 2026-07-11)
- **E5a — Spatial rendering is adapter-bound and benchmark-selected; React Flow is the leading first
  spike, not a committed dependency.** The durable contract is a renderer-independent projection/layout
  model plus governed canvas actions. React Flow has the strongest evidence for Fleet's first workload:
  rich React Agent cards and tens-to-hundreds of media/workflow nodes (also seen in TapNow, TRAEWork, and the
  owner-provided MiniMax Hub analysis). tldraw remains the strongest free-spatial behavior comparison;
  its store may be a derived renderer store rather than a second domain authority, but production
  licensing is an owner checkpoint. PixiJS/GPU or CanvasKit is introduced only if a representative
  Electron benchmark proves DOM rendering insufficient; FlowGram is a workflow-editor candidate, not the
  spatial host, because its form/variable/runtime layers would otherwise duplicate Fleet authorities.
  No renderer dependency is promoted before the canvas milestone's adapter spike and media/concurrency
  benchmark. (replaced 2026-07-11) | Affected: M07, M16, M17 (design-library module numbering, **not**
  the Milestone 1–6 sequence in `04-MILESTONES.md`) |
  `design-library/07-canvas-spatial-orchestration-VISION.md` §§6–9
- **E6 — The BrowserPane is a governed evidence input, not a stealth browser and not an editable-doc
  surface.** It follows an explicit control model (enablement, open-target, data clearing, screenshot
  policy, approval policy, site overrides, and a separate high-risk full-CDP developer toggle). Remote
  pages are evidence-only; no editing via silent DOM mutation. (2026-07-08)
- **E7 — Exports are honest.** A motion/deck surface uses a native document; PPTX/HTML/video are
  explicit exports with visible fidelity limits. Never promise full animated-PowerPoint compatibility
  the export path can't prove. (2026-07-09)
- **E8 — Local resource limits are product behavior, not exceptional failure.** When concurrent work
  saturates the machine (jobs, previews, media, renders), the product visibly queues, suspends,
  degrades, or hands off — it does not freeze, silently drop work, or pretend nothing happened. Exact
  thresholds are benchmark outputs, never frozen from drafts. (Carried from the owner's concurrency
  concern — see the owner-voice record in `design-library/OWNER-VOICE.md`; 2026-07-08, re-promoted
  2026-07-11)
- **E9 — Thinking-intensity levels adapt per model; ungradable models are handled honestly.** Owner
  wording (binding, quote verbatim): 「我们软件应该要能根据不同的模型自动适配不同的思考强度分级策略，
  有些模型思考强大不能分级」. Operationally: the product keeps **one** thinking-level vocabulary
  (Craft's `off…max`); each backend/model adapter maps it onto what that provider **actually
  supports** — saturating at the provider's ceiling, collapsing to on/off, or hiding the selector for
  models that cannot be graded — and never claims a level was applied when it wasn't. Never emit a
  level the installed SDK's type does not accept; passing a new level through 1:1 requires a published
  SDK that supports it plus an owner-approved dependency bump (a shipped runtime-dependency change,
  per `OWNER-CHECKPOINTS.md` #2). First application: `THINKING_TO_PI` saturates `max → 'xhigh'` on
  pi SDK 0.80.6. (owner, 2026-07-11) — see `design-library/OWNER-VOICE.md` OV-006.

## F. Compliance (hard product requirements, not policy notes)

- **F1 — No quota bypass, stealth/anti-detection automation, credential/cookie extraction,
  unauthorized account automation, or terms-of-service evasion.** Ever. Multiple accounts are legal
  profiles only. (2026-07-08)
- **F2 — Preserve user data.** Destructive changes and external side effects require explicit
  authority. Credentials stay in established credential pathways. (2026-07-08)
- **F3 — Source reuse passes both a license gate and a product-fit gate.** A permissive license alone
  is not enough; copy only explicitly approved sources, otherwise use an adapter or black-box the
  behavior. (2026-07-08)

## G. Process

- **G1 — Owner gives concept and intent; the agent chooses the technical route.** Do not ask the owner
  for engineering opinions. Extract design intent, pick the implementation, document assumptions,
  escalate only genuine conflicts. (2026-07-08)

## Deferred, not reversed (legacy decisions parked with their modules)

A few durable legacy judgments were deliberately **not** carried as active entries because no near-term
milestone touches them. They are parked, not overturned; their substance lives in the matching
`design-library/` file and the original ledger (recoverable under `_trash/2026-07-11/docs-legacy/`):
the `@`/`/` addressing model and session-as-Agent idea (old D16); "Messaging is retained and governed,
not silently deleted" (old D28 — the messaging packages in the tree stay until a real decision removes
them); the terminal-surface / CLI-lane / TeamRun three-concept separation (old D21); and
adapter-first integration for volatile external ecosystems (old D24). Old D29 ("move toward
`node-pty`") is the one entry that was **reversed**, by Milestone 2's non-interactive-first rule.
