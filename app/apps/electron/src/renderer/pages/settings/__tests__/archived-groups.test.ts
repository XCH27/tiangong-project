import { describe, expect, test } from 'bun:test'

import {
  ALL_FILTER,
  CONVERSATIONS_FILTER,
  getArchivedGroupKey,
  groupArchivedSessions,
  isFolderBoundSession,
} from '../archived-groups'

describe('archived-groups', () => {
  test('folder-less sessions are Conversations even with a storage workspaceId', () => {
    const session = {
      id: 'c1',
      workspaceId: 'ws-my-workspace',
      workingDirectory: undefined as string | undefined,
      isArchived: true,
    }
    expect(isFolderBoundSession(session)).toBe(false)
    expect(getArchivedGroupKey(session)).toEqual({
      kind: 'conversations',
      projectWorkspaceId: null,
    })
  })

  test('folder-bound sessions group under their project workspace, not Conversations', () => {
    const session = {
      id: 'p1',
      workspaceId: 'ws-my-workspace',
      workingDirectory: '/Users/me/code/app',
      isArchived: true,
    }
    expect(getArchivedGroupKey(session)).toEqual({
      kind: 'project',
      projectWorkspaceId: 'ws-my-workspace',
    })
  })

  test('groups conversations and projects separately and respects filters', () => {
    const sessions = [
      {
        id: 'conv',
        workspaceId: 'ws-1',
        isArchived: true,
      },
      {
        id: 'proj-a',
        workspaceId: 'ws-1',
        workingDirectory: '/a',
        isArchived: true,
      },
      {
        id: 'proj-b',
        workspaceId: 'ws-2',
        workingDirectory: '/b',
        isArchived: true,
      },
      {
        id: 'active',
        workspaceId: 'ws-1',
        workingDirectory: '/a',
        isArchived: false,
      },
    ]

    const all = groupArchivedSessions(sessions)
    expect(all.map(g => g.filterValue)).toEqual([
      CONVERSATIONS_FILTER,
      'ws-1',
      'ws-2',
    ])
    expect(all[0]!.sessionIds).toEqual(['conv'])
    expect(all[1]!.sessionIds).toEqual(['proj-a'])

    const onlyConversations = groupArchivedSessions(sessions, {
      filter: CONVERSATIONS_FILTER,
    })
    expect(onlyConversations).toHaveLength(1)
    expect(onlyConversations[0]!.sessionIds).toEqual(['conv'])

    const onlyWs1 = groupArchivedSessions(sessions, { filter: 'ws-1' })
    expect(onlyWs1).toHaveLength(1)
    expect(onlyWs1[0]!.sessionIds).toEqual(['proj-a'])

    expect(groupArchivedSessions(sessions, { filter: ALL_FILTER })).toHaveLength(3)
  })
})
