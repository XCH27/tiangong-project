import type {
  ActionSurface,
  ActionVerb,
  InternalActionDefinition,
  InternalActionRegistry,
  InternalActionSummary,
} from '@craft-agent/shared/protocol'
import { createSpineInternalActions } from './spine-internal-actions'

export { createSpineInternalActions } from './spine-internal-actions'

export class InternalActionRegistryService implements InternalActionRegistry {
  private readonly defs = new Map<string, InternalActionDefinition>()
  private readonly latestById = new Map<string, InternalActionDefinition>()

  constructor(initialDefinitions: InternalActionDefinition[] = []) {
    for (const def of initialDefinitions) {
      this.register(def)
    }
  }

  register(def: InternalActionDefinition): void {
    assertValidDefinition(def)
    const key = keyFor(def.id, def.contractVersion)
    if (this.defs.has(key)) {
      throw new Error(`Duplicate internal action definition: ${def.id}@${def.contractVersion}`)
    }

    this.defs.set(key, def)
    const current = this.latestById.get(def.id)
    if (!current || def.contractVersion > current.contractVersion) {
      this.latestById.set(def.id, def)
    }
  }

  get(id: string, contractVersion?: number): InternalActionDefinition | undefined {
    if (contractVersion === undefined) return this.latestById.get(id)
    return this.defs.get(keyFor(id, contractVersion))
  }

  list(filter: { surface?: ActionSurface; verb?: ActionVerb } = {}): InternalActionDefinition[] {
    return Array.from(this.defs.values())
      .filter((def) => !filter.surface || def.surface === filter.surface)
      .filter((def) => !filter.verb || def.verb === filter.verb)
  }

  summarize(filter: { surface?: ActionSurface; verb?: ActionVerb } = {}): InternalActionSummary[] {
    return this.list(filter).map((def) => ({
      id: def.id,
      contractVersion: def.contractVersion,
      surface: def.surface,
      verb: def.verb,
      title: def.title,
      permissionLevel: def.permissionLevel,
      inputSchema: def.inputSchema,
    }))
  }
}

export function createFilesInternalActions(): InternalActionDefinition[] {
  return [
    {
      id: 'files.inspect_workspace',
      contractVersion: 1,
      surface: 'files',
      verb: 'read',
      title: 'Inspect workspace files',
      description: 'List entries in the current workspace files surface.',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          entries: { type: 'array' },
        },
      },
      permissionLevel: 'L0',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'read-only action' },
      humanEntryPoints: ['FilesListPanel'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      redactionPolicy: ['path'],
      contextSummary: { reads: ['workspace.fileTree'], writes: [], tokenHint: 'small' },
    },
    {
      id: 'files.select_entry',
      contractVersion: 1,
      surface: 'files',
      verb: 'select',
      title: 'Select file entry',
      description: 'Create an ActionTargetRef for a file or directory entry.',
      inputSchema: {
        type: 'object',
        required: ['path'],
        properties: {
          path: { type: 'string' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          target: { type: 'object' },
        },
      },
      permissionLevel: 'L0',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'selection action does not mutate workspace state' },
      humanEntryPoints: ['FilesListPanel.entry'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      redactionPolicy: ['path'],
      contextSummary: { reads: ['workspace.entry'], writes: [], tokenHint: 'tiny' },
    },
    {
      id: 'files.move_entry',
      contractVersion: 1,
      surface: 'files',
      verb: 'mutate',
      title: 'Move or rename file entry',
      description: 'Move or rename a file or directory inside the workspace and record an inverse patch.',
      inputSchema: {
        type: 'object',
        required: ['fromPath', 'toPath'],
        properties: {
          fromPath: { type: 'string' },
          toPath: { type: 'string' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['patchId', 'fromPath', 'toPath', 'fromRevision'],
        properties: {
          patchId: { type: 'string' },
          fromPath: { type: 'string' },
          toPath: { type: 'string' },
          fromRevision: { type: 'string' },
        },
        additionalProperties: false,
      },
      permissionLevel: 'L2',
      timelineEvent: 'file_entry_moved',
      undoHandle: { type: 'inverse-patch' },
      humanEntryPoints: ['FilesListPanel.rename', 'FilesListPanel.move'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      redactionPolicy: ['fromPath', 'toPath'],
      contextSummary: { reads: ['workspace.entry'], writes: ['workspace.fileTree'], tokenHint: 'tiny' },
    },
    {
      id: 'files.undo_last_edit',
      contractVersion: 1,
      surface: 'files',
      verb: 'undo',
      title: 'Undo last file edit',
      description: 'Undo the last file mutation by applying its inverse patch with precondition checks.',
      inputSchema: {
        type: 'object',
        properties: {
          patchId: { type: 'string' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['undonePatchId'],
        properties: {
          undonePatchId: { type: 'string' },
        },
        additionalProperties: false,
      },
      permissionLevel: 'L1',
      timelineEvent: 'file_edit_undone',
      undoHandle: { type: 'none', noneReason: 'undo action is not recursively undoable' },
      humanEntryPoints: ['FilesListPanel.undo'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      redactionPolicy: ['patchId'],
      contextSummary: { reads: ['session.lastPatch'], writes: ['workspace.fileTree'], tokenHint: 'tiny' },
    },
  ]
}

export function createAllInternalActions(): InternalActionDefinition[] {
  return [...createFilesInternalActions(), ...createSpineInternalActions()]
}

function keyFor(id: string, contractVersion: number): string {
  return `${id}@${contractVersion}`
}

function assertValidDefinition(def: InternalActionDefinition): void {
  if (!def.id.trim()) throw new Error('Internal action id is required')
  if (!Number.isInteger(def.contractVersion) || def.contractVersion < 1) {
    throw new Error(`Invalid contractVersion for ${def.id}`)
  }
  if (def.undoHandle.type === 'none' && !def.undoHandle.noneReason?.trim()) {
    throw new Error(`Internal action ${def.id} has undoHandle.type='none' without noneReason`)
  }
  if (def.humanEntryPoints.length === 0 && !def.agentCallable) {
    throw new Error(`Internal action ${def.id} must have a human entry point or be agent-callable`)
  }
  const localOnlySurfaces: ActionSurface[] = ['files', 'session', 'manager', 'team']
  if (localOnlySurfaces.includes(def.surface) && def.locality !== 'LOCAL_ONLY') {
    throw new Error(`Internal action ${def.id} belongs to ${def.surface} and must be LOCAL_ONLY`)
  }
}
