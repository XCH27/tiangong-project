# Persistence Authority Map

> **SUPERSEDED 2026-10-10 (D56):** Historical only. Not a product gate. ZCode-first supersedes the Craft layouts in this map.
>
> Craft `~/.craft-agent` layouts below are reference. ZCode persistence is product authority when present. This banner does not add a store, decide SQLite, bump `CONTRACT_VERSION`, mark Ready or `usable`, or edit `app/`. Detail: `docs/audits/2026-10-10-zcode-residual-supersede.md`.

> **Status:** binding ownership rules for the historical Craft map. D54 records this table as the Lead stance on that map. The physical-store gate below stays open until Mac-verified recovery. It is not the ZCode product authority.
> **Updated:** 2026-07-09. Decision footnote 2026-10-10 (D54).
> **Inspection footnote (2026-10-10):** At pin `f4e172bf`, sessions are `{workspace}/sessions/{id}/session.jsonl`, projects are `{workspace}/projects/{slug}/`, and tasks are `{workspace}/tasks/<slug>/task.yaml` plus a run log. `CONFIG_DIR` is `~/.craft-agent/`. Those three stores are files. A repo-wide SQLite search on a checkout was not run. The decision gate below stays open (D51, D52, D54).
> **Decision footnote (2026-10-10, D54):** The authority table is the Lead stance. The retained physical candidate is the Craft file layout named above. SQLite is not decided. Exit item 5 stays open. Detail: `docs/audits/2026-10-10-w01-exit5-persistence-authority.md`.

## Rule

Every state class has one logical authority. A JSON/SQLite/native file format is an implementation
choice of that authority, not permission to create a second product store. Current documents must
not assume SQLite, a daemon, or a workspace-local control directory. D54 records the
authority table as the Lead stance and leaves the physical-store gate open. The retained
physical candidate is the Craft file layout under `~/.craft-agent/`.

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

