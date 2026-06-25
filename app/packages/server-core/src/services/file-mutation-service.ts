import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { access, lstat, mkdir, realpath, rename, stat } from 'node:fs/promises'
import { dirname, isAbsolute, normalize, relative, resolve, sep } from 'node:path'
import type { ActorRef, DesignPatch } from '@craft-agent/shared/protocol'

export interface FileMoveEntryInput {
  sessionId: string
  workspaceRoot: string
  fromPath: string
  toPath: string
  actor: ActorRef
  expectedSourceRevision?: string
  idempotencyKey?: string
}

export interface FileMoveEntryResult {
  patch: DesignPatch
  fromRevision: string
  toRevision: string
}

export interface FileUndoLastEditInput {
  sessionId: string
  workspaceRoot: string
  actor: ActorRef
  patchId?: string
}

export interface FileUndoLastEditResult {
  undonePatchId: string
  patch: DesignPatch
}

interface MoveRecord {
  sessionId: string
  workspaceRoot: string
  patch: DesignPatch
  fromPath: string
  toPath: string
  fromRevision: string
  toRevision: string
  actor: ActorRef
}

export class FileMutationService {
  private readonly movesByPatchId = new Map<string, MoveRecord>()
  private readonly movesByIdempotencyKey = new Map<string, MoveRecord>()
  private readonly latestPatchBySession = new Map<string, string>()

  async moveEntry(input: FileMoveEntryInput): Promise<FileMoveEntryResult> {
    if (input.idempotencyKey) {
      const existing = this.movesByIdempotencyKey.get(input.idempotencyKey)
      if (existing) return { patch: existing.patch, fromRevision: existing.fromRevision, toRevision: existing.toRevision }
    }

    const workspaceRoot = await realpath(resolve(input.workspaceRoot))
    const fromPath = await resolveExistingWithinWorkspace(workspaceRoot, input.fromPath, 'fromPath')
    const toPath = await resolveNewPathWithinWorkspace(workspaceRoot, input.toPath, 'toPath')

    await assertDestinationAvailable(toPath)
    const fromRevision = await this.getRevision(fromPath)
    if (input.expectedSourceRevision && input.expectedSourceRevision !== fromRevision) {
      throw new Error(`Source revision mismatch for ${input.fromPath}`)
    }

    await mkdir(dirname(toPath), { recursive: true })
    try {
      await rename(fromPath, toPath)
    } catch (error) {
      throw classifyRenameError(error)
    }

    const toRevision = await this.getRevision(toPath)
    const patchId = randomUUID()
    const actionId = input.idempotencyKey || patchId
    const patch: DesignPatch = {
      patchId,
      actionId,
      sessionId: input.sessionId,
      forward: {
        kind: 'files.move_entry',
        fromPath,
        toPath,
        fromRevision,
        toRevision,
      },
      inverse: {
        kind: 'files.move_entry.inverse',
        fromPath: toPath,
        toPath: fromPath,
        expectedSourceRevision: toRevision,
      },
      status: 'committed',
      committedAt: Date.now(),
    }

    const record: MoveRecord = {
      sessionId: input.sessionId,
      workspaceRoot,
      patch,
      fromPath,
      toPath,
      fromRevision,
      toRevision,
      actor: input.actor,
    }
    this.movesByPatchId.set(patchId, record)
    this.latestPatchBySession.set(input.sessionId, patchId)
    if (input.idempotencyKey) this.movesByIdempotencyKey.set(input.idempotencyKey, record)

    return { patch, fromRevision, toRevision }
  }

  async undoLastEdit(input: FileUndoLastEditInput): Promise<FileUndoLastEditResult> {
    const patchId = input.patchId ?? this.latestPatchBySession.get(input.sessionId)
    if (!patchId) throw new Error(`No file edit to undo for session ${input.sessionId}`)
    const record = this.movesByPatchId.get(patchId)
    if (!record || record.sessionId !== input.sessionId) {
      throw new Error(`Unknown file edit patch ${patchId}`)
    }

    const workspaceRoot = await realpath(resolve(input.workspaceRoot))
    if (workspaceRoot !== record.workspaceRoot) {
      throw new Error('Undo workspace root does not match original file edit')
    }

    const currentTargetPath = await resolveExistingWithinWorkspace(workspaceRoot, record.toPath, 'undoSource')
    const currentTargetRevision = await this.getRevision(currentTargetPath)
    if (currentTargetRevision !== record.toRevision) {
      throw new Error(`Cannot undo ${patchId}: target changed since move`)
    }

    await assertDestinationAvailable(record.fromPath)
    await mkdir(dirname(record.fromPath), { recursive: true })
    try {
      await rename(record.toPath, record.fromPath)
    } catch (error) {
      throw classifyRenameError(error)
    }

    const undoPatch: DesignPatch = {
      patchId: randomUUID(),
      actionId: `undo-${patchId}`,
      sessionId: input.sessionId,
      forward: {
        kind: 'files.undo_last_edit',
        undonePatchId: patchId,
        fromPath: record.toPath,
        toPath: record.fromPath,
      },
      inverse: { kind: 'none', reason: 'undo action is not recursively undoable' },
      status: 'committed',
      committedAt: Date.now(),
    }
    this.movesByPatchId.delete(patchId)
    if (this.latestPatchBySession.get(input.sessionId) === patchId) {
      this.latestPatchBySession.delete(input.sessionId)
    }

    return { undonePatchId: patchId, patch: undoPatch }
  }

  async getRevision(filePath: string): Promise<string> {
    const entryStat = await stat(filePath)
    const type = entryStat.isDirectory() ? 'directory' : 'file'
    return `${type}:${entryStat.size}:${Math.trunc(entryStat.mtimeMs)}`
  }
}

async function resolveExistingWithinWorkspace(workspaceRoot: string, inputPath: string, label: string): Promise<string> {
  const normalized = normalize(resolvePath(workspaceRoot, inputPath))

  const entryLstat = await lstat(normalized)
  const real = await realpath(normalized)
  assertLexicallyWithinWorkspace(workspaceRoot, real, label)
  if (entryLstat.isSymbolicLink() && real !== normalized) {
    assertLexicallyWithinWorkspace(workspaceRoot, real, `${label} symlink target`)
  }
  return real
}

async function resolveNewPathWithinWorkspace(workspaceRoot: string, inputPath: string, label: string): Promise<string> {
  const normalized = normalize(resolvePath(workspaceRoot, inputPath))

  const parent = dirname(normalized)
  const parentReal = await realpath(parent)
  assertLexicallyWithinWorkspace(workspaceRoot, parentReal, `${label} parent`)
  return normalized
}

function resolvePath(workspaceRoot: string, inputPath: string): string {
  return isAbsolute(inputPath) ? inputPath : resolve(workspaceRoot, inputPath)
}

function assertLexicallyWithinWorkspace(workspaceRoot: string, candidate: string, label: string): void {
  const rel = relative(workspaceRoot, candidate)
  if (rel === '' || (!rel.startsWith('..') && rel !== '..' && !isAbsolute(rel))) return
  throw new Error(`${label} is outside workspace`)
}

async function assertDestinationAvailable(toPath: string): Promise<void> {
  try {
    await access(toPath, constants.F_OK)
    throw new Error(`Destination already exists: ${toPath}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
    throw error
  }
}

function classifyRenameError(error: unknown): Error {
  const code = (error as NodeJS.ErrnoException).code
  if (code === 'EXDEV') return new Error('Cannot move entry across filesystem volumes')
  if (code === 'EACCES' || code === 'EPERM') return new Error('Cannot move entry because permission was denied')
  if (code === 'EBUSY') return new Error('Cannot move entry because it is busy')
  if (code === 'ENOENT') return new Error('Cannot move entry because source or destination parent is missing')
  return error instanceof Error ? error : new Error(String(error))
}
