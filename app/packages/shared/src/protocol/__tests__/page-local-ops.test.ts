import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import { EDIT_PAGE_KEYS, type EditPageKey } from '../page-local-ops'
import {
  applyEditPageFromAgent,
  applyEditPageFromHuman,
  createPageLocalShared,
  pageOpsForEditKey,
  selectPageModel,
} from '../page-local-ops'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('page-local edit operations', () => {
  test('every edit page has model switch and the shared target update', () => {
    for (const key of EDIT_PAGE_KEYS) {
      expect(pageOpsForEditKey(key)).toEqual(['set-model', 'update-target'])
    }
    expect(selectPageModel('fast', 'claude-sonnet')).toBe('claude-sonnet')
    expect(selectPageModel('fast', '  ')).toBe('fast')
  })

  test('human button and agent tool write the same page target through one kernel', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-page-op-'))
    dirs.push(dir)
    const filePath = join(dir, 'preferences.json')
    const shared = createPageLocalShared('fast')
    const editKey: EditPageKey = 'preferences-notes'

    const selected = await applyEditPageFromHuman(shared, {
      op: 'set-model',
      editKey,
      sessionId: 'session-1',
      invocationId: 'model-1',
      actor: human,
      modelId: 'default',
    })
    expect(selected).toMatchObject({ status: 'completed', output: { modelId: 'default' } })
    expect(shared.modelId).toBe('default')

    const humanWrite = await applyEditPageFromHuman(shared, {
      op: 'update-target',
      editKey,
      sessionId: 'session-1',
      invocationId: 'write-human',
      actor: human,
      filePath,
      nextDocument: { notes: 'from the button' },
    })
    expect(humanWrite).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:page_target' })
    expect(() => readFileSync(filePath, 'utf8')).toThrow()

    const agentWrite = await applyEditPageFromAgent(shared, {
      op: 'update-target',
      editKey,
      sessionId: 'session-1',
      invocationId: 'write-agent',
      actor: agent,
      filePath,
      nextDocument: { notes: 'from the tool' },
    })
    expect(agentWrite).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:page_target' })
    expect(() => readFileSync(filePath, 'utf8')).toThrow()

    const kinds = shared.kernel.events('session-1').map((event) => event.kind)
    expect(kinds).toContain('action_failed')
    expect(kinds).not.toContain('action_completed')
  })

  test('a credential-shaped page update is denied before the file exists', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'fleet-page-secret-'))
    dirs.push(dir)
    const filePath = join(dir, 'secrets.json')
    const shared = createPageLocalShared()
    const outcome = await applyEditPageFromAgent(shared, {
      op: 'update-target',
      editKey: 'source-config',
      sessionId: 'session-1',
      invocationId: 'write-secret',
      actor: agent,
      filePath,
      nextDocument: { apiKey: 'sk-live-secret-value' },
    })
    expect(outcome).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(() => readFileSync(filePath, 'utf8')).toThrow()
  })

  test('an unknown edit page and a parent path fail closed', async () => {
    const shared = createPageLocalShared()
    expect(await applyEditPageFromHuman(shared, {
      op: 'update-target',
      editKey: 'not-a-page',
      sessionId: 'session-1',
      invocationId: 'bad-key',
      actor: human,
      filePath: '/tmp/notes.json',
      nextDocument: { ok: true },
    })).toMatchObject({ status: 'failed', reason: 'unknown_edit_page' })

    expect(await applyEditPageFromAgent(shared, {
      op: 'update-target',
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'bad-path',
      actor: agent,
      filePath: '/tmp/../notes.json',
      nextDocument: { ok: true },
    })).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })
  })
})
