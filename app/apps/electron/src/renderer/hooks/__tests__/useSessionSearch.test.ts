import { describe, it, expect } from 'bun:test'
import { computeCollapsedPagination } from '../useSessionSearch'
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
  it('does not strand folderless conversations behind a legacy collapsed key', () => {
    const sessions = [makeSession('folderless'), makeSession('project', { projectId: 'folder' })]
    const result = computeCollapsedPagination(sessions, 50, new Set(['project-__none__', 'project-folder']), 'project')
    expect(result.paginatedItems.map(item => item.id)).toEqual(['folderless'])
    expect(result.collapsedGroupsMeta).toEqual([{ key: 'project-folder', count: 1 }])
  })
  it('collapses a sole project while retaining its header and count', () => {
    const sessions = [makeSession('s1', { projectId: 'folder' }), makeSession('s2', { projectId: 'folder' })]
    const collapsed = computeCollapsedPagination(sessions, 50, new Set(['project-folder']), 'project')
    expect(collapsed.paginatedItems).toEqual([])
    expect(collapsed.collapsedGroupsMeta).toEqual([{ key: 'project-folder', count: 2 }])
    expect(collapsed.hasMore).toBe(false)
    expect(computeCollapsedPagination(sessions, 50, new Set(), 'project').paginatedItems).toEqual(sessions)
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
