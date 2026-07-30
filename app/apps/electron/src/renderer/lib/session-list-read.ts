export interface SessionReadState {
  id: string
  hasUnread?: boolean
}

/**
 * Lightweight fields used to decide whether a session may appear in lists.
 * Matches SessionMeta / list RPC headers without loading messages.
 */
export interface SessionListVisibilityFields {
  /** User-defined or first-message title — set when the session has started */
  name?: string
  /** First-user-message preview stamped in the JSONL header */
  preview?: string
  lastFinalMessageId?: string
  messageCount?: number
  isProcessing?: boolean
  /** Explicit hide (e.g. mini EditPopover sessions) */
  hidden?: boolean
}

interface ResolveBulkReadSessionsOptions<T extends SessionReadState> {
  isSearchMode: boolean
  preSearchSessions: readonly T[]
  searchResultSessions: readonly T[]
}

/** Resolve the complete list affected by a bulk read action. */
export function resolveBulkReadSessions<T extends SessionReadState>({
  isSearchMode,
  preSearchSessions,
  searchResultSessions,
}: ResolveBulkReadSessionsOptions<T>): readonly T[] {
  return isSearchMode ? searchResultSessions : preSearchSessions
}

/** Return only unread sessions from the already-filtered list, preserving list order. */
export function getUnreadSessionIds(sessions: readonly SessionReadState[]): string[] {
  return sessions.filter((session) => session.hasUnread).map((session) => session.id)
}

/**
 * Empty “composer placeholder” sessions must not appear in any list.
 *
 * Product rule (ChatGPT / Claude / Cursor pattern; Craft auto-delete is the
 * leave-cleanup complement): createSession may still open a composer, but the
 * session only becomes a list citizen after the first send (name/preview/
 * messageCount) or while actively processing.
 *
 * Folder / project placement is decided from workingDirectory when the session
 * becomes visible — not while it is still empty.
 */
export function isEmptyPlaceholderSession(
  meta: SessionListVisibilityFields | null | undefined,
): boolean {
  if (!meta) return false
  // Explicitly hidden sessions have their own lifecycle (not this rule).
  if (meta.hidden) return false
  if (meta.isProcessing) return false
  if (meta.name) return false
  if (meta.preview) return false
  if (meta.lastFinalMessageId) return false
  if ((meta.messageCount ?? 0) > 0) return false
  return true
}

/** Whether this session may appear in sidebar / search / counts. */
export function isSessionListVisible(
  meta: SessionListVisibilityFields | null | undefined,
): boolean {
  if (!meta) return false
  if (meta.hidden) return false
  return !isEmptyPlaceholderSession(meta)
}
