# SPEC — <Release id + name>

> Spec status: `draft` | `active` | `done`
> Development-order row: `R0`…`R18` (must match `05-ROADMAP.md`)
> Owner acceptance date: —

Spec status describes the lifecycle of this implementation contract. It is not a capability
status, module packet readiness, or roadmap release status; use the fixed capability vocabulary in
[`../07-PLAYBOOK.md`](../07-PLAYBOOK.md) when reporting what the software can do.

For persistent Goal execution, this existing spec is a projection, not a second task state:
`Outcome = Goal`, `Scope/References/Risks = Context + Constraints`, and
`Acceptance criteria = Done when`. Progress and next actions stay in Goal/thread state; do not add
dated run logs or create another planning document.

## Outcome

One paragraph: the user-visible or system behavior that exists when this release is done, in plain
language the owner can verify.

## User story / walkthrough

Concrete: who does what, what they see, step by step. For non-visual releases, the observable
system walkthrough (commands, files, events).

## Scope

- **In:** the existing paths/authorities this release touches (from
  [`../06-CODE-MAP.md`](../06-CODE-MAP.md); classify REUSE/EXTEND/NEW per row).
- **Out (non-goals):** the adjacent things explicitly not done, so drift is detectable.
- **Reserved paths:** what implementing agents must not modify (usually: this spec, acceptance
  criteria, unrelated tests/harness).

## Acceptance criteria

Stable IDs. Each criterion is checkable by a named method (test, data-path trace, owner click).

| ID | Criterion | Verified by |
|---|---|---|
| Rx-C1 | … | … |

## Pages touched

Which surfaces from [`../12-PAGE-ARCHITECTURE.md`](../12-PAGE-ARCHITECTURE.md) this release
creates, extends, or wires — with the §4 state checklist applied to each. Frontend-track pages
(mocked, preview-gated) list their adapter contract here. Use canonical `P-xx` IDs from §3A and
state the host/primary home; a route name alone is not a page contract. The visual anchor is an
exact existing component/flow/playground fixture, and the intentional delta states what alone may
change visually.

| Surface ID | Create/extend/wire | Visual anchor + intentional delta | Adapter/data contract | Permission | States exercised | Owner visual checkpoint |
|---|---|---|---|---|---|---|
| P-xx | | | | | loading/empty/error/denied/offline/recovery/narrow/i18n | |

## References consumed

Which reference-project conclusions from
[`../11-PRODUCT-MATRIX.md`](../11-PRODUCT-MATRIX.md) /
[`../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md`](../../源码参考/meta/CAPABILITY-REFERENCE-MAP.md)
this release actually uses (mechanism reference, compatibility adapter, licensed local rework), and
what was explicitly rejected. "None" is a valid answer; silence is not.

## Dependencies and unresolved edges

What this release consumes from earlier ones; any ahead-of-dependency work and its recorded edge.
List hard dependencies separately from soft improvements. Every cross-context write names the
authority and action seam it uses; a page mock must not silently establish a new store.

## Risks and rollback

The main ways this goes wrong; how the release is rolled back if it lands badly.

## Verification plan

Which ladder levels ([`../09-QUALITY.md`](../09-QUALITY.md)) apply, which tests are added/extended,
what the owner's CHECK THIS list will contain.

## Doc updates on completion

Exactly which docs change when this ships (capability rows, user-facing docs, roadmap status).
