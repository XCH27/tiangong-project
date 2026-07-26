import { describe, expect, test } from 'bun:test'
import { getUnreadSessionIds } from '../session-list-read'

describe('getUnreadSessionIds', () => {
  test('returns only unread ids from the supplied filtered list', () => {
    const filteredSessions = [
      { id: 'visible-unread', hasUnread: true },
      { id: 'visible-read', hasUnread: false },
      { id: 'visible-without-state' },
    ]

    expect(getUnreadSessionIds(filteredSessions)).toEqual(['visible-unread'])
  })

  test('does not introduce sessions outside the supplied filter result', () => {
    const allSessions = [
      { id: 'included', hasUnread: true },
      { id: 'excluded', hasUnread: true },
    ]

    expect(getUnreadSessionIds(allSessions.slice(0, 1))).toEqual(['included'])
  })
})
