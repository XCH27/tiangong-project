export interface SessionReadState {
  id: string
  hasUnread?: boolean
}

/** Return only unread sessions from the already-filtered list, preserving list order. */
export function getUnreadSessionIds(sessions: readonly SessionReadState[]): string[] {
  return sessions.filter((session) => session.hasUnread).map((session) => session.id)
}
