import { describe, it, expect } from 'bun:test'
import { compareSessionsForDisplay, computeCollapsedPagination } from '../useSessionSearch'
import type { SessionMeta } from '@/atoms/sessions'

function makeSession(id: string, opts: Partial<SessionMeta> = {}): SessionMeta {
  return {
    id,
    workspaceId: 'ws-1',
    sessionStatus: 'in-progress',
    lastMessageAt: Date.parse('2026-03-05T10:00:00.000Z'),
    ...opts,
  }
}

describe('computeCollapsedPagination', () => {
  it.each(['date', 'status', 'project', 'unread'] as const)('never hides a pinned session with collapsed %s groups', (mode) => {
    const pinned = makeSession('pinned', { isFlagged: true, projectId: 'p1' })
    const ordinary = makeSession('ordinary', { projectId: 'p1' })
    const collapsed = new Set(['pinned', 'status-in-progress', 'project-p1', 'unread-no',
      new Date(new Date(pinned.lastMessageAt!).setHours(0, 0, 0, 0)).toISOString()])
    const result = computeCollapsedPagination([pinned, ordinary], 50, collapsed, mode)
    expect(result.paginatedItems.map(item => item.id)).toEqual(['pinned'])
    expect(result.collapsedGroupsMeta.reduce((sum, meta) => sum + meta.count, 0)).toBe(1)
    expect(result.collapsedGroupsMeta.some(meta => meta.key === 'pinned')).toBe(false)
  })

  it('does not hide items when current view has only one group and that group is collapsed', () => {
    const sessions = [
      makeSession('s1'),
      makeSession('s2'),
    ]

    const result = computeCollapsedPagination(
      sessions,
      50,
      new Set(['2026-03-05T00:00:00.000Z']),
      'date'
    )

    expect(result.paginatedItems.map(s => s.id)).toEqual(['s1', 's2'])
    expect(result.collapsedGroupsMeta).toEqual([])
    expect(result.hasMore).toBe(false)
  })

  it('still collapses normally when multiple groups exist', () => {
    const sessions = [
      makeSession('today', { lastMessageAt: Date.parse('2026-03-06T10:00:00.000Z') }),
      makeSession('yesterday', { lastMessageAt: Date.parse('2026-03-05T10:00:00.000Z') }),
      makeSession('older', { lastMessageAt: Date.parse('2026-03-04T10:00:00.000Z') }),
    ]

    const result = computeCollapsedPagination(
      sessions,
      50,
      new Set(['2026-03-05T00:00:00.000Z']),
      'date'
    )

    expect(result.paginatedItems.map(s => s.id)).toEqual(['today', 'older'])
    expect(result.collapsedGroupsMeta).toEqual([{ key: '2026-03-05T00:00:00.000Z', count: 1 }])
    expect(result.hasMore).toBe(false)
  })

  it('ignores collapsed keys that are not present in current view', () => {
    const sessions = [
      makeSession('a', { sessionStatus: 'in-progress' }),
      makeSession('b', { sessionStatus: 'done' }),
    ]

    const result = computeCollapsedPagination(
      sessions,
      50,
      new Set(['status-todo']),
      'status'
    )

    expect(result.paginatedItems.map(s => s.id)).toEqual(['a', 'b'])
    expect(result.collapsedGroupsMeta).toEqual([])
  })
})

describe('compareSessionsForDisplay', () => {
  const session = (id: string, lastMessageAt: number, isFlagged = false) => ({
    id,
    workspaceId: 'workspace',
    lastMessageAt,
    isFlagged,
  })

  it('puts pinned sessions before newer unpinned sessions', () => {
    expect(compareSessionsForDisplay(session('new', 200), session('pinned', 100, true))).toBeGreaterThan(0)
  })

  it('keeps recency ordering within the same pin tier', () => {
    expect(compareSessionsForDisplay(session('new', 200), session('old', 100))).toBeLessThan(0)
    expect(compareSessionsForDisplay(session('pinned-new', 200, true), session('pinned-old', 100, true))).toBeLessThan(0)
  })
})
