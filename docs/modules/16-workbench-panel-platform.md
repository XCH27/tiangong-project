# M16 — Workbench Panel Platform

> **Capability status:** `not implemented`  
> **Execution gate:** Locked  
> **Spec maturity:** contract draft; implementation paths require v0.11 baseline inspection  
> **Wave:** W2 host slice, W3 composition slice  
> **Owner:** Lead for layout contract; M16 Worker after packet approval  
> **Depends on:** M00 preferences/identity boundary, M03 actions, clean Craft Agents v0.11 shell

## 1. Purpose

Provide the only registration, instance, routing, docking, focus, and layout-restoration system
inside the retained Craft shell. Modules contribute views without editing the shell independently
or creating a second state authority.

The first closed loop is: register the terminal panel and one main surface, open them, resize the
dock, restart, restore the layout, and recover safely if one contribution is missing.

## 2. Scope

### In Scope

- discriminated panel, surface, and inspector contributions;
- view-instance creation and typed route state;
- versioned layout graph stored through canonical preferences;
- left, right, and bottom docks plus one main stage in v1;
- lazy view mount/suspend without cancelling owned runtime work;
- default layout, reset, migration, unknown-contribution recovery, and focus policy;
- safe human and Agent reveal/open actions.

### Out of Scope

- replacing the Craft shell, OS-level tear-off windows, a panel-owned task store, or a second
  settings database;
- provider/job execution, native document state, workflow execution, or plugin distribution;
- allowing each module to create its own toolbar, sidebar, or route registry.

## 3. Default Workbench Composition

```text
Craft shell
|-- left: project navigator / files / Library
|-- main: one active surface (chat, canvas, browser, design, video, web, deck)
|-- right: contextual inspector and evidence/timeline tabs
`-- bottom: terminal, jobs, and editor timelines
```

The main stage may support a two-surface comparison later. It is not a v1 gate because heavy
surfaces have not yet been benchmarked together.

## 4. View Contract

M16 consumes the proposed `ViewContribution`, `ViewInstance`, and `LayoutSnapshot` contracts in
`docs/contracts/composable-workspace-contracts.md`. Before implementation, the accepted forms
must be promoted into the canonical protocol.

Rules:

1. `PanelContribution`, `SurfaceContribution`, and `InspectorContribution` are distinct.
2. Every route state has an owner-provided schema and migration.
3. `contributionId` is stable; every open occurrence has a distinct `instanceId`.
4. A contribution declares whether its runtime continues while the view is hidden.
5. Layout contains view references and geometry only. Domain state remains with the owner.
6. Registration conflicts fail visibly; there is no last-registration-wins behaviour.

## 5. Registration and Lifecycle

```text
discovered -> validated -> registered | rejected
unmounted -> mounted -> visible | suspended -> unmounted
```

- Core contributions load from the built-in manifest after contract compatibility is checked.
- Plugin contributions remain deferred until M12 plugin distribution is usable.
- Hidden `view_only` panels may unmount completely.
- A hidden `runtime_continues_when_hidden` panel unmounts its view but its owner continues the
  PTY, job, or render in its own authority.
- A faulted view is isolated, replaced by a recovery card, and does not stop unrelated views.

## 6. Layout Persistence

- Layout is per workspace with an optional global default.
- M16 serializes one versioned layout graph through the existing preference authority; it does
  not create `layout.json` as a second truth.
- Save is debounced and atomic through the canonical preference path.
- Unknown contribution IDs restore as placeholders showing owner, missing ID, and remove or
  reinstall guidance.
- Invalid geometry is clamped to safe defaults; an unreadable snapshot falls back to the default
  layout and preserves the rejected snapshot for diagnostics.
- `layout.reset` restores the versioned default without deleting domain documents or jobs.

## 7. UI and Agent Behaviour

Human users may open, close, resize, reorder, save, and reset views.

Agents may request an ephemeral reveal of an entity, event, node, or job when the effective
permission manifest allows it. By default an Agent may open/focus the relevant view, but it may
not persist a rearranged layout or repeatedly steal focus. A user preference may disable Agent
view control entirely.

Agent reveal requests are presentation actions. They do not grant access to the referenced
entity; the target module still enforces read permission.

## 8. Candidate Actions — Not Frozen

| Candidate | Purpose | Risk/side effect |
|---|---|---|
| `workbench.view_open` | create or reveal a view instance with typed route state | L0 view state, no domain mutation |
| `workbench.entity_reveal` | open the correct view and focus one permitted entity | L0 view state |
| `workbench.view_close` | close one view instance without cancelling domain work | L0 view state |
| `workbench.layout_save` | persist the human's current layout | L1 preference write, snapshot undo |
| `workbench.layout_reset` | replace workspace layout with the default | L1 preference write, snapshot undo |

These IDs remain proposals until W0.1. Transport hook names must not be maintained as a second
manual action list.

## 9. Required Core Contributions

| Contribution | Kind | Default placement | Owner |
|---|---|---|---|
| project/files | panel | left | M05 / retained shell |
| chat/workbench | surface | main | M00/M01 |
| terminal | panel | bottom | M02 |
| timeline/evidence | panel | right | M00 |
| jobs | panel | right | M08 |
| spatial canvas | surface | main | M07 |
| browser | surface | main | M06 |
| media editor | surface plus bottom timeline | M09 |
| web project | surface | main | M18 |
| motion deck | surface plus bottom timeline | M19 |
| contextual inspector | inspector | right | selected entity owner |

## 10. State and Authority

| Data | Authority |
|---|---|
| contribution definitions | canonical built-in/M12 manifest |
| layout and view instances | M16 through canonical preferences |
| selected entity | view-local ephemeral state or owning surface selection |
| PTY, job, workflow, native document | M02, M08, M17, or native owner respectively |
| permission and timeline | M00/M03 |

Closing a job panel never cancels a job. Closing a workflow view never deletes the workflow.
Closing a native editor prompts only for that editor's unsaved document state.

## 11. Error Handling

| Condition | User-visible result | Recovery |
|---|---|---|
| duplicate contribution ID | registration rejected with owner conflict | disable/fix the conflicting module |
| invalid route state | view does not mount; field error shown | reopen with corrected/default route |
| missing contribution on restore | placeholder occupies saved position | remove or restore module |
| layout migration fails | default layout opens; rejected snapshot retained | inspect/reset/import supported snapshot |
| view component faults | isolated recovery card | reload view or disable contribution |
| Agent reveal denied | no focus change; reason returned | user opens manually or changes permission |

## 12. Resource Rules

- Invisible views do not continue rendering frames.
- Runtime state is never held only in a React subtree.
- Each contribution declares suspend/resume behaviour and a memory class.
- M16 may decline a split or live preview when the resource policy says the machine is
  saturated; the reason is visible.
- Exact memory/latency budgets require a repeatable v0.11 baseline benchmark before freeze.

## 13. Verification Procedure

1. Register chat, terminal, timeline, and one test surface through the same registry.
2. Open and resize each; verify only M16 changes layout state.
3. Restart; verify active view, route state, dock sizes, and tab order restore.
4. Remove the test contribution; verify an unknown-view placeholder instead of a crash.
5. Hide terminal while a process runs; verify the view unmounts and the M02 process continues.
6. Call entity reveal from an authorized Agent; verify the right view opens without persisting a
   new layout. Disable Agent view control and verify the same call is refused.
7. Corrupt a layout snapshot; verify default recovery and user-visible diagnostics.

`usable` requires real rendered verification; registration and persistence tests alone are not
sufficient.

## 14. Open Gates

- Inspect and classify the Craft Agents v0.11 shell/panel primitives on the clean baseline.
- Freeze the selected layout graph and canonical preference keys.
- Resolve the product namespace before freezing contribution IDs.
- Freeze candidate actions and typed route schemas.
- Produce a narrow M16 packet; no generic shell ownership is granted to a Worker.

## 15. Non-Goals and Prohibitions

- No second workbench shell.
- No panel-owned business state.
- No Agent-controlled persistent layout by default.
- No free-floating OS windows in v1.
- No third-party panel library until reference policy promotion and license review.

