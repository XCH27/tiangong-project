# M05 — Files, Library, Artifact References, and Leases

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft
> **Wave:** W2
> **Owner:** Lead for file/ArtifactRef contract; M05 Worker after packet approval
> **Depends on:** M00 usable, M03 usable, canonical workspace authority on v0.11 baseline

## 1. Purpose

Let humans, Agents, and workflows read and mutate real workspace files without silent conflicts,
and exchange versioned project artifacts without inventing a second asset store. Raw files,
Library assets, ArtifactRefs, and leases are related but not interchangeable.

The first closed loop is: human and Agent edit one real file through the same action path,
conflicting writes are refused, undo restores the previous bytes, and one output is registered as
a provenance-tracked ArtifactRef/Library asset.

## 2. Four Concepts

| Concept | Meaning | Authority |
|---|---|---|
| workspace file | real bytes at a workspace-relative path | filesystem |
| Library asset | deliberately selected reusable asset with hash/license/provenance | M05 metadata referencing real bytes |
| ArtifactRef | typed/versioned handoff envelope for a file, native document, evidence, or output | M05 metadata plus native owner |
| file lease | temporary coordination record for a write scope | M00/M05 durable state |

ArtifactRef never duplicates content. Library registration never makes a second hidden copy unless
an explicit import/copy action creates one and records it.

## 3. Scope

### In Scope

- permissioned create/update/rename/move/delete and atomic writes;
- exclusive write leases, renewal, release, expiry, conflict/reclaim UX;
- operation-scoped snapshots for reversible writes;
- Library registration, hashing, provenance, license, sensitivity, and usage references;
- ArtifactRef creation, versioning, resolution, parent lineage, and missing-source behaviour;
- generated/exported output commit for M08/M09/M18/M19.

### Out of Scope

- automatic import of every workspace file into Library;
- implicit Git rollback or a hidden shadow workspace;
- a lease granting authorization;
- exposing unrestricted local paths to untrusted callers;
- native document edit semantics owned by other modules.

## 4. User-Visible Mutation Loop

```text
human/Agent/workflow operation
-> M03 schema validation
-> M00 permission/approval
-> acquire file-scope lease
-> revalidate current revision/hash
-> atomic filesystem mutation
-> update ArtifactRef/Library metadata when requested
-> commit evidence and undo correlation
-> release lease
-> visible result
```

Approval is resolved before a lease is held. A success response is forbidden until filesystem
and required metadata/evidence commits agree.

## 5. Lease Contract

One v1 lease represents exclusive write coordination over one normalized workspace-relative path
or a finite explicit path set.

Required fields:

```ts
type FileLease = {
  leaseId: string
  workspaceId: string
  paths: string[]
  holder: ActorRef
  invocationId: string
  acquiredAt: string
  renewedAt: string
  expiresAt: string
  status: 'active' | 'released' | 'expired' | 'reclaimed'
  releaseReason?: string
}
```

Proposed v1 timing, to be validated on the implementation baseline:

- TTL: 60 seconds;
- renewal attempt: every 20 seconds while the owning invocation is active;
- a missing renewal does not transfer ownership silently;
- the next writer sees an expired/reclaimable conflict and may claim it after verifying no live
  owner;
- force-reclaim of an apparently live lease is L2 and leaves explicit evidence;
- process exit/restart reconciliation marks orphaned leases expired after the deadline.

Parent/child path overlap is a conflict. Path normalization rejects traversal, symlink escape, and
case-fold collisions according to the host filesystem rules.

System-owned transactional metadata writes do not recursively acquire user-file leases. They
remain inside their owning M00/M05 transaction and cannot be called as an ungoverned file API.

## 6. File Actions

| Existing action | Lease | Undo/side-effect rule |
|---|---|---|
| `file.create` | destination path | remove new file only if unchanged and unreferenced |
| `file.update` | target path | restore operation snapshot when current hash matches expected result |
| `file.rename` | source + destination | restore both paths if neither has conflicting changes |
| `file.move` | source + destination | same as rename, including cross-volume atomicity fallback |
| `file.delete` | target path | L3 unless moved to an approved recovery/trash mechanism |

Every action includes idempotency and precondition hashes. A stale precondition returns conflict;
it does not overwrite.

## 7. Atomicity and Undo

- New/updated bytes are written to a controlled temporary sibling and atomically renamed when the
  filesystem permits.
- Cross-volume moves use copy-verify-rename-delete with explicit partial-failure recovery.
- L1 snapshots are operation-scoped, encrypted/protected at the same sensitivity as the source,
  and retained only for the configured undo window.
- Proposed first threshold: snapshots up to 50 MiB per action. Larger writes require a bounded
  chunk/snapshot strategy or are reclassified before execution; they are not silently called L1.
- Undo rechecks hashes and downstream references. A conflict returns a visible no-op rather than
  overwriting later work.
- Git is an optional separately permissioned capability, never the generic rollback path.

## 8. Library Asset Contract

```ts
type LibraryAsset = {
  assetId: string
  versionId: string
  workspaceId: string
  sourceRef: string
  mediaType: string
  byteSize: number
  contentHash: { algorithm: 'sha256'; value: string }
  provenance: {
    origin: 'workspace' | 'generated' | 'imported' | 'captured' | 'exported'
    sourceInvocationId?: string
    sourceJobId?: string
    parentArtifactRefs: Array<{ artifactId: string; versionId: string }>
  }
  license: {
    status: 'known' | 'unknown' | 'restricted'
    identifier?: string
    attribution?: string
  }
  sensitivity: 'public' | 'workspace' | 'restricted'
  usageRefs: EntityRef[]
  createdAt: string
}
```

Unknown license is recorded as unknown. It is never converted to “free to use.” Export/publish
operations may block on missing or restricted license metadata.

## 9. ArtifactRef Handoff

M05 implements the accepted ArtifactRef contract from
`docs/contracts/composable-workspace-contracts.md` after W0.1 promotion.

Rules:

- exact versions are immutable;
- an edit produces a new version and parent linkage;
- a reference may point to a native document owner rather than a normal file;
- callers receive a scoped resolver/handle, not necessarily a raw path;
- missing source displays a broken-reference state; it does not cascade-delete canvas/workflow
  nodes;
- sensitivity and permission are re-evaluated on resolution;
- previews are derived and replaceable.

## 10. Generated/Rendered Output Commit

M08/M09/M18/M19 must use this sequence:

1. create a bounded temporary output under an approved owner scope;
2. validate media type, size, checksum, and expected invocation/job;
3. acquire destination lease;
4. atomically commit the file;
5. register LibraryAsset/ArtifactRef provenance in the same logical completion transaction;
6. return the ArtifactRef and evidence;
7. only then mark the owning action/job completed.

If metadata commit fails after file commit, the job remains reconciling and the orphan output is
quarantined/reconciled. It is not reported as a finished untracked artifact.

## 11. UI Contributions

- project/file explorer and Library tabs contributed to M16 left panel;
- conflict card showing holder, expiry, affected paths, wait/retry/reclaim options;
- artifact inspector showing exact version, parents, hash, sensitivity, license, and usage;
- missing-reference and stale-version states reusable by M07/M09/M18/M19.

## 12. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| permission denied | no lease/write | narrow request or obtain valid approval |
| active lease conflict | no write; owner/expiry shown | wait/request release/reclaim if safe |
| stale hash/revision | explicit conflict | reread and submit new edit |
| path escape/symlink violation | validation refusal | choose permitted path |
| atomic rename/copy failure | original preserved when possible; partial state tracked | retry/reconcile cleanup |
| snapshot too large | action not classified as reversible | choose bounded strategy/approval |
| metadata commit failure | output quarantined/reconciling | repair and commit once |
| missing artifact source | broken reference, no cascade delete | relink exact version or remove reference |

## 13. First Usable Verification

1. Create/update/rename/move one real file through human and Agent paths using the same actions.
2. Verify lease acquisition, atomic mutation, evidence, restart persistence, and L1 undo.
3. Race two writes; verify one explicit conflict and no lost bytes.
4. Expire and safely reclaim a lease; attempt live force-reclaim and verify L2 behaviour.
5. Modify a file externally between precondition and commit; verify stale conflict.
6. Register a real generated output and inspect hash, parents, license status, sensitivity, and
   usage refs.
7. Resolve the same ArtifactRef from M07 and M17 without duplicating source bytes.
8. Simulate metadata failure after file output and reconcile without double commit.

## 14. Open Gates

- Freeze ArtifactRef, LibraryAsset, lease, hash/precondition, and action payload contracts.
- Verify canonical workspace/preferences/state roots after v0.11 migration.
- Validate proposed TTL/snapshot limits with real runtime and large-file behaviour.
- Produce exact binary/indexing size policy before Library bulk import features.

## 15. Non-Goals and Prohibitions

- No permission through lease ownership.
- No automatic all-files Library indexing.
- No silent last-write-wins.
- No generic Git rollback.
- No third artifact content store.
