import { describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SessionEvent } from '@craft-agent/shared/protocol'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import type { InternalActionRuntimeBridge } from './internal-action-bridge'
import { FileMutationService } from './file-mutation-service'
import { InternalActionExecutorService } from './internal-action-executor'
import { createAllInternalActions, createFilesInternalActions, InternalActionRegistryService } from './internal-action-registry'

const SESSION = 'session-internal-actions-1'

function makeBridge(overrides: Partial<InternalActionRuntimeBridge> = {}): InternalActionRuntimeBridge {
  return {
    getSessionProgress: async () => [],
    setSessionProgress: async () => {},
    listMemory: async () => [],
    addMemory: async () => ({
      id: 'mem-1',
      partition: 'user',
      tier: 'semantic',
      content: 'hello',
      sensitivity: 'medium',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
    getTeamProjection: async () => ({ teamId: 'team-main', members: [] } as never),
    sendTeamMessage: async () => ({ messageId: 'msg-1' }),
    assignTeamTask: async () => ({ taskId: 'task-1' }),
    ...overrides,
  }
}

function makeExecutor(options: { allowPermission?: boolean; bridge?: InternalActionRuntimeBridge } = {}) {
  const events: SessionEvent[] = []
  const permissionRequests: Array<{ toolName: string; description: string; type: string; reason?: string }> = []
  const executor = new InternalActionExecutorService({
    registry: new InternalActionRegistryService(createFilesInternalActions()),
    fileMutations: new FileMutationService(),
    bridge: options.bridge,
    emit: (event) => events.push(event),
    requestPermission: async (_sessionId, input) => {
      permissionRequests.push(input)
      return options.allowPermission ?? true
    },
  })
  return { executor, events, permissionRequests }
}

describe('InternalActionExecutorService', () => {
  it('lists files actions as low-token summaries', () => {
    const { executor } = makeExecutor()

    expect(executor.list({ surface: 'files' }).map((action) => action.id)).toEqual([
      'files.inspect_workspace',
      'files.select_entry',
      'files.move_entry',
      'files.undo_last_edit',
    ])
  })

  it('selects a file entry and emits internal_action_invoked', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fleet-internal-action-select-'))
    try {
      const filePath = join(root, 'a.txt')
      writeFileSync(filePath, 'hello', 'utf8')
      const { executor, events } = makeExecutor()

      const result = await executor.invoke({
        sessionId: SESSION,
        workspaceRoot: root,
        invocation: {
          actionDefinitionId: 'files.select_entry',
          contractVersion: 1,
          actor: USER_ACTOR,
          input: { path: filePath },
        },
      })

      expect(result).toEqual(expect.objectContaining({
        target: expect.objectContaining({ surface: 'files', kind: 'file' }),
      }))
      expect(events.some((event) => event.type === 'internal_action_invoked')).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects selecting entries outside the workspace root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fleet-internal-action-select-root-'))
    const outside = mkdtempSync(join(tmpdir(), 'fleet-internal-action-select-outside-'))
    try {
      const outsideFile = join(outside, 'secret.txt')
      writeFileSync(outsideFile, 'nope', 'utf8')
      const { executor } = makeExecutor()

      await expect(executor.invoke({
        sessionId: SESSION,
        workspaceRoot: root,
        invocation: {
          actionDefinitionId: 'files.select_entry',
          contractVersion: 1,
          actor: USER_ACTOR,
          input: { path: outsideFile },
        },
      })).rejects.toThrow(/escapes workspace/i)
    } finally {
      rmSync(root, { recursive: true, force: true })
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('rejects inspect paths that follow a symlink outside the workspace root', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fleet-internal-action-inspect-root-'))
    const outside = mkdtempSync(join(tmpdir(), 'fleet-internal-action-inspect-outside-'))
    try {
      const linkPath = join(root, 'outside-link')
      symlinkSync(outside, linkPath)
      const { executor } = makeExecutor()

      await expect(executor.invoke({
        sessionId: SESSION,
        workspaceRoot: root,
        invocation: {
          actionDefinitionId: 'files.inspect_workspace',
          contractVersion: 1,
          actor: USER_ACTOR,
          input: { path: linkPath },
        },
      })).rejects.toThrow(/escapes workspace/i)
    } finally {
      rmSync(root, { recursive: true, force: true })
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('requests permission for L2 move, moves the file, and emits file_entry_moved', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fleet-internal-action-move-'))
    try {
      const fromPath = join(root, 'a.txt')
      const toPath = join(root, 'b.txt')
      writeFileSync(fromPath, 'hello', 'utf8')
      const { executor, events, permissionRequests } = makeExecutor({ allowPermission: true })

      const result = await executor.invoke({
        sessionId: SESSION,
        workspaceRoot: root,
        invocation: {
          actionDefinitionId: 'files.move_entry',
          contractVersion: 1,
          actor: USER_ACTOR,
          input: { fromPath, toPath },
          idempotencyKey: 'move-via-action',
        },
      })

      expect(permissionRequests).toHaveLength(1)
      expect(permissionRequests[0]?.type).toBe('file_write')
      expect(readFileSync(toPath, 'utf8')).toBe('hello')
      expect(result).toEqual(expect.objectContaining({ patchId: expect.any(String) }))
      expect(events.some((event) => event.type === 'file_entry_moved')).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('does not move when L2 permission is denied', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fleet-internal-action-denied-'))
    try {
      const fromPath = join(root, 'a.txt')
      const toPath = join(root, 'b.txt')
      writeFileSync(fromPath, 'hello', 'utf8')
      const { executor } = makeExecutor({ allowPermission: false })

      await expect(executor.invoke({
        sessionId: SESSION,
        workspaceRoot: root,
        invocation: {
          actionDefinitionId: 'files.move_entry',
          contractVersion: 1,
          actor: USER_ACTOR,
          input: { fromPath, toPath },
        },
      })).rejects.toThrow(/permission denied/i)

      expect(readFileSync(fromPath, 'utf8')).toBe('hello')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('undoes the last file move and emits file_edit_undone', async () => {
    const root = mkdtempSync(join(tmpdir(), 'fleet-internal-action-undo-'))
    try {
      const fromPath = join(root, 'a.txt')
      const toPath = join(root, 'b.txt')
      writeFileSync(fromPath, 'hello', 'utf8')
      const { executor, events } = makeExecutor()

      const moved = await executor.invoke({
        sessionId: SESSION,
        workspaceRoot: root,
        invocation: {
          actionDefinitionId: 'files.move_entry',
          contractVersion: 1,
          actor: USER_ACTOR,
          input: { fromPath, toPath },
        },
      }) as { patchId: string }

      await executor.invoke({
        sessionId: SESSION,
        workspaceRoot: root,
        invocation: {
          actionDefinitionId: 'files.undo_last_edit',
          contractVersion: 1,
          actor: USER_ACTOR,
          input: { patchId: moved.patchId },
        },
      })

      expect(readFileSync(fromPath, 'utf8')).toBe('hello')
      expect(events.some((event) => event.type === 'file_edit_undone')).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('sets session progress through the runtime bridge', async () => {
    let savedTasks: import('@craft-agent/shared/protocol').ProgressTask[] | undefined
    const bridge = makeBridge({
      setSessionProgress: async (_sessionId, tasks) => {
        savedTasks = tasks
      },
    })
    const events: SessionEvent[] = []
    const executor = new InternalActionExecutorService({
      registry: new InternalActionRegistryService(createAllInternalActions()),
      fileMutations: new FileMutationService(),
      emit: (event) => events.push(event),
      requestPermission: async () => true,
    })

    await executor.invoke({
      sessionId: SESSION,
      workspaceRoot: '/tmp',
      invocation: {
        actionDefinitionId: 'session.set_progress',
        contractVersion: 1,
        actor: USER_ACTOR,
        input: {
          tasks: [{ id: '1', title: 'Step one', status: 'pending' }],
        },
      },
      bridge,
    })

    expect(savedTasks).toEqual([{ id: '1', title: 'Step one', status: 'pending' }])
    expect(events.some((event) => event.type === 'internal_action_invoked')).toBe(true)
  })
})
