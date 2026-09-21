import { afterEach, beforeEach, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createAssistant, loadCatalog, saveCatalog, formatAssistantContext } from '@craft-agent/shared/assistants'
import { createSession, loadSession, sessionPersistenceQueue } from '@craft-agent/shared/sessions'
import { SessionManager, createManagedSession } from './SessionManager'

let root: string
let manager: SessionManager
let id: string
beforeEach(async () => {
  root = mkdtempSync(join(tmpdir(), 'fleet-identity-'))
  manager = new SessionManager()
  const stored = await createSession(root, { permissionMode: 'ask' })
  id = stored.id
  const workspace = { id: 'workspace', slug: 'workspace', name: 'Workspace', rootPath: root, createdAt: 1 }
  const managed = createManagedSession(stored, workspace)
  ;(manager as unknown as { sessions: Map<string, unknown> }).sessions.set(id, managed)
})
afterEach(async () => {
  await sessionPersistenceQueue.flushAll()
  rmSync(root, { recursive: true, force: true })
})

test('wearing persists in the real Session, survives another mutation and feeds the prompt', async () => {
  const identity = createAssistant(root, { name: 'Writer', systemPrompt: 'Be precise.' })
  const result = await manager.wearAssistant('workspace', id, identity.id, 'apply')
  expect(result.decision.applied).toBe(true)
  expect((await manager.getSession(id))?.assistantId).toBe(identity.id)
  await manager.setSessionProjectId(id, null)
  expect(loadSession(root, id)?.assistantId).toBe(identity.id)
  expect(formatAssistantContext(root, id)).toContain('Be precise.')
})

test('cross-workspace and missing Sessions fail before a write or delegate is created', async () => {
  const identity = createAssistant(root, { name: 'Writer' })
  await expect(manager.wearAssistant('other-workspace', id, identity.id, 'apply')).rejects.toThrow('not found')
  await expect(manager.wearAssistant('workspace', 'missing', identity.id, 'specialist')).rejects.toThrow('not found')
  expect(loadSession(root, id)?.assistantId).toBeUndefined()
})

test('unknown identities and unimplemented CLI wrappers never claim success', async () => {
  const identity = createAssistant(root, { name: 'Writer' })
  await expect(manager.wearAssistant('workspace', id, 'ghost', 'apply')).rejects.toThrow('Assistant not found')
  await expect(manager.wearAssistant('workspace', id, identity.id, 'cli')).rejects.toThrow('not implemented')
})

test('an unresolved loadout is refused instead of silently ignored', async () => {
  const identity = createAssistant(root, { name: 'Writer' })
  const catalog = loadCatalog(root)
  catalog.assistants[0]!.loadout.skills = { mode: 'fixed', values: ['review'] }
  saveCatalog(root, catalog)
  await expect(manager.wearAssistant('workspace', id, identity.id, 'apply')).rejects.toThrow('skills')
  expect(loadSession(root, id)?.assistantId).toBeUndefined()
})

test('permission requests only narrow the existing Session permission', async () => {
  const identity = createAssistant(root, { name: 'Writer' })
  const catalog = loadCatalog(root)
  catalog.assistants[0]!.loadout.permissionMode = { mode: 'fixed', value: 'allow-all' }
  saveCatalog(root, catalog)
  await manager.wearAssistant('workspace', id, identity.id, 'apply')
  expect(loadSession(root, id)?.permissionMode).toBe('ask')
})
