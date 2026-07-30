import { describe, expect, test } from 'bun:test'
import {
  getUnreadSessionIds,
  isEmptyPlaceholderSession,
  isSessionListVisible,
  resolveBulkReadSessions,
} from '../session-list-read'

describe('isEmptyPlaceholderSession / isSessionListVisible', () => {
  test('brand-new createSession meta is a placeholder (not list-visible)', () => {
    const meta = { id: 's1', messageCount: 0 }
    expect(isEmptyPlaceholderSession(meta)).toBe(true)
    expect(isSessionListVisible(meta)).toBe(false)
  })

  test('first user message title promotes into the list', () => {
    const meta = { id: 's1', name: 'Fix login', messageCount: 1 }
    expect(isEmptyPlaceholderSession(meta)).toBe(false)
    expect(isSessionListVisible(meta)).toBe(true)
  })

  test('preview alone (header stamp) is enough to show', () => {
    expect(isEmptyPlaceholderSession({ preview: 'hello', messageCount: 1 })).toBe(false)
    expect(isSessionListVisible({ preview: 'hello', messageCount: 1 })).toBe(true)
  })

  test('processing empty stays visible so the tile does not flicker mid-send', () => {
    expect(isEmptyPlaceholderSession({ isProcessing: true, messageCount: 0 })).toBe(false)
    expect(isSessionListVisible({ isProcessing: true })).toBe(true)
  })

  test('hidden sessions stay out of the list', () => {
    expect(isSessionListVisible({ hidden: true, name: 'x' })).toBe(false)
  })
})

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

  test('uses the resolved search result instead of the pre-search list', () => {
    const preSearchSessions = [
      { id: 'visible-search-match', hasUnread: true },
      { id: 'hidden-by-search', hasUnread: true },
    ]
    const searchResultSessions = [preSearchSessions[0]!]

    expect(resolveBulkReadSessions({
      isSearchMode: true,
      preSearchSessions,
      searchResultSessions,
    })).toEqual(searchResultSessions)
  })
})
