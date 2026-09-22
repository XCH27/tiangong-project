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
