# Forbidden Anti-Patterns

> **Authority:** binding non-goals and second-system bans for active development.
> **Updated:** 2026-07-09
> **Write authority:** Lead only.
> **Sources:** `DECISIONS-LEDGER.md`, `PROJECT-DIRECTION.md`, `COMPOSABLE-WORKSPACE-ARCHITECTURE.md`,
> `PERSISTENCE-AUTHORITY-MAP.md`, ADR-0033. This file is the single checklist Agents must scan
> before inventing architecture. Product thesis and positive design remain in the source docs.

Use this list to refuse work. Do not re-derive a parallel non-goals section that weakens these bans.

## 1. Second-Truth Systems (always forbidden)

| Forbidden | Binding reason | Prefer |
|---|---|---|
| Second session store or chat system beside Craft/M00 | D16, D18, M00 | Single session authority |
| Second permission / approval path (UI-only, workflow-only, Agent-only) | D7, D12, D40 | M00 decisions + M03 dispatch |
| Second memory database or silent shadow memory | D2 | One M10 authority when that wave opens |
| Second job / cost / usage ledger for the same work | D9, D36 | M08 jobs; M11 enriches, does not fork |
| Second artifact / file content store that duplicates M05 bytes | D15, D44 | `ArtifactRef` + native owners |
| Second UI shell or workbench that replaces Craft shell | D27-R, D42 | M16 registration inside retained shell |
| Porting old Fleet / fleet-old **UI design** (skins, experimental pages, display-only panels) as the product look | D50 | Clean Craft v0.11 shell + new surfaces; backend-only ports from old trees |
| Second timeline / audit stream | D7, M00 | Ordered `SessionEvent` only |
| Canvas or panel as authoritative job/document store | D39, D42, ADR-0033 | Projection only; native owners keep content |

## 2. Product and Compliance Redlines

| Forbidden | Binding reason |
|---|---|
| Quota bypass, stealth browser, anti-detection, cookie/token theft, ToS-evasion product work | D4, D10, D23, D30 |
| Fleet account / login / subscription business in the active route | D26 |
| Fake completed features that are display-only or stub-only presented as usable | PROJECT-DIRECTION quality bar |
| Copying unapproved or black-box reference source as if green-lit | D20, D24, `REFERENCE-PROJECT-POLICY.md` |
| Universal `DesignPatch` that edits code, design, browser DOM, and video with one internal model | D14, D18 |
| Treating remote web pages as editable design documents via DOM mutation | D6, D10 |

## 3. Architecture Mis-routes (rejected)

| Forbidden | Binding reason |
|---|---|
| Embed full live Chromium / design / video / deck editors in every canvas node | COMPOSABLE §1, §13 |
| Fixed nine-type (or fixed media-node) canvas union as the whole product | ADR-0033; DOCUMENT-READINESS Fable boundary |
| OpenPencil (or any design editor) assumed as universal M07 spatial host | D43 |
| Visual Space-mode connector treated as executable workflow edge | COMPOSABLE §6 |
| Workflow runner with its own permission/runtime platform beside M00/M03/M04/M08 | ADR-0033 rejected #3 |
| Physical long-lived daemon as W1/W2 prerequisite | D22, D38, PROJECT-DIRECTION § Binding W1/W2 spine |
| Independent `jobs.json` / `clips.json` / `memory.json` authorities before persistence ADR | `PERSISTENCE-AUTHORITY-MAP.md` |
| Timeline sequence used as document conflict algorithm | COMPOSABLE §12; contract invariants |
| Silent last-write-wins on concurrent document mutation | COMPOSABLE §12 |
| Arbitrary workflow cycles / general programming language in v1 workflows | D41; COMPOSABLE §13 |
| Full-fidelity animated PowerPoint compatibility promises | D46 |
| External plugin distribution before built-in capability manifests work | COMPOSABLE §13 |

## 4. Process Anti-Patterns (coordination)

| Forbidden | Correct action |
|---|---|
| Worker edits Lead-owned protocol / frozen contracts | Contract change request to Lead |
| Implementation while gate is Locked or maturity &lt; execution-ready | Stop; report to Lead |
| Self-promote capability to `usable` | Lead only, after real behaviour |
| Infer ownership from a broad parent glob when path is unassigned | Lead updates OWNERSHIP-MATRIX / packet |
| Follow superseded packets or `docs/legacy/` as execution authority | Active packet + WAVE-MAP only |
| Use research drafts (including archived architectural comparison) to open a wave or choose topology | `UPSTREAM-BASELINE.md`, DECISIONS, ADRs only |
| Collapse capability / gate / maturity into one informal status word | Three-axis block in `AGENTS.md` |

## 5. How to Use

1. Before proposing architecture, scan §1–§3.
2. Before editing files, scan §4 and `OWNERSHIP-MATRIX.md`.
3. If a module spec appears to require a forbidden item, **do not implement**. Escalate with a `[DECISION NEEDED]` note; Lead updates DECISIONS-LEDGER if the ban changes.

Positive product direction, delivery phases, and state matrices stay in:

- `docs/PROJECT-DIRECTION.md`
- `docs/COMPOSABLE-WORKSPACE-ARCHITECTURE.md`
- `docs/PERSISTENCE-AUTHORITY-MAP.md`
- `docs/DECISIONS-LEDGER.md`
