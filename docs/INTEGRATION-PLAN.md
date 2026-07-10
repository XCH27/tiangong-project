# Fleet Documentation Reconciliation Plan

> **Status:** W0.1 in progress. This file is a documentation control record, not proof that code has been changed or verified.

## Goal

Produce one coherent pre-implementation baseline: the decision ledger, architecture boundary, contracts, wave map, ownership, packets, and module specifications must describe the same delivery order and authority model.

## Completed Documentation Corrections (2026-07-09)

- D22/D38 and Project Direction now define a logical in-product spine for W1/W2; a physical daemon is conditional.
- W1 is locked behind W0.1; the stale “open but blocked” state has been removed from the live Wave Map.
- M14 Onboarding and M15 Messaging are separated in the module index, ledger, and ownership model.
- Existing worker packets that grant frozen-protocol writes or mix waves are marked superseded.
- M00, M02, M03, and M05 now state complete loop, authority, error, recovery, and verification requirements.
- Browser/canvas implementation sketches now state the required Action Registry/adapter boundaries.
- Owner-approved modular spatial/workflow direction is now expressed as M07/M12/M16/M17 plus
  M18/M19 native output modules; Fable-5 drafts were used as review input, not copied as authority.
- Documentation maturity is separated from capability status and execution gate.

## Still Required Before W1 Opens

| Item | Owner | Evidence required |
|---|---|---|
| Reconcile canonical implementation with contract text | Lead | explicit version, commit/reference, and parity check |
| Complete clean v0.11 migration ledger | Lead | retain/adapt/drop/defer path ledger and baseline validation |
| Freeze AgentSeat/tag projection, ActionInvocation versioning, event payload rules | Lead | one versioned contract update |
| Resolve composable contracts and persistence authority | Lead | accepted/rejected ArtifactRef/capability/job/workflow/spatial/view types; storage ADR |
| Resolve product/internal namespace | Owner/Lead | recorded decision before plugin/storage API freeze |
| Generate replacement W1 packet | Lead | one worker per worktree; no frozen protocol writes |
| Decide W1 gate | Lead | Wave Map and Board updated in the same change |

## Non-Claims

- This plan makes no claim that protocol TypeScript, build commands, package paths, or runtime behaviour have been verified.
- No documentation-only change promotes a feature to `usable`.
- Downstream W2–W5 packets remain locked until their preceding wave gates are met.
