# grok-4.5-00 — Index & Method

**Model:** Grok 4.5 (xAI)  
**Date:** 2026-07-09  
**Package root:** `docs/model-reviews/grok-4.5/`

---

## 1. Review Method

### Layer A — Control plane (mandatory)

Read in order:

1. `AGENTS.md`
2. `docs/START-HERE.md`
3. `docs/DECISIONS-LEDGER.md`
4. `docs/PROJECT-DIRECTION.md`
5. `docs/WAVE-MODULE-MAP.md`
6. `docs/OWNERSHIP-MATRIX.md`
7. `docs/PARALLEL-AGENT-OPERATING-MODEL.md`
8. `docs/contracts/*` (action-ids, protocol-stubs, identity-tags-permission-matrix)
9. Module specs `docs/modules/**`
10. Agent packets `docs/agent-packets/**`
11. `docs/REFERENCE-PROJECT-POLICY.md`, `docs/ARCHITECTURAL-COMPARISON.md`, `docs/OWNER-VOICE.md`

### Layer B — Code reality

- `app/package.json` (Craft 0.10.5 monorepo scripts)
- `app/packages/shared/src/protocol/*` (wire + internal-action)
- `app/packages/server-core`, `session-tools-core`, `session-mcp-server`, `messaging-gateway`
- Ownership claims vs real directory layout under `app/`

### Layer C — Reference tree

- `源码参考/README.md`
- Green-light targets: `software/craft-agents-oss`, `AionUi`, `openpencil`, `opencut-classic`, `DeepSeek-Reasonix`; plugins `open-design`, `rtk`, `codegraph`, `deepcode-cli`
- Spot-check of black-box / candidate volume vs policy

### Layer D — Cross-checks

- Name collisions (`Fleet` vs product name)
- Permission vocabulary collisions (L0–L3 vs ActionPermissionLevel vs identity tools)
- Wave status vs module status vs blocker cards
- Frozen contract claims vs file contents vs code versions

---

## 2. Confidence Levels Used in This Package

| Level | Meaning |
|---|---|
| **C1 High** | Direct contradiction between two active docs, or doc vs existing file content |
| **C2 Medium** | Strong architectural risk; route choice may be OK but is under-specified |
| **C3 Low** | Opinion / optimization; product could choose either side |

Findings marked **C1** should be treated as pre-coding blockers.

---

## 3. What “Complete” Means Here

This package is complete when it covers:

1. Product thesis health  
2. Technical route selection  
3. Contract freeze quality  
4. Wave / dependency graph integrity  
5. Ownership vs monorepo truth  
6. Reference policy vs disk inventory  
7. Prioritized modification list with target files  
8. Explicit open decisions for the owner / Lead  

It does **not** include rewritten product docs (that is a separate Lead commit series after multi-model comparison).

---

## 4. How to Diff Against Other Models

Compare other models’ packages on these axes:

| Axis | Grok file |
|---|---|
| Go / no-go | `01-executive-summary` |
| Severity ranking | `02` + `08` |
| Concrete patches | `03` + `06` |
| Reference reuse stance | `04` |
| Code gap claims | `05` |
| Naming proposal | `07` |

Prefer **intersection of C1 findings across models** as the mandatory fix set.

---

## 5. Sources Touched (Non-Exhaustive)

- Active docs tree under `docs/` (except this package at write time)
- `AGENTS.md`, root `README.md`
- `app/packages/shared/src/protocol/internal-action.ts` (CONTRACT_VERSION 1.0.0)
- `app/packages/shared/src/protocol/{types,events,dto,channels}.ts` (spot)
- `源码参考/README.md` + software/plugins listings
- Prior conversation audit notes (2026-07-09)

---

## 6. Change Control for This Package

- Append-only preferred; if revised, bump a `Revision` line in each changed file.
- Do not merge this package into product control-plane docs without Lead promotion.
