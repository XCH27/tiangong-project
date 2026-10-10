import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import { InternalActionId } from '../internal-action'
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

  test('the edit popover selects a model and does not call the page host', () => {
    const popover = readFileSync(new URL('../../../../../apps/electron/src/renderer/components/ui/EditPopover.tsx', import.meta.url), 'utf8')
    expect(popover.includes('selectPageModel')).toBe(true)
    expect(popover.includes('applyEditPageFromHuman')).toBe(false)
    expect(popover.includes('applyEditPageFromAgent')).toBe(false)
    expect(popover.includes('file.page_target')).toBe(false)
  })

  test('set-model does not admit a turn', async () => {
    const shared = createPageLocalShared('fast')
    const selected = await applyEditPageFromHuman(shared, {
      op: 'set-model',
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'model-1',
      actor: human,
      modelId: 'default',
    })
    expect(selected).toMatchObject({ status: 'completed', output: { modelId: 'default' } })
    expect(shared.modelId).toBe('default')
    expect(shared.kernel.snapshot().turns).toEqual([])
  })

  test('human and agent page writes wait on file.page_target and do not write', async () => {
    const dir = workspace()
    const filePath = join(dir, 'preferences.json')
    const shared = createPageLocalShared('fast')
    const editKey: EditPageKey = 'preferences-notes'

    const humanWrite = await applyEditPageFromHuman(shared, {
      op: 'update-target',
      editKey,
      sessionId: 'session-1',
      invocationId: 'write-human',
      actor: human,
      filePath,
      nextDocument: { notes: 'from the button' },
      baseRevision: 0,
    })
    expect(humanWrite).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })

    const agentWrite = await applyEditPageFromAgent(shared, {
      op: 'update-target',
      editKey,
      sessionId: 'session-1',
      invocationId: 'write-agent',
      actor: agent,
      filePath,
      nextDocument: { notes: 'from the tool' },
      baseRevision: 0,
    })
    expect(agentWrite).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
    expect(existsSync(filePath)).toBe(false)
    expect(shared.kernel.approve('write-human', agent).status).toBe('approval_required')

    const turns = shared.kernel.snapshot().turns
    expect(turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.FILE_PAGE_TARGET,
      InternalActionId.FILE_PAGE_TARGET,
    ])
    expect(turns.every((turn) => turn.phase === 'awaiting_approval')).toBe(true)
    expect(turns.every((turn) => turn.request.invocation.payload.baseRevision === 0)).toBe(true)
    expect(turns.every((turn) => turn.request.preAuthorizedBy === undefined)).toBe(true)
    const kinds = shared.kernel.events('session-1').map((event) => event.kind)
    expect(kinds).toContain('supervision_requested')
    expect(kinds).not.toContain('action_completed')
  })

  test('the same page payload on file.update is still refused', () => {
    const filePath = join(workspace(), 'old-verb.json')
    const shared = createPageLocalShared()
    expect(shared.kernel.admit({
      invocation: {
        invocationId: 'old-verb',
        actionId: InternalActionId.FILE_UPDATE,
        payload: {
          editKey: 'preferences-notes',
          filePath,
          nextDocument: { notes: 'from the button' },
          baseRevision: 0,
        },
        targets: [{ kind: 'file', id: filePath, label: 'preferences-notes' }],
        callerKind: 'agent',
        sessionId: 'session-1',
        createdAt: '2026-10-09T00:00:00.000Z',
      },
      actor: agent,
    })).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:page_target' })
    expect(existsSync(filePath)).toBe(false)
  })

  test('a human allow writes the page and a deny does not', async () => {
    const dir = workspace()
    const allowedPath = join(dir, 'allowed.json')
    const deniedPath = join(dir, 'denied.json')
    const shared = createPageLocalShared()
    const allowed = {
      op: 'update-target' as const,
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'write-allow',
      actor: human,
      filePath: allowedPath,
      nextDocument: { notes: 'from the button' },
      baseRevision: 3,
    }
    expect(await applyEditPageFromHuman(shared, allowed)).toMatchObject({ status: 'approval_required' })
    expect(existsSync(allowedPath)).toBe(false)
    expect(shared.kernel.approve('write-allow', human).status).toBe('admitted')
    const written = await applyEditPageFromHuman(shared, allowed)
    expect(written).toMatchObject({
      status: 'completed',
      output: { actionId: InternalActionId.FILE_PAGE_TARGET, baseRevision: 3 },
    })
    expect(JSON.parse(readFileSync(allowedPath, 'utf8'))).toEqual({ notes: 'from the button' })

    const denied = {
      op: 'update-target' as const,
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'write-deny',
      actor: agent,
      filePath: deniedPath,
      nextDocument: { notes: 'from the tool' },
      baseRevision: 0,
    }
    expect(await applyEditPageFromAgent(shared, denied)).toMatchObject({ status: 'approval_required' })
    expect(shared.kernel.reject('write-deny', human)).toMatchObject({ status: 'denied', reason: 'approval_rejected' })
    const rejected = await applyEditPageFromAgent(shared, denied)
    expect(rejected).toMatchObject({ status: 'denied', reason: 'approval_rejected' })
    expect(existsSync(deniedPath)).toBe(false)
  })

  test('a missing baseRevision is not admitted and does not write', async () => {
    const filePath = join(workspace(), 'missing-revision.json')
    const shared = createPageLocalShared()
    const outcome = await applyEditPageFromHuman(shared, {
      op: 'update-target',
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'write-revision',
      actor: human,
      filePath,
      nextDocument: { notes: 'no revision' },
    })
    expect(outcome).toMatchObject({ status: 'failed', reason: 'base_revision_required' })
    expect(shared.kernel.snapshot().turns).toEqual([])
    expect(existsSync(filePath)).toBe(false)

    const fractional = await applyEditPageFromAgent(shared, {
      op: 'update-target',
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'write-fraction',
      actor: agent,
      filePath,
      nextDocument: { notes: 'fraction' },
      baseRevision: 1.5,
    })
    expect(fractional).toMatchObject({ status: 'failed', reason: 'base_revision_required' })
    expect(existsSync(filePath)).toBe(false)
  })

  test('stop before run does not write the page', async () => {
    const filePath = join(workspace(), 'stopped.json')
    const shared = createPageLocalShared('fast', {
      beforeRun(invocationId, kernel) {
        kernel.stop(invocationId)
      },
    })
    const input = {
      op: 'update-target' as const,
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'write-stop',
      actor: human,
      filePath,
      nextDocument: { notes: 'stopped' },
      baseRevision: 0,
    }
    expect(await applyEditPageFromHuman(shared, input)).toMatchObject({
      status: 'approval_required',
      reason: 'human_approval_required',
    })
    expect(existsSync(filePath)).toBe(false)
    expect(shared.kernel.approve('write-stop', human).status).toBe('admitted')
    const stopped = await applyEditPageFromHuman(shared, input)
    expect(stopped).toMatchObject({ status: 'interrupted' })
    expect(existsSync(filePath)).toBe(false)
  })

  test('a credential-shaped page update is denied before the file exists', async () => {
    const filePath = join(workspace(), 'secrets.json')
    const shared = createPageLocalShared()
    const outcome = await applyEditPageFromAgent(shared, {
      op: 'update-target',
      editKey: 'source-config',
      sessionId: 'session-1',
      invocationId: 'write-secret',
      actor: agent,
      filePath,
      nextDocument: { apiKey: 'sk-live-secret-value' },
      baseRevision: 0,
    })
    expect(outcome).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(existsSync(filePath)).toBe(false)
    expect(JSON.stringify(shared.kernel.snapshot())).not.toContain('sk-live-secret-value')
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
      baseRevision: 0,
    })).toMatchObject({ status: 'failed', reason: 'unknown_edit_page' })

    expect(await applyEditPageFromAgent(shared, {
      op: 'update-target',
      editKey: 'preferences-notes',
      sessionId: 'session-1',
      invocationId: 'bad-path',
      actor: agent,
      filePath: '/tmp/../notes.json',
      nextDocument: { ok: true },
      baseRevision: 0,
    })).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })
    expect(shared.kernel.snapshot().turns).toEqual([])
  })
})

function workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-page-op-'))
  dirs.push(dir)
  return dir
}
