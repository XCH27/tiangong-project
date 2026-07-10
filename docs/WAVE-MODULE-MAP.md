# Wave and Module Map

> **Lead-owned.** This is the only active source for execution gates and module placement.
> **Updated:** 2026-07-09
> **Current state:** W0.1 reconciliation is active; every Worker implementation wave is Locked.
>
> **Delivery orientation:** numbered closed loops live in `docs/loops/README.md` (L00→L05).
> Loop folders explain entry order and assemble modules; they do **not** override this map.

## 1. Status Axes

- **Execution gate:** `Locked`, `Ready`, `In Progress`, `Blocked`.
- **Capability status:** `not implemented`, `display-only`, `wired but not visually checked`,
  `usable`.
- **Spec maturity:** `concept`, `contract draft`, `execution-ready`.

See `DOCUMENT-READINESS.md`. A spec file does not make a module Ready.

## 2. Wave Schedule

| Wave | Delivery loop | Entry gate | Required exit | Current gate |
|---|---|---|---|---|
| W0 — recorded baseline | (historical) | initial contract documents recorded | historical v1.2 record only | Done (historical) |
| W0.1 — v0.11 migration and contract reconciliation | **[L00](loops/L00-control-plane/)** | Lead-only documentation/migration work | clean v0.11 migration ledger; one canonical contract implementation/text version; ownership/wave/packet parity | In Progress; blocking all Workers |
| W1 — control spine | **[L01](loops/L01-platform-action/)** | W0.1 explicitly closed | M00 backbone and M03 executor `usable`; M12 capability-core contract frozen and registry projection seam defined | Locked |
| W2 — local workbench runtime | **[L02](loops/L02-local-workbench/)** | W1 exit | M02 terminal loop, M05 file/ArtifactRef loop, M16 host slice, and M08 durable job core `usable`; M04 bounded run core verified | Locked |
| W3A — composable spatial loop | **[L03A](loops/L03A-composable-creative/)** | W2 exit | D45 real text-to-image workflow loop `usable`, including M07/M08/M12/M16/M17 and restart reconciliation | Locked |
| W3B — native creative outputs | **[L03B](loops/L03B-creative-fanout/)** | W3A contract/core available | one real M18 web, M19 deck, and M09 multi-asset media fan-out path; each may promote independently | Locked |
| W4 — intelligence/distribution | **[L04](loops/L04-intelligence/)** | W3A exit and stable M05/M08 contracts | M10/M11 and M12 distribution slices reach their packet criteria | Locked |
| W5 — polish/integrations | **[L05](loops/L05-polish/)** | required W1-W4 dependencies usable | M13-M15 complete real user loops; no placeholder-only finish | Locked |

W3B and W4 may overlap only when their packets have disjoint files and each dependency is already
usable. A wave label never overrides the dependency DAG.

## 3. W0.1 Exit Checklist

All items are required; there is no hidden secondary gate.
Status legend: **Done** | **Partial** | **Open**.

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | clean Craft Agents OSS v0.11.0 baseline and migration branch recorded | **Partial** | SHA + worktree; **install + typecheck:shared/electron green** (`docs/migration/v0.11-BASELINE-VALIDATION.md`); monorepo `app/` replace + GUI **Open** |
| 2 | retain/adapt/drop/defer ledger for Fleet + fleet-old | **Partial** | Ledger started with protocol/tree diffs; fleet-old rows still expand-on-demand |
| 3 | canonical text/implementation parity for seat/actions/caller/idempotency/revision/events/policy | **Partial** | Text requirements in `docs/contracts/w0.1-freeze-record.md`; TS parity **Open** |
| 4 | ArtifactRef, capability, ExternalJob, workflow, spatial, view contracts frozen or version-gated | **Partial** | Text freeze via composable contracts + freeze record; spatial spike still version-gated |
| 5 | M11A UsageObservation/CostRecord/budget preflight frozen | **Done** (text) | `docs/contracts/m11a-usage-cost-core.md` (`w0.1-m11a-1`) |
| 6 | physical persistence authority recorded | **Done** (W1/W2 policy) | ADR-0034 + PERSISTENCE map |
| 7 | product/internal namespace decided | **Done** | ADR-0035 / D47 |
| 8 | ownership precedence non-overlapping for first packets | **Partial** | Matrix rules OK; many paths still unassigned until clean base |
| 9 | active packets grant no Worker frozen-protocol writes | **Done** | Only W0.1 Lead packet active |
| 10 | Lead explicitly sets W1 Ready | **Open** | **W1 remains Locked** |

## 4. Module Table

| Module/slice | Wave | Depends on | Canonical spec | Spec maturity | Capability | Gate | blocked_by |
|---|---|---|---|---|---|---|---|
| M00 Platform Spine | W1 | W0.1 | `modules/00-platform-spine.md` | contract draft | not implemented | Locked | — |
| M01 Clean v0.11 Baseline (Lead slice) | W0.1 Lead-only | upstream gate | `modules/01-clean-craft-baseline.md` | contract draft | not implemented | In Progress | BLK-001 |
| M01 Worker coding | — | M01 Lead exit | same | contract draft | not implemented | Locked | BLK-001 |
| M02 Terminal/CLI Runtime | W2 | M00/M03 usable; M16 host | `modules/02-terminal-cli-runtime/SPEC.md` | contract draft | not implemented | Locked | BLK-001 |
| M03 Action Registry | W1 | W0.1; M00 backbone for executor | `modules/03-internal-action-registry.md` | contract draft | not implemented | Locked | BLK-001 |
| M04 Runtime Lanes/TeamRun core | W2 | M00/M03 usable | `modules/04-runtime-lanes-teamrun.md` | contract draft | not implemented | Locked | BLK-001 |
| M05 Files/Library/ArtifactRef | W2 | M00/M03 usable | `modules/05-files-library-leases.md` | contract draft | not implemented | Locked | BLK-001 |
| M06 Browser Evidence | W3A | M03/M05/M16 usable | `modules/06-browser-artifact-surface/SPEC.md` | contract draft | not implemented | Locked | BLK-001 |
| M07 Spatial Canvas | W3A | M03/M05/M12-core/M16/M17 contracts | `modules/07-canvas-design-surface/SPEC.md` | contract draft | not implemented | Locked | BLK-001 |
| M08 job core | W2 | M00/M03/M05; M11A contract | `modules/08-aigc-jobs-surface.md` | contract draft | not implemented | Locked | BLK-001 |
| M08 generative providers | W3A | M08 core/M05/M11A usable | same | contract draft | not implemented | Locked | BLK-001 |
| M09 Media Composition | W3B | M05/M08/M12/M16/M17 | `modules/09-video-surface.md` | contract draft | not implemented | Locked | BLK-001 |
| M10 Memory/Context | W4 | M00/M05 stable | `modules/10-memory-context-review.md` | contract draft | not implemented | Locked | BLK-001 |
| M11A usage/cost core | W2 | M00/M03; W0.1 freeze of M11A types | `modules/11-model-routing-cost-ledger.md` §2 | contract draft | not implemented | Locked | BLK-001 |
| M11B routing/cache/batch | W4 | M00/M03/M08/M11A | same | contract draft | not implemented | Locked | BLK-001 |
| M12 capability core | W1 contract/W2 catalog | M00/M03 | `modules/12-capability-skill-plugin-system.md` | contract draft | not implemented | Locked | BLK-001 |
| M12 plugin distribution | W4 | M12 core/M05/M11B | same | concept | not implemented | Locked | BLK-001 |
| M13 Settings/Preferences | W5 | M00/M16 boundaries | `modules/13-settings-shell-ux.md` | concept | not implemented | Locked | BLK-001 |
| M14 Onboarding | W5 | M00/M13 | `modules/14-onboarding.md` | contract draft | not implemented | Locked | BLK-001 |
| M15 Messaging | W5 | M00/M03/M13 | `modules/15-messaging.md` | contract draft | not implemented | Locked | BLK-001 |
| M16 panel host slice | W2 | v0.11 shell/M00/M03 | `modules/16-workbench-panel-platform.md` | contract draft | not implemented | Locked | BLK-001 |
| M16 composition slice | W3A | M16 host/M12 core | same | contract draft | not implemented | Locked | BLK-001 |
| M17 Composable Workflows | W3A | M00/M03/M05/M08-core/M12-core/M16 | `modules/17-composable-workflows.md` | contract draft | not implemented | Locked | BLK-001 |
| M18 Web Artifact | W3B | M05/M06/M08/M12/M16/M17 | `modules/18-web-artifact-surface.md` | contract draft | not implemented | Locked | BLK-001 |
| M19 Presentation/Motion | W3B | M05/M08/M12/M16/M17 | `modules/19-presentation-motion-surface.md` | contract draft | not implemented | Locked | BLK-001 |

## 5. Dependency Stop Rules

1. M03 skeleton may start only after W0.1; its executor waits for M00 backbone.
2. No W2 Worker starts until M00/M03 are usable and the exact packet says which slice is Ready.
3. M02 UI depends on M16 host; it must not create a separate terminal shell.
4. M17 does not start until M05 ArtifactRef and M08 durable job core contracts are frozen and
   their required paths are usable.
5. M08 paid/unknown jobs and W3A generative providers require **M11A** vocabulary (budget preflight,
   UsageObservation/CostRecord, confirmed|estimated|unknown). M11B routing does not block D45.
6. M07 does not start until the spatial renderer/license spike and M17/M12/M16 contracts are
   accepted. The superseded F Track is never an alternate gate.
7. M09/M18/M19 each start from exact ArtifactRef/capability/workflow/view contracts and may be
   promoted independently after a real native output loop.
8. M10/M11B/M12-distribution cannot create alternate jobs, memory, capability, or usage stores to
   bypass earlier gates.

## 6. Active Blockers

| ID | Blocker | Owner | Affects |
|---|---|---|---|
| BLK-001 | Clean v0.11 monorepo replace + launch evidence + TS contract parity still open (ledger/text freezes started). | Lead | W0.1/M01 Lead In Progress; W1 and every Worker wave Locked |
| BLK-001a | M11A text freeze complete (`w0.1-m11a-1`); implementation still W2. | Lead | Informational reduction of cost-vocabulary uncertainty |
| BLK-002 | Product/internal namespace is unresolved; plugin/storage API identifiers cannot freeze. | Lead/Owner | M05/M12/M16 and external compatibility |
| BLK-003 | Required Browser/Spatial/Media/Panel/Web/Deck adapter spikes have no recorded result. | Lead by consumer wave | M06/M07/M09/M16/M18/M19 readiness |

## 7. Historical W0 Record

The following files were previously recorded as frozen v1.2.0. They are **historical evidence**,
not authorization to implement, because canonical parity and the new product contracts are
unresolved. Treat any prose that still says “frozen at W0” as a **shape record** until W0.1
promotes a new contract version in this map and the active packet.

| File | Recorded SHA | Current interpretation |
|---|---|---|
| `contracts/action-ids.md` | `0dda5fada3bb562d9451836a753a6b6afd6c7d11` | last recorded table; known policy/action gaps |
| `contracts/protocol-stubs.md` | `21113dc36bc94e83e5ce381c52180a9bc7c03eb4` | last recorded stub; lacks workflow/view/artifact contracts |
| `contracts/identity-tags-permission-matrix.md` | `e3a7c3b6b6d3f034a30f7ad3e108737aed1364c6` | last recorded matrix; AgentSeat projection still needs re-freeze |

## 8. Promotion Rules

- Only the Lead changes a gate to Ready or capability status to usable.
- A Worker cannot self-declare a dependency satisfied.
- Documentation-only changes never promote capability status.
- A module below `execution-ready` cannot receive an implementation packet.
- Real behaviour, restart, permission, evidence, Agent parity, and failure recovery are required
  before usable; tests/typecheck alone are insufficient.
