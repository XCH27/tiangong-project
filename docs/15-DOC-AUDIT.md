# 15 — Documentation contract and reality check

This file is an evergreen check for whether documentation helps an executing Goal. It contains no
repository snapshot, progress log, or dated completion claim. Runtime facts must be checked from the
current code, Git state, tests, and the active Goal before acting.

## Goal-readiness check

A task is startable only when an agent can answer these without reading the whole corpus:

1. **Goal / done when:** explicit owner Goal, or the ACTIVE roadmap row and one linked spec slice.
2. **Context:** exact code paths confirmed with `rg`; reference files only when a concrete design
   question remains.
3. **Constraints:** applicable non-negotiables, authority seam, reserved paths, and checkpoints.
4. **Evidence:** one acceptance ID or checkable behavior plus the cheapest sufficient validation.
5. **Next safe action:** one reversible action that advances the criterion.
6. **Development-order owner:** one R0–R18 anchor in the roadmap/packet index; no near/mid/far-term
   bucket and no unowned “future spec”. Conditional rows close with implementation or `NO_GAP` evidence.

If any field is missing, repair the canonical existing document or narrow the Goal/thread state.
Do not create a new audit, plan, packet, run log, or dated report to bridge the gap.

## Reality rules

- `git status`, current code, and current tests override historical counts and prose observations.
- `11-PRODUCT-MATRIX.md` maps breadth/authority; it is not an implementation specification.
- `12-PAGE-ARCHITECTURE.md` inventories surfaces; it does not prove wiring.
- `13-ORCHESTRATION.md` records design; it is not a persisted runtime authority.
- A reference candidate demonstrates a mechanism only; it is not a dependency or shipped feature.
- A runtime/package name does not prove its harness profile. Claims about Pi, Claude or another lane
  must inspect the actual serialized prompt/tool projection and distinguish runtime reuse from
  Fleet wrapper behavior (E13).
- Spec lifecycle, module readiness, release state, and capability status are different fields.
- Goal progress lives in Goal/thread state and evidence, never in a growing Markdown journal.

## Completion gate for a module

A module packet may move from `BREADTH_ONLY`/`PACKET_DRAFT` to `READY_FOR_SPEC` only when all are present:

1. actual current code paths or a clearly marked NEW boundary;
2. a bounded-context owner and no duplicated core authority;
3. at least one audited reference with fixed commit, license and exact files;
4. an execution sequence with named dependencies and rollback;
5. observable acceptance IDs and evidence commands/paths;
6. page/surface states including failure, denied, offline and recovery behavior.

Until then, the only honest implementation status is `not implemented`, `display-only`, or the
verified Craft status from the capability map. The implementation status vocabulary is fixed in
[`07-PLAYBOOK.md`](07-PLAYBOOK.md); `breadth` and packet-index states describe documentation only.

## Claim and status rules

- `11-PRODUCT-MATRIX.md` is the breadth/authority mapping, not an implementation specification.
- `12-PAGE-ARCHITECTURE.md` is the surface inventory and state contract, not proof that a page is
  wired.
- `13-ORCHESTRATION.md` is a design decision record; its state machine is not a persisted runtime
  authority until a roadmap spec and code path establish that explicitly.
- A `references/` candidate or a module's “proposed” technology route is evidence to inspect, not
  a dependency or a shipped capability.
- `specs/` status (`draft`/`active`/`done`) describes an implementation contract and is
  separate from capability status and module packet readiness.
- An external benchmark supplies a hypothesis, not a Fleet KPI. Exact savings, token thresholds,
  cache-hit targets and model-routing defaults require a sealed local task, baseline and acceptance
  evidence. Source-file characters or tool counts may inventory fixed tax but are not provider
  token measurements.

## Canonical field ownership (do not duplicate authorities)

The same fact may be linked from several documents, but it is edited in exactly one place. A
repeated value is a projection and must carry the source ID/link; freehand copies are an audit
failure. The following fields are canonical:

| Field | Canonical owner | Allowed projections / rule |
|---|---|---|
| Owner intent / target outcome | current owner request; durable product intent in `01-WHITEPAPER.md` | `design-library/` may provide design input, never narrow or mark it shipped |
| Safety boundary / invariant | `03-NON-NEGOTIABLES.md` and `04-ARCHITECTURE.md` | module packets/specs link the section; they do not restate a weaker variant |
| Binding technical/product decision | `02-DECISIONS.md` | matrix, orchestration and modules cite the decision ID; no second decision ledger |
| Integration order and release state | `05-ROADMAP.md` + linked `specs/` | every registered capability maps through `modules/PACKET-INDEX.md` to R0–R18; projections cannot invent time horizons |
| Actual code path and observed implementation status | current code, indexed by `06-CODE-MAP.md` | registry and matrix mirror the observed status; a code mismatch is a gap, not a silent decision change |
| Capability breadth and stable registry ID | `modules/REGISTRY.md` | `11-PRODUCT-MATRIX.md`, pages and packets reference the ID; they cannot invent or delete a capability |
| Capability behavior/authority/gap/reference column | `11-PRODUCT-MATRIX.md` | registry supplies breadth; implementation status must mirror the registry row or state its narrower scope explicitly |
| Page/panel surface and surface status | `12-PAGE-ARCHITECTURE.md` P-IDs | packets/specs link P-IDs; surface status may be lower than capability status and must never promote it |
| Module packet readiness and registry→surface/spec join | `modules/PACKET-INDEX.md` + `modules/CROSSWALK.md` | registry remains breadth-only; `BREADTH_ONLY`/`PACKET_DRAFT` are documentation states, not capability states |
| Executable acceptance criteria | active `specs/` and `modules/ACCEPTANCE-INDEX.md` | module README may summarize IDs, but Given/When/Then and evidence live in the active spec/index |
| Reference admission and license facts | `references/REFERENCE-REGISTRY.md` + `源码参考/meta/` | product matrix names only admitted/candidate IDs; no prose may promote a candidate |
| Feature territory / in-flight ownership | `FEATURE-REGISTRY.md` | it is coordination metadata only, never proof of implementation or a task authority |
| Owner checkpoints and acceptance language | `OWNER-GUIDE.md` | duplicate checkpoint documents are not retained |
| Documentation language and project terminology | root `AGENTS.md` rule 10 + `10-GLOSSARY.md` | English-first; retain only exact owner quotes, `zh-Hans` literals/fixtures, or identity-bearing proper names, with an English gloss when needed |

### Status projection rule

`implementation status` is not a design-readiness field. A capability row is `usable` only when
its required real path and its required user-visible surfaces satisfy the acceptance contract; if
one required surface is `display-only`, the capability cannot be promoted above that state. A page
may be `usable` as a Craft surface while the Fleet extension mapped to the same registry ID remains
`not implemented`; the row must name that scope explicitly. This rule prevents “usable Craft
baseline” from being copied to an unimplemented Fleet capability.

### Minimum cross-document join

Every registry ID must resolve to exactly one bounded context, one authority/seam, one P-ID or an
explicit non-visual reason, one packet state, one acceptance anchor and one reference status. The
join is checked across the per-ID rows in [`modules/PACKET-INDEX.md`](modules/PACKET-INDEX.md), the
behavior/authority row in [`11-PRODUCT-MATRIX.md`](11-PRODUCT-MATRIX.md), and the evidence row in
[`references/REFERENCE-REGISTRY.md`](references/REFERENCE-REGISTRY.md). A group-level summary in
`modules/CROSSWALK.md` is navigation only and does not replace those per-ID records.

Run `python3 scripts/validate-doc-contracts.py` from the repository root after changing the registry,
packet index, page architecture or acceptance index. It checks ID equality, page and acceptance
references, packet paths, packet-state vocabulary and R0–R18/TE1 anchors. The script validates joins;
it never promotes design or implementation status.
