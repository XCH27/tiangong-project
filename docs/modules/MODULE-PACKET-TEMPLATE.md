# Module packet template

Every module packet must replace placeholders with repository-grounded facts before its packet
state can advance beyond `PACKET_DRAFT` in [`PACKET-INDEX.md`](PACKET-INDEX.md). A matrix row alone
is not a module design. `BREADTH_ONLY`, `PACKET_DRAFT` and `READY_FOR_SPEC` are the only
packet-index states; spec lifecycle is a separate roadmap/spec fact. `covered`, packet `READY` and
`ACTIVE_SPEC` are retired terms and must not be introduced.

The registry-to-page join is maintained in [`PACKET-INDEX.md`](PACKET-INDEX.md); minimum criteria
for every registry row live in [`ACCEPTANCE-INDEX.md`](ACCEPTANCE-INDEX.md). A packet links those
canonical IDs rather than inventing another acceptance vocabulary.

## 1. Reality baseline

- Existing Craft/Fleet capability row:
- Actual code paths and symbols:
- Current status: `usable` · `wired but not visually checked` · `display-only` · `not implemented`:
- Known limitations and environment dependencies:
- Registry ID(s), bounded context, architectural kind and surface IDs (`P-xx`):
- Development-order anchor (R0–R18 from `PACKET-INDEX.md`; conditional rows name implement-or-`NO_GAP` evidence):

## 2. User-visible contract

- Primary user story:
- Entry points/pages/panels:
- Loading/empty/error/denied/offline/recovery states:
- Permission and owner checkpoints:

## 3. Domain and seams

- Bounded context:
- Native domain objects and invariants:
- Core authority reused:
- Adapter interface and implementation:
- Human action and Agent action parity:
- Persistence, idempotency, cancellation and restart behavior:
- Cross-context dependency edges (read/write direction) and forbidden duplicate authorities:

## 4. Reference evidence

| Project | Commit | License | Files/symbols read | Mechanism used | Why not direct reuse |
|---|---|---|---|---|---|
| | | | | | |

## 5. Acceptance and execution

Each criterion must be observable and tied to a code path or a named test:

| ID | Given | When | Then | Evidence command/path | Status |
|---|---|---|---|---|---|
| M-001 | | | | | not implemented |

Criteria must use the module's IDs from `ACCEPTANCE-INDEX.md` (or a spec-owned child ID such as
`VID-001a`). “Works”, “integrates later” and screenshot-only assertions are not criteria. Every
criterion names the fixture/command/path that proves it and states which failure, denial, offline
and recovery cases are intentionally `none`.

The packet must also state:

- implementation slices and their dependency edges;
- exact roadmap order, hard dependencies versus soft improvements, and the smallest reversible slice;
- cheapest verification ladder and owner visual checkpoint;
- failure, recovery and rollback scope;
- exact documentation updates required after the slice.

“Implement later”, “integrate at activation”, a near/mid/far bucket, or “reference X” without these fields is a research
note, not an executable module plan.
