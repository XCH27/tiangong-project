# Document Registry

> **Purpose:** single map of every **active** project document: class, authority, and how to use it.
> **Updated:** 2026-07-10 (subagent handoff + git/PR delivery contracts)
> **Not a gate:** does not replace `WAVE-MODULE-MAP.md` or `DOCUMENT-READINESS.md`.
> **Legacy:** files under `docs/legacy/` are listed only as historical; never execution authority.

## How to use this file

1. Find the document class (binding / execution / navigation / historical).
2. Read **only** the files required for your role and current loop.
3. If two files appear to conflict, follow the **Authority** column and escalate to Lead.

## A. Navigation & entry (execution-orientation)

| Document | Class | Authority | Role |
|---|---|---|---|
| `START-HERE.md` | Navigation | Entry only | Human/agent onboarding |
| `loops/README.md` | Navigation | Entry order (not gate) | Numbered closed loops L00→L05 |
| `loops/L00-…` … `L05-…` | Navigation | Loop orientation | Assemble modules + packets for one loop |
| `README.md` | Navigation | Index | Docs folder index |
| `GLOSSARY.md` | Navigation | Definitions | Shared terms |
| `FRONTEND-EXPOSURE-MATRIX.md` | Execution (UI contract) | Backend→UI exposure | settings vs workbench vs none |
| `UI-COMPONENT-PACKAGE-CATALOG.md` | Research catalog | Non-binding until promoted | Future UI overhaul package shortlist |
| `verification/DOC-SET-STATUS-2026-07-10.md` | Verification | Status snapshot | Control plane vs L00 residual |
| `verification/CONTROL-PLANE-VERIFICATION.md` | Verification | Doc audit | Governance PASS; code residual explicit |
| `DOCUMENT-REGISTRY.md` | Navigation | This map | Full active inventory |

## B. Binding product & architecture

| Document | Class | Authority | Role |
|---|---|---|---|
| `DECISIONS-LEDGER.md` | Binding | **Decision truth** | Final promoted decisions D1–D46+ |
| `PROJECT-DIRECTION.md` | Binding | Product thesis | What Fleet is/is not; W1/W2 spine |
| `COMPOSABLE-WORKSPACE-ARCHITECTURE.md` | Binding | Architecture boundary | Spatial + native editors; state matrix |
| `FORBIDDEN-ANTIPATTERNS.md` | Binding | Non-goals checklist | Second systems, redlines, rejected routes |
| `PERSISTENCE-AUTHORITY-MAP.md` | Binding | State ownership | One logical authority per state class |
| `UPSTREAM-BASELINE.md` | Binding | Migration gate | Craft v0.11.0 clean base |
| `migration/ENGINEERING-STANDARDS.md` | Execution | Migration engineering norms | folders, C1–C10, trace |
| `migration/BACKEND-CONFLICT-AUDIT.md` | Execution | Conflict audit | stub vs spine blockers |
| `migration/BACKEND-VALUE-PORT.md` | Binding (D50) | Value filter | no old UI |
| `migration/v0.11-MIGRATION-LEDGER.md` | Execution | Migration evidence | retain/adapt/drop/defer + verification |
| `migration/v0.11-BASELINE-VALIDATION.md` | Execution | Baseline evidence | install/typecheck results |
| `migration/v0.11-PORT-CHECKLIST.md` | Execution | Port plan | Fleet protocol onto clean base |
| `migration/audits/**` | Execution | Adapt records | per-unit traceability |
| `contracts/w0.1-freeze-record.md` | Binding (text) | Contract freeze status | Partial W0.1 freeze |
| `contracts/m11a-usage-cost-core.md` | Binding (text) | M11A freeze | `w0.1-m11a-1` |
| `contracts/markdown-document-surface.md` | Binding (behaviour text) | Craft TipTap 文稿 | Modular block reorder + Agent gate; external checkout retired |
| `contracts/subagent-context-handoff.md` | Binding (behaviour text) | M04×M10 handoff | TaskBrief required; RunReport; no bare spawn |
| `contracts/git-pr-delivery.md` | Binding (behaviour text) | Code remote delivery | Agent-first PR protocol; not PR UI product |
| `adr/0034-physical-persistence-w1-w2.md` | Binding ADR | Persistence | Filesystem W1/W2 |
| `adr/0035-product-internal-namespace.md` | Binding ADR | Namespace | `fleet.` rules |
| `REFERENCE-PROJECT-POLICY.md` | Binding | Reuse policy | Green-light / black-box / absorb loop; points at UI package catalog |
| `adr/0032-…` | Binding ADR | Identity/tags/skills | Accepted ADR |
| `adr/0033-…` | Binding ADR | Composable workspace | Accepted ADR |

## C. Execution control plane

| Document | Class | Authority | Role |
|---|---|---|---|
| `WAVE-MODULE-MAP.md` | Execution | **Only gate source** | Locked/Ready/In Progress/Blocked |
| `DOCUMENT-READINESS.md` | Execution | **Only maturity source** | concept / contract draft / execution-ready |
| `OWNERSHIP-MATRIX.md` | Execution | Path ownership | Who may edit which paths |
| `PARALLEL-AGENT-OPERATING-MODEL.md` | Execution | Coordination | Pre-flight, packets, Bridge, Completion |
| `DEVELOPMENT-PROCESS.md` | Execution | Process | Layers, usable promotion, validation |
| `BOARD-SYNC.md` | Execution (human/Lead) | Status cards | Does **not** override WAVE-MAP |
| `agent-packets/*` (active only) | Execution | Work grant | Exact allowed files; currently W0.1 Lead |
| `modules/*` | Execution specs | Behaviour intent | Not permission to implement alone |
| `contracts/*` recorded v1.2 | Recorded baseline | Historical shape | Implement only after re-freeze + packet |
| `contracts/composable-workspace-contracts.md` | Proposal | Not frozen | W0.1 change proposal only |

## D. Feedback staging (non-binding until promoted)

| Document | Class | Authority | Role |
|---|---|---|---|
| `HUMAN-FEEDBACK-LOG.md` | Staging | Non-binding | Raw owner feedback |
| `OWNER-VOICE.md` | Staging | Non-binding | Translated intent; cites HFL |

## E. Historical (read-only)

| Location | Class | Rule |
|---|---|---|
| `legacy/**` | Historical | Never open a wave; never override DECISIONS/WAVE |
| `legacy/ARCHITECTURAL-COMPARISON.md` | Research draft | Nonbinding; topology claims may conflict with D38 |
| `legacy/agent-packets/*` | Superseded packets | Authorize nothing |
| `legacy/PROJECT-DIRECTION-HISTORICAL-TOPOLOGY.md` | Superseded topology | Bun/daemon/SQLite draft only |
| `ARCHIVE-LOG.md` | Process log | Why items were archived |

## F. Forced root summary

| Document | Class | Role |
|---|---|---|
| `AGENTS.md` (repo root) | Execution summary | Forced short read; must not invent a second rule universe |

## Authority conflict rule

| Conflict | Winner |
|---|---|
| Any doc vs `DECISIONS-LEDGER.md` on a decided topic | DECISIONS-LEDGER |
| Any doc vs `WAVE-MODULE-MAP.md` on Ready/Locked | WAVE-MODULE-MAP |
| Any doc vs `DOCUMENT-READINESS.md` on maturity | DOCUMENT-READINESS |
| Loop card vs WAVE-MAP | WAVE-MAP |
| Board card vs WAVE-MAP / READINESS | WAVE-MAP / READINESS |
| Legacy / research vs any active binding/execution doc | Active doc |
| OWNERSHIP path missing or unassigned | Lead must update matrix; Worker stops |

## Current global snapshot (2026-07-09)

| Fact | Value | Source |
|---|---|---|
| Active loop | L00 only | `loops/README.md` |
| W0.1 / M01 Lead gate | `In Progress` + `blocked_by: BLK-001` | `WAVE-MODULE-MAP.md` |
| Worker implementation waves | Locked | `WAVE-MODULE-MAP.md` |
| M11A usage/cost core | W0.1 freeze + W2 implement (not W4) | `modules/11-…` §2 |
| Modules at execution-ready | **None** | `DOCUMENT-READINESS.md` |
| Active packet | W0.1 Lead-only | `agent-packets/` |
| Parallel Worker coding | **Forbidden** | above |
| Verification status | **PARTIAL PASS** | `verification/CONTROL-PLANE-VERIFICATION.md` |

## Completeness note

This registry inventories **active control and orientation docs**. Module bodies remain
`contract draft` until L00 exits and each slice is promoted — inventory ≠ implementation-ready.
