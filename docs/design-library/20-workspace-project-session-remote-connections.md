# Workspaces, Projects, Conversations and Remote Connections

> **Status:** supporting rationale, not a release contract or a schema proposal. [PRODUCT](../PRODUCT.md),
> P6–P9/P9-rev in [Decisions](../02-DECISIONS.md), and the exact statements in
> [Owner Voice](OWNER-VOICE.md) govern this note. [R1](../specs/R1-one-boundary-language.md) owns the shell/context contract; [Non-negotiables](../03-NON-NEGOTIABLES.md) owns authority and remote-access boundaries.
> Current `app/` tracks Craft v0.13.4. Earlier Fleet implementation claims do not survive the rebuild.

## 1. Owner direction and fixed decisions

- **P6 revised, 2026-09-22:** retain visible Workspaces, each with independent Projects,
  Conversations and tool configuration. A Project references a directory; two Workspaces may
  reference the same directory without sharing their conversation/configuration state.
- **P7/P9-rev:** connect directly to another user-owned Fleet instance through the existing Workspace route.
  The host supplies an access link; the client supplies a name and that link. There is no Fleet account,
  central control plane, relay, or separate network-mode choice.
- **P8:** remove silent dependence on Craft-operated services; preserve local behavior and honest failure.
- **P9 / OV-008:** execution choices are **Local / Cloud**. Cloud means a user-owned Fleet runtime;
  worktree isolation is agent-managed and never a peer location preset.

## 2. Boundary and source rationale

Workspace owns configuration and routing; Project owns a membership referencing a working folder;
Session owns a conversation. These existing Craft authorities remain distinct. Selecting a Project
never switches Workspace. Project filters change visible rows, never execution context. Shared files
are intentionally shared when two memberships reference one directory; transcripts and loadouts are not.

Cindy's `CCAgentSidebarUpper.tsx` and ZCode's `WorkspaceSidebarItem.tsx` supply inline Project groups,
hover actions and context menus. ZCode's ConversationTimeline/SessionPane supply the empty composer
arrangement and independent Plan/permission and model/reasoning controls. Cindy's unified model
panel supplies search, category rail, grouped rows and configure footer. Craft supplies tokens,
primitives, the panel stack and command/event paths. Exact source
revisions and admission limits are in [R1](../specs/R1-one-boundary-language.md).

## 3. Product shape

One left sidebar contains Project groups and folderless Conversations. Board has its own entry and
projects existing Task/Session records. Tools use a contextual right panel with Session-scoped tabs,
not a vertical rail or a second left navigator. Resource settings may have list/detail content without
duplicating the work list.

Manual backlog/todo/done categories belong to Board. Conversation activity is automatic: running,
error/paused, or no marker. Permissions, credentials and plan waits require attention; a successful
reply clears old failures. Collapsed Project headers aggregate the same child scope. Unread/pinning
remain reading/organization properties, not additional runtime phases.

## 4. Single backend authority

| Concern | Existing authority |
|---|---|
| Workspace identity, configuration and remote routing | Workspace store and RoutedClient |
| Project membership, assets and folder reference | Workspace-scoped Project store |
| Conversations and tasks | Session/Task stores and lifecycle |
| Sources, Skills and settings | existing global, Workspace and Session scopes |
| Files | referenced folder on the executing host; Session directory for folderless work |
| Permissions and credentials | existing permission and host credential paths |

## 5. Compatibility

No Workspace/Project collapse or record migration is authorized. Retain IDs, assets, files and old
routes. Existing saved status-based sidebar filters must not silently hide Conversations after the
status menu is removed. A membership removal must preserve its referenced working folder. Resource
asset deletion retains the existing explicit confirmation. No historical patch is restored wholesale.

## 6. Remote Projects

Craft already provides the embedded/headless server, WebSocket lifecycle, remote Workspace routing and
Session/Task execution path. Extend that route: the client displays the work, while the connected host owns
its Workspace files, tools, model calls and credentials. A controller's selected provider or account must not
silently replace the remote host's configuration.

The same connection contract applies to a home computer and a VPS. An installation or networking mechanism
used outside Fleet does not become another Project type, control service or connection authority.

## 7. Access grants and execution truth

P7 and [Non-negotiables](../03-NON-NEGOTIABLES.md) require explicit, scoped and revocable remote access,
separate from the host's internal server token. Grant representation and enforcement must extend the
existing permission path; this note does not predeclare their stored fields.

The UI must distinguish live transport state from last-known data. A running Session remains bound to its
executing host; changing a selection must never silently move it. Any supported handoff must be explicit,
permissioned and recoverable. This is a behavioral requirement, not a new Session identifier or registry.
Disconnect or revocation blocks new unauthorized operations while preserving prior evidence and remote data.

## 8. Settings surface

P9-rev owns the **Remote connection** flow: host access link, client name plus link, and selection of Projects
reported by that host without asking the user for internal Workspace IDs. Health, compatibility, grant state,
reconnect and revocation belong to that connection's existing settings path.

The flow does not introduce an SSH installer, browser-pairing alternative, network-mode selector or separate
“advanced connection” product. Nor may it imply that Fleet operates the host or can recover its credentials.

## 9. Network and security boundary

The binding boundary is [Non-negotiables](../03-NON-NEGOTIABLES.md): explicit remote admission at both
ends, the existing permission decision, protected credentials, and truthful refusal/recovery. Remote access
must not expose unrestricted filesystem roots or reinterpret a path on a different host. OS service
management remains outside Fleet's application authority. P9-rev excludes a second file-sync protocol over
the pairing connection; Git/GitHub delivery follows the existing OpenChamber-derived contract.

## 10. Development-order ownership

[WORK-ORDER](../WORK-ORDER.md) and the [Roadmap](../05-ROADMAP.md) own sequencing. The current owner order
starts with inherited Craft capability/service rectification and baseline acceptance, before the Component
host and added capabilities. This note creates no alternate queue or prerequisite.

## 11. Execution-location comparison and evidence

Reference products distinguish the machine that executes work from the folder and checkout used there.
That distinction is useful evidence for host/path isolation; their menus, registries and terminology are not
Fleet requirements.

| Evidence | Relevant distinction |
|---|---|
| Craft remote Workspace | `remoteServer` on the existing Workspace identifies its server and remote Workspace. `RoutedClient` uses that mapping for Workspace RPC. |
| Local folder | A path belongs to the machine whose runtime opens it; choosing it is not attaching a file or creating a second Project authority. |
| Git worktree | Another checkout provides repository isolation; it does not identify another executing machine. P9 keeps its lifecycle agent-managed. |
| SSH, WSL and Dev Containers references | Connection/setup and runtime isolation are different concerns. Their existence elsewhere does not admit corresponding Fleet UI or adapters. |
| Provider-hosted cloud references | These products operate a different execution service. Fleet's user-owned Cloud wording does not promise such a service. |

Source pointers:

- Craft source: [`WorkspaceCreationScreen.tsx`](../../源码参考/software/craft-agents-oss/apps/electron/src/renderer/components/workspace/WorkspaceCreationScreen.tsx), [`AddWorkspaceStep_ConnectRemote.tsx`](../../源码参考/software/craft-agents-oss/apps/electron/src/renderer/components/workspace/AddWorkspaceStep_ConnectRemote.tsx), [`workspace.ts`](../../源码参考/software/craft-agents-oss/packages/core/src/types/workspace.ts), [`routed-client.ts`](../../源码参考/software/craft-agents-oss/apps/electron/src/transport/routed-client.ts), and [remote-server README](../../源码参考/software/craft-agents-oss/README.md#remote-server-headless).
- OpenAI: [local environments](https://learn.chatgpt.com/docs/environments/local-environment), [cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment), [Git worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees), [WSL](https://learn.chatgpt.com/docs/windows/wsl), and [Codex app announcement](https://openai.com/index/introducing-the-codex-app/).
- Cursor: [project/repository picker](https://cursor.com/en-US/changelog#3-11) and [worktree command/Agents Window](https://cursor.com/changelog/3-0).
- Visual Studio Code: [Remote-SSH](https://code.visualstudio.com/docs/remote/ssh), [WSL](https://code.visualstudio.com/docs/remote/wsl), [Dev Containers](https://code.visualstudio.com/docs/devcontainers/create-dev-container), and [remote extension architecture](https://code.visualstudio.com/api/advanced-topics/remote-extensions).

These retained citations are comparison sources, not a claim of a fresh external-document audit or that a
referenced feature is implemented in Fleet. Recheck the relevant source when implementing an admitted slice.

## 12. Existing Workspace routing

Workspace remains the configuration and remote-routing authority; Project remains a scoped membership. Session create, read, resume and execution
must resolve through that same boundary. The executing host owns path interpretation and runtime state;
the local window consumes routed events. No separate execution-target registry, reserved provider kinds or
new persisted Session fields are authorized by this note.

The running-Session host binding and explicit-handoff requirement in §7 must be proven through the existing
lifecycle. The owning implementation contract determines any necessary data changes after that trace.

## 13. New Task interaction contract

[R1](../specs/R1-one-boundary-language.md) owns one creation flow with a Project/folderless picker inside the active Workspace. P9 and OV-008
supply the **Local / Cloud** labels; P9-rev supplies the remote connection flow. Cloud means a configured,
user-owned Fleet runtime and must not appear as an unusable placeholder before the path is implemented.

The selected Project and folder must belong to the selected host. Keep that relationship explicit without a
second Project picker, a worktree mode, or new SSH/WSL/container/hosted-cloud menus. Folder-less work remains
legal under R1. Choosing a location does not create a parallel model or authentication scope and does not
move an already-running Session.

Use the same composer in draft and normal conversations. Put Project/context immediately above it;
put supported attachments/Sources/context actions in the add popup, permission at bottom left and
separate model/reasoning controls at bottom right. R1 owns the independent Plan plus three-permission
contract, validated submission snapshot and Cindy model popup. These are target behaviors;
the restored Craft callbacks do not yet implement them.

## 14. Connection and setup surfaces

New Task consumes the existing connection and Workspace state; it does not repeat server administration.
When a remote connection is needed, use the same Remote connection settings flow described in §8. Connection
failures, revoked access and unavailable Projects must be distinguishable from an empty local Project.

Home-computer and VPS connections use the same host-link/client-name-and-link interaction. Any underlying
transport detail remains an implementation concern; this note adds no alternate onboarding branch.

## 15. Backend acceptance evidence

The owning remote slice must prove:

1. the chosen Project, folder and file operations resolve only on the owning host;
2. Session create/read/resume and events use the existing Workspace/Session route, without silent host changes;
3. tools, Sources, Skills, model connections and credentials use the executing host's applicable context and
   the existing permission path;
4. disconnect, restart, revocation and incompatible versions refuse invalid new work without erasing evidence;
5. any supported handoff either completes with explicit permission and recovery evidence or leaves the
   original Session recoverable.

Current inherited remote transport is **`wired but not visually checked`**. Fleet's scoped remote grants and
their lifecycle are **`not implemented`** after the v0.13.4 rebuild. A loopback startup check does not prove
cross-machine authentication, context isolation, disconnect recovery or the owner-facing connection flow.
