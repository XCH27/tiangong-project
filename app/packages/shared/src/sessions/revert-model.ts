/**
 * Message revert.
 *
 * Fleet already forks: `branchFromMessageId` + `branchContextStrategy` spawn a
 * new session whose history stops at a chosen message. That answers "continue
 * differently from here". It does not answer "undo what the agent did to my
 * files", because forking a conversation leaves the working tree exactly as the
 * agent left it.
 *
 * Revert is the second operation, and it is file-level:
 *
 *   fork    → new session, conversation diverges, files untouched
 *   revert  → same session, files roll back to a chosen point, reversibly
 *
 * The mechanism follows OpenCode's `SessionRevert`. Every assistant turn records
 * the snapshot taken *before* it ran plus the paths it touched. Reverting to a
 * message collects the turns after that boundary and restores each touched path
 * from the earliest snapshot that recorded it — the state the file had when the
 * boundary message was sent.
 *
 * Crucially the pre-revert state is captured first and kept, so the revert is
 * itself undoable. A destructive rollback with no way back is a worse failure
 * than the agent's original mistake.
 */

/** Content-addressed identifier for a captured filesystem state. */
export type SnapshotId = string

/** What one assistant turn recorded about the files it was about to change. */
export interface TurnSnapshot {
  messageId: string
  /**
   * Which agent ran the turn. Absent means a single-agent session.
   *
   * Required once work is delegated: without it a revert rolls back whatever
   * happened to touch the same file, including another agent's in-flight work,
   * and the review surface reads as one interleaved pile rather than per-agent
   * changes.
   */
  agentId?: string
  /** Ordering key. Turn order, not wall-clock: clocks are not monotonic. */
  seq: number
  /** State captured *before* this turn ran. */
  startSnapshot: SnapshotId
  /** Project-relative paths this turn wrote. */
  files: readonly string[]
}

export interface RevertPlan {
  boundaryMessageId: string
  /** Set when the plan covers only one agent's turns. */
  agentId?: string
  /** Path → snapshot to restore it from. */
  files: ReadonlyMap<string, SnapshotId>
  /** Turns that will be undone. Shown before the user commits to it. */
  revertedTurnCount: number
}

/**
 * Which files to restore, and from where.
 *
 * The *earliest* snapshot after the boundary wins for each path. Later turns
 * captured the file mid-edit; only the first one holds the state as of the
 * boundary. Taking the latest instead would leave partially-applied work that
 * matches no point in the session's history.
 */
export function planRevert(
  turns: readonly TurnSnapshot[],
  boundaryMessageId: string,
  options: { agentId?: string } = {},
): RevertPlan | null {
  const boundary = turns.find((turn) => turn.messageId === boundaryMessageId)
  if (!boundary) return null

  // Scoping to one agent is the difference between undoing your own work and
  // undoing a colleague's. Unscoped stays the default so a single-agent session
  // behaves as before.
  const after = turns
    .filter((turn) => turn.seq > boundary.seq)
    .filter((turn) => options.agentId === undefined || turn.agentId === options.agentId)
    .sort((a, b) => a.seq - b.seq)

  const files = new Map<string, SnapshotId>()
  for (const turn of after) {
    for (const file of turn.files) {
      if (!files.has(file)) files.set(file, turn.startSnapshot)
    }
  }

  return {
    boundaryMessageId,
    ...(options.agentId === undefined ? {} : { agentId: options.agentId }),
    files,
    revertedTurnCount: after.length,
  }
}

/**
 * A revert that has been applied but not yet accepted.
 *
 * Held on the session so the composer can show what was undone with a way back,
 * rather than the change happening silently and the user discovering it later.
 */
export interface StagedRevert {
  boundaryMessageId: string
  /** State captured immediately before the revert ran. This is the way back. */
  originalSnapshot: SnapshotId
  /** Paths the revert touched, for the summary and for restoring. */
  files: readonly string[]
  revertedTurnCount: number
  stagedAt: number
}

/**
 * Re-reverting to a different message must first put back everything the
 * previous revert moved. Otherwise files touched only by the first revert stay
 * rolled back — the working tree ends up matching no point in the history.
 */
export function planRestoreBeforeRevert(
  staged: StagedRevert | undefined,
): ReadonlyMap<string, SnapshotId> {
  if (!staged) return new Map()
  return new Map(staged.files.map((file) => [file, staged.originalSnapshot]))
}

/** Merge order matters: the previous revert is undone, then the new one applies. */
export function mergeRevertRestores(
  undoPrevious: ReadonlyMap<string, SnapshotId>,
  applyNext: ReadonlyMap<string, SnapshotId>,
): ReadonlyMap<string, SnapshotId> {
  const merged = new Map(undoPrevious)
  for (const [file, snapshot] of applyNext) merged.set(file, snapshot)
  return merged
}

export type RevertBlockedReason =
  /** No snapshot was recorded, so there is nothing to roll back to. */
  | 'no-snapshot'
  /** The boundary is the newest turn; nothing came after it. */
  | 'nothing-after'
  /** The session is mid-turn; rolling files under a running agent corrupts it. */
  | 'session-busy'

export interface RevertAvailability {
  canRevert: boolean
  reason: RevertBlockedReason | null
  /** How many turns would be undone. */
  turnCount: number
}

/**
 * Whether the affordance should be offered at all, and if not, why.
 *
 * Reported rather than hidden: a menu item that silently disappears reads as a
 * missing feature, while one that explains itself reads as a boundary.
 */
export function revertAvailability(input: {
  turns: readonly TurnSnapshot[]
  boundaryMessageId: string
  isProcessing: boolean
  /** Restrict the check to one agent's turns. */
  agentId?: string
}): RevertAvailability {
  if (input.isProcessing) {
    return { canRevert: false, reason: 'session-busy', turnCount: 0 }
  }

  const plan = planRevert(input.turns, input.boundaryMessageId, { agentId: input.agentId })
  if (!plan || plan.revertedTurnCount === 0) {
    return { canRevert: false, reason: 'nothing-after', turnCount: 0 }
  }
  if (plan.files.size === 0) {
    // Turns ran but touched no files — a pure conversation exchange. Forking is
    // the operation that fits; there is nothing on disk to roll back.
    return { canRevert: false, reason: 'no-snapshot', turnCount: plan.revertedTurnCount }
  }

  return { canRevert: true, reason: null, turnCount: plan.revertedTurnCount }
}

/**
 * Summary for the dock above the composer.
 *
 * Counts come from the staged revert, not from a re-derived plan: the plan
 * changes as new turns arrive, and the dock must describe what actually
 * happened.
 */
export interface RevertSummary {
  fileCount: number
  turnCount: number
  boundaryMessageId: string
}

export function summarizeStagedRevert(staged: StagedRevert): RevertSummary {
  return {
    fileCount: staged.files.length,
    turnCount: staged.revertedTurnCount,
    boundaryMessageId: staged.boundaryMessageId,
  }
}
