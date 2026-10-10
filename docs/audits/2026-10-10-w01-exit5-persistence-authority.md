# W0.1 Exit item 5 — persistence authority

> **Date:** 2026-10-10
> **Role:** Fleet Lead. This note records the logical persistence stance. It does not close the physical-store gate.
> **Base:** `402f3ddd8166d56f895b42fba405a62c8bd549ba` (`work/fresh-base-spine` after #57).
> **Pin:** Craft Agents OSS tag `v0.11.0` = `f4e172bf372f4ccc7389a189be1e0b0541f96282` (D51).
> **Ledger:** D54 in `docs/DECISIONS-LEDGER.md`. D52 retain rows and the D-08 SQLite deferral stay in force.
> **Capability:** documentation only. Nothing in this note is `usable`.
> **Gates:** W0.1 stays In Progress. W1 stays Locked. Exit item 5 stays open. Exit items 1, 3, and 4 stay open. `CONTRACT_VERSION` stays `1.3.0`. No action id is added.
>
> **What this does not do:** It does not run a Mac recovery, invent a `typecheck:all` pass, introduce SQLite, add a store, replace `app/`, or close W0.1. This cloud workspace still has no populated Craft checkout. No new Mac command was run for this note.

## Choice

Keep the logical authority map. Retain the Craft file-backed workspace store as the default durable layout. Leave the physical-store gate open.

`docs/PERSISTENCE-AUTHORITY-MAP.md` already gives every state class one logical owner. D52 already retains upstream projects, tasks, Kanban, `session.jsonl`, BrowserPane, `~/.craft-agent/`, the CLI, background-agent keep-alive, and the Craft shell, and it defers any SQLite decision (row D-08). D50 already keeps app storage at `~/.craft-agent/` (`CONFIG_DIR`) and refuses `~/.fleet/`.

D54 makes that the Lead stance for Exit item 5. The six checks under "Physical Store Decision Gate" in the map stay unmet. Exit item 5 stays open until a later note records Mac-verified recovery for those checks. Recording the stance is the record. It is not the recovery.

## Logical authorities

The table below is the map's authority table, copied here so this note is the Exit item 5 record. A file format is an implementation choice of that owner. It is not permission to add a second product store.

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

The completion invariant in the map still stands: a durable change is `completed` only when the native mutation, the authoritative metadata, and the invocation correlation are committed, and any lease is released or has a safe expiry. A partial commit stays `reconciling` and does not repeat an external side effect. That invariant is a rule. It is not a Mac recovery result.

M00 on this tree already states the same shape: restart reopens the same local store, and it does not create a replacement session database. `docs/modules/00-platform-spine.md` §13 records that a process restart reads `fleet_host_session_event` lines and does not rebuild in-memory turn phase. That sentence describes the 0.10.5 Fleet tree. It is not a quit/relaunch of an awaiting card on the v0.11 pin.

## What is retained from Craft

D52 retain rows R-01 through R-04, read from source at `f4e172bf`, are the physical candidates. They are files.

| Layout | Where it was read | Role |
|---|---|---|
| `{workspaceRootPath}/sessions/{id}/session.jsonl` | `packages/shared/src/sessions/storage.ts` | M00 session authority (R-03). Fleet host lines `fleet_host_session_event` append here on the current tree. |
| `{workspaceRootPath}/projects/{slug}/` with `assets/` and `MEMORY.md` | `packages/shared/src/projects/storage.ts` | Workspace project folder (R-01). M05 governs the bytes. |
| `{workspaceRoot}/tasks/<slug>/task.yaml`, `runs/<runId>/run-log.jsonl`, `nodes/<id>.json` | `packages/shared/src/tasks/storage.ts` | Upstream task files (R-02). An M17 workflow document stays a separate versioned document (D41, D53). |
| `CONFIG_DIR` = `CRAFT_CONFIG_DIR` or `~/.craft-agent/` | `packages/shared/src/config/paths.ts` | Preferences and workspace home (R-04, D50). |

The v0.11 README configuration block, recorded in `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`, stores configuration at `~/.craft-agent/` and names `config.json`, `credentials.enc`, `preferences.json`, `theme.json`, and `workspaces/{id}/` with `config.json`, `theme.json`, `automations.json`, `sessions/`, `sources/`, `skills/`, and `statuses/`. That block does not print `projects/` or `tasks/`. Those two are runtime layouts under the workspace root, from the `storage.ts` comments. They are not top-level directories of the source tree.

D50 storage prefixes that stay with this layout:

- `~/.craft-agent/` and the `CRAFT_CONFIG_DIR` override
- `preferences.json` and `config.json` inside that directory
- skill bytes at `~/.agents/skills/`, `{workspace}/skills/{slug}/`, and `{project}/.agents/skills/`
- the host record prefix `fleet_host_` inside the existing `session.jsonl`
- the Craft credential manager for secret API keys and tokens (`src/credentials/`)

`FileKernelSnapshotStore` writes `host-kernel-snapshot.json` beside `session.jsonl`. Behaviour-ledger row A-12 and M00 §13 call that file `test-only`. It is a host execution projection of that session. It is not a second session database.

These approaches stay refused, on evidence already in the repo:

- `~/.fleet/` as a host home (D50)
- a Fleet-named second Projects, Tasks, Kanban, or panel product (D52 X-02)
- `.claude-plugin/loadout.json` or a new `preferences.json` key that copies plugin enablement (D49, D50)
- an independent `jobs.json`, `clips.json`, or `memory.json` authority (the map's gate text). The in-repo `{directory}/*.job.json` path described in `docs/audits/2026-10-10-spine-honesty-audit.md` is that kind of side file. This note does not promote it.

## Patterns already cited

Craft at the pin is the green-light base (`docs/REFERENCE-PROJECT-POLICY.md`, Apache-2.0, D51). The file layouts above are the reuse. Peers already compared in this repo agree on one host-owned store and disagree on a new database.

| Peer | What the prior audit already said | Stance for this note |
|---|---|---|
| Craft `paths.ts` / `storage.ts` / README | `CONFIG_DIR` is `~/.craft-agent/`. Sessions, projects, and tasks are files under the workspace. | **Retained default.** |
| VS Code extension host | `docs/audits/2026-10-10-blk002-namespace-oss.md`: extension state is `globalState`, `workspaceState`, and `secrets` on the extension host. A plugin does not pick a shared disk prefix. `docs/audits/2026-10-10-spine-honesty-audit.md`: permission and state stay in the host that owns the session. | **Reuse the lesson.** Fleet state stays in Craft preferences, the credential manager, and `session.jsonl`. |
| Claude Code | The same namespace note: sensitive `userConfig` goes to the platform credential store. The manifest directory is not the workspace authority. | **Reuse the lesson.** Secrets stay in the Craft credential path. |
| `docs/ARCHITECTURAL-COMPARISON.md` | The baseline audit already says this file is not evidence. It mentions OpenCode SQLite session persistence and an OpenClaw SQLite gateway. Versions there are unverified. | **Ignored for the store decision.** |
| Zvec | `docs/REFERENCE-PROJECT-POLICY.md` allows a black-box look at SQLite FTS5 and forbids copying the vector library or C++ bindings. | **Does not select a database.** |

No UI and no schema are copied from those peers.

## What is explicitly not decided

SQLite is not decided.

D52 row D-08 still stands: the session, project, and task stores inspected at the pin are files, and a repo-wide SQLite search on a checkout was not run. This note does not run that search. It does not name an owner, a schema, a migration, a transaction boundary, a backup, a corruption path, or an upgrade path for a database, because no database is introduced.

Also still undecided, and still inside the open gate:

- an inventory of the Craft secret store beyond the README name `credentials.enc` and the credential-manager path in D50
- which derived caches may be deleted and rebuilt
- restart reconciliation for non-final invocations, leases, ExternalJob rows, and workflow runs on the v0.11 desktop
- a native-document reference format for spatial, media, web, and deck files (those contracts stay proposed under D53)

## Recovery gaps

The six physical-store checks, against evidence that already exists. None of them closes.

| Check in the map | What is already recorded | Why the check stays open |
|---|---|---|
| 1. Which v0.11 storage APIs are retained | D52 R-01–R-04 and the file table above. | Classification from source comments and file presence. Adapt ports on `fleet/migration-from-v0.11.0` are not started. Fleet `app/` stays package `0.10.5`. |
| 2. Whether any SQLite database is introduced | D-08. The three inspected stores are files. | No repo-wide search. No owner or migration record, because none is proposed. |
| 3. Where canonical preferences and protected secrets live | README names `preferences.json` and `credentials.enc` under `~/.craft-agent/`. D50 names the Craft credential manager. R-04 says this ledger does not inventory that store. | The names are not a key list, a backup rule, or a Mac listing of those files. |
| 4. How native project documents are referenced without becoming control databases | Projects are folders. M05 governs bytes. D44 keeps content authority with the native owner. D53 leaves ArtifactRef and the native document drafts proposed. | No recovered native document on the pin shows a reference that survived restart. |
| 5. Which derived caches may be deleted and rebuilt | M00 says in-memory caches are derived. | No cache was deleted and rebuilt on the Mac pin. No list of on-disk caches was written down. |
| 6. How restart reconciles non-final invocations, leases, jobs, and workflow runs | M00: restart reads the journal and does not restore turn phase. The map's completion invariant requires a `reconciling` record when a commit cannot be atomic. | No awaiting card, lease, job, or workflow run was quit and reconciled on the v0.11 desktop. Leases, ExternalJob, and workflow runs are not frozen contracts (D53). |

### Mac observations that are not this recovery

These facts are already in the Exit 1 notes. This note cites them. It does not extend them.

`docs/audits/2026-10-10-w01-exit1-electron-launch.md` records one quit and relaunch of `electron:dev` on the pin. Three existing `session.jsonl` files kept the same SHA-256, and `projects/project/config.json` stayed 375 bytes dated Sep 12. `projects/project/` was already on disk. `ls` of `~/.craft-agent/workspaces/my-workspace/tasks` reported `No such file or directory`. Kanban, a new project, an ordinary session turn, the Settings panel, and BrowserPane were not part of that pass. `typecheck:all` remained the #52 failure (exit 2). At that launch record the migration branch was still absent.

`docs/audits/2026-10-10-w01-exit1-rpc-loop.md` records a later authenticated RPC on pid `71904` (AX title `Craft Agents`). `projects:create` wrote slug `exit1-loop-evidence-2026-10-10t14-07-27` under `~/.craft-agent/workspaces/my-workspace/projects/`. `sessions:sendMessage` on `260912-misty-tiger` persisted a user line and an assistant reply whose content was `pong`. That pass does not supply a new SHA-256. It does not record a quit after those writes.

`docs/audits/2026-10-10-w01-exit1-routes-migration.md` records later `route=board` and `route=settings` restores and an open branch `fleet/migration-from-v0.11.0`. Those restores are route restores. They are not a persistence recovery. Adapt ports are not started. `typecheck:all` remains the #52 failure.

Hash stability of files that already existed, and a create that was not followed by a recorded relaunch, leave check 6 open. The absent `tasks/` directory leaves the task layout unrecovered. This note does not claim those passes verified recovery.

## Evidence that would close the physical gate

A later Mac note on the D51 pin can close the gate by recording all six of the following. Until that note exists, Exit item 5 stays open.

1. Quit and relaunch after a project create and a session turn, then list `sessions/{id}/session.jsonl` and `projects/{slug}/` and record that both are still present. Include a created `tasks/<slug>/task.yaml` the same way. The #52 hashes and the #53 create may be the inputs. They are not this listing.
2. A repo-wide search of the pin checkout and of `~/.craft-agent/` for a SQLite database, with the command and the result written down. Zero hits keeps D-08 as "no database introduced." A hit needs one owner and the migration, transaction, backup, corruption, and upgrade behaviour before Fleet uses it. This note does not pick that owner.
3. A file-level inventory of canonical preferences versus protected secrets: which keys live in `preferences.json`, which bytes live in `credentials.enc` or the credential manager, and a statement that a plugin does not add a second secret file.
4. One native project document referenced by path under the M05 workspace, recovered after the same relaunch, with the folder remaining a document and not a control database.
5. A list of derived caches that were deleted and rebuilt from the retained files, or an explicit empty list taken from a source read on the pin.
6. One non-final invocation — an awaiting permission card, or a later lease, job, or workflow run once those contracts are frozen — quit mid-flight and relaunched to a single final outcome without a second external side effect.

`bun run typecheck:all` on this pin is still the #52 failure (exit 2, missing `tsconfig.base.json`). A passing typecheck is Exit item 1 evidence. It does not close item 5. This note does not record a pass.

## What stays open

Exit item 5 stays open. Exit item 1 stays open. Exit item 3 stays open. Exit item 4 stays open. BLK-001 and BLK-003 stay open. W1 stays Locked. Settings install, enable, and disable stay `wired` in D49 and are not `usable`.

The logical map is the stance workers must not contradict. The physical adapter is still an open gate. No module may add SQLite, `~/.fleet/`, or a second session, job, or memory store on the strength of this note.
