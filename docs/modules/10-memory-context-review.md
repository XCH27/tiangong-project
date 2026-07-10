# M10 — Memory, Context Pack, and Review

> **Capability status:** `not implemented`
> **Execution gate:** Locked
> **Spec maturity:** contract draft; physical memory/index adapter unresolved
> **Wave:** W4
> **Owner:** Lead for memory/context contracts; M10 Workers by separate slices
> **Depends on:** M00, M03, M05, M08, M11 usage reporting, M13/M16 views

## 1. Purpose

Keep local memory accurate, isolated, inspectable, and deletable; assemble bounded project context;
and produce governed internal/external review reports with evidence and honest cost labels.

M10 has two separately packeted loops that share governance and UI:

- **M10A Memory/Retrieval:** propose -> review/accept -> retrieve under scope -> inspect/delete.
- **M10B Context Pack/Review:** select scope -> preview/secret scan -> authorize external handoff if
  any -> run review -> save evidence-backed report.

No packet may attempt both loops at once.

## 2. Memory Model: Orthogonal Dimensions

The previous L0-L4/five-tier model is superseded. The canonical draft uses three independent
dimensions.

### 2.1 Seven Partitions

| Partition | Owner/scope | Cross-project rule |
|---|---|---|
| session | one session's temporary working facts | forbidden |
| project | one project's decisions/facts | forbidden |
| tool | reusable, evidence-backed operation lessons | explicit read-only transfer with origin |
| user-preference | confirmed user preferences | user scope, still filtered by sensitivity |
| policy | Lead/system governance rules | read-only to Agents |
| sensitive-quarantine | entries requiring review/redaction | never injected automatically |
| archive | superseded/expired records retained by policy | not recalled by default |

### 2.2 Four Lifecycle States

`transient -> active -> retained -> archived`

- transient is not eligible for broad retrieval;
- active is valid in its owning session/project;
- retained has passed quality/review policy;
- archived is excluded from ordinary recall but remains governed until deletion/retention expiry.

### 2.3 Sensitivity

`normal | sensitive | raw_path | uncertain`

Unknown/omitted sensitivity defaults to `uncertain`, which uses the most restrictive routing and
redaction. Partition and sensitivity filtering always occurs before similarity/scoring.

## 3. Memory Entry Contract

```ts
type MemoryEntry = {
  memoryId: string
  schemaVersion: 1
  partition: 'session' | 'project' | 'tool' | 'user_preference' |
    'policy' | 'sensitive_quarantine' | 'archive'
  lifecycle: 'transient' | 'active' | 'retained' | 'archived'
  sensitivity: 'normal' | 'sensitive' | 'raw_path' | 'uncertain'
  ownerScope: { sessionId?: string; projectId?: string; userId?: string; toolId?: string }
  content: string
  confidence: 'high' | 'medium' | 'low' | 'uncertain'
  sourceRefs: string[]
  originProjectId?: string
  validFrom: string
  expiresAt?: string
  supersedes?: string[]
  conflictRefs?: string[]
  allowedTargets: string[]
  blockedTargets: string[]
  createdBy: ActorRef
  createdAt: string
  updatedAt: string
}
```

Identity/source/security fields are hard requirements. Semantic confidence may be uncertain. An
entry without evidence/source cannot be high confidence or automatically retained.

## 4. Write and Distillation Rules

- Session events remain evidence, not automatically memory.
- A human or Agent may propose an entry; M03/M00 permission and M10 semantic validation apply.
- Background distillation is an M08 job and returns proposals, not silent retained facts.
- Project facts remain project-scoped.
- Tool lessons may be retained/cross-project only after evidence, sensitivity scan, origin label,
  and configured review policy.
- User preferences require explicit confirmation.
- Policy memory is Lead/system owned and read-only to project Agents.
- Sensitive/raw-path/uncertain proposals enter quarantine and are never auto-injected.
- Conflicting entries coexist with explicit conflict/supersession until reviewed; no silent
  similarity-based overwrite.
- Fixed claims such as “10 successes/70% repetition creates a skill” are removed. M12 skill
  proposals require real evidence and human approval; any future threshold is measured/configured.

## 5. Retrieval Gate

```text
request with caller/project/session/purpose/token budget
-> M00 permission and effective sensitivity ceiling
-> partition + owner-scope filter
-> sensitivity/blocked-target filter
-> lifecycle/expiry/conflict filter
-> exact/lexical/semantic scoring inside allowed pool
-> finite budget/ranking
-> return entries with origin/confidence/source labels
```

Forbidden:

- global similarity search before scope filtering;
- unlabelled cross-project tool memory;
- quarantine/archive injection by default;
- treating recalled memory as an authoritative project fact without source/confidence;
- hidden memory injection that the user cannot inspect.

## 6. Deletion and Retention

- User-requested authoritative memory deletion is L3 under D2.
- Delete removes the authoritative entry and schedules removal from all derived indexes/caches.
- Evidence that an entry existed may retain a redacted tombstone only if the audit policy requires
  it; the content is not retained in the tombstone.
- Expiry moves entries to archive unless policy requires hard deletion.
- Project archive never makes project memory cross-project.
- Retention values live in M13 settings/policy and must not be duplicated in code/spec constants.

## 7. Physical Persistence

M10 owns one logical memory authority. W0.1/v0.11 inspection must select the physical store and
index strategy. There is no simultaneous `memory.json` and SQLite authority. Search indexes,
vectors, summaries, and caches are derived/rebuildable and must honour delete/tombstone policy.

See `PERSISTENCE-AUTHORITY-MAP.md`. No external/cloud memory database is permitted without a new
explicit decision and upload consent model.

## 8. Context Segment and Prompt Boundary

M10 returns typed, source-labelled `ContextSegment` objects. It does not assemble final provider
prompts or claim provider cache hits; M11 owns final prompt/routing/cache policy.

Rules retained from earlier analysis:

- structured JSON/diffs/AST are not semantically truncated by unstructured output compression;
- terminal/output compression applies only to declared unstructured streams;
- file outlines/full-content decisions are explicit and reversible at retrieval time;
- every segment carries origin, scope, sensitivity, token estimate, and evidence refs;
- a token budget drops low-confidence/low-priority segments first and reports omissions.

## 9. ProjectPack Contract

```ts
type ProjectPack = {
  packId: string
  schemaVersion: 1
  workspaceId: string
  selection: string[]
  fileManifest: Array<{ pathRef: string; hash: string; bytes: number; mediaType?: string }>
  secretScan: { status: 'clean' | 'findings' | 'failed'; findingRefs: string[] }
  contextSegments: string[]
  excluded: Array<{ ref: string; reason: string }>
  createdBy: ActorRef
  createdAt: string
}
```

Pack preview is local-only. A pack is immutable once authorized for external review; changes create
a new version/hash. Raw secrets are never added to the pack report/timeline.

## 10. Review Loop

1. select project/artifact scope and build a local preview;
2. show file/byte/token estimate, exclusions, secret findings, provider/target, and cost source;
3. require explicit upload/provider approval when data leaves the machine;
4. submit through M08 with idempotency and provider reconciliation;
5. normalize response into `ReviewReport` claims, severity, confidence, and evidence refs;
6. save raw protected output and user-visible report as governed artifacts;
7. let the user accept, dismiss, or turn findings into explicit tasks/workflows.

An external AI opinion is not automatically memory, policy, or a code change.

## 11. UI Contributions

- one M16 context/review panel with tabs for memory, pack preview, reviews, and provenance;
- M13 preferences for retention/retrieval/external-review policy;
- per-entry inspect/source/conflict/delete controls;
- M17 operations for pack/review only when caller permission and finite upload policy permit;
- no separate button/center per external review provider.

## 12. Candidate Actions — Not Frozen

| Candidate | Purpose | Policy intent |
|---|---|---|
| `memory.search` | scoped filtered retrieval | L0 filtered read |
| `memory.propose` | create reviewable entry proposal | L1 local write |
| `memory.retain` | promote validated entry | L2 policy/context effect |
| `memory.delete` | delete content/indexes | L3 explicit confirmation |
| `context.pack_preview` | local finite pack preview/secret scan | L0/L1 local artifacts |
| `review.submit` | send exact approved pack to provider | L2 external/data/cost side effect |
| `review.report_save` | commit normalized report artifact | L1 local write |

## 13. Error Handling

| Condition | Result | Recovery |
|---|---|---|
| scope/sensitivity denied | entry absent; no metadata leak | narrow request or permitted policy change |
| index unavailable | exact/lexical fallback or visible unavailable | rebuild derived index |
| conflicting memory | warning and sources, not silent winner | human resolve/supersede |
| distillation uncertain | quarantine/low-confidence proposal | inspect/edit/reject |
| secret scan fails | external submission blocked | repair scan/exclude files |
| provider status unknown | review job reconciling | M08 inspect; no duplicate upload |
| report evidence missing | finding downgraded/rejected | attach evidence or mark opinion |
| delete/index cleanup partial | deletion reconciling; entry not retrievable | complete derived cleanup |

## 14. Verification

### M10A Memory

1. Propose project/tool/user/sensitive entries through human and Agent paths.
2. Verify partition/lifecycle/sensitivity, evidence, scope-before-similarity, and origin labels.
3. Attempt cross-project leakage and quarantine injection; verify refusal.
4. Create conflict/supersession and inspect both sources.
5. Delete an entry; verify authoritative and derived-index removal after restart.
6. Rebuild indexes and verify no deleted content returns.

### M10B Context/Review

1. Build a real ProjectPack preview with files, hashes, exclusions, token estimate, and secret scan.
2. Block external submission on secret-scan failure; approve an exact safe version.
3. Submit through a real approved provider/M08 job and reconcile across restart.
4. Save a report with evidence/cost labels and keep unsupported claims marked as opinion.
5. Verify report findings do not automatically become memory/tasks/changes.

## 15. Open Gates

- Freeze memory entry, retrieval, deletion/tombstone, ContextSegment, ProjectPack, and ReviewReport
  contracts.
- Select one physical store/index adapter and prove deletion/rebuild/isolation.
- Resolve M11 prompt/cache ownership and real provider review/cost fields.
- Issue separate M10A/M10B packets.

## 16. Non-Goals and Prohibitions

- No global unfiltered recall, silent cross-project facts, cloud memory sync, double store, or
  automatic skill/policy promotion.
- No review upload without exact scope, secret scan, permission, target, and honest cost source.
