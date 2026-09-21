# Project = Workspace and Remote Connections

> **Status:** recovered design rationale, not a release contract. P6–P9 in
> [Decisions](../02-DECISIONS.md) are authoritative. Page status belongs to
> [Page Architecture](../12-PAGE-ARCHITECTURE.md), sequencing to the
> [Roadmap](../05-ROADMAP.md), and implementation acceptance to the applicable spec. Re-check current
> Craft v0.13.3 source before implementation (the current rolling Craft pin).

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

## 11. Execution-location comparison and admission

This section resolves a recurring UI ambiguity: a folder, a worktree, an SSH host, WSL, a remote Fleet
instance and a hosted cloud container are not interchangeable kinds of "location." The comparison uses only
the pinned/latest Craft source and first-party product documentation.

| Candidate | What the source actually owns | Fleet admission |
|---|---|---|
| Craft remote Workspace | A local Workspace record stores `remoteServer { url, token, remoteWorkspaceId }`; `RoutedClient` redirects remote-eligible RPCs to the selected server and translates the local Workspace ID to the remote ID. In thin-client mode, Session logic, tools and model calls execute on the remote server | **REUSE/EXTEND.** This is the existing transport and Project route. Harden target identity, grants, capabilities, health and disconnect truth; do not add a second remote Session store |
| Local folder | The Project/root and file boundary on the machine that owns the selected runtime | **REUSE.** The folder picker selects or creates the existing Workspace-as-Project authority; it is not an attachment action or a second Project record |
| Git worktree | OpenAI defines it as another checkout of the same local repository, sharing Git metadata, for isolated parallel work; setup runs when the app creates the worktree for a chat | **NEW behind the existing Task/Session runtime.** Agent-managed isolation, never a peer of Local/Remote/Cloud and never a Project authority |
| SSH host | VS Code Remote-SSH installs/runs its server, commands and workspace extensions on the SSH host, then opens a folder on that host | **RESHAPE.** SSH may bootstrap or connect a user-owned remote Fleet target. It is not "hosted cloud" and is not implemented merely because a menu item exists |
| WSL | OpenAI and VS Code treat WSL as a Windows-hosted Linux execution environment whose Linux paths, tools and terminal run inside a selected distribution | **CONDITIONAL.** Show only on Windows when a real WSL runtime/capability is detected. It is an environment of the local machine, not a universal remote target |
| Dev Container | VS Code describes `devcontainer.json` as the definition for opening a selected folder/repository inside a container; it can also layer on an SSH host | **CONDITIONAL.** Detect after the Project/target is selected; do not make it a top-level location or a new Project |
| Provider-hosted cloud | OpenAI Codex creates an isolated container, checks out a selected repository revision, runs setup, applies network policy, and returns a diff/PR. Cursor likewise separates Cloud from This Computer and Remote Machines | **NOT IMPLEMENTED and owner checkpoint.** Fleet P7/P9 currently means an owner-controlled Fleet runtime, not a Fleet-operated hosted control plane. Do not label the existing remote-server route as provider-hosted cloud |

Primary evidence:

- Craft v0.13.3 source: [`WorkspaceCreationScreen.tsx`](../../源码参考/software/craft-agents-oss/apps/electron/src/renderer/components/workspace/WorkspaceCreationScreen.tsx), [`AddWorkspaceStep_ConnectRemote.tsx`](../../源码参考/software/craft-agents-oss/apps/electron/src/renderer/components/workspace/AddWorkspaceStep_ConnectRemote.tsx), [`workspace.ts`](../../源码参考/software/craft-agents-oss/packages/core/src/types/workspace.ts), [`routed-client.ts`](../../源码参考/software/craft-agents-oss/apps/electron/src/transport/routed-client.ts), and [remote-server README](../../源码参考/software/craft-agents-oss/README.md#remote-server-headless).
- OpenAI: [local environments](https://learn.chatgpt.com/docs/environments/local-environment), [cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment), [Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees), [WSL](https://learn.chatgpt.com/docs/windows/wsl), and [Codex app announcement](https://openai.com/index/introducing-the-codex-app/).
- Cursor: [3.11 project/repository picker](https://cursor.com/en-US/changelog#3-11) and [3.0 worktree command/Agents Window](https://cursor.com/changelog/3-0).
- Visual Studio Code: [Remote-SSH](https://code.visualstudio.com/docs/remote/ssh), [WSL](https://code.visualstudio.com/docs/remote/wsl), [Dev Containers](https://code.visualstudio.com/docs/devcontainers/create-dev-container), and [remote extension architecture](https://code.visualstudio.com/api/advanced-topics/remote-extensions).

The mature pattern is consistent even when product labels differ: choose the machine/runtime boundary first,
choose a folder or repository inside that boundary second, then apply checkout or container isolation. Cursor's
latest picker makes search explicitly scoped to `This Computer`, `Cloud`, or a named remote machine and no
longer treats a global search box as if paths from different machines were comparable. OpenAI's Worktree UI
can expose a user handoff, but the underlying object remains checkout isolation under a local Project.

## 12. One execution-target authority

Fleet should extend one target registry behind Workspace routing. It must not create parallel Local, SSH,
WSL and Cloud Project stores.

```text
Session
├── workspaceId                 existing Project/Workspace authority
├── executionTargetId           immutable while running; local sentinel or registered remote target
├── workingDirectory            path interpreted only by that target
└── runtime binding             TaskRunner-owned lease, capability snapshot and isolation evidence
      ├── direct checkout
      └── managed worktree      only when the selected directory is a Git repository

ExecutionTarget
├── id, kind                    local | fleet-remote | hosted-cloud (reserved)
├── identity and transport      embedded | authenticated Fleet route | provider adapter
├── platform/capabilities       OS, path semantics, Git/worktree/container availability
├── connection truth            connecting | online | offline | expired | revoked | incompatible
└── grant reference             existing permission path; no second evaluator
```

`hosted-cloud` is reserved so future implementation cannot overload `fleet-remote`, but it must not appear
until a real provider, repository checkout path, secrets/network policy and recovery flow exist. SSH is not a
new authority record after connection: when used to install or discover Fleet on a machine, the durable result
is a `fleet-remote` target. WSL is a capability-qualified local runtime variant, not a remote Workspace.

Do not add a generic environment-adapter interface before two real adapters exist. The target capability
snapshot is enough to conditionally expose WSL, worktree or container behavior while the first implementation
lands.

## 13. New Task interaction contract

The new-task composer may show a compact context strip only while no folder has been selected. It is a
projection over the authorities above, not another creation flow.

1. **Execution target first.** Default to **This computer**. Show **Remote** when a configured user-owned
   Fleet target exists, plus one **Add remote target…** action. Do not say **Cloud** for an SSH host or a
   user-owned Fleet server. A true **Hosted cloud** row is absent until implemented.
2. **Project/folder second.** Under This computer, show recent Projects and **Choose folder…**; under a remote
   target, list Projects reported by that target. A global New Task may remain folder-less as R1 requires.
   Paths from different targets are never merged into one undifferentiated recent list. The execution-target
   and Project/folder controls use the same menu row grammar (icon slot, label, selected check and setup
   action), but remain two controls because they select different authorities. The user-facing label is
   Project or folder, never Workspace.
3. **No Worktree location row.** After a local Git directory is selected, TaskRunner may automatically create
   a managed worktree when concurrency or isolation policy requires it. Non-Git folders run directly.
4. **Make handoff contextual.** If a managed worktree exists, the task header may show its checkout/branch and
   an explicit handoff or switch action. This changes the Session's runtime binding through governed Git
   operations; it does not reselect the Project or create another Session.
5. **Capability-only environment choices.** On Windows, WSL appears only after detection and identifies the
   distribution before any Linux path is selected. A detected `devcontainer.json` may offer **Run in
   container** after Project selection. Neither is always-visible chrome.
6. **Pin after start.** Once execution begins, `executionTargetId` is pinned. Moving a running Session requires
   an explicit handoff with preflight, file/change transfer, permission re-evaluation and failure recovery;
   changing a dropdown must never silently migrate execution.

The add/context menu remains for attachments, Skills, MCP and task controls. It must not also own Project or
execution-target selection. This prevents the current collision between "attach files" and "work in a
folder," which have different authority and lifecycle semantics.

The remote branch uses progressive disclosure: the initial picker shows the named target, health and
reported Projects. URL, grant, version details, installation commands and advanced diagnostics remain in
Remote Targets settings. Repeating those administration fields in the New Task picker is a failed
simplification, not useful context.

## 14. Connection and setup surfaces

Use one progressive Remote Targets settings flow rather than four top-level connection buttons:

- **Connect existing Fleet** — URL/pairing plus grant; discover remote Projects through the current Craft
  server route.
- **Set up on another machine** — advanced SSH-assisted installation/bootstrap. SSH credentials stay in the
  platform credential store or SSH agent; after setup Fleet connects through its authenticated transport.
- **Windows local Linux** — WSL discovery belongs to local environment setup and is hidden on other systems.
- **Container** — discovered from the selected Project and target; it is not a connection account.
- **Hosted cloud** — omitted until a provider contract is approved and implemented.

The target list owns health, version, capability and grant status. The new-task picker consumes that list; it
does not perform server administration inline. If there is no configured remote target, the picker presents a
setup action and remains honest rather than offering a selectable but non-functional Cloud mode.

## 15. Backend acceptance evidence

Before any new execution location is `usable`, the implementation must prove the following non-visual path:

1. the selected Project resolves on the selected target and its path is never interpreted on another host;
2. Session create/read/resume stays on the one Session authority and preserves `executionTargetId`;
3. tool, terminal, Source, Skill and MCP calls route through the same target and permission decision;
4. Git worktree create/reuse/handoff/cleanup is recoverable and never becomes a Project row;
5. disconnect, restart, revocation and incompatible-version states prevent new mutation without erasing prior
   evidence;
6. WSL/container choices are absent when unsupported and identify their real distribution/container when
   present;
7. target handoff either completes atomically from the user's perspective or leaves the original target and
   Session recoverable.

Current status remains: Craft's remote transport is `usable`; the Fleet target/grant model, SSH bootstrap,
WSL integration, managed worktrees and provider-hosted cloud are `not implemented` unless separately proven.
