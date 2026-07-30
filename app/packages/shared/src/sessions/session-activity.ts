/**
 * Derived session activity.
 *
 * The session row currently shows `sessionStatus` — a user-assigned Kanban label
 * (`todo` / `in-progress` / `needs-review` / `done` / `cancelled`) written only
 * by a menu, a URL parameter, or a board drag. Nothing sets it automatically, so
 * the icon in front of every conversation answers "what did someone last file
 * this as", never "what is this doing right now". A session can be actively
 * running while its icon says `todo`, and one blocked on an approval looks
 * exactly like one that finished an hour ago.
 *
 * There are already two manual status fields (`sessionStatus`, `kanbanColumn`)
 * and no derived one. This adds the derived one. It does not replace them:
 *
 *   activity        — what the session is doing. Derived, live, never clicked.
 *   sessionStatus   — how the human filed it. Manual, and rightly so.
 *
 * Both can be shown; only one of them is the machine's job to keep true.
 */

export type SessionActivity =
  /** Blocked on a human: a permission request or a question is outstanding. */
  | 'awaiting-input'
  /** The last turn ended in an error. */
  | 'failed'
  /** The agent is working. */
  | 'running'
  /** Finished since the human last looked. */
  | 'completed'
  /** Nothing outstanding. */
  | 'idle'

/** Everything the derivation reads. Kept explicit so it can be tested directly. */
export interface SessionActivityInput {
  isProcessing?: boolean
  isAsyncOperationOngoing?: boolean
  /** True while a permission request or question is waiting on the human. */
  hasPendingApproval?: boolean
  lastMessageRole?: 'user' | 'assistant' | 'plan' | 'tool' | 'error'
  hasUnread?: boolean
  /** Activity of child sessions, for a session that delegated work. */
  children?: readonly SessionActivity[]
}

/**
 * Order is by urgency, not by likelihood.
 *
 * A session blocked on approval outranks one that is running, because the first
 * needs a human and the second does not — and with several agents in flight the
 * only thing worth surfacing at a glance is which ones are stuck.
 */
export function deriveSessionActivity(input: SessionActivityInput): SessionActivity {
  const children = input.children ?? []

  // A parent that delegated is only as unblocked as its children. Rolling this
  // up matters most with several agents running: a collapsed parent row must not
  // read as calm while something underneath it is stuck.
  if (input.hasPendingApproval || children.includes('awaiting-input')) return 'awaiting-input'
  if (input.lastMessageRole === 'error' || children.includes('failed')) return 'failed'
  if (input.isProcessing || input.isAsyncOperationOngoing || children.includes('running')) {
    return 'running'
  }
  if (input.hasUnread || children.includes('completed')) return 'completed'
  return 'idle'
}

/**
 * Whether the row should pull the eye.
 *
 * Only states a human can act on. `running` is deliberately excluded: with
 * several agents working, marking every busy row as attention-worthy means none
 * of them are.
 */
export function needsAttention(activity: SessionActivity): boolean {
  return activity === 'awaiting-input' || activity === 'failed'
}

/** Sort key for grouping a list by urgency. Lower comes first. */
export function activityRank(activity: SessionActivity): number {
  switch (activity) {
    case 'awaiting-input': return 0
    case 'failed': return 1
    case 'running': return 2
    case 'completed': return 3
    case 'idle': return 4
    default: return activity satisfies never
  }
}

// ── Presentation ────────────────────────────────────────────────────────────

export type ActivityTone = 'attention' | 'danger' | 'active' | 'success' | 'neutral'

/**
 * A tone, not a colour value. Themes own the palette; this only says what the
 * state means so light and dark can each render it legibly.
 *
 * Only `idle` is muted. Every other state describes something that happened or
 * is happening, and rendering those in a dim grey — as the current status icons
 * do — makes a working session indistinguishable from an empty one at a glance.
 */
export function activityTone(activity: SessionActivity): ActivityTone {
  switch (activity) {
    case 'awaiting-input': return 'attention'
    case 'failed': return 'danger'
    case 'running': return 'active'
    case 'completed': return 'success'
    case 'idle': return 'neutral'
    default: return activity satisfies never
  }
}

/** Whether the indicator animates. Only motion that means "still going". */
export function activityIsAnimated(activity: SessionActivity): boolean {
  return activity === 'running'
}

/**
 * Whether an explicit indicator is drawn at all.
 *
 * An idle session gets nothing rather than a grey dot. A row of identical grey
 * dots is visual noise that hides the two rows that matter.
 */
export function activityHasIndicator(activity: SessionActivity): boolean {
  return activity !== 'idle'
}

// ── Multi-agent rollup ──────────────────────────────────────────────────────

export interface AgentFleetSummary {
  total: number
  running: number
  awaitingInput: number
  failed: number
  /** True when any session needs a human. */
  blocked: boolean
}

/**
 * Fleet-level counts for a header or badge.
 *
 * With one agent the row indicator is enough. With several, the question becomes
 * "how many are stuck" — a question no per-row icon can answer.
 */
export function summarizeFleet(
  activities: readonly SessionActivity[],
): AgentFleetSummary {
  const summary: AgentFleetSummary = {
    total: activities.length,
    running: 0,
    awaitingInput: 0,
    failed: 0,
    blocked: false,
  }

  for (const activity of activities) {
    if (activity === 'running') summary.running += 1
    else if (activity === 'awaiting-input') summary.awaitingInput += 1
    else if (activity === 'failed') summary.failed += 1
  }

  summary.blocked = summary.awaitingInput > 0 || summary.failed > 0
  return summary
}
