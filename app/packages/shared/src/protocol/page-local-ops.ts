/**
 * Page-local operations for the existing EDIT_CONFIGS seam.
 *
 * set-model is the control the edit popover already exposes. It does not admit.
 * update-target asks for file.update. file.page_target is the frozen M05 id.
 * This caller does not use it. HostTurnKernel refuses the file.update payload
 * and the file stays unwritten. Pi is not the permission authority.
 */

import type { ActorRef } from './actor'
import { InternalActionId, type ActionInvocation } from './internal-action'
import { applyAtomicJsonEffect, NativeEffectRegistry } from './native-effect-executor'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome } from './turn-admission'

export const EDIT_PAGE_KEYS = [
  'workspace-permissions',
  'default-permissions',
  'skill-instructions',
  'skill-metadata',
  'source-guide',
  'source-config',
  'source-permissions',
  'source-tool-permissions',
  'preferences-notes',
  'add-source',
  'add-source-api',
  'add-source-mcp',
  'add-source-local',
  'add-skill',
  'edit-statuses',
  'edit-labels',
  'edit-auto-rules',
  'add-label',
  'edit-views',
  'edit-tool-icons',
  'automation-config',
] as const

export type EditPageKey = (typeof EDIT_PAGE_KEYS)[number]

export const PAGE_LOCAL_OPS = ['set-model', 'update-target'] as const
export type PageLocalOpName = (typeof PAGE_LOCAL_OPS)[number]

const PAGE_OPS: readonly PageLocalOpName[] = PAGE_LOCAL_OPS

export interface PageLocalShared {
  modelId: string
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
}

export interface EditPageCall {
  op: PageLocalOpName
  editKey: string
  sessionId: string
  invocationId: string
  actor: ActorRef
  filePath?: string
  nextDocument?: unknown
  modelId?: string
}

export function isEditPageKey(value: string): value is EditPageKey {
  return (EDIT_PAGE_KEYS as readonly string[]).includes(value)
}

export function pageOpsForEditKey(key: EditPageKey): readonly PageLocalOpName[] {
  switch (key) {
    case 'workspace-permissions':
    case 'default-permissions':
    case 'skill-instructions':
    case 'skill-metadata':
    case 'source-guide':
    case 'source-config':
    case 'source-permissions':
    case 'source-tool-permissions':
    case 'preferences-notes':
    case 'add-source':
    case 'add-source-api':
    case 'add-source-mcp':
    case 'add-source-local':
    case 'add-skill':
    case 'edit-statuses':
    case 'edit-labels':
    case 'edit-auto-rules':
    case 'add-label':
    case 'edit-views':
    case 'edit-tool-icons':
    case 'automation-config':
      return PAGE_OPS
    default: {
      const unexpected: never = key
      return unexpected
    }
  }
}

export function selectPageModel(current: string, next: string): string {
  const trimmed = next.trim()
  if (!trimmed) return current
  return trimmed
}

export function createPageLocalShared(modelId = 'fast'): PageLocalShared {
  const effects = new NativeEffectRegistry()
  effects.register(InternalActionId.FILE_UPDATE, async (request) => {
    const filePath = typeof request.payload.filePath === 'string' ? request.payload.filePath : ''
    const applied = await applyAtomicJsonEffect({
      filePath,
      next: request.payload.nextDocument,
      signal: request.signal,
      commit: request.commit,
    })
    return {
      output: { editKey: request.payload.editKey, filePath },
      undoHandle: {
        undoId: `undo-${request.sessionId}`,
        label: 'Restore previous page target',
        snapshot: applied.previous,
      },
    }
  })
  const kernel = new HostTurnKernel(new MemoryTurnJournal(), { nativeEffects: effects })
  return { modelId, kernel, effects }
}

export async function executePageLocalOp(
  shared: PageLocalShared,
  input: EditPageCall & { callerKind: 'human_ui' | 'agent' },
): Promise<TurnOutcome> {
  switch (input.op) {
    case 'set-model':
      shared.modelId = selectPageModel(shared.modelId, input.modelId ?? '')
      return {
        status: 'completed',
        invocationId: input.invocationId,
        output: { modelId: shared.modelId, editKey: input.editKey },
      }
    case 'update-target':
      return updatePageTarget(shared, input)
    default: {
      const unexpected: never = input.op
      return {
        status: 'failed',
        invocationId: input.invocationId,
        reason: `unknown_page_op:${String(unexpected)}`,
      }
    }
  }
}

export function applyEditPageFromHuman(shared: PageLocalShared, input: EditPageCall): Promise<TurnOutcome> {
  return executePageLocalOp(shared, { ...input, callerKind: 'human_ui' })
}

export function applyEditPageFromAgent(shared: PageLocalShared, input: EditPageCall): Promise<TurnOutcome> {
  return executePageLocalOp(shared, { ...input, callerKind: 'agent' })
}

async function updatePageTarget(
  shared: PageLocalShared,
  input: EditPageCall & { callerKind: 'human_ui' | 'agent' },
): Promise<TurnOutcome> {
  if (!isEditPageKey(input.editKey)) {
    return { status: 'failed', invocationId: input.invocationId, reason: 'unknown_edit_page' }
  }
  const filePath = input.filePath ?? ''
  if (!filePath.trim() || filePath.split(/[\\/]/).includes('..')) {
    return { status: 'failed', invocationId: input.invocationId, reason: 'unsafe_file_path' }
  }

  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId: InternalActionId.FILE_UPDATE,
    payload: {
      editKey: input.editKey,
      filePath,
      nextDocument: input.nextDocument ?? null,
    },
    targets: [{ kind: 'file', id: filePath, label: input.editKey }],
    callerKind: input.callerKind,
    sessionId: input.sessionId,
    createdAt: '2026-10-09T00:00:00.000Z',
  }
  const admitted = shared.kernel.admit({ invocation, actor: input.actor })
  if (admitted.status !== 'admitted') return admitted
  return shared.kernel.run(input.invocationId)
}
