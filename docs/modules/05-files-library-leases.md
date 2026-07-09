# 05 Files Library Leases

## 1. Mission

Make workspace files and reusable Library assets visible, permissioned, and safe for human/agent collaboration.

## 2. User-Visible Loop

User or agent sees files, selects an item, performs a permissioned operation, sees timeline evidence, and can undo or inspect conflict state.

## 3. Current App Reuse

Reuse Craft file viewer, right context/files panel, internal action registry, and existing filesystem RPC.

## 4. Reference Projects

Codegraph for authorized indexing; Open Design for artifact/library ideas; RTK/Repomix for packaging boundaries. No unapproved file manager code.

## 5. UI Placement

Raw files belong to the workspace files area. Library belongs to asset/library surfaces and creative tools. Do not add another "all files" left-nav entry.

## 6. Backend / RPC / Locality

File operations are `LOCAL_ONLY`. Library indexing stores source, hash, license/provenance, usage refs, and deletion boundaries.

## 7. Session / Timeline / Permission / Rollback

Move/rename/delete/write actions use L2/L3 as appropriate, emit timeline, and hold file leases for writes/Git operations.

## 8. Data Model

File entry, Library asset, provenance, hash/version, license scope, `WorkspaceFileLease`, conflict state, undo handle.

## 9. Agent-Native Actions

Inspect files, select file, move/rename, register Library asset, release lease, undo file action.

## 10. Files To Inspect First

- `app/packages/shared/src/protocol/internal-action.ts`
- `app/packages/server-core/src/services/*file*`
- `app/apps/electron/src/renderer` files/context components

## 11. Files Likely Touched

File services, Library services, Files panel, action registry, session tools.

## 12. Parallel Work Packages

File read UI, file write actions, lease persistence, Library index can split after shared data fields freeze.

## 13. File Ownership

File/Library protocol changes are Lead-owned. Surface components owned by assigned module agents.

## 14. Validation Ladder

Path safety tests, lease conflict tests, typecheck, UI file operation smoke, undo conflict smoke.

## 15. Done / Not Done

`usable`: a write action is permissioned, leased, visible, and reversible. Read-only file browsing alone is not the full module.

## 16. Risks And Blocked Decisions

Risk: conflating raw files and Library assets. Keep them separate.

## 17. Non-Goals & Prohibitions

- **No Raw Promotion:** Raw workspace files must not be promoted or treated as Library assets without explicit user authorization, indexation, and license check.
- **No Non-logged Writes:** Do not perform write or delete operations on workspace files without Timeline logging and rollback/reversal points.
