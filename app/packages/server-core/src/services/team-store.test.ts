import { describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import { FileTeamStore } from './team-store'

describe('FileTeamStore', () => {
  it('serializes concurrent inbox writes without losing delivery references', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'fleet-team-store-'))
    try {
      const store = new FileTeamStore(dataDir)
      await Promise.all(Array.from({ length: 40 }, (_, index) => store.enqueueInbox({
        id: `inbox-${index}`,
        sessionId: 'member-1',
        kind: 'message',
        fromActor: USER_ACTOR,
        sourceSessionId: 'team-conversation',
        sourceMessageId: `message-${index}`,
        createdAt: index,
      })))

      const items = await store.listInbox('member-1')
      expect(items).toHaveLength(40)
      expect(new Set(items.map(item => item.sourceMessageId)).size).toBe(40)
    } finally {
      await rm(dataDir, { recursive: true, force: true })
    }
  })

  it('drains each reference exactly once', async () => {
    const dataDir = await mkdtemp(join(tmpdir(), 'fleet-team-store-'))
    try {
      const store = new FileTeamStore(dataDir)
      await store.enqueueInbox({
        id: 'inbox-1',
        sessionId: 'member-1',
        kind: 'task',
        fromActor: { kind: 'agent', agentId: 'leader', role: 'leader' },
        sourceSessionId: 'team-conversation',
        sourceMessageId: 'message-1',
        taskId: 'task-1',
        createdAt: 1,
      })

      expect(await store.drainInbox('member-1')).toHaveLength(1)
      expect(await store.drainInbox('member-1')).toEqual([])
    } finally {
      await rm(dataDir, { recursive: true, force: true })
    }
  })
})
