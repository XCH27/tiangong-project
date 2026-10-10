# Wave and Module Map

> **Lead-owned.** This is the only active source for execution gates and module placement.
> **Updated:** 2026-07-09
> **Current state:** W0.1 reconciliation is active; every Worker implementation wave is Locked.
> **Honesty footnote (2026-10-10):** W0.1 exit is still incomplete. The gates and capability cells below are unchanged. No wave is Ready. No module is `usable`.
> **Namespace footnote (2026-10-10):** Exit item 6 and BLK-002 are closed as a name decision by D50. The other exit items stay open. W0.1 stays Locked.
> **Baseline footnote (2026-10-10):** D51 records the v0.11.0 pin. D52 records the behaviour ledger. Exit items 1 and 2 stay open. The detail is `docs/audits/2026-10-10-w01-v011-baseline-blk001.md`.
> **Exit 1 footnote (2026-10-10):** the Mac source tree matches D51. Frozen `bun install` failed. After #51, non-frozen `bun install` finished and `bun run typecheck:all` failed (exit 2). After #52, Electron `electron:dev` launch and relaunch are recorded from the Craft logs only. Corrected the same day: a System Events window titled `Fleet` was misattributed to Craft. Mac `ps` shows pid `4855` command is `Fleet 项目审查`, a separate local app. That title and the `Cmd+,` sent at that process are retracted. After #53, an authenticated WebSocket RPC on live Craft Electron pid `71904` (AX title `Craft Agents`, not pid `4855`) recorded `projects:create`, `sessions:sendMessage` (assistant content `pong`), and `browser-pane:create` (`browser-1`). `tasks:list` returned `0` and is not a Kanban board UI open. `menu:openSettings` returned no handler, so the Settings panel UI is not verified. The settings RPC token is not written here. `typecheck:all` remains the #52 failure. After #54 (`20a8d2fd`), `docs/audits/2026-10-10-w01-exit1-routes-migration.md` records two `bun run electron:dev` window-state restores. The board restore logs `Restoring window ... route=board`. The AX title was `Craft Agents`. That restore is the sessions board navigator (`routes.view.board()` → `board`). It is a route restore, not an AX click on Kanban chrome, and not `tasks:list`. A later restore logs `Restoring window ... route=settings`. The window title stayed `Craft Agents`. `Cmd+,` and Craft Agents → 设置... were not verified: the frontmost menu bar stayed on pid `4855` `Fleet 项目审查` (also Electron, `com.github.Electron`). Migration branch `fleet/migration-from-v0.11.0` is open at `/Volumes/AIGC/天工参考/源码参考/software/intake/upstream/craft-agents-oss--migration-from-v0.11.0`, HEAD `f4e172bf372f4ccc7389a189be1e0b0541f96282`, exact tag `v0.11.0`. The pin worktree is intact. Adapt row ports are not started. Fleet `app/` on the spine stays `0.10.5`. Item 1 stays open. Docs decides whether these route restores and this branch open meet the remaining UI and migration bullets. This footnote does not check item 1 off. Gate cells below stay In Progress or Locked. No module is `usable`. W1 stays Locked. The notes are `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`, `docs/audits/2026-10-10-w01-exit1-electron-launch.md`, `docs/audits/2026-10-10-w01-exit1-rpc-loop.md`, and `docs/audits/2026-10-10-w01-exit1-routes-migration.md`.
> **Exit 3 footnote (2026-10-10):** `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` names the Fleet implementation file and the Craft v0.11.0 (`f4e172bf`) surface for each field. Action ids and the v1.3.0 policy table are frozen (D47–D49). AgentSeat projection, caller provenance, envelope idempotency, document revisions, typed event payloads, and HostTurnKernel admission on the v0.11 tree are partial. `CONTRACT_VERSION` stays `1.3.0`. No action id is added. Item 3 stays open. Exit item 1 stays open. This footnote does not check item 3 off. Gate cells stay In Progress or Locked. No module is `usable`. W1 stays Locked.
> **Exit 4 footnote (2026-10-10):** D53 version-gates ArtifactRef, the capability manifest, ExternalJob, workflow, spatial, and view contracts. They stay proposed. `docs/contracts/composable-workspace-contracts.md` stays proposed v0.1. `CONTRACT_VERSION` stays `1.3.0`. No action id is added. The note is `docs/audits/2026-10-10-w01-exit4-contract-version-gate.md`. First consumers may not implement the drafts until a later freeze: W2 M05, W1 M12, W2 M08, W3A M17, W3A M07, and W2 M16 host. Stop rules 4–6 are not met. Item 4 stays open. Exit items 1 and 3 stay open. This footnote does not check item 4 off. Gate cells stay In Progress or Locked. No module is `usable`. W1 stays Locked.

## 1. Status Axes

- **Execution gate:** `Locked`, `Ready`, `In Progress`, `Blocked`.
- **Capability status:** `not implemented`, `display-only`, `wired but not visually checked`,
  `usable`.
- **Spec maturity:** `concept`, `contract draft`, `execution-ready`.

See `DOCUMENT-READINESS.md`. A spec file does not make a module Ready.

## 2. Wave Schedule

| Wave | Entry gate | Required exit | Current gate |
|---|---|---|---|
| W0 — recorded baseline | initial contract documents recorded | historical v1.2 record only | Done (historical) |
| W0.1 — v0.11 migration and contract reconciliation | Lead-only documentation/migration work | clean v0.11 migration ledger; one canonical contract implementation/text version; ownership/wave/packet parity | In Progress; blocking all Workers |
| W1 — control spine | W0.1 explicitly closed | M00 backbone and M03 executor `usable`; M12 capability-core contract frozen and registry projection seam defined | Locked |
| W2 — local workbench runtime | W1 exit | M02 terminal loop, M05 file/ArtifactRef loop, M16 host slice, and M08 durable job core `usable`; M04 bounded run core verified | Locked |
| W3A — composable spatial loop | W2 exit | D45 real text-to-image workflow loop `usable`, including M07/M08/M12/M16/M17 and restart reconciliation | Locked |
| W3B — native creative outputs | W3A contract/core available | one real M18 web, M19 deck, and M09 multi-asset media fan-out path; each may promote independently | Locked |
| W4 — intelligence/distribution | W3A exit and stable M05/M08 contracts | M10/M11 and M12 distribution slices reach their packet criteria | Locked |
| W5 — polish/integrations | required W1-W4 dependencies usable | M13-M15 complete real user loops; no placeholder-only finish | Locked |

W3B and W4 may overlap only when their packets have disjoint files and each dependency is already
usable. A wave label never overrides the dependency DAG.

## 3. W0.1 Exit Checklist

All items are required; there is no hidden secondary gate:

1. clean Craft Agents OSS v0.11.0 baseline and migration branch are recorded.
   **2026-10-10:** pin recorded (D51). A populated source tree is recorded on the Mac path in `docs/audits/2026-10-10-w01-exit1-mac-checkout.md`. After #51, non-frozen `bun install` finished and `typecheck:all` failed (exit 2). After #52, Electron launch and relaunch are recorded from the Craft logs only in `docs/audits/2026-10-10-w01-exit1-electron-launch.md`. The System Events title `Fleet` (pid `4855`, `Fleet 项目审查`) was misattributed to Craft and is retracted. After #53, `docs/audits/2026-10-10-w01-exit1-rpc-loop.md` records RPC `projects:create`, `sessions:sendMessage`, and `browser-pane:create` on pid `71904` (`Craft Agents`). After #54, `docs/audits/2026-10-10-w01-exit1-routes-migration.md` records a `route=board` restore (`routes.view.board()` → `board`, AX title `Craft Agents`) and a later `route=settings` restore (window title stayed `Craft Agents`). Those are route restores. They are not an AX click on Kanban chrome, not `tasks:list`, and not a `Cmd+,` or 设置... menu click (frontmost menu bar stayed on pid `4855` `Fleet 项目审查`). Branch `fleet/migration-from-v0.11.0` is open on the pin. Adapt row ports are not started. Fleet `app/` stays `0.10.5`. `typecheck:all` remains the #52 failure. Item stays open. Docs decides whether the route restores and the opened branch meet the remaining UI and migration bullets;
2. a retain/adapt/drop/defer ledger covers current Fleet-only behaviour and useful `fleet-old`
   behaviour.
   **2026-10-10:** behaviour ledger recorded (D52). `fleet-old` rows and the file-by-file `app/` diff stay deferred. Item stays open;
3. canonical implementation/text parity is recorded for AgentSeat/identity, actions, caller
   provenance, idempotency, revisions, typed events, and action policy.
   **2026-10-10:** `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` records the file and the Craft v0.11.0 surface for each field. Action ids and the v1.3.0 policy table are frozen (D47–D49). The other fields are partial. `CONTRACT_VERSION` stays `1.3.0`. Item stays open;
4. ArtifactRef, capability manifest, ExternalJob, workflow, spatial, and view contracts are either
   frozen now or explicitly version-gated before their first consumer wave.
   **2026-10-10:** version-gated by D53. The drafts stay proposed v0.1. `CONTRACT_VERSION` stays `1.3.0`. Named consumers may not implement them until a later freeze. Item stays open. Detail: `docs/audits/2026-10-10-w01-exit4-contract-version-gate.md`;
5. physical persistence authority and recovery are recorded from `PERSISTENCE-AUTHORITY-MAP.md`;
6. product/internal namespace is decided before plugin/storage API freeze. **Decided 2026-10-10 (D50).** The strings are in `docs/audits/2026-10-10-blk002-namespace-oss.md`. This item does not close W0.1;
7. ownership precedence and exact narrow domains are non-overlapping;
8. all active packets agree with this map and grant no Worker frozen-protocol writes;
9. the Lead explicitly changes W1 to Ready. Absence of that declaration means Locked.
   **2026-10-10:** W1 stays Locked. This footnote is not that declaration.

Status of the items this baseline note clarified, still open:

| Item | 2026-10-10 status |
|---|---|
| 3 canonical parity | Open. Partial. v1.3.0 covers D47–D49 and is frozen. The Exit 3 note names the other fields as partial. `CONTRACT_VERSION` stays `1.3.0`. |
| 4 proposed contracts | Open. Version-gated (D53), not frozen. `composable-workspace-contracts.md` stays proposed v0.1. `CONTRACT_VERSION` stays `1.3.0`. Named consumers may not implement the drafts until a later freeze. |
| 5 persistence | Logical map stands. Session, project, and task file layouts were inspected at the pin. The physical-store gate stays open. |
| 7 ownership | Precedence rule stands. v0.11 project/task/kanban paths are Lead-held in the ownership matrix. Other v0.11 surfaces stay unassigned. |
| 8 packets | The active packet is the Lead-only W0.1 packet. Superseded packets authorize nothing. Replacement packets are not issued. |
| 9 W1 Ready | Locked. |

## 4. Module Table

| Module/slice | Wave | Depends on | Canonical spec | Spec maturity | Capability | Gate |
|---|---|---|---|---|---|---|
| M00 Platform Spine | W1 | W0.1 | `modules/00-platform-spine.md` | contract draft | not implemented | Locked |
| M01 Clean v0.11 Baseline | W0.1 Lead-only | upstream gate | `modules/01-clean-craft-baseline.md` | contract draft | not implemented | Blocked — pin, behaviour ledger, and Mac source tree recorded; `typecheck:all` failed (exit 2); Electron launch and relaunch recorded; RPC project create, session turn, and `browser-pane:create` recorded; `route=board` and `route=settings` restores recorded (not an AX click, not a menu click); migration branch `fleet/migration-from-v0.11.0` open and adapt ports not started; `app/` still 0.10.5; fleet-old rows open |
| M02 Terminal/CLI Runtime | W2 | M00/M03 usable; M16 host | `modules/02-terminal-cli-runtime/SPEC.md` | contract draft | not implemented | Locked |
| M03 Action Registry | W1 | W0.1; M00 backbone for executor | `modules/03-internal-action-registry.md` | contract draft | not implemented | Locked |
| M04 Runtime Lanes/TeamRun core | W2 | M00/M03 usable | `modules/04-runtime-lanes-teamrun.md` | contract draft | not implemented | Locked |
| M05 Files/Library/ArtifactRef | W2 | M00/M03 usable | `modules/05-files-library-leases.md` | contract draft | not implemented | Locked |
| M06 Browser Evidence | W3A | M03/M05/M16 usable | `modules/06-browser-artifact-surface/SPEC.md` | contract draft | not implemented | Locked |
| M07 Spatial Canvas | W3A | M03/M05/M12-core/M16/M17 contracts | `modules/07-canvas-design-surface/SPEC.md` | contract draft | not implemented | Locked |
| M08 job core | W2 | M00/M03/M05 contract | `modules/08-aigc-jobs-surface.md` | contract draft | not implemented | Locked |
| M08 generative providers | W3A | M08 core/M05 usable | same | contract draft | not implemented | Locked |
| M09 Media Composition | W3B | M05/M08/M12/M16/M17 | `modules/09-video-surface.md` | contract draft | not implemented | Locked |
| M10 Memory/Context | W4 | M00/M05 stable | `modules/10-memory-context-review.md` | contract draft | not implemented | Locked |
| M11 Routing/Cost | W4 (usage contract may be earlier) | M00/M03/M08 | `modules/11-model-routing-cost-ledger.md` | contract draft | not implemented | Locked |
| M12 capability core | W1 contract/W2 catalog | M00/M03 | `modules/12-capability-skill-plugin-system.md` | contract draft | not implemented | Locked |
| M12 plugin distribution | W4 | M12 core/M05/M11 | same | concept | not implemented | Locked |
| M13 Settings/Preferences | W5 | M00/M16 boundaries | `modules/13-settings-shell-ux.md` | concept | not implemented | Locked |
| M14 Onboarding | W5 | M00/M13 | `modules/14-onboarding.md` | contract draft | not implemented | Locked |
| M15 Messaging | W5 | M00/M03/M13 | `modules/15-messaging.md` | contract draft | not implemented | Locked |
| M16 panel host slice | W2 | v0.11 shell/M00/M03 | `modules/16-workbench-panel-platform.md` | contract draft | not implemented | Locked |
| M16 composition slice | W3A | M16 host/M12 core | same | contract draft | not implemented | Locked |
| M17 Composable Workflows | W3A | M00/M03/M05/M08-core/M12-core/M16 | `modules/17-composable-workflows.md` | contract draft | not implemented | Locked |
| M18 Web Artifact | W3B | M05/M06/M08/M12/M16/M17 | `modules/18-web-artifact-surface.md` | contract draft | not implemented | Locked |
| M19 Presentation/Motion | W3B | M05/M08/M12/M16/M17 | `modules/19-presentation-motion-surface.md` | contract draft | not implemented | Locked |

## 5. Dependency Stop Rules

1. M03 skeleton may start only after W0.1; its executor waits for M00 backbone.
2. No W2 Worker starts until M00/M03 are usable and the exact packet says which slice is Ready.
3. M02 UI depends on M16 host; it must not create a separate terminal shell.
4. M17 does not start until M05 ArtifactRef and M08 durable job core contracts are frozen and
   their required paths are usable.
5. M07 does not start until the spatial renderer/license spike and M17/M12/M16 contracts are
   accepted. The superseded F Track is never an alternate gate.
6. M09/M18/M19 each start from exact ArtifactRef/capability/workflow/view contracts and may be
   promoted independently after a real native output loop.
7. M10/M11/M12-distribution cannot create alternate jobs, memory, capability, or usage stores to
   bypass earlier gates.

## 6. Active Blockers

| ID | Blocker | Owner | Affects |
|---|---|---|---|
| BLK-001 | Behaviour ledger is recorded (D52) and stays incomplete: the Mac source tree is recorded, `typecheck:all` failed (exit 2), Electron launch and relaunch are recorded, RPC project create, session turn, and `browser-pane:create` are recorded, `route=board` and `route=settings` restores are recorded and are not an AX or menu click, migration branch `fleet/migration-from-v0.11.0` is open with adapt ports not started and Fleet `app/` still 0.10.5, fleet-old rows and the file-by-file `app/` diff are still absent, and canonical contract parity is recorded as partial in `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` and the re-freeze is still open. | Lead | W1 and every downstream wave |
| BLK-003 | Required Browser/Spatial/Media/Panel/Web/Deck adapter spikes have no recorded result. | Lead by consumer wave | M06/M07/M09/M16/M18/M19 readiness |

BLK-002 is closed as a name decision by D50 (2026-10-10). Plugin API keys, storage prefixes, and the action-owner namespace strings are recorded in `docs/audits/2026-10-10-blk002-namespace-oss.md`. Closing BLK-002 does not open W0.1 or a storage adapter. The later Settings install, enable, and disable caller is `wired` in D49 (`plugins:mutateLoadout` → `plugin.loadout_mutate` and the Craft card) and is not `usable`. That caller does not open W0.1. Marketplace ids, extra skill roots, and the M16 contribution table stay under discussion in that note.

## 7. Historical W0 Record

The following files were previously recorded as frozen v1.2.0. They are historical evidence, not
authorization to implement, because canonical parity and the new product contracts are unresolved.

| File | Recorded SHA | Current interpretation |
|---|---|---|
| `contracts/action-ids.md` | `0dda5fada3bb562d9451836a753a6b6afd6c7d11` | last recorded table; known policy/action gaps |
| `contracts/protocol-stubs.md` | `21113dc36bc94e83e5ce381c52180a9bc7c03eb4` | last recorded stub; lacks workflow/view/artifact contracts |
| `contracts/identity-tags-permission-matrix.md` | `e3a7c3b6b6d3f034a30f7ad3e108737aed1364c6` | last recorded matrix; AgentSeat projection still needs re-freeze |

## 8. Promotion Rules

- Only the Lead changes a gate to Ready or capability status to usable.
- A Worker cannot self-declare a dependency satisfied.
- Documentation-only changes never promote capability status.
- A module below `execution-ready` cannot receive an implementation packet.
- Real behaviour, restart, permission, evidence, Agent parity, and failure recovery are required
  before usable; tests/typecheck alone are insufficient.
