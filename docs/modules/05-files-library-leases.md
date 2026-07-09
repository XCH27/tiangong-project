# 05 Files Library Leases Specification

## 1. Purpose
Provide unified file access, leasing locks, and Library asset indexing to ensure human and agent writes do not conflict and all files remain strictly accounted for.

## 2. Non-Goals
-   Do not allow file mutations without active leases.
-   Do not automatically import raw files as Library assets without user authorization.

## 3. Inputs
-   File path strings and write lease requests.
-   Asset registration metadata (hash, provenance, license).

## 4. Outputs
-   `WorkspaceFileLease` tokens.
-   File modification timeline events.
-   Library indexing database records.

## 5. State Model
-   Active leases map (`FilePath -> ActorRef`).
-   Library asset database schema.

## 6. Dependencies
-   M00 Spine SQLite databases.
-   Local workspace file system wrappers.

## 7. Acceptance Criteria
-   `usable`: Releasing a file lease triggers file log writes and timeline evidence updates. Write conflicts return active owner blocks.

## 8. Failure & Rollback
-   Write failures release the active lease and roll back file edits using git checkout/revert hooks.

## 9. Observability
-   All lease requests, checkouts, and file write actions log metadata to the session timeline.

## 10. Agent Hooks
-   `library:acquireLease`
-   `library:releaseLease`
-   `library:indexAsset`
