# Work Order — From Documentation to Accepted Implementation

> **Roadmap source:** [`05-ROADMAP.md`](05-ROADMAP.md). **Synchronization owner:** the main
> integration agent updates this projection in the same change that advances the ACTIVE release.

This is a convenient execution view of the suite integration queue. Read it only when a Goal asks
to execute that queue; ordinary owner Goals still start at root [`AGENTS.md`](../AGENTS.md). It
connects system suites, active specs, code entries, reference intake and acceptance evidence. It is
not a second roadmap: `05-ROADMAP.md` owns order, and `modules/REGISTRY.md` owns breadth.

## Goal execution rules

- The Goal prompt owns the objective and done conditions; this file supplies only the default order.
- One run selects one Task ID or active-spec slice, never all suites or the entire documentation set.
- Keep only `objective · paths · constraints · acceptance · next action` in execution context;
  research logs, full test output and sub-agent transcripts do not flow back into this file.
- Complete reversible preparation before an owner checkpoint; commit, tag, deletion, public and
  paid effects still wait for the applicable approval.

## Preflight discipline

1. Read root `AGENTS.md`, this file, the relevant suite packet and the ACTIVE spec.
2. Run `git status --porcelain`; touch only the registered boundary and preserve unrelated changes.
3. For EXTEND/NEW work, perform the bounded reference review. Without a fixed commit and exact
   source paths, a project remains `candidate`; do not copy it or claim adoption.
4. Keep a TaskBrief in Goal/thread state with `Outcome / Criteria / Classification / Frontend /
   Backend / Unchanged / Reserved / Docs after`; do not create a TaskBrief document unless asked.
5. SYS-01 alone integrates shared contracts. Other suites request an interface change and never add
   a second state owner.

## Complete development order

> Only the ACTIVE row is executable by default. Rows are dependency order, not time horizons.
> Every product domain ends in this queue. In R16–R18, evidence-backed `NO_GAP` is completion;
> leaving a row as “future” is not.

| Order | Task ID | Suite | Accepted outcome | Craft starting point | Entry contract | Unlock condition |
|---:|---|---|---|---|---|---|
| 0 | R0-BASELINE | SYS-01 | Classify every dirty-tree group as land/fix/drop and produce a runnable, attributable baseline | current Craft-derived implementation tree | `specs/R0-baseline-audit.md` | **ACTIVE** |
| 1 | R1-BOUNDARY | SYS-01 | Converge interaction on v0.10.5; Projects and Conversations are two honest scopes over one Session list; one context-bound create flow, direct folder picker, preserved archive/label/actions, no permanent All Sessions or default Kanban, complete `zh-Hans` | Workspace, SessionManager, app-shell, labels, i18n, settings; v0.11 Task code classification only | `specs/R1-one-boundary-language.md` | R0 |
| 2 | R2-INDEPENDENCE | SYS-01 | Make inherited Craft-hosted dependencies Fleet-owned, local, user-configured, or honestly unavailable | updater, sharing, docs, OAuth | `specs/R2-independence.md` | R0 |
| 3 | R3-PRODUCTION | SYS-01/03/04 | intent → research/evidence → Markdown → review → accepted output → delivery | Session, Sources, BrowserPane, TipTap, files | `specs/R3-first-production-chain.md`; TE1/profile work follows the roadmap | R0; R1/R2 improve the experience |
| 4 | R4-ACTION | SYS-01 | Two real human/Agent mutations share one Craft permission and evidence path | RPC, session tools, PreToolUse, owning service | `specs/R4-action-seam.md` | R3 |
| 5 | R5-ARTIFACT | SYS-01/04 | Exact version and provenance, one producer→consumer path, and stale-writer rejection | Workspace files, Session evidence, previews | accepted R5 spec | R3 |
| 6 | R6-DELEGATION | SYS-01/03 | TaskBrief → child Session → validated RunReport plus budget circuit breaker over Craft TaskRunner | TaskRunner, Session, Task, permission | accepted R6 spec | R4 + R5 |
| 7 | R7-CANVAS | SYS-05 | Canvas projects real Session/Artifact state and invokes one governed action | Craft shell/views + R4/R5 | accepted R7 spec | R5 + E5a |
| 8 | R8-WORKFLOW | SYS-07 | Promote the completed R3 chain to a finite versioned DAG without adding an executor | TaskRunner + governed actions | accepted R8 spec | R4 + R5 |
| 9 | R9-MEMORY | SYS-03 | Layered agent-maintained memory: working notes → logged consolidation → curated layers; optional curation; D5 floors | Workspace files + Session evidence + search index | accepted R9 spec | repeated R3 chains |
| 10 | R10-DESIGN-WEB | SYS-05 | Native design document plus versioned web edit/preview/export loop | Craft shell, TipTap/previews, R4/R5/R7 | accepted R10 spec | R4 + R5 + R7 |
| 11 | R11-JOB-IMAGE | SYS-06 | Extract one cancellable Job from a real image-generation loop and preserve provenance/cost | provider backends, UsageTracker, R4/R5 | accepted R11 spec | R4 + R5 |
| 12 | R12-VIDEO-AUDIO | SYS-06 | Media import, sequence editing, audio/captions, cancellable/retryable render and delivery | files/previews + R11 Job | accepted R12 spec | R11 |
| 13 | R13-DECK-SPATIAL | SYS-05/06 | Deck/motion export and 3D/panorama/relight/shot-grid manifests | R10 native documents + R11/R12 Job/Artifact | accepted R13 spec | R10 + R11 + R12 |
| 14 | R14-REMOTE-MSG | SYS-02 | User-owned remote target, worktree/Git/PR, grants and Workspace-scoped messaging | Craft transport, TaskRunner, messaging, settings | accepted R14 spec | R6 |
| 15 | R15-MARKET | SYS-08 | Local discovery, trust, install, loadout, rollback and revoke for Skill/plugin/MCP packages | Craft Skills/Sources/MCP/credentials/settings | accepted R15 spec | R6 + R9 |
| 16 | R16-COMPUTER | SYS-02/04 | Exhaust Craft structured routes on a real task, then add the smallest fallback or close `NO_GAP` | BrowserPane/CDP, file/shell/API, remote, permission | accepted R16 spec | R14 |
| 17 | R17-ADAPTIVE | SYS-01/03 | Add explainable routing/organization from accepted-outcome traces, or close `NO_GAP` | provider seam, UsageTracker, Task/Session | accepted R17 spec | R6 + R9 + R12 |
| 18 | R18-CONDITIONAL | SYS-01/02/05 | Resolve PTY, stronger sandbox and docking individually by implementation or gate-backed `NO_GAP` | Craft shell/process/isolation/settings | accepted R18 spec | R10 + R12 + R16 |

## Definition of done for every task

- A real path exists from caller through persistence/events back to the relevant surface.
- Required normal, empty, failure, denied, offline, cancel and recovery states are observable.
- The cheapest sufficient verification ran; type checking alone is not completion.
- Reference mechanism, license, same-task alternative and deletion test are in the admission ledger.
- The affected spec, registry/matrix row, page state and user-facing documentation are synchronized.
- Reports use exactly one capability status: `usable`, `wired but not visually checked`,
  `display-only`, or `not implemented`.

## Shared verification commands

Run from `app/`; a task packet may add commands but cannot omit the applicable level:

```bash
bun run typecheck:electron
bun test <changed-package-or-test>
bun run validate:dev
```

High-risk tasks also require a real data-path check, cancel/recovery coverage and independent
verification. Git, remote targets, credentials, deletion, publication or a new authority stop at
the [`OWNER-GUIDE.md`](OWNER-GUIDE.md) checkpoint.

## Parallel dispatch queue

A projection of the queue above for multi-agent execution, governed by the multi-agent and
bounded-feature rules in `../AGENTS.md`. **Rewritten 2026-08-15** — the previous
frontier table described packets that landed 2026-07-26 and covered none of the work done since.

### How concurrency is legal here (read this before dispatching anything)

Decision G2 sets a WIP limit of exactly one ACTIVE release, so a wide parallel plan looks like a
violation of it. It is not, and the distinction is load-bearing:

> **Exactly one release is ACTIVE *for integration*.** Concurrency is legal only in these five
> lanes, each already authorized by a named decision:
>
> 1. **Frontend track (G6)** — preview-gated pages behind a typed adapter, reported `display-only`.
> 2. **Read-only / observation** — inventories, audits, measurement. TE1 is defined this way (E13).
> 3. **Disjoint-path suite research and typed preview adapters** —
>    `modules/REGISTRY.md` §Build and parallelism, item 2.
> 4. **Behaviour-preserving seam extraction** — characterization-tested refactors that change no
>    observable behaviour.
> 5. **Owner-directed early slices (G2)** — each registered in
>    [`FEATURE-REGISTRY.md`](FEATURE-REGISTRY.md) with its unresolved edges.
>
> Anything outside those five is serialized behind the ACTIVE release.

**The honest limit.** Several dependency edges are *evidence* edges, not scheduling edges, and
cannot be parallelized away: R4's contract is extracted from two real callers and R3 supplies the
second (G2, D6); R5's `ArtifactRef` fields come from R3's recorded handoff friction; R7 projects the
artifact graph R5 creates. Forcing R4/R5/R6 to run beside R3 re-creates the speculative pre-freeze
that `04-ARCHITECTURE.md` §2 forbids — which is exactly what the 2026-08 delegation kernel already
did once (roadmap change log, 2026-08-15). The realistic shape is roughly ten to twelve concurrent
lanes after seam extraction, about five of which are entirely dependency-free.

### Dispatch rules

1. Writers branch as `work/<packet-id>` **from the `fleet-baseline-r0` tag**, in their own
   worktree; read-only packets run without a branch. No packet pushes, merges or tags — merging is
   the integrator's job, in Deps order, with `bun run validate:quick` between merges and
   `bash scripts/fleet-verify.sh` at every wave boundary.
2. A worktree alone is **not** isolation (Decision H4). A packet that starts a dev server, database
   or cache also declares its runtime facets, and ports are assigned **by agent index, not found
   free** — a found-free port changes every run, which makes a failure impossible to reproduce.
   The helper exists: `AgentIsolation` / `agentPortOffset` in
   `packages/shared/src/artifacts/history-backend.ts`.
3. Every packet starts by reading root `AGENTS.md` (including its reference-root preflight) and its
   spec slice, then confirms exact code paths with `rg`. The boundary column is a containment
   ceiling, not a path inventory.
4. A packet that discovers a cross-packet contract change **stops and returns the decision to the
   integrator**. No packet widens its own scope, touches another packet's boundary, or adds a
   compatibility shim to avoid asking.
5. A packet that must add net lines to a renderer file already above 1,500 lines records the
   `06-CODE-MAP.md` exemption in its RunReport, or extracts in the same slice.

**Execution record, honest:** the 2026-07 packets ran as direct commits on `work/fresh-base-spine`
rather than as `work/<packet-id>` branches merged by the integrator, and the 2026-08 work did the
same — producing the second unaudited tree recorded in the R0 row. The rule-versus-practice question
that entry left open is **closed in favour of the rule** (roadmap change log, 2026-08-15). Wave 0
itself is the one legitimate exception: it is explicitly serial, single-agent and owner-present, and
there is no tag to branch from until it finishes — it ran as direct commits on
`work/fresh-base-spine` on 2026-09-09 and that is what rule 1 above prescribes for it.

### Path ownership — the collision gate

`../AGENTS.md`: at most one writer per occupied path. This table *is* the parallelism mechanism;
without it "many agents at once" means "many agents editing `AppShell.tsx`".

**Reserved — no packet writes these without the integrator role:**

```
docs/02-DECISIONS.md          docs/03-NON-NEGOTIABLES.md      docs/05-ROADMAP.md
docs/04-ARCHITECTURE.md       docs/specs/*                    (except your own spec slice)
app/package.json  app/bun.lock  app/tsconfig*.json  .github/workflows/*  .githooks/*
app/packages/shared/src/protocol/          (wire types — one integrator)
any test/fixture/harness your own packet does not explicitly own
```

**Exclusive ownership, Waves 0–2:**

| Path prefix | Owner packet | Notes |
|---|---|---|
| `app-shell/AppShell.tsx` + its extracted modules | **S1** | then released to R1 |
| `app-shell/{LeftSidebar,SessionList,TopBar,SessionItem,SessionMenu*}.tsx`, `sidebar-nav-model.ts`, `session-filter-menu.tsx`, `context/NavigationContext.tsx` | **R1** | after S1 merges |
| `app-shell/*menu*.tsx` (the four copies) + the new primitive | **S3** | disjoint from S1 |
| `packages/server-core/src/sessions/` | **S2** | then released to R4 |
| `agent/core/pre-tool-use.ts`, `handlers/set-session-labels.ts` | **R4** | after S2 |
| `packages/shared/src/artifacts/`, `workspaces/deliverable-acceptance.ts` | **R5** | R3 reads, does not write |
| `agent/delegation-*.ts`, `path-lease.ts`, `run-report-validate.ts`, `permission-intersection.ts` | **R6-CLOSE** | candidate for everyone else until then (freeze register below) |
| `agent/core/{usage-tracker,cache-economy}.ts` + provider event adapters | **TE1-S3..S5** | observation-only writes |
| `renderer/playground/`, `pages/<new preview page>` | **F1..F4** | one page batch per packet, no shared file |
| `packages/shared/src/auth/`, docs-link modules, `main/auto-update.ts` | **R2-CLOSE** | R2 service classes |
| `packages/*/src/**/{types,errors}.ts` duplicate-authority collapses | **U1** | list fixed in the packet block |
| `docs/02-DECISIONS.md`, `FEATURE-REGISTRY.md` | **D1** | |
| `modules/{REGISTRY,PACKET-INDEX,ACCEPTANCE-INDEX}.md`, `11-PRODUCT-MATRIX.md`, `12-PAGE-ARCHITECTURE.md` | **D2** | must end with `validate-doc-contracts.py` green |
| `06-CODE-MAP.md`, `09-QUALITY.md`, `references/GROK-RUN-LOG.md`, `scripts/fleet-verify.sh` | **D3** | |
| `docs/references/<domain>/`, `modules/<module>/README.md` | **X1..X3** | one suite per packet |

**Shared-file escape hatch.** A packet that genuinely must touch another packet's path applies
dispatch rule 4: stop, file a BLOCKER naming the exact file and hunk, and let the integrator land it
centrally or re-sequence. Do not fork the file.

### Wave 0 — baseline restoration · serial · one agent · owner present at marked steps

Not parallelizable. Every later packet branches from the tag this wave produces; there is no
verified commit to branch from until it exists. `backup/pre-r0-audit` is the safety net and is not
deleted until the owner accepts R0.

| Order | Packet | Mode | Boundary ceiling | Result |
|---:|---|---|---|---|
| 1 | W0-REFS — reference roots and phantom deletions | branch | `AGENTS.md` preflight · `.gitignore` / git index config · `06-CODE-MAP.md` reference-root rows | **done 2026-09-09** (`c487815ec`). The recorded cause was wrong — `源码参考/` is a symlink and git will not traverse one, so its 73 stale index entries reported as deletions whether or not the volume was mounted. Entries dropped from the index, nothing touched on disk, `.gitignore` landed. `git status --porcelain -- 源码参考 UI参考` is empty |
| 2 | W0-INV — fresh inventory | read-only | zero writes | **done 2026-09-09**: 395 entries measured fresh, each assigned to exactly one of 17 groups, no `G-unknown` |
| 3–17 | W0-G\* — one group, one commit | branch | one group each | **done 2026-09-09**: every group landed; none dropped. Two gate defects found and fixed as their own group (`G-gate-repair`) because `validate:dev` could not pass on any machine that had not launched the app |
| 18 | W0-TAG — integrate | branch | — | **open**: R0-C1..C6 met (empty porcelain · `scripts/fleet-verify.sh` green · headless-server smoke clean · docs synced). Remaining is R0-C7 — owner walkthrough of the changed surfaces, then tag `fleet-baseline-r0`. **Owner checkpoint** |

Groups as landed (the 2026-08-15 forecast was close but not the shape the tree actually had —
count them fresh, always): `W0-REFS` · `G-gate-repair` · `G-runtime-hardening` ·
`G-renderer-hardening` · `G-messaging` · `G-atomic-storage` · `G-distribution` · `G-build-scripts` ·
`G-delegation-kernel` · `G-model-connections` · `G-shell-layout` · `G-browser-automations` ·
`G-runtime-modes` · `G-r3-acceptance` · `G-te1-s1` · `G-composer-plan` · `G-docs`.

Grouping method, so the next inventory can repeat it: partition by area first and authorship wave
second, one path in exactly one group. The waves are recoverable from file mtimes when the tree has
sat uncommitted. Groups are individually revertable; they were **verified as a set** against the
complete tree, and no intermediate commit is claimed to build in isolation — several waves touch the
same file (`App.tsx`, `AppShell.tsx`, the i18n catalogs), and splitting hunks would have traded a
real property for a cosmetic one.

### Wave 0.5 — documentation truth · 3 agents · docs only · runs beside Wave 0

Safe to run concurrently with the Wave 0 group commits: these touch no application code and own
disjoint files. Merge order D1 → D2 → D3, because D2 depends on D1's rulings.

| Packet | Mode | Boundary ceiling | Deps | Result required |
|---|---|---|---|---|
| D1 — decision ledger and territory | branch | `02-DECISIONS.md` · `05-ROADMAP.md` (row + log only) · `FEATURE-REGISTRY.md` | — | **landed 2026-08-15**: C1 amended (no Manager Agent layer; H28), C2 reworded to "a delegating session", roadmap log records the R0 recurrence and the early delegation kernel, three territory rows registered |
| D2 — status reconciliation | branch | `modules/{REGISTRY,PACKET-INDEX,ACCEPTANCE-INDEX}.md` · `11-PRODUCT-MATRIX.md` · `12-PAGE-ARCHITECTURE.md` | D1 | **landed 2026-08-15**: P-20/P-18/P-04 split so no capability sits above its surface; `EXEC-15` joins the registry, packet index and acceptance index, closing the last `—` matrix row; validator green at 69/60/78/69 |
| D3 — code map and quality truth | branch | `06-CODE-MAP.md` · `09-QUALITY.md` · `references/AUDIT-2026-07-28-root-cause.md` · `scripts/fleet-verify.sh` | — | **landed 2026-08-15**: stamp re-verified, the 2026-08 modules mapped, file sizes re-measured with the renderer-rule violation recorded, the dated audit retired after its facts migrated, `app/scripts` test row added, stale gate comment corrected. **Remaining (2026-09-09):** `references/GROK-RUN-LOG.md` is still in the tree — a run log by name, which `03-NON-NEGOTIABLES.md` §6 forbids, but carrying five unique machine-review outcomes (one completed, four rejected, all still `candidate`). Migrate those rows into `references/REFERENCE-REGISTRY.md` and drop the file, or keep it and rename it to what it is (an evidence ledger, like `ADMISSION-V2-AUDIT.md`). Small, and nobody's until someone takes it |

### Wave 1 — seam extraction · 3–4 agents · worktrees · zero behaviour change

This is the wave that turns a serial project into a parallel one. Characterization tests first,
extraction second. If an existing test has to change, that is a BLOCKER, not a licence.

| Packet | Mode | Boundary ceiling | Deps | Result required |
|---|---|---|---|---|
| S1 — decompose `AppShellContent` | worktree | `app-shell/AppShell.tsx` + new sibling modules + their `__tests__` | tag | `AppShell.tsx` under 1,500 lines; characterization tests written before each concern moves and passing unchanged after; `lint:ui-contract` + `typecheck:electron` clean; rendered comparison with **zero** visual delta. Suggested seams: navigation state · session-list state · composer wiring · workbench/panel state · keyboard handling · dialog orchestration. **Target shape (source-level evidence, 2026-08-15 intake):** Kun solved this exact problem — a **155-line** `AppShell` switching one route field over lazy children, a composition-root `Workbench` that owns nothing and renders one child, ~40 single-purpose `useWorkbench*` controller hooks beside small view files, and layout as a hook with persistence isolated in one module. Aim at that shape; Kun is PolyForm Noncommercial, so read it and never copy it. **Do this first:** port Orca's `max-lines` **ratchet** (`config/scripts/check-max-lines-ratchet.mjs` + a baseline file, MIT) — the linter fails an over-budget file, the only escape is a disable comment, and the script freezes the set of files holding one in a baseline that may only shrink. It grandfathers today's 4,166 lines while making 4,167 impossible, and it is what stops the file regrowing after this packet lands. Orca's own `App.tsx` (2,831 lines, opening with an eslint disable) is the evidence that the rule without the ratchet does not hold |
| S2 — decompose `SessionManager.ts` | worktree | `packages/server-core/src/sessions/**` | tag | one module per concern (CRUD · message queue · event emission · snapshot/revert · labels/status · workspace routing) with `SessionManager` as the composition root; existing session tests pass unmodified; **one** session authority — a split that creates two owners of one field is a failure, not a refactor |
| S3 — one menu primitive | worktree | the four menu components + the new primitive + their `__tests__` | tag | `mention-menu`, `slash-command-menu`, `label-menu` and `skill-mention-menu` share one primitive whose contract is `UI-SPEC.md` §8; keyboard nav, filtering and dismiss ordering preserved |
| U1 — collapse duplicate authorities | branch | the named type files only | tag | `TokenUsage.contextWindow` drift reconciled (the Token ring reads it); `PreviewOverlayProps extends FullscreenOverlayBaseProps`; a fresh ≥70%-overlap scan is clean or each survivor has a reason. Every collapse is a re-export or a derivation, never a copy |

`ListSessionsArgs`/`Options`, `AgentError`/`TypedError` and `PANEL_TOP_EDGE_INSET` are **already
collapsed** (verified 2026-08-15) — do not redo them.

### Wave 2A — dependency-free lanes · start the moment the tag exists

| Packet | Mode | Boundary ceiling | Deps | Result required |
|---|---|---|---|---|
| R3-CHAIN — the first production chain | branch | no new page, no new store; the landed `acceptDeliverable` helper is the glue | tag | `specs/R3-first-production-chain.md` R3-C1..C8. The 2026-08-12 fixture is **not** a stand-in. Produces R4's second caller, R5's friction list and SYS-03's first benchmark trace. **Owner runs C1 and C7** |
| F1 — delegation inspector pages | worktree | new preview page + typed adapter; reads `delegation-projection.ts` shapes | tag | P-20 inspector `display-only`, preview-gated, every §4 state via `components/ui/surface-state` |
| F2 — cost / usage / context pages | worktree | new preview page + typed adapter; reads `usage-rollup.ts`, `session-cost.ts` | tag | P-29/P-30/T8 `display-only`, preview-gated |
| F3 — library and deliverables pages | worktree | new preview page + typed adapter | tag | P-12/T2/T3 `display-only`; its proposed view shape is a **named input to R5**, not a frozen contract |
| F4 — memory browser pages | worktree | new preview page + typed adapter; reads `memory-scope.ts` layer names | tag | P-31/T9 `display-only`, preview-gated |
| TE1-S3..S5 — cache observation | branch | `agent/core/{usage-tracker,cache-economy}.ts` + provider event adapters | tag | TE1-C3, TE1-C5, TE1-C6. Observation only — prompt diet and Pi-light are a separate owner-accepted slice **after** this baseline (E13) |
| R2-CLOSE — finish independence | branch | R2 service classes | tag · docs-MCP owner decision · mirror mounted | R2-C1 network-blocked smoke with traffic log; R2-C6 endpoint inventory; then R2-C7 owner acceptance |
| CRAFT-012 — upstream v0.12.0 intake | branch | the five named files only | tag | Five bounded REUSE items from the v0.11.2→v0.12.0 delta, recorded in `references/REFERENCE-REGISTRY.md` (2026-09-10): `archive-session.ts` + `archive-guards.ts`, `mcp/proxy-tool-name.ts`, `inherited-filter-params.ts`, `bootstrap/lock-identity.ts`, and the `config/storage.ts` startup migration. No new authority in any of them; `proxy-tool-name` is a prerequisite for any kit that projects a tool subset (H37 Option A) |
| X1..X3 — suite packets | read-only | one suite each (`SYS-05`, `SYS-06`, `SYS-08` recommended first) | mirror mounted | `BREADTH_ONLY`/`PACKET_DRAFT` → `READY_FOR_SPEC` against the six `15-DOC-AUDIT.md` completion-gate items. Deliverable is a packet plus a reference audit — **not code** |

### Wave 2B — lanes that open as their evidence edge lands

| Packet | Opens when | Boundary ceiling | Result required |
|---|---|---|---|
| R1-BOUNDARY | S1 merged + mirror mounted | sidebar/list/menu/composer/navigation + i18n catalogs | `specs/R1-one-boundary-language.md` slice order 2–6 and its six executor-handoff groups; R1-C1..C14 |
| R4-ACTION | R3-C1 passed + S2 merged | `pre-tool-use.ts`, `handlers/set-session-labels.ts`, the owning service | one vertical action correct **first**, then migrate the second — the second action is the test that the abstraction is reusable. R4-C1..C8 |
| R5-ARTIFACT | R3-C3 passed | `packages/shared/src/artifacts/` | `ArtifactRef` v1 from R3's friction list and F3's proposed shape; one producer→consumer pair; stale-writer rejection |
| R6-CLOSE | R4 + R5 | the landed delegation kernel + PreToolUse | smaller than the roadmap implies — the kernel exists. Remaining: PreToolUse `TaskContract` gates, the independent read-only verifier, worktree apply/discard. Promotes the candidate envelopes to frozen |

### Integration protocol

The integrator merges; nobody else does. Order within a wave is the Deps column, and between merges:

```bash
cd app && bun run validate:quick
```

At each wave boundary:

```bash
bash scripts/fleet-verify.sh
```

**A packet whose merge breaks the gate is reverted, not patched forward** (`../AGENTS.md`: a
broken direct-to-main change is fixed or reverted before anything else). Resolve a conflict by
comparing behaviour, intent and state authority and choosing **one** solution — never by adding a
second store, adapter or path. If two packets need the same file the integrator re-sequences them;
the file is not forked and no compatibility shim is added.

### Wave exit criteria

| Wave | Exit condition |
|---|---|
| **0** | `git status --porcelain` empty · `scripts/fleet-verify.sh` green · launch smoke clean · `fleet-baseline-r0` tagged · owner accepted |
| **0.5** | `validate-doc-contracts.py` green · no capability row above its surface's status · dated reports retired with their facts migrated · `06-CODE-MAP` stamp current |
| **1** | `AppShell.tsx` < 1,500 lines · `SessionManager.ts` split with one authority intact · one menu primitive with four call sites · zero behaviour change proven by unmodified characterization tests · `fleet-verify.sh` green |
| **2A** | R3-C1..C8 met · four frontend batches `display-only` and preview-gated · TE1 baseline recorded · R2 accepted · three suite packets `READY_FOR_SPEC` |
| **2B** | R1-C1..C14 met · R4 seam extracted from two real callers and both migrated · R5 `ArtifactRef` v1 with one real producer→consumer pair · R6 gates and verifier landed |

### Contract freeze register

`modules/REGISTRY.md` rule 2: a contract name is a *candidate vocabulary entry* until its first real
producer and consumer land. This register enforces that while the delegation kernel exists ahead of
its callers.

| Contract | Location | State | Who may depend on it |
|---|---|---|---|
| `TaskContract` / `TaskBrief` / `RunReport` | `agent/delegation-contract.ts` | **candidate** | R6-CLOSE only; suites may read the shape, nothing builds against it as frozen |
| `PathLease` | `agent/path-lease.ts` | **candidate** | R6-CLOSE |
| permission intersection | `agent/permission-intersection.ts` | **candidate** | R6-CLOSE |
| `ActionEnvelope` / `ActionOutcome` | not written | **unwritten** | nobody — R4 extracts it from two real callers |
| `ArtifactRef` | not written | **unwritten** | nobody — F3 *proposes* a view shape; proposing is not freezing |
| `ExpertKit` / skill routing / kit sources | `labels/*` | landed, unwired | readable; wiring is a separate slice |
| `HistoryBackend` / `ChangeAttribution` / `WriteLease` / `AgentIsolation` | `artifacts/history-backend.ts` | landed, unwired | Wave 1 may use `AgentIsolation` for port offsets |
| `SessionEvent` union | `protocol/dto.ts` | **frozen** | everyone reads; only the integrator writes |

Promotion from candidate to frozen happens once, by the integrator, when a real producer and a real
consumer both exist. Until then a packet that finds a field wrong files a BLOCKER and the field
changes — that is the point of keeping it candidate.

### Owner checkpoints

Owner checkpoints stay owner-owned regardless of parallelism: the reference-root decision (W0-REFS),
any `G-unknown` group, any drop that deletes something unique (03 §6), the R0 tag and walkthrough
(R0-C7), the docs-MCP default and R2-C7, R3-C1/C7, R1-C12 visual acceptance, deleting
`backup/pre-r0-audit`, and any merge to remote `main`.

## Handoff format

```text
TASK: <Task ID>
STATUS: usable | wired but not visually checked | display-only | not implemented
CHANGED: <exact paths>
AUTHORITY: <canonical store/contract>
EVIDENCE: <commands, fixtures, output paths>
REFERENCES: <admission IDs and exact symbols>
RECOVERY: <cancel/offline/denied/retry behavior>
DOCS: <updated spec, registry/matrix, page and user docs>
BLOCKER: <smallest unresolved decision, or none>
```

“Page complete” and “tests pass” never replace a capability status or real-path evidence.
