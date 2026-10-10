# Documentation Readiness

> **Authority:** current documentation-maturity register  
> **Updated:** 2026-07-09  
> **Scope:** documentation only; no capability status is promoted by this file

## 1. Three Independent Axes

Do not collapse product status, execution permission, and specification quality.

| Axis | Allowed values | Meaning |
|---|---|---|
| capability status | `not implemented`, `display-only`, `wired but not visually checked`, `usable` | what the real product currently does |
| execution gate | `Locked`, `Ready`, `In Progress`, `Blocked` | whether a Worker may start/continue the assigned slice |
| spec maturity | `concept`, `contract draft`, `execution-ready` | whether the document can support implementation without invention |

`Blocked` is not a capability status. `Locked` is not proof that a spec is complete. A module may
be `not implemented`, `Locked`, and `contract draft` simultaneously.

## 2. Spec Maturity Rules

### `concept`

Purpose/direction exists, but one or more of the following is missing: state authority, field-level
contracts, actions, error/recovery, dependency contracts, exact acceptance procedure, or evidence
for the selected adapter.

### `contract draft`

The module has a coherent boundary, data/action/state proposal, failure paths, and verification
procedure. Shared contracts, implementation baseline, dependency behaviour, or exact file/adapter
mapping still requires Lead freeze/evidence. Workers must not implement it.

### `execution-ready`

All of the following are true:

1. binding decisions and canonical contract versions are frozen;
2. state authority and persistence/recovery are unambiguous;
3. field-level inputs, outputs, actions, errors, permissions, undo/cancel, and events are defined;
4. dependency contracts and gate versions are satisfied;
5. the current v0.11 implementation paths/extension points have been inspected and recorded;
6. selected external engine/library version and license are verified;
7. a finite packet names exact allowed files and one complete user-visible loop;
8. acceptance can be performed on real behaviour without guessing.

No active module is `execution-ready` on 2026-07-09 because the v0.11 migration ledger and W0.1
canonical re-freeze are incomplete.

## 3. Current Module Register

| Module | Spec maturity | Primary blocking evidence/decision |
|---|---|---|
| M00 Platform Spine | contract draft | v0.11 storage adapter; AgentSeat/event/caller recorded as partial in `docs/audits/2026-10-10-w01-exit3-canonical-parity.md` and not re-frozen; transaction/recovery parity |
| M01 Clean Baseline | contract draft | behaviour ledger started (`docs/audits/2026-10-10-w01-v011-baseline-blk001.md`); Mac source tree recorded (`docs/audits/2026-10-10-w01-exit1-mac-checkout.md`); `typecheck:all` failed (exit 2); Electron launch and relaunch recorded (`docs/audits/2026-10-10-w01-exit1-electron-launch.md`); RPC project create, session turn, and `browser-pane:create` recorded (`docs/audits/2026-10-10-w01-exit1-rpc-loop.md`); `route=board` and `route=settings` restores recorded, not an AX or menu click (`docs/audits/2026-10-10-w01-exit1-routes-migration.md`); branch `fleet/migration-from-v0.11.0` open, adapt ports not started, `app/` still 0.10.5; `typecheck:all` still the #52 failure; Exit item 1 stays open; fleet-old rows still missing |
| M02 Terminal/CLI | contract draft | runtime discovery, host/process/PTY paths and real commands unverified on v0.11 |
| M03 Action Registry | contract draft | action-id policy columns frozen at 1.3.0 (D47–D49); caller, idempotency, revision, and typed-event envelopes not frozen (`docs/audits/2026-10-10-w01-exit3-canonical-parity.md`) |
| M04 Runtime Lanes/TeamRun | contract draft | TaskRun/TeamRun authority and W2-only dependency boundary need reconciliation |
| M05 Files/Library/ArtifactRef | contract draft | canonical workspace store and lease limits not frozen; ArtifactRef stays proposed and version-gated (D53); W2 M05 may not consume it until a later freeze |
| M06 Browser Evidence | contract draft | WebContentsView selection-overlay/lifecycle spike and setting/action contracts missing |
| M07 Spatial Canvas | contract draft | spatial renderer/license spike open (BLK-003); SpatialDocument stays proposed and version-gated (D53); W3A M07 may not consume it; historical CanvasDocument is not the spatial contract |
| M08 External Jobs | contract draft | ExternalJob draft is version-gated (D53), not frozen; W2 M08 may not consume it; real provider still missing |
| M09 Media Composition | contract draft | native media/render adapter, codec/license/platform decision and benchmark missing |
| M10 Memory/Context | contract draft | physical store/index adapter, delete/isolation proof, and canonical schemas missing |
| M11 Routing/Cost | contract draft | W2 usage core versus W4 routing split, provider facts, and persistence boundary unresolved |
| M12 Capability System | contract draft | capability manifest stays proposed and version-gated (D53); W1 M12 may not consume it; D50 namespace strings are not this schema; external distribution remains concept |
| M13 Settings/Preferences | concept | full IA, canonical preference keys/migrations, and risk classes missing; M16 boundary is now defined |
| M14 Onboarding | contract draft | canonical v0.11 startup routes/preference keys and real diagnostics missing |
| M15 Messaging | contract draft | canonical secrets/session route, one bridge adapter, provider retention/terms evidence missing |
| M16 Panel Platform | contract draft | v0.11 shell primitive inspection still open; ViewContribution, ViewInstance, and LayoutSnapshot stay proposed and version-gated (D53); W2 M16 host may not consume them |
| M17 Composable Workflows | contract draft | WorkflowDefinition and WorkflowRun stay proposed and version-gated (D53); W3A M17 may not consume them; TaskRun relationship and workflow action ids stay unfrozen |
| M18 Web Artifact | contract draft | real local project/build/preview adapter and action schemas missing |
| M19 Presentation/Motion | contract draft | native deck/PPTX/HTML/render adapter and fidelity evidence missing |

## 4. Immediate P0 Documentation Work

1. Complete the clean Craft Agents v0.11 migration ledger and record retained extension points.
2. Re-freeze one canonical W0.1 contract covering caller provenance, idempotency, document
   revisions, and typed event payloads. Those fields stay partial (Exit 3). ArtifactRef, the
   capability manifest, workflow, ExternalJob, spatial, and view contribution are version-gated
   by D53 and stay proposed. They are not part of this re-freeze and are not in
   `CONTRACT_VERSION` 1.3.0. Orthogonal action-id policy columns are already frozen at 1.3.0.
   The Exit 3 note records the open fields and does not bump `CONTRACT_VERSION`. Exit item 4
   stays open.
3. Resolve physical persistence from `PERSISTENCE-AUTHORITY-MAP.md`; remove active claims that
   assume unverified SQLite/JSON authorities.
4. Align wave gates, phase mapping, ownership precedence, and the hidden upstream gate.
5. Rewrite M10, M13, M14, and M15 before their waves; do not treat file presence as readiness.
6. Complete required engine/adapter spikes before promoting M06/M07/M09/M16/M18/M19.

## 5. First Documentation-to-Product Promotion Order

```text
W0.1 contracts and v0.11 migration
-> M00 + M03 + M12 capability core
-> M16 host + M02 + M05
-> M08 job core + M17 workflow core + M07 spatial slice
-> real text-to-image loop
-> M18/M19/M09 fan-out and multi-asset editing
-> intelligence/polish modules after their own spec gates
```

This order does not authorize implementation. The live execution gate remains
`WAVE-MODULE-MAP.md`.

## 6. Fable-5 Evidence Boundary

Fable-5's recommendations were used as review input, not copied as authority. This round confirmed
from documentation that its strongest criticism is valid: many files are interface summaries,
not executable specs. Claims in its reports that depend on source-code inspection were not
independently re-verified in this documentation-only round and are not promoted as facts here.

The following Fable proposals were deliberately not adopted unchanged:

- fixed nine-type canvas node union;
- OpenPencil as the universal React canvas host;
- timeline sequence as a document conflict algorithm;
- `export_selection` as L0 while writing a file;
- one PanelDefinition type for both panels and main surfaces;
- unverified performance numbers and engine command names.
