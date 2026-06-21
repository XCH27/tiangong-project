import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { DesignAction, DesignPatch, DesignSelection } from '@craft-agent/shared/protocol'

export interface PersistedDesignPatch {
  patch: DesignPatch
  action: DesignAction
}

export interface DesignEnginePersistence {
  saveSelection(selection: DesignSelection): Promise<void>
  loadSelection(sessionId: string): Promise<DesignSelection | null>
  savePatch(record: PersistedDesignPatch): Promise<void>
  loadPatch(sessionId: string, patchId: string): Promise<PersistedDesignPatch | null>
}

export function getDesignEngineDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'design-engine')
}

function sessionKey(sessionId: string): string {
  if (typeof sessionId !== 'string' || !sessionId.trim()) throw new Error('sessionId must be non-empty')
  return createHash('sha256').update(sessionId).digest('hex')
}

function patchKey(patchId: string): string {
  if (!/^[0-9a-f-]+$/i.test(patchId)) throw new Error('patchId has an invalid format')
  return patchId
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf-8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export class FileDesignEnginePersistence implements DesignEnginePersistence {
  constructor(private readonly dataDir = getDesignEngineDataDir()) {}

  async saveSelection(selection: DesignSelection): Promise<void> {
    await this.writeAtomic(
      join(this.dataDir, `${sessionKey(selection.sessionId)}.selection.json`),
      selection,
    )
  }

  loadSelection(sessionId: string): Promise<DesignSelection | null> {
    return readJson(join(this.dataDir, `${sessionKey(sessionId)}.selection.json`))
  }

  async savePatch(record: PersistedDesignPatch): Promise<void> {
    const { sessionId, patchId } = record.patch
    await this.writeAtomic(
      join(this.dataDir, `${sessionKey(sessionId)}.${patchKey(patchId)}.patch.json`),
      record,
    )
  }

  loadPatch(sessionId: string, patchId: string): Promise<PersistedDesignPatch | null> {
    return readJson(join(this.dataDir, `${sessionKey(sessionId)}.${patchKey(patchId)}.patch.json`))
  }

  private async writeAtomic(path: string, value: unknown): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    const tempPath = `${path}.${process.pid}.tmp`
    await writeFile(tempPath, JSON.stringify(value, null, 2), 'utf-8')
    await rename(tempPath, path)
  }
}

