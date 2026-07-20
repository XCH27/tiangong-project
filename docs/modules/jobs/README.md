# AIGC and rendering jobs module

Design state: `breadth`; implementation status: `not implemented`; development order: R11–R13. Generation, media analysis,
render and export work must use one cancellable, resource-aware Job seam and return ArtifactRefs.
Acceptance: `JOB-001` shows queue/progress; `JOB-002` supports cancel/retry/failure; `JOB-003`
returns one versioned ArtifactRef; `JOB-004` enforces resource limits without silent loss. These
short IDs are implementation subcriteria for canonical `ORCH-05-A` (the shared Job authority);
export/delivery acceptance is separately canonical `CREATE-12-A` and must not be silently substituted
by a generic job criterion.

## Reality and activation sequence

No Fleet Job queue or ArtifactRef authority is present (`rg -n "Job|job queue|ArtifactRef|retry"
app/packages app/apps`). Activation is: define the Job adapter over one existing TaskRunner seam,
add a deterministic fixture and resource limits, prove progress/cancel/retry/failure and restart,
then expose P-49/P-45. Placeholder progress cannot be reported as wired.

This is a Fleet seam to extend, not permission to import a reference job system. The first
implementation must bind to `app/packages/server-core/src/tasks/TaskRunner.ts` and the existing
SessionManager cancellation path, then prove restart, resource-limit and ArtifactRef behavior
before any external queue is considered.
