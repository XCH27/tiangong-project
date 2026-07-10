# Persistence Authority Map

> **Status:** binding ownership rules; physical storage adapters remain pending v0.11 migration
> evidence and W0.1 re-freeze.  
> **Updated:** 2026-07-09

## Rule

Every state class has one logical authority. A JSON/SQLite/native file format is an implementation
choice of that authority, not permission to create a second product store. Current documents must
not assume SQLite, a daemon, or a workspace-local control directory is present until the clean
Craft Agents v0.11 baseline is inspected and a persistence ADR records the decision.

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

Before W1 opens, the Lead must record:

1. which v0.11 storage APIs are retained;
2. whether any SQLite database is introduced and, if so, its single owner, schema migration,
   transaction boundary, backup, corruption, and upgrade behaviour;
3. where canonical preferences and protected secrets live;
4. how native project documents are referenced without becoming control databases;
5. which derived caches may be deleted/rebuilt;
6. how application restart reconciles non-final invocations, leases, jobs, and workflow runs.

Until that record exists, module specs describe logical state and recovery invariants only. They
must not prescribe independent `jobs.json`, `clips.json`, `memory.json`, or similar authorities.

## Completion Invariant

An operation that changes durable state may be reported `completed` only when:

- the native mutation/file output is committed;
- its authoritative metadata/run state is committed;
- its invocation and evidence correlation is durable;
- any lease is released or has a safe expiry path;
- the caller receives the committed revision/output reference.

If these cannot be committed atomically, the owner persists a `reconciling` record that can reach
one final outcome without repeating an external side effect.

