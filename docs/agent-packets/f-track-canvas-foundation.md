# F Track Canvas Foundation

## Wave

F Track. Runs in its own worktree after canvas contract freeze.

## Module Sections Covered

- `07-canvas-design-surface`
- asset parts of `05-files-library-leases`
- action parts of `03-internal-action-registry`

## Goal

Create the native canvas foundation: document store, renderer surface, action bridge, and first real node edits.

## Allowed Files

Assigned after Lead freezes `canvas` protocol. Expected domains:

- canvas renderer components
- canvas store/action bridge
- canvas action services
- canvas tests

## Forbidden Files

- shared canvas/internal-action protocols unless Lead updates first
- default workbench shell
- Library protocol without Lead approval
- unapproved engine source

## Frozen Contracts Consumed

- `internal-action.ts`
- canvas protocol once created
- Library asset/provenance fields

## Interfaces Produced

- CanvasRoot
- node store bridge
- read/select/mutate/undo canvas actions
- SessionEvent bridge for coalesced edits

## UI Placement

Canvas is a professional surface. It is not a replacement default shell.

## Permission / Timeline Requirements

Human and agent edits use the same action ids. Drag/resize events are coalesced. Asset writes use Library provenance.

## Validation Ladder

1. canvas store/action tests
2. renderer nonblank canvas smoke
3. human edit timeline event
4. agent edit same action event
5. undo smoke

## Completion Report Template

```text
F Track report:
- Worker:
- Worktree / branch / commit:
- Canvas slice:
- Files changed:
- Forbidden files not touched:
- Validation:
- Human+agent action parity:
- Final status:
- Remaining blockers:
```

## Board Cards

Use the card format defined in `docs/BOARD-SYNC.md`. Append one card per claimed slice below
this section as work is claimed.
