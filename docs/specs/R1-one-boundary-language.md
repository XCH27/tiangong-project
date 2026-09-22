# R1 — Workspaces, one sidebar, contextual tools and composer

**Owner-authorized implementation slice, 2026-09-22.** This replaces the former Workspace/Project
collapse and preparation-only restriction for this scope. R0 still owns overall baseline exit.
The owner's subsequent composer clarification includes independent planning and action permission,
separate model/reasoning controls, and a Cindy-style model popup. These are behavioral changes,
not a relabeling of Craft modes. R1-specific behavior is **`not implemented`** after the rollback;
the source comparisons below describe the target, not evidence of a running implementation.

## Product contract

1. Workspace stays visible and owns Conversations, Project memberships, Sources/MCPs, Skills and
   component overrides. Keep the existing stores. Project selection does not switch Workspace.
2. A Project is a Workspace-scoped record referencing a working folder. The same folder can belong
   to two Workspaces. Files are shared; transcripts, assets/context, activation and grants are not.
   Removing a membership must never delete the referenced folder. Existing folderless records survive.
3. One left sidebar contains the work list, grouped by Project, and folderless Conversations. Keep
   search, archive/restore, labels, rename, pin, delete and multi-selection through native paths.
   Empty Projects remain reachable. Remove the old separate left navigator column and its resize rail.
4. Board has its own entry. Remove both list/Board switches; retain native Task/Session persistence,
   card editing and old Board deep links. Board never becomes another conversation store.
5. The contextual right panel follows Cindy's `RightSidebarShell` + `TabBar`: Session-scoped tabs,
   an add menu, active/close/reorder actions, and a body for each supported kind. Extend Craft's
   existing panel/layout owner to store this state; Craft currently has no mounted Session tab host
   or per-Session tab persistence. Reuse `PanelStackContainer`, rather than importing Cindy's store.
   The existing new-session-panel and browser-window commands move to this area; browser remains a
   native window until the browser embedding slice is implemented. A command opening a window is
   not advertised as an embedded tab. Do not migrate/redesign Sources, Skills, Pages, automations or
   Settings under this clause. Their existing routes remain reachable. R18 owns new native window
   and advanced docking behavior. Narrow mode must let the user return to the work list.
6. New Conversation uses the same Craft composer in ZCode's responsive empty-timeline arrangement:
   restrained heading, Project/context header immediately above the editor, one editor, and one
   bottom toolbar. Attachments, Sources and supported context actions share the add popup; remove
   their duplicate footer buttons. Permission stays left; model, reasoning and Send stay right.
   After the first message, the same editor returns to its normal transcript/input position.
   The detailed layout and state contract below applies to draft and normal flows. No brand artwork,
   second editor or suggested capability without a real execution path.
7. Choosing a Project for a new Conversation validates membership in the owning Workspace and binds
   the folder through the Session authority. Folderless selection clears Project and uses the Session's
   own working directory, not an implicit Project default. Reject rebinding a running/nonempty session
   through this draft-only control. Failures retain the input and report a reason.
8. Existing workspace Sources/Skills/settings remain usable. Generic Components/Plugin loading and
   distribution are not implemented by this navigation change; do not imply that visibility is activation.

9. Conversation activity is derived, never manually selected: running; error/paused (including
   permission, credential and plan waits); otherwise no marker. Explicit Stop is paused until a new
   turn; normal completion clears activity. Board retains manual workflow columns. Project headers
   aggregate the same child collection, including collapsed children. Cindy's aggregate keeps
   running and attention independently: when one child runs and another waits/fails, preserve both
   facts rather than hiding one through an invented priority. Do not import completed/unread as
   additional runtime states.
10. Sidebar footer exposes the actual connected GitHub account, connection settings and app settings.
    Account data comes from the admitted GitHub integration, not a guessed local username or a new
    authentication store. Missing connection/login/error states are explicit. Phone pairing remains not implemented. Row actions
    appear on hover, keyboard focus and touch; menus use native shared primitives and stable ordering.

## Source comparison and admission

| Evidence | What is admitted | What remains excluded |
|---|---|---|
| Craft v0.13.4 `AppShell`, `PanelStackContainer`, `SessionList`, `TopBar`, `ChatDisplay`; shared `projects/storage.ts`, `workspaces/types.ts` | Existing panel stack, grouped list, routes, command/event paths and scoped stores | Three-column navigation and Board/list toggle |
| Cindy `64e96e3a351797b1a3e305b52b6627f376dbf2b3`: `CCAgentSidebarUpper.tsx`, `features/right-sidebar/{RightSidebarShell,TabBar}.tsx`, `features/right-sidebar/{registry,store,types}.ts`, `NewMakerDraftRoute.tsx` | Project grouping in one sidebar; a Session-scoped tab host with registered bodies, add menu, active/close/reorder state and explicit folderless/project creation | Maker runtime, global layout store, browser webview replacement, fixed widths, Cindy's own RPC/schema |
| ZCode `872ad960de7ec172591f7e1952f7849229f94521`: `packages/ui/src/v4/{ConversationTimeline,SessionPane,ConversationComposer,ConversationDraftEmptyState}.tsx` | Same composer in draft and normal flows; responsive empty timeline with a top spacer; context header immediately above the input; draft-only model/context resolution | Brand artwork, CSS token system, second composer/runtime, copied ZCode backend |
| ZCode, same revision: `packages/ui/src/v4/composer/{V4ComposerModeControls,V4ComposerToolbar}.tsx`, `composerSubmissionConfig.ts`; `packages/shared/src/execution-state.ts`; `apps/zcode-cli/packages/core/src/permission/service.ts` | Independent Plan checkbox plus three permission radios; separate model/reasoning controls; validated send-time snapshot; Plan still constrains full-access mode | Four mutually exclusive modes, automatic phase router, reserved unimplemented `auto` mode, copied policy engine |
| Cindy, same revision: `apps/desktop/src/renderer/components/new-chat/{ModelSelector,UnifiedModelPanel,UnifiedModelRail,UnifiedModelRow,ModelSourceDetails}.tsx`, `composerModelSelection.ts` | Search above a category rail and grouped model list; fixed configure footer; account-scoped source details; coherent current/next-turn selection | Cindy theme variables, payment flow, engine registry, duplicated provider/preferences/usage stores, sample prices or quota |
| [Codex projects](https://learn.chatgpt.com/docs/projects), [Claude Desktop](https://code.claude.com/docs/en/desktop) | Distinct conversation context, folder association and inspectable work panels | No claim about private desktop source; no copying product modes or account dependence |

## Composer and policy contract

### Placement and add popup

ZCode's `SessionPane` supplies `contextHeader` to the same `ConversationComposer` used after Send.
Use that relationship, with Craft's spacing, colours, typography and shared popup primitives.
The new-task header chooses a Project or folderless context inside the visible Workspace. A folder
attachment is evidence; choosing a working directory changes execution context. Never merge those
actions, retain two working-folder selectors, or silently rebind an active conversation.

The add popup appears above the input where space permits, with a searchable action/context list
and grouped sections. Reuse attachment validation/upload readiness and Source/Skill selection.
Selection must create the same attachment/context record consumed by Send. Closing or dismissing
the popup preserves the draft and restores editor focus. A source requiring authentication exposes
its existing setup path; it is not marked active until setup succeeds. ZCode's Goal, Workflow and
Plugin sections are reference evidence, not permission to render unwired Fleet actions. Context
shortcuts appear only when their existing parser and selection path support them.

### Plan and action permission

The menu has an independent **Plan mode** checkbox, a separator, and three mutually exclusive
permission choices: **Confirm changes / Auto edit / Full access**. Exact `zh-Hans` labels are
`计划模式`, `变更前确认`, `自动编辑`, `完全访问`. The trigger shows permission; an active Plan marker is
separately visible. Cycling permission does not toggle Plan. Settings supplies defaults; the
composer owns the explicit Session/next-turn choice.

| Choice | Enforced behavior through the existing permission path |
|---|---|
| Plan enabled | Investigation and the governed plan artifact are allowed; implementation writes remain blocked even when Full access is selected underneath. Existing `SubmitPlan` produces one review gate. |
| Confirm changes | Reads retain current policy; file mutations require the existing approval flow. Explicit denies and source/tool policy remain effective. |
| Auto edit | Authorized file edits may proceed automatically; command execution and other side effects still use their applicable permission rules. It is not an alias of Full access. |
| Full access | Explicitly reduces action prompts in the existing authorized scope. It does not turn off Plan, overwrite Workspace policy, create grants on another host, or authorize excluded effects. |

Plan approval records the approved plan and turns off the Plan gate using the already selected
action permission. It must not automatically select Full access. Cancellation, revision, Stop and
restart preserve the pending plan and decision accurately. No regex-based automatic phase router,
new plan journal, separate permission store or new agent role is part of R1.

Extend Session-owned persisted state, protocol, settings defaults and all provider adapters together.
At Send, validate and freeze the selected Project/host, model, reasoning, permission and Plan intent
for that submission. Changes during a running turn apply at a defined subsequent turn boundary;
they cannot change policy under an already dispatched action. Queue/retry/resume consume the stored
submission intent. A remote host unable to enforce independent Plan must refuse with a reason,
not silently omit the field. Failed persistence keeps the last accepted configuration and the draft.

Legacy `ask` and `allow-all` retain their corresponding authorization. Legacy `safe` is read-only;
do not migrate it to editing permission merely to fit three visible choices. Preserve its restriction
and explain compatibility until the user explicitly selects a new mode. Imported unknown values
must not fall back to Full access. These checks apply equally to Claude, Pi and remote execution.

### Model popup and independent reasoning control

The bottom toolbar has two independent triggers: model and reasoning. Opening the model popup
does not open a reasoning submenu. Cindy's row can show a read-only capability/effort summary, but
editing reasoning happens through its own trigger.

| Region | Required content and behavior |
|---|---|
| Top | Full-width search; match model name/ID and real provider/connection identity. Keep visible while results scroll. |
| Left rail | Favorites, all models, and provider/connection filters with accessible names and selected state. Disambiguate multiple accounts for one provider. |
| Main list | Grouped rows: provider icon and model name first; genuine description or account/source identity beneath; selection mark and known capability summary at the right. No nested provider-to-model flyout. |
| Footer | Fixed **Configure models** action to the existing Settings route, also reachable for empty, unavailable and no-result states. |
| Reasoning popup | Choices from the selected model and executing adapter's actual option support. Unsupported and unknown are distinct; never assume the global six-level list proves all six are supported. |

Rows use the composite identity of executing host, connection/account and provider-native model ID.
Favorites are view preferences in the existing settings scope, not a second model catalog. Selection
must honor Craft's existing connection-lock/rebinding rules: show a truthful reason and a new-task
path when a started Session cannot change connection. Never mutate credentials or silently fall
back to another connection when an account is removed.

On a model change, resolve the target model's valid reasoning option and persist the resulting
pair coherently. A provider default is an explicit default, not an invented effort level. Do not
carry a source model's unsupported effort into the next request or silently clamp it while showing
the old label. Current-turn configuration and next-turn selection remain distinguishable. Remote
selection uses the executing host's catalog and capabilities; late responses from another Workspace
cannot overwrite the current selection.

Price, account/plan, quota and reset time appear only with genuine scoped data and known units and
freshness. Unknown is not zero or full allowance. Paid API cost, context occupancy and subscription
quota are separate facts. The screenshot's names, prices, discounts and percentages are sample
content, not defaults. Reuse the existing usage authority and its admitted adapters; this popup
does not authorize a new quota scraper, credential reader or Settings redesign.

## Implementation entry points and current gaps

All paths here are relative to `app/`; extend the existing owners.

| Concern | Entry point and required correction |
|---|---|
| Composer | `apps/electron/src/renderer/components/app-shell/ChatDisplay.tsx`, `input/ChatInputZone.tsx`, `input/FreeFormInput.tsx`: same input instance/controller; remove duplicate working-folder/context actions and Board status selector from conversation input. |
| Model/effort | `input/FreeFormInput.tsx`, `input/CompactModelSelector.tsx`, `packages/shared/src/config/models.ts`, `agent/thinking-levels.ts`: replace nested popup, separate effort, retain compact callers; global levels plus `supportsThinking` currently do not provide per-model option evidence. |
| Persistence/protocol | `packages/server-core/src/sessions/SessionManager.ts`, `packages/shared/src/sessions/`, `packages/shared/src/protocol/`: validate complete submission intent, preserve queue/restart/Workspace routing. |
| Permission enforcement | `packages/shared/src/agent/{mode-types,mode-manager}.ts`, `agent/core/pre-tool-use.ts`, `agent/{claude-agent,pi-agent}.ts`: current `safe/ask/allow-all` cannot implement independent Plan plus Auto edit by renaming. |
| Plan handoff | `input/FreeFormInput.tsx` and existing `SubmitPlan`/pending-plan execution path: remove automatic `safe` to `allow-all` escalation only as part of the coherent new state transition. |
| Right panel | `AppShell.tsx`, `PanelStackContainer.tsx`, `PanelSlot.tsx`, `context/NavigationContext.tsx`: extend layout owner; existing `rightSidebar` route state is not a mounted tab host. `rightSidebarButton` currently carries panel-close chrome, not a tool toggle. |

Renderer paths abbreviated after `input/` above are under
`apps/electron/src/renderer/components/app-shell/`; shell files use that same root.
Do not classify this as UI-only or claim inherited callbacks already enforce the target policy.

## Acceptance

- **R1-A1:** one visible left navigation column at desktop widths; Project and folderless sessions
  open directly; search, archive/recover, pin, rename, filters and keyboard navigation remain reachable.
- **R1-A2:** Board opens from its own entry, edits existing records and closes/navigates back without
  inserting a list/Board switch in Conversations. Old routes remain parseable.
- **R1-A3:** two Workspaces reference the same directory; projects/sessions/tools do not cross-load.
  Delayed fetch or broadcast from the old Workspace cannot overwrite current Project data.
- **R1-A4:** Project picker changes both Project context and working directory for an empty Session;
  rejection on foreign Project, missing folder or active work leaves both unchanged. Folderless is real.
- **R1-A5:** the contextual right panel exposes browser-window/new-session-panel commands and supported
  tab bodies without a second left navigator. Tabs restore per Session, unknown kinds degrade visibly,
  and hidden panels are not mistaken for stopped work. Unrelated resource/settings routes still work.
- **R1-A6:** empty composer works in English and Simplified Chinese, normal/narrow windows and after
  restart; add/context selection survives dismissal and upload errors; Send retains a validated
  configuration snapshot and transitions to the ordinary conversation layout. Model popup search,
  filters, favorites, grouped rows, keyboard selection, no results, unavailable account and configure
  footer work; model and reasoning are independent. Same model ID on two accounts never aliases.
  Test unsupported/unknown effort, changing model, stale catalog and failed persistence.
- **R1-A7:** targeted tests, renderer build and typecheck report current results; missing UI-contract
  guard remains a classified gap. No historical result substitutes for this source tree.
  Policy proof covers Plan on/off crossed with all three permissions; denied edits, allowed edits,
  commands, plan approval/cancel, legacy `safe`, queued sends, restart and unsupported remote protocol.
  Assert provider request parameters as well as displayed selections; no accidental Full access.

- **R1-A8:** errors, Stop, approvals, retry and completion update conversation markers without changing
  Board classification. Collapsed Project activity matches its children; stale prior-turn errors clear.
- **R1-A9:** Project/conversation hover actions and menus work with keyboard and pointer; status
  classification is absent from conversation menus and composer. GitHub identity never exposes tokens.

## Recovery and non-goals

No migration merges Workspaces, Projects or Sessions. No live user records are rewritten as setup.
Layout changes reuse existing navigation and panel persistence. Source rollback must leave created
native records readable by upstream. Test with a disposable profile and directories only.
This slice does not claim three-platform visual acceptance, remote pairing, generic Component
installation, browser embedding, credential repair or independence from upstream hosted services.

## Design background — Workspace, Project, Session and remote

> **Status:** supporting rationale, not a release contract or a schema proposal. [PRODUCT](../PROJECT-SPEC.md),
> P6–P9/P9-rev in [Decisions](../DECISIONS.md), and the exact statements in
> [Owner Voice](../DECISIONS.md#the-owners-words) govern this note. [R1](../specs/R1-one-boundary-language.md) owns the shell/context contract; [Non-negotiables](../DECISIONS.md#hard-constraints) owns authority and remote-access boundaries.
> Current `app/` tracks Craft v0.13.4. Earlier Fleet implementation claims do not survive the rebuild.

### 1. Owner direction and fixed decisions

- **P6 revised, 2026-09-22:** retain visible Workspaces, each with independent Projects,
  Conversations and tool configuration. A Project references a directory; two Workspaces may
  reference the same directory without sharing their conversation/configuration state.
- **P7/P9-rev:** connect directly to another user-owned Fleet instance through the existing Workspace route.
  The host supplies an access link; the client supplies a name and that link. There is no Fleet account,
  central control plane, relay, or separate network-mode choice.
- **P8:** remove silent dependence on Craft-operated services; preserve local behavior and honest failure.
- **P9 / OV-008:** execution choices are **Local / Cloud**. Cloud means a user-owned Fleet runtime;
  worktree isolation is agent-managed and never a peer location preset.

### 2. Boundary and source rationale

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

### 3. Product shape

One left sidebar contains Project groups and folderless Conversations. Board has its own entry and
projects existing Task/Session records. Tools use a contextual right panel with Session-scoped tabs,
not a vertical rail or a second left navigator. Resource settings may have list/detail content without
duplicating the work list.

Manual backlog/todo/done categories belong to Board. Conversation activity is automatic: running,
error/paused, or no marker. Permissions, credentials and plan waits require attention; a successful
reply clears old failures. Collapsed Project headers aggregate the same child scope. Unread/pinning
remain reading/organization properties, not additional runtime phases.

### 4. Single backend authority

| Concern | Existing authority |
|---|---|
| Workspace identity, configuration and remote routing | Workspace store and RoutedClient |
| Project membership, assets and folder reference | Workspace-scoped Project store |
| Conversations and tasks | Session/Task stores and lifecycle |
| Sources, Skills and settings | existing global, Workspace and Session scopes |
| Files | referenced folder on the executing host; Session directory for folderless work |
| Permissions and credentials | existing permission and host credential paths |

### 5. Compatibility

No Workspace/Project collapse or record migration is authorized. Retain IDs, assets, files and old
routes. Existing saved status-based sidebar filters must not silently hide Conversations after the
status menu is removed. A membership removal must preserve its referenced working folder. Resource
asset deletion retains the existing explicit confirmation. No historical patch is restored wholesale.

### 6. Remote Projects

Craft already provides the embedded/headless server, WebSocket lifecycle, remote Workspace routing and
Session/Task execution path. Extend that route: the client displays the work, while the connected host owns
its Workspace files, tools, model calls and credentials. A controller's selected provider or account must not
silently replace the remote host's configuration.

The same connection contract applies to a home computer and a VPS. An installation or networking mechanism
used outside Fleet does not become another Project type, control service or connection authority.

### 7. Access grants and execution truth

P7 and [Non-negotiables](../DECISIONS.md#hard-constraints) require explicit, scoped and revocable remote access,
separate from the host's internal server token. Grant representation and enforcement must extend the
existing permission path; this note does not predeclare their stored fields.

The UI must distinguish live transport state from last-known data. A running Session remains bound to its
executing host; changing a selection must never silently move it. Any supported handoff must be explicit,
permissioned and recoverable. This is a behavioral requirement, not a new Session identifier or registry.
Disconnect or revocation blocks new unauthorized operations while preserving prior evidence and remote data.

### 8. Settings surface

P9-rev owns the **Remote connection** flow: host access link, client name plus link, and selection of Projects
reported by that host without asking the user for internal Workspace IDs. Health, compatibility, grant state,
reconnect and revocation belong to that connection's existing settings path.

The flow does not introduce an SSH installer, browser-pairing alternative, network-mode selector or separate
“advanced connection” product. Nor may it imply that Fleet operates the host or can recover its credentials.

### 9. Network and security boundary

The binding boundary is [Non-negotiables](../DECISIONS.md#hard-constraints): explicit remote admission at both
ends, the existing permission decision, protected credentials, and truthful refusal/recovery. Remote access
must not expose unrestricted filesystem roots or reinterpret a path on a different host. OS service
management remains outside Fleet's application authority. P9-rev excludes a second file-sync protocol over
the pairing connection; Git/GitHub delivery follows the existing OpenChamber-derived contract.

### 10. Development-order ownership

[WORK-ORDER](../../TODO.md#slice-procedure) and the [Roadmap](../../TODO.md#release-ladder) own sequencing. The current owner order
starts with inherited Craft capability/service rectification and baseline acceptance, before the Component
host and added capabilities. This note creates no alternate queue or prerequisite.

### 11. Execution-location comparison and evidence

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

### 12. Existing Workspace routing

Workspace remains the configuration and remote-routing authority; Project remains a scoped membership. Session create, read, resume and execution
must resolve through that same boundary. The executing host owns path interpretation and runtime state;
the local window consumes routed events. No separate execution-target registry, reserved provider kinds or
new persisted Session fields are authorized by this note.

The running-Session host binding and explicit-handoff requirement in §7 must be proven through the existing
lifecycle. The owning implementation contract determines any necessary data changes after that trace.

### 13. New Task interaction contract

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

### 14. Connection and setup surfaces

New Task consumes the existing connection and Workspace state; it does not repeat server administration.
When a remote connection is needed, use the same Remote connection settings flow described in §8. Connection
failures, revoked access and unavailable Projects must be distinguishable from an empty local Project.

Home-computer and VPS connections use the same host-link/client-name-and-link interaction. Any underlying
transport detail remains an implementation concern; this note adds no alternate onboarding branch.

### 15. Backend acceptance evidence

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
