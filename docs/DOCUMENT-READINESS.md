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
| M00 Platform Spine | contract draft | v0.11 storage adapter, AgentSeat/event/caller contract, transaction/recovery parity |
| M01 Clean Baseline | contract draft | retain/adapt/drop ledger and exact clean-v0.11 classification missing |
| M02 Terminal/CLI | contract draft | runtime discovery, host/process/PTY paths and real commands unverified on v0.11 |
| M03 Action Registry | contract draft | W0.1 caller/idempotency/revision/policy/event contracts not frozen |
| M04 Runtime Lanes/TeamRun | contract draft | TaskRun/TeamRun authority and W2-only dependency boundary need reconciliation |
| M05 Files/Library/ArtifactRef | contract draft | canonical workspace store, ArtifactRef/lease schema and limits not frozen |
| M06 Browser Evidence | contract draft | WebContentsView selection-overlay/lifecycle spike and setting/action contracts missing |
| M07 Spatial Canvas | contract draft | spatial renderer/license spike and new SpatialDocument contract missing |
| M08 External Jobs | contract draft | ExternalJob/provider/idempotency/protected-input contract and real provider missing |
| M09 Media Composition | contract draft | native media/render adapter, codec/license/platform decision and benchmark missing |
| M10 Memory/Context | contract draft | physical store/index adapter, delete/isolation proof, and canonical schemas missing |
| M11 Routing/Cost | contract draft | W2 usage core versus W4 routing split, provider facts, and persistence boundary unresolved |
| M12 Capability System | contract draft | capability core must be promoted in W0.1; external distribution remains concept |
| M13 Settings/Preferences | concept | full IA, canonical preference keys/migrations, and risk classes missing; M16 boundary is now defined |
| M14 Onboarding | contract draft | canonical v0.11 startup routes/preference keys and real diagnostics missing |
| M15 Messaging | contract draft | canonical secrets/session route, one bridge adapter, provider retention/terms evidence missing |
| M16 Panel Platform | contract draft | v0.11 shell primitive inspection, layout schema/preferences/actions missing |
| M17 Composable Workflows | contract draft | canonical workflow/run/TaskRun relationship and action IDs missing |
| M18 Web Artifact | contract draft | real local project/build/preview adapter and action schemas missing |
| M19 Presentation/Motion | contract draft | native deck/PPTX/HTML/render adapter and fidelity evidence missing |

## 4. Immediate P0 Documentation Work

1. Complete the clean Craft Agents v0.11 migration ledger and record retained extension points.
2. Re-freeze one canonical W0.1 contract covering caller provenance, idempotency, document
   revisions, typed event payloads, orthogonal action policy, ArtifactRef, capability manifest,
   workflow, ExternalJob, and view contribution.
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
