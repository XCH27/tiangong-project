# Module Specs

Each file in this folder must define one closed product loop. A module spec is not a vision note and not a backend-only design.

---

## Required Module Spec Template

Every module spec file in the `docs/modules/` directory must strictly implement the following structure:

```markdown
# M## — Module Name

> **Status:** `not implemented` | `display-only` | `wired but not visually checked` | `usable`
> **Wave:** W#
> **Owner:** Lead / Worker (name or role)
> **Spec version:** v1.0 — YYYY-MM-DD
> **Depends on:** M## (interface level), M## (full implementation)

---

## 1. Purpose

_One paragraph. What user problem does this module solve?
What is the first complete loop this module enables?_

## 2. Scope

### In Scope
- _bullet list of what this module builds_

### Out of Scope
- _bullet list of what explicitly is NOT this module's job_

## 3. User-Visible Loop

_Describe the complete user-visible behavior:_

```
user action → UI path → backend handler → state change → timeline event → visible feedback
```

_Include the error path:_

```
failure condition → error message → user-visible recovery option
```

## 4. Action Registry Entries

| Action ID | Description | Permission Required | Produces SessionEvent? |
|---|---|---|---|
| `module.actionName` | What it does | `permission:level` | Yes / No |

## 5. Session Events Emitted

| Event Type | When Emitted | Payload Shape |
|---|---|---|
| `MODULE_ACTION_DONE` | After successful action | `{ actionId, actorId, timestamp, ... }` |

## 6. Permission Rules

| Operation | Who Can Perform | Denial Behavior |
|---|---|---|
| read | any authenticated actor | — |
| write | role:lead or user with explicit grant | Returns PERMISSION_DENIED, logs to audit |

## 7. Agent Tool Surface

_Which actions are available as agent tools? Copy from §4 with notes on agent-specific behavior._

## 8. UI Components

_List UI components needed. Reference existing Craft components where possible._

## 9. Backend / Package Changes

| Package | File | Change Type | Notes |
|---|---|---|---|
| `app/packages/___` | `src/___.ts` | new / modify | |

## 10. State and Persistence

_Where is state stored? What survives a session restart? What is ephemeral?_

## 11. Error Handling

| Error Condition | User-Visible Message | Recovery Option |
|---|---|---|
| | | |

## 12. Forbidden Patterns

- Do not create a second session store
- Do not self-declare identity tags

## 13. Open Questions

_Questions that need Lead resolution before or during implementation._

| # | Question | Impact | Status |
|---|---|---|---|
| Q1 | | | open / resolved |

## 14. Verification Procedure

_Step-by-step manual verification that a Reviewer can follow to confirm `usable` status._

1. Launch `./scripts/craft.sh run electron:dev`
2. Navigate to [specific UI path]
3. Perform [specific action]
4. Expected result: [describe exactly what should happen]
5. Check timeline: [what SessionEvent should appear]
6. Trigger error case: [how] → Expected: [error message shown]
7. Run as agent: [tool call] → Expected: [same result as UI]

## 15. Handoff Notes

_Space for Worker to fill in during handoff. Leave blank until handoff._

## 16. Change Log

| Date | Version | Author | Summary |
|---|---|---|---|
| YYYY-MM-DD | v1.0 | Lead | Initial spec |
```

---

## Planned Modules

| File | Module |
|---|---|
| `00-platform-spine.md` | Session, permission, timeline, actors, runtime identity. |
| `01-clean-craft-baseline.md` | Clean Craft base and shell simplification. |
| `02-terminal-cli-runtime.md` | Terminal surface, CLI runtime, launcher, diagnostics. |
| `03-internal-action-registry.md` | Agent-native action registry and first file/action loop. |
| `04-runtime-lanes-teamrun.md` | AgentSeat, RuntimeLane, TeamRun, Fleet Bridge. |
| `05-files-library-leases.md` | Files, Library, file leases, write conflict control. |
| `06-browser-artifact-surface.md` | BrowserPane selection, annotation, artifact handoff. |
| `07-canvas-design-surface.md` | Native canvas/design surface. |
| `08-aigc-jobs-surface.md` | AIGC and external job surfaces. |
| `09-video-surface.md` | Native video timeline and render loop. |
| `10-memory-context-review.md` | Memory, ProjectPack, context efficiency, external review. |
| `11-model-routing-cost-ledger.md` | API routing, quota, usage, cost, Fusion boundaries. |
| `12-capability-skill-plugin-system.md` | Capability catalog, loadout, skill/plugin management. |
| `13-settings-shell-ux.md` | Settings IA, shell UX, dedupe rules. |
| `14-messaging.md` | Messaging gateway retention and governance. |

Do not create a module file until its control-plane dependencies are clear in `OWNERSHIP-MATRIX.md` and `WAVE-MODULE-MAP.md`.
