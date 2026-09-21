# Component and panel foundation — owner-directed early R15/R18 slice

> Contract revision: 2026-09-15, reconciling the owner's foundation-first and freely movable panel
> requests. This replaces the former workbench contract and its stale pre-rebase status claims;
> it does not weaken or edit any executable tests. Implementation: `not implemented` as a complete
> registered Component host. R0 remains the only ACTIVE release; this explicit owner slice is the
> early host part of R15/R18, not an additional release or a wholesale shell restoration.

## Current slice

- Objective: make existing conversation, Files and Notes surfaces reusable through one registered
  host, then support user-owned sizing/position and scoped Component activation.
- Context: `renderer/components/app-shell/`, `renderer/components/right-sidebar/`,
  `renderer/atoms/panel-stack.ts`, `renderer/contexts/NavigationContext.tsx`,
  `packages/shared/src/{components,layout,workspaces}` and existing Settings/Session handlers.
- Constraints: preserve unrelated dirty work; no HEAD/index/ref movement, live-data migration,
  dependency installation or new Session/Task/permission authority. No canvas placeholder or
  external marketplace merely to demonstrate the host.
- Evidence: current source/caller comparison, isolated two-Workspace fixtures, targeted interaction
  and lifecycle tests, affected typechecks, production bootstrap and owner look-and-feel review.
- Next safe action: audit the touched baseline and Workspace/Session binding paths; compare the
  Craft pins and Cindy registry, then extract the smallest host bridge from two real surfaces.

## Current implementation, not historical claims

Paths below are relative to `app/`.

| Path | Observed fact | Capability status |
|---|---|---|
| `apps/electron/src/renderer/components/app-shell/{AppShell,PanelStackContainer,PanelResizeSash}.tsx` | Fixed horizontal content stack and mounted size controls; existing widths/proportions are persisted | `wired but not visually checked` for current sizing |
| `apps/electron/src/renderer/components/right-sidebar/RightSidebar.tsx` | Fixed Files/Browser/Notes/History list; Files/Notes call existing services; History is empty placeholder content | `wired but not visually checked` for fixed tools; History `display-only` |
| `packages/shared/src/components/{types,resolve}.ts` | Data contracts and pure resolver, no production host caller; not a validated loader, lifecycle or permission path | `not implemented` for Component activation |
| `packages/shared/src/layout/tree.ts` | Unmounted pure model; v1 requires empty floats and fixes the sidebar to the left; no general gesture pipeline | `not implemented` for user reposition/docking |

No statement here claims embedded browser reparenting, a generic left-tool contribution host, Git
review, a terminal workbench, or restored plugin tabs is already delivered. BrowserPane itself and
Session new-window commands remain existing mechanisms, not proof of drag-out/re-dock support.

## Sequence and dependency boundary

1. **Scoped baseline and P6 prerequisites.** Prove create/select/context isolation over existing
   Workspace and Session records; preserve compatibility data. A demo Project name is irrelevant.
   Do not wait for a live user-data rename to build or test the host. R0 still owns the complete
   dirty-tree audit and release verification; this slice does not declare that audit finished.
2. **Registered host with real consumers.** Put Files and Notes behind a shared contribution
   registry consumed by the tool-entry list and panel body. Both still use their existing handlers.
   Keep conversation creation/selection on its present authority; no duplicated navigation lists.
3. **User-owned in-window layout.** Resize, move left/right/above/below, reorder, float and re-dock
   supported conversation/tool panels; preserve identity/drafts and restore layout per Workspace
   and local window. The two real consumers prove the seam; they are not a prerequisite demanding
   a marketplace, new media editor or curated memory before work can begin.
4. **Scoped local Component proof.** Resolve global defaults and Workspace enable/disable/config
   overrides through existing settings, activate only the required implementation, and unregister
   cleanly without deleting files or notes. Connect the resolver to this real path before calling
   it a Component system. Then add domain components one by one.

Steps 1–4 do not depend on R6 delegation or R9 memory. R15 subsequently closes external catalog,
package supply-chain and update/rollback safety. A component that actually uses delegation or memory
depends on that capability, not the entire Component host. R18 subsequently closes native
multi-window docking and any advanced layout beyond this in-window contract.

## Host, state and presentation contract

- Default entries live on the left and tools on the right. These are discoverability/default
  placements, not position locks. User movement does not authorize a component to replace the
  conversation implementation, Session store or permission path.
- Keep one canonical layout representation. Compare the existing tree and a library-backed model
  before choosing; do not persist two competing layout trees. A tree plus `@dnd-kit` is not already
  a complete docking system. No new production dependency is selected by this document.
- Each panel instance has a stable id and explicit Workspace/Session binding. Layout holds ids,
  sizes and positions only. Text drafts, notes, browser instances, terminal jobs and files stay with
  their native owners; moving a view does not restart an Agent or duplicate a file store.
- Craft tokens, fonts, shared headers, menus, focus and motion rules remain binding. Pointer
  movement does not re-render every conversation token. Persist committed geometry rather than
  writing on every pointer event. Provide keyboard move/resize and a reset-layout action.
- Opened panels may preserve local state while hidden, but unopened heavy modules are not eagerly
  imported. Hiding a panel is not job cancellation; active work leases may keep a worker alive.
  Unmount/disable must flush or preserve drafts and explicitly stop/release unused resources.
- Missing or incompatible components do not corrupt layout. Keep their saved identity with a named
  unavailable state/recovery action; clamp restored geometry to the current viewport.
- Native popout requires a separately verified Electron window/protocol bridge, cross-window
  security/context and close/re-dock recovery. A browser library's `window.open` demo is not proof
  of packaged `file://` support. That closure belongs to R18, not this first in-window slice.

## Acceptance (all are required for this foundation)

| ID | Observable evidence |
|---|---|
| FND-01 | Given isolated Workspaces A/B with arbitrary names, selecting/creating work uses the correct existing Workspace/Session; no live data rename or migration is required. |
| FND-02 | Files and Notes are represented by one registry; registered ids drive the entry and host body-dispatch marker, while removing one contribution leaves the other reachable. Real file reads and note save/reload still work. A future Component supplies its lazy body through the same registration contract. |
| FND-03 | Drag and keyboard resize/move/reorder change the conversation/tool view positions; Session identity, draft text, selected file and note contents survive. |
| FND-04 | In-window float/re-dock preserves identity; restart restores scoped layout; missing component and narrower viewport recover without losing user content. |
| FND-05 | Global enablement, Workspace disable/enable, settings overrides and reset-to-inherit resolve deterministically; A cannot change B or implicitly grant permissions. |
| FND-06 | Opening only Files does not load Notes/heavy unused implementations. Missing/disabled/version-conflicting required dependencies block the affected feature; optional unrequested capabilities are not activated silently. |
| FND-07 | Denied/read/save failures, unknown component, failed activation, unsaved draft on close, and unload during active work have visible recovery; installing dependencies requires the existing approval/trust path. |
| FND-08 | Production Electron smoke, relevant tests/type/UI/i18n checks pass without changing their acceptance; owner receives a Craft-styled walkthrough. Passing model tests alone never counts as host completion. |

Existing joins: CORE-11-A / WB-001..003, ORCH-03-A. External-package lifecycle remains ORCH-11-A.
Relevant existing regression files include `layout/__tests__/tree.test.ts`,
`components/__tests__/resolve.test.ts`, the Session route/selection tests and Notes handlers.
Add real renderer/lifecycle tests with implementation; do not replace them with source-string checks.

## Reference and recovery rules

Read both Craft pins before changing their counterpart; read Cindy
`features/right-sidebar/{registry,RightSidebarShell}.tsx`/`.ts` and its scoped plugin settings,
and DeepSeek Harness `packages/client/ui-slots` for ownership/disposal mechanics. OpenChamber's
context panels are supplementary evidence. Library presence is not dependency approval.

Use the current checkout as a non-destructive audit candidate, not an automatically accepted
baseline. Any wholesale rollback needs an exact target and a recovery copy of the dirty tree.
Revert only this slice's known diffs if it fails; never revert the user's unrelated work or raw
reference directories. Video dependencies and their licenses are not required by this foundation.
