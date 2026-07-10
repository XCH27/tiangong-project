# ADR-0034 — Physical Persistence for W1/W2

> **Status:** Accepted for W1/W2  
> **Date:** 2026-07-09  
> **Decision source:** v0.11.0 clean-tree inspection + D38 / PERSISTENCE-AUTHORITY-MAP  

## Context

W0.1 required a physical store decision before inventing SQLite or per-module JSON authorities.
Inspection of Craft Agents OSS **v0.11.0** (`f4e172bf…`) shows filesystem-based persistence:

- sessions: workspace-scoped JSONL (`sessions/{id}/session.jsonl`)
- workspaces: `~/.craft-agent/workspaces/` + per-workspace rootPath
- views: `{workspace}/views.json`
- no mandatory control-plane SQLite as the session authority in the inspected baseline paths

## Decision

For **W1/W2**:

1. **Retain** Craft v0.11 filesystem persistence APIs for sessions, workspaces, preferences, and
   views as the default physical layer under M00 logical authority.
2. **Do not introduce** a second session/permission/timeline database.
3. **Do not introduce** product-wide SQLite for control plane in W1/W2 unless a later ADR replaces
   this one with schema/migration/backup/corruption plan and single owner.
4. Fleet-owned metadata (invocation correlation, leases, ExternalJob, M11A usage/cost rows) must
   attach to **M00-selected durable stores** or explicit single-owner tables under the same
   filesystem authority — never `jobs.json` / `memory.json` / `clips.json` as independent product
   stores (PERSISTENCE-AUTHORITY-MAP ban).
5. Native documents (design/media/web/deck) remain files under M05 governance; control plane stores
   **references**, not full document bodies.
6. Derived caches may be deleted and rebuilt; they are never authority.
7. Restart reconciliation uses `reconciling` / non-final statuses per PERSISTENCE completion
   invariant (especially ExternalJob and leases).

## Consequences

- Module specs may describe logical recovery without inventing new DB products.
- Porting Fleet protocol types to clean base must use workspace/session filesystem seams.
- Future SQLite (if any) needs ADR superseding this one before W1 implementation of that store.

## Evidence

- `packages/shared/src/sessions/storage.ts` (v0.11.0) — JSONL sessions  
- `packages/shared/src/workspaces/storage.ts` — `~/.craft-agent` workspaces  
- `packages/shared/src/views/storage.ts` — `views.json`  
- D38 — no physical daemon prerequisite for W1/W2  

## Not decided

- Exact on-disk encoding for ExternalJob rows (single owner still M08+M00; format chosen at W2
  implementation with packet evidence).
- Memory engine physical adapter (M10 / W4).
