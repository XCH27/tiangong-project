# Project = Workspace and Remote Connections

> **Status:** recovered design rationale, not a release contract. P6–P9 in
> [Decisions](../02-DECISIONS.md) are authoritative. Page status belongs to
> [Page Architecture](../12-PAGE-ARCHITECTURE.md), sequencing to the
> [Roadmap](../05-ROADMAP.md), and implementation acceptance to the applicable spec. Re-check current
> Craft v0.11 source before implementation.

## 1. Owner direction and fixed decisions

The owner explicitly chose a simplified Craft fork: the user-facing **Project is the Workspace**. The
exact source statements remain in [Owner Voice](OWNER-VOICE.md); this record stores their engineering
interpretation.

- **P6:** expose one work boundary named Project; retain Craft Workspace as the backend authority.
- **P7:** connect a remote Project directly to another user-owned Fleet instance; no Fleet account or
  central control plane.
- **P8:** remove silent dependencies on Craft-operated services; use local, user-configured, or honestly
  disabled behavior.
- **P9:** cloud mode is the same Fleet runtime on owner/team-controlled hardware, reached through P7.

Nested Craft Projects are upstream compatibility data, not Fleet's long-term product authority.

## 2. Why the boundary collapses

Craft currently presents Workspace and nested Project as two layers even though both describe a repository,
client engagement, product, or durable work environment. The duplication creates two selectors, inconsistent
navigation, both `workspace` and optional `projectId` on Session, renderer-side filtering, and confusing scope
for Sources and Skills.

Fleet's user model is one root:

```text
Project (implemented by Craft Workspace)
├── Sessions and tasks
├── Sources and Skills
├── labels, statuses, and automations
├── working directory and files
├── assets and MEMORY.md
└── settings and permissions
```

This matches Craft CLI's workspace-directory model and local evidence from AionUI and Hermes. The selected
project directory is the file, permission, and context boundary; Fleet extends Craft's proven Workspace
implementation instead of adding another store.

## 3. Product shape

The sidebar should expose New Session, the unified work surface, labels, Sources, Skills, automations, a flat
Project list, and settings. A Project row switches the active Workspace. Sessions appear in the unified list
or board, not duplicated beneath each Project row. Local and remote Projects share the list; grouping appears
only when remote connections exist.

The unified work surface shows the active Project's sessions/tasks. List and board are projections of the
same Session data. Global search may find work across Projects, but the UI must not imply one transactional
database across unrelated local and remote stores.

A Project home may show overview, recent sessions, files/assets, reviewed memory, and settings. Ordinary
switching and session opening must not require navigating through that page.

These are design constraints, not claims that the pages are implemented.

## 4. Single backend authority

| User concept | Existing authority |
|---|---|
| Project | Workspace config plus root path |
| Project sessions | `SessionManager.getSessions(workspaceId)` |
| Sources and Skills | current Workspace configuration |
| Labels, statuses, automations | current Workspace configuration |
| Files | Workspace root or configured working directory |
| Assets and reviewed memory | Workspace-scoped paths |
| Current Project | active Workspace/window mapping |
| Permission | existing Workspace and Source permission chain |

Do not create `ProjectStore`, another permission evaluator, or another remote Session store. After migration,
the old shared-project package is compatibility code only; board/task scope follows Workspace and new writes
stop depending on `session.projectId`.

Project-only metadata that survives P6—such as description, color, assets, reviewed memory, or board
configuration—must extend WorkspaceConfig or a Workspace-owned path. It must not recreate nested ownership.

## 5. Compatibility migration

Migration must be previewable, non-destructive, and preserve sessions and files.

- **No nested Project:** the Workspace becomes the user Project directly.
- **One nested Project:** merge compatible metadata and bindings into the Workspace after conflict preview;
  archive legacy data only after verification.
- **Multiple nested Projects:** require explicit owner selection. Offer separate Workspace creation or a
  reviewed merge; never silently flatten working directories, assets, memory, or Session bindings.

During compatibility reads, resolve legacy `projectId` without writing new nested ownership. The preview must
list affected sessions, assets, memory, working directories, conflicts, and the recovery path.

## 6. Remote Projects

Remote connection is a second role on the existing Fleet runtime:

```text
Fleet client
   └── authenticated direct transport
          └── user-owned Fleet runtime
                 ├── Workspace/Project authority
                 ├── SessionManager and TaskRunner
                 ├── existing permissions
                 └── local or configured execution adapters
```

Craft already contains the reusable spine: embedded server, WebSocket lifecycle, handshake/heartbeat,
reconnect, headless operation, remote workspace routing, Session/Task authority, and local permissions.
Extend these components. Do not add a Multica-style central server, daemon, PostgreSQL control plane, queue,
or workspace database.

Multica remains product evidence for named expiring tokens, creation-time-only secret display, browser-first
pairing with advanced manual setup hidden, true online/offline/last-seen status, and revocation UX. Its generic
personal access token and multi-tenant control plane are not Fleet's target.

## 7. Access grants and execution truth

A remote credential is an access grant, not merely a transport token. A future representation may need a
hash, name, target/project scope, capabilities, creation/expiry/revocation timestamps, and last-used evidence.
The exact interface belongs to the R14 spec and must be extracted from the existing permission path.

Required behavior:

- show a secret once; persist only a secure hash or platform credential reference;
- scope and expire grants; make revocation immediate for new operations;
- show `connecting`, `online`, `offline`, `expired`, `revoked`, and `incompatible` from real transport state;
- distinguish last-known data from live data;
- pin a Session to an `executionTargetId`; never migrate execution silently;
- require an explicit handoff for target migration;
- invalidate stale observations and grants before action;
- preserve immutable prior evidence after disconnect or revocation.

Disconnect removes the active route and new authority to act. It does not erase the user's remote data or
rewrite historical evidence.

## 8. Settings surface

The Remote Targets settings page should support:

- add by browser pairing or explicit server address plus grant;
- list user-owned instances and their Projects;
- select Projects to add without asking for internal Workspace IDs;
- inspect health, version compatibility, last seen, grant scope, and expiry;
- reconnect, rename the local label, revoke, and disconnect;
- reveal VPS/headless installation as an advanced flow with copyable install and start commands.

No page may imply that Fleet operates a cloud account, stores the owner's Projects centrally, or can recover
a disconnected server it does not control.

## 9. Network and security boundary

- Default to loopback/local use; remote listening is explicit.
- Require authenticated encrypted transport outside loopback.
- Bind grants to allowed Projects and capabilities.
- Reuse the existing permission decision for every remote action.
- Validate target identity, protocol version, request size, and replay/stale state.
- Rate-limit authentication and mutation endpoints and record auditable evidence.
- Never expose provider keys, raw local secrets, or unrestricted filesystem roots to a remote client.
- Headless service management belongs to the user's OS service manager, not a second Fleet daemon.

## 10. Development-order ownership

This note creates no slices or parallel queue. Canonical order is:

- P6 user language and Workspace reuse under R1 and its accepted spec;
- P8 service independence under R2;
- real Project/session/file behavior under the first production chain and later accepted suites;
- P7/P9 remote targets under R14 after the local authorities and action seam are proven.

Status must use only `usable`, `wired but not visually checked`, `display-only`, or `not implemented`.
Migration, transport, permission, disconnect, stale-state, and recovery behavior require non-visual data-path
evidence before any capability can be called `usable`; rendered look-and-feel remains owner acceptance.
