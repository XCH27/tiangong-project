# Module Specs

Each file in this folder must define one closed product loop. A module spec is not a vision note and not a backend-only design.

## Required Template

```text
# <Module Name>

## 1. Mission
## 2. User-Visible Loop
## 3. Current App Reuse
## 4. Reference Projects
## 5. UI Placement
## 6. Backend / RPC / Locality
## 7. Session / Timeline / Permission / Rollback
## 8. Data Model
## 9. Agent-Native Actions
## 10. Files To Inspect First
## 11. Files Likely Touched
## 12. Parallel Work Packages
## 13. File Ownership
## 14. Validation Ladder
## 15. Done / Not Done
## 16. Risks And Blocked Decisions
```

For a spine/contract module, "User-Visible Loop" must explain which downstream loops it enables.

## Planned Modules

| File | Module |
|---|---|
| `00-platform-spine.md` | Session, permission, timeline, actors, runtime identity. |
| `01-clean-craft-baseline.md` | Clean Craft base and shell simplification. |
| `02-terminal-cli-runtime.md` | Terminal surface, CLI runtime, launcher, diagnostics. |
| `03-internal-action-registry.md` | Agent-native action registry and first file/action loop. |
| `04-runtime-lanes-teamrun.md` | AgentSeat, RuntimeLane, TeamRun, Fleet Bridge. |
| `05-files-library-leases.md` | Files, Library, file leases, write conflict control. |
| `06-browser-artifact-workflow.md` | BrowserPane selection, annotation, artifact handoff. |
| `07-canvas-design-surface.md` | Native canvas/design surface. |
| `08-aigc-external-jobs.md` | AIGC and external job surfaces. |
| `09-video-surface.md` | Native video timeline and render loop. |
| `10-memory-context-review.md` | Memory, ProjectPack, context efficiency, external review. |
| `11-model-routing-cost-ledger.md` | API routing, quota, usage, cost, Fusion boundaries. |
| `12-capability-skill-plugin-system.md` | Capability catalog, loadout, skill/plugin management. |
| `13-settings-shell-ux.md` | Settings IA, shell UX, dedupe rules. |
| `14-messaging.md` | Messaging gateway retention and governance. |

Do not create a module file until its control-plane dependencies are clear in `OWNERSHIP-MATRIX.md` and `WAVE-MODULE-MAP.md`.
