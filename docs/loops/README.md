# Delivery Loops — Where to Start

> **Purpose:** Numbered **closed-loop** map so agents know entry order.
> **Not a second gate:** `docs/WAVE-MODULE-MAP.md` still owns Ready/Locked.
> **Not a second maturity register:** `docs/DOCUMENT-READINESS.md` still owns execution-ready.
> **Updated:** 2026-07-09

## How numbering works

Loops are ordered by **dependency first** (what must exist before the next closed loop can be real), then by **product value of the loop**. Difficulty is tagged separately so “hard” is not confused with “do later.”

| Code | Meaning |
|---|---|
| **L0x** | Delivery loop index (start at **L00**) |
| **Wave** | Calendar/gate from WAVE-MODULE-MAP |
| **Importance** | Product leverage if this loop is missing |
| **Difficulty** | Migration, contracts, multi-module, or external engine risk |
| **Start when** | Hard entry condition (never skip) |

**Rule:** Always enter the **lowest-numbered loop that is not yet exited**. Today that is **L00**.

```text
L00 → L01 → L02 → L03A → L03B → L04 → L05
 │      │      │       │       │      │
 │      │      │       │       │      └ polish (settings/onboarding/messaging)
 │      │      │       │       └ intelligence (memory/routing/plugins)
 │      │      │       └ creative fan-out (web/deck/media)
 │      │      └ first creative proof (text→image→ArtifactRef→canvas)
 │      └ first local workbench loops (terminal/files/jobs/panel host)
 └ control plane + clean baseline (blocks everything)
```

## Master sequence

| Loop | Folder | Closed loop (one sentence) | Wave | Importance | Difficulty | Gate now | Start here? |
|---|---|---|---|---|---|---|---|
| **L00** | [L00-control-plane/](L00-control-plane/) | Clean v0.11 base + one frozen control contract + persistence authority | W0.1 | Critical | Hard | In Progress (Lead-only) | **YES — only active work** |
| **L01** | [L01-platform-action/](L01-platform-action/) | Identity/permission/timeline + same action path for human/Agent | W1 | Critical | Hard | Locked | After L00 exit |
| **L02** | [L02-local-workbench/](L02-local-workbench/) | Terminal/files/ArtifactRef/job-core/panel host usable locally | W2 | Critical | Medium–Hard | Locked | After L01 usable spine |
| **L03A** | [L03A-composable-creative/](L03A-composable-creative/) | Text → real image job → ArtifactRef → canvas/workflow (D45) | W3A | High | Hard | Locked | After L02 cores usable |
| **L03B** | [L03B-creative-fanout/](L03B-creative-fanout/) | Same artifact fans out to web / motion deck / media project | W3B | High | Hard | Locked | After L03A proof |
| **L04** | [L04-intelligence/](L04-intelligence/) | Memory/context, routing/cost, capability distribution | W4 | Medium | Medium | Locked | After L03A + stable M05/M08 |
| **L05** | [L05-polish/](L05-polish/) | Settings, onboarding, messaging as real user loops | W5 | Medium | Medium | Locked | After required L01–L04 deps |

Cross-cutting product rules (not a loop): keep reading from repo root docs —

- `docs/PROJECT-DIRECTION.md`
- `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`
- `docs/DECISIONS-LEDGER.md`
- `docs/FORBIDDEN-ANTIPATTERNS.md`
- `docs/PERSISTENCE-AUTHORITY-MAP.md`
- `docs/UPSTREAM-BASELINE.md`
- `docs/OWNERSHIP-MATRIX.md`
- `docs/WAVE-MODULE-MAP.md`
- `docs/DOCUMENT-READINESS.md`

## What lives in each loop folder

Each `Lxx-*/` folder is a **work package orientation**, not a second module store:

| File | Role |
|---|---|
| `README.md` | Loop mission, entry/exit, modules, packets, reading order, anti-skip rules |
| (later) packet links | Only when WAVE marks Ready and maturity is execution-ready |

**Module specs stay under** `docs/modules/` (stable IDs M00–M19).
**Active packets stay under** `docs/agent-packets/`.
Loop folders **assemble** them into one closed loop so you do not invent order.

## Agent entry checklist

1. Open **this file** → find the lowest loop not exited.
2. Open that loop’s `README.md`.
3. Confirm WAVE gate + DOCUMENT-READINESS for every listed slice.
4. Confirm an **active** packet exists (today: only L00 / W0.1 Lead packet).
5. Fill the three-axis status block from `AGENTS.md`.
6. If `implementation_authorized: no`, do documentation/migration only (or stop).

## Today (2026-07-09)

```text
Active loop:     L00
Worker coding:   forbidden (W1–W5 Locked; no execution-ready module)
Lead work:       docs/agent-packets/wave-0.1-control-plane-reconciliation.md
```
