import { readdir, realpath, stat } from 'node:fs/promises'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type {
  ActionInvocation,
  ActionSurface,
  ActionTargetRef,
  ActionVerb,
  InternalActionRegistry,
  InternalActionSummary,
  SessionEvent,
} from '@craft-agent/shared/protocol'
import type { FileMutationService } from './file-mutation-service'

export interface InvokeInternalActionInput {
  sessionId: string
  workspaceRoot: string
  invocation: ActionInvocation
}

export interface InternalActionExecutorDeps {
  registry: InternalActionRegistry & { summarize?(filter?: { surface?: ActionSurface; verb?: ActionVerb }): InternalActionSummary[] }
  fileMutations: FileMutationService
  emit: (event: SessionEvent) => void
  requestPermission: (
    sessionId: string,
    input: { toolName: string; description: string; type: 'file_write' | 'mcp_mutation' | 'api_mutation'; reason?: string },
  ) => Promise<boolean>
}

export class InternalActionExecutorService {
  constructor(private readonly deps: InternalActionExecutorDeps) {}

  list(filter: { surface?: ActionSurface; verb?: ActionVerb } = {}): InternalActionSummary[] {
    if (this.deps.registry.summarize) return this.deps.registry.summarize(filter)
    return this.deps.registry.list(filter).map((def) => ({
      id: def.id,
      contractVersion: def.contractVersion,
      surface: def.surface,
      verb: def.verb,
      title: def.title,
      permissionLevel: def.permissionLevel,
      inputSchema: def.inputSchema,
    }))
  }

  async invoke(input: InvokeInternalActionInput): Promise<unknown> {
    const { sessionId, workspaceRoot, invocation } = input
    const def = this.deps.registry.get(invocation.actionDefinitionId, invocation.contractVersion)
    if (!def) {
      throw new Error(`Unknown internal action definition ${invocation.actionDefinitionId}@${invocation.contractVersion}`)
    }
    if (!def.agentCallable && invocation.actor.kind === 'agent') {
      throw new Error(`Internal action ${def.id} is not agent-callable`)
    }

    if (def.permissionLevel === 'L2' || def.permissionLevel === 'L3') {
      const allowed = await this.deps.requestPermission(sessionId, {
        toolName: def.id,
        description: def.description,
        type: def.surface === 'files' ? 'file_write' : 'api_mutation',
        reason: `${def.permissionLevel} internal action requested by ${invocation.actor.kind}`,
      })
      if (!allowed) throw new Error(`Permission denied for ${def.id}`)
    }

    switch (def.id) {
      case 'files.inspect_workspace':
        return this.inspectWorkspace(sessionId, workspaceRoot, invocation)
      case 'files.select_entry':
        return this.selectEntry(sessionId, workspaceRoot, invocation)
      case 'files.move_entry':
        return this.moveEntry(sessionId, workspaceRoot, invocation)
      case 'files.undo_last_edit':
        return this.undoLastEdit(sessionId, workspaceRoot, invocation)
      default:
        throw new Error(`No executor is registered for internal action ${def.id}`)
    }
  }

  private async inspectWorkspace(sessionId: string, workspaceRoot: string, invocation: ActionInvocation): Promise<unknown> {
    const input = readObjectInput(invocation.input)
    const dirPath = await resolveExistingWithinWorkspace(
      workspaceRoot,
      typeof input.path === 'string' ? input.path : workspaceRoot,
    )
    const dirStat = await stat(dirPath)
    if (!dirStat.isDirectory()) throw new Error('inspect path must be a directory')
    const entries = await readdir(dirPath, { withFileTypes: true })
    const result = {
      path: dirPath,
      entries: entries
        .filter((entry) => entry.name !== '.DS_Store')
        .map((entry) => ({ name: entry.name, path: join(dirPath, entry.name), type: entry.isDirectory() ? 'directory' : 'file' })),
    }
    this.emitInternalInvoked(sessionId, invocation, result)
    return result
  }

  private async selectEntry(sessionId: string, workspaceRoot: string, invocation: ActionInvocation): Promise<unknown> {
    const input = readObjectInput(invocation.input)
    if (typeof input.path !== 'string' || !input.path.trim()) throw new Error('path is required')
    const entryPath = await resolveExistingWithinWorkspace(workspaceRoot, input.path)
    const entryStat = await stat(entryPath)
    const target: ActionTargetRef = {
      surface: 'files',
      kind: entryStat.isDirectory() ? 'dir' : 'file',
      locator: { path: entryPath },
      revision: await this.deps.fileMutations.getRevision(entryPath),
      preview: { text: basename(entryPath) },
    }
    const result = { target }
    this.emitInternalInvoked(sessionId, invocation, result, target)
    return result
  }

  private async moveEntry(sessionId: string, workspaceRoot: string, invocation: ActionInvocation): Promise<unknown> {
    const input = readObjectInput(invocation.input)
    if (typeof input.fromPath !== 'string' || typeof input.toPath !== 'string') {
      throw new Error('fromPath and toPath are required')
    }
    const moved = await this.deps.fileMutations.moveEntry({
      sessionId,
      workspaceRoot,
      fromPath: input.fromPath,
      toPath: input.toPath,
      actor: invocation.actor,
      expectedSourceRevision: typeof input.expectedSourceRevision === 'string' ? input.expectedSourceRevision : undefined,
      idempotencyKey: invocation.idempotencyKey,
    })
    const forward = moved.patch.forward as { fromPath: string; toPath: string; fromRevision?: string; toRevision?: string }
    this.deps.emit({
      type: 'file_entry_moved',
      sessionId,
      patchId: moved.patch.patchId,
      fromPath: forward.fromPath,
      toPath: forward.toPath,
      fromRevision: moved.fromRevision,
      toRevision: moved.toRevision,
      actor: invocation.actor,
      timestamp: Date.now(),
    })
    return {
      patchId: moved.patch.patchId,
      fromPath: forward.fromPath,
      toPath: forward.toPath,
      fromRevision: moved.fromRevision,
      toRevision: moved.toRevision,
    }
  }

  private async undoLastEdit(sessionId: string, workspaceRoot: string, invocation: ActionInvocation): Promise<unknown> {
    const input = readObjectInput(invocation.input)
    const undone = await this.deps.fileMutations.undoLastEdit({
      sessionId,
      workspaceRoot,
      actor: invocation.actor,
      patchId: typeof input.patchId === 'string' ? input.patchId : undefined,
    })
    this.deps.emit({
      type: 'file_edit_undone',
      sessionId,
      undonePatchId: undone.undonePatchId,
      actor: invocation.actor,
      timestamp: Date.now(),
    })
    return { undonePatchId: undone.undonePatchId }
  }

  private emitInternalInvoked(sessionId: string, invocation: ActionInvocation, result: unknown, target?: ActionTargetRef): void {
    this.deps.emit({
      type: 'internal_action_invoked',
      sessionId,
      invocation,
      target,
      result,
      actor: invocation.actor,
      timestamp: Date.now(),
    })
  }
}

function readObjectInput(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as Record<string, unknown>
}

async function resolveExistingWithinWorkspace(workspaceRoot: string, candidatePath: string): Promise<string> {
  if (!candidatePath.trim()) throw new Error('path is required')
  const realRoot = await realpath(workspaceRoot)
  const absoluteCandidate = isAbsolute(candidatePath)
    ? resolve(candidatePath)
    : resolve(realRoot, candidatePath)
  const realCandidate = await realpath(absoluteCandidate)
  if (!isWithin(realRoot, realCandidate)) {
    throw new Error('Path escapes workspace root')
  }
  return realCandidate
}

function isWithin(root: string, candidate: string): boolean {
  const rel = relative(root, candidate)
  return rel === '' || (!rel.startsWith('..') && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}
