import { afterEach, beforeEach, expect, test } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { SessionPersistenceQueue } from '../persistence-queue'
import { getSessionFilePath } from '../storage'
import type { StoredSession } from '../types'

let root: string
let queue: SessionPersistenceQueue
const record = (name: string): StoredSession => ({
  id: 'durable-session', workspaceRootPath: root, createdAt: 1, lastUsedAt: 1, name, messages: [],
  tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, contextTokens: 0, costUsd: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
})
beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'fleet-durable-')); queue = new SessionPersistenceQueue(60_000) })
afterEach(() => { queue.cancel('durable-session'); rmSync(root, { recursive: true, force: true }) })
const header = () => JSON.parse(readFileSync(getSessionFilePath(root, 'durable-session'), 'utf8').split('\n')[0]!)

test('failed save rejects, keeps the previous journal/signature and can be retried', async () => {
  queue.enqueue(record('saved'))
  await queue.flush('durable-session')
  const signature = queue.getLastWrittenSignature('durable-session')
  const blockedTmp = getSessionFilePath(root, 'durable-session') + '.tmp'
  mkdirSync(blockedTmp)
  queue.enqueue(record('unsaved'))
  await expect(queue.flush('durable-session')).rejects.toThrow()
  expect(header().name).toBe('saved')
  expect(queue.getLastWrittenSignature('durable-session')).toBe(signature)
  expect(queue.hasPending('durable-session')).toBe(true)
  rmSync(blockedTmp, { recursive: true })
  await queue.flush('durable-session')
  expect(header().name).toBe('unsaved')
})

test('concurrent flushes serialize and flushAll waits for an already-started write', async () => {
  queue.enqueue(record('first'))
  const first = queue.flush('durable-session')
  queue.enqueue(record('latest'))
  await Promise.all([first, queue.flush('durable-session'), queue.flush('durable-session'), queue.flushAll()])
  expect(header().name).toBe('latest')
  expect(queue.pendingCount).toBe(0)
})
