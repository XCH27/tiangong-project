# Persistence Authority Map

> **Status:** binding ownership rules; W1/W2 physical policy accepted in ADR-0034 (filesystem Craft
> stores). Clean-base replace + exact ExternalJob on-disk encoding still open.
> **Updated:** 2026-07-09

## Rule

Every state class has one logical authority. A JSON/SQLite/native file format is an implementation
choice of that authority, not permission to create a second product store. Do not assume a product-wide SQLite control plane or a physical daemon. W1/W2 use retained Craft
v0.11 filesystem stores (ADR-0034). A later SQLite introduction requires a superseding ADR.

## Authority Table

| State | Logical authority | Durable requirement | Export/derived forms |
|---|---|---|---|
| sessions and messages | retained Craft/M00 session authority | preserve v0.11 compatibility | export/report only |
| permission/approval decisions | M00 | durable and correlated | filtered timeline view |
| SessionEvents/evidence index | M00 | ordered per session | report/JSON export |
| action invocation/idempotency/undo correlation | M03 using M00 persistence | durable before completed claim | diagnostic projection |
| AgentSeat/RuntimeLane/TeamRun | M00/M04 | one canonical run authority | compressed reports |
| workspace bytes | filesystem under M05 governance | atomic file semantics | snapshots/proxies |
| leases | M05 using M00 durable state | restart/expiry reconciliation | conflict UI |
| LibraryAsset/ArtifactRef metadata | M05 | version/provenance durability | manifests/previews |
| browser evidence/annotations | M06 documents via M05 | versioned artifact | screenshots/previews |
| spatial document | M07 native document via M05 | revision/migration/recovery | thumbnails/exports |
| ExternalJob | M08 using M00 execution state | provider reconciliation | panel/canvas projection |
| media project | M09 native document via M05 | revision/migration/recovery | proxy/render artifacts |
| memory | M10 through one selected memory authority | deletion/isolation proof | indexes/caches |
| usage/cost | M11 ledger | append/reconcile | reports/estimates |
| capability catalog/loadout | M12 plus canonical preferences | compatibility/audit | effective manifest cache |
| workbench layout | M16 through canonical preferences | version/migration | default layout |
| workflow definition | M17 project document via M05 | immutable versions | canvas projection |
| workflow run correlation | M17 using M00 execution state | restart reconciliation | run graph/status |
| web project | M18 workspace files/manifest via M05 | real file versions | builds/previews |
| motion deck | M19 native document via M05 | revision/migration | PPTX/HTML/video exports |

## Physical Store Decision Gate

| Item | Status | Record |
|---|---|---|
| 1. which v0.11 storage APIs are retained | **Recorded** | ADR-0034 — sessions JSONL, workspaces under `~/.craft-agent`, views.json |
| 2. SQLite for control plane in W1/W2 | **Decided: no** | ADR-0034; superseding ADR required to change |
| 3. preferences / secrets | **Retain Craft** + Fleet keys `fleet.*` | ADR-0035 |
| 4. native documents | **References via M05**, bodies native | Authority table |
| 5. derived caches | **Rebuildable** | ADR-0034 |
| 6. restart reconciliation | **Logical rule fixed**; job encoding at W2 | Completion invariant below |

Remaining before W1 Ready: clean v0.11 monorepo replace + launch evidence
(`docs/migration/v0.11-MIGRATION-LEDGER.md` §5). Module specs still must not invent independent
`jobs.json` / `clips.json` / `memory.json` authorities.

## Completion Invariant

An operation that changes durable state may be reported `completed` only when:

- the native mutation/file output is committed;
- its authoritative metadata/run state is committed;
- its invocation and evidence correlation is durable;
- any lease is released or has a safe expiry path;
- the caller receives the committed revision/output reference.

If these cannot be committed atomically, the owner persists a `reconciling` record that can reach
one final outcome without repeating an external side effect.

