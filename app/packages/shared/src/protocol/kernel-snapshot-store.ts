/**
 * Session-directory persistence for KernelSnapshot v1.
 *
 * Craft sessions already live at `{workspace}/sessions/{id}/session.jsonl`
 * and are replaced with write-to-temp-then-rename. This adapter writes
 * `host-kernel-snapshot.json` in that same session directory using the same
 * replace. It is the host execution projection of the session, not a second
 * database, and it does not rewrite session.jsonl.
 *
 * save, load, and HostTurnKernel.snapshot all pass through sealHostRecord.
 * That gate is the only serialization path into this file: credentials are
 * removed, and missing Claude or ChatGPT/Pi cache and price fields are not
 * written as zero.
 */

import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve, sep } from 'node:path'
import { validateSessionId } from '../sessions/validation.ts'
import { sealHostRecord } from './provider-usage'
import { KERNEL_SNAPSHOT_VERSION, type KernelSnapshot } from './turn-admission'

export const HOST_KERNEL_SNAPSHOT_FILE = 'host-kernel-snapshot.json'
export const HOST_KERNEL_SNAPSHOT_KIND = 'fleet_host_kernel_snapshot' as const

interface SnapshotEnvelope {
  kind: typeof HOST_KERNEL_SNAPSHOT_KIND
  version: typeof KERNEL_SNAPSHOT_VERSION
  snapshot: KernelSnapshot
}

export function hostKernelSnapshotPath(workspaceRoot: string, sessionId: string): string {
  validateSessionId(sessionId)
  const root = resolve(workspaceRoot)
  const sessionsRoot = resolve(root, 'sessions')
  const filePath = resolve(sessionsRoot, sessionId, HOST_KERNEL_SNAPSHOT_FILE)
  const prefix = sessionsRoot.endsWith(sep) ? sessionsRoot : `${sessionsRoot}${sep}`
  if (!filePath.startsWith(prefix)) {
    throw new Error('Security Error: Invalid session ID - path traversal detected')
  }
  return filePath
}

export class FileKernelSnapshotStore {
  constructor(private readonly filePath: string) {}

  save(snapshot: KernelSnapshot): void {
    const safe = sealHostRecord(snapshot)
    if (safe.version !== KERNEL_SNAPSHOT_VERSION) {
      throw new Error('unsupported_snapshot_version')
    }
    const envelope: SnapshotEnvelope = {
      kind: HOST_KERNEL_SNAPSHOT_KIND,
      version: KERNEL_SNAPSHOT_VERSION,
      snapshot: safe,
    }
    mkdirSync(dirname(this.filePath), { recursive: true })
    const tmpFile = `${this.filePath}.tmp`
    writeFileSync(tmpFile, `${JSON.stringify(envelope)}\n`)
    try {
      unlinkSync(this.filePath)
    } catch {
      // The first save has no previous file.
    }
    renameSync(tmpFile, this.filePath)
  }

  load(): KernelSnapshot {
    let parsed: unknown
    try {
      parsed = JSON.parse(readFileSync(this.filePath, 'utf8'))
    } catch {
      throw new Error('corrupt_kernel_snapshot')
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('corrupt_kernel_snapshot')
    const envelope = parsed as Partial<SnapshotEnvelope>
    if (envelope.kind !== HOST_KERNEL_SNAPSHOT_KIND || !envelope.snapshot) {
      throw new Error('corrupt_kernel_snapshot')
    }
    if (envelope.version !== KERNEL_SNAPSHOT_VERSION || envelope.snapshot.version !== KERNEL_SNAPSHOT_VERSION) {
      throw new Error('unsupported_snapshot_version')
    }
    return sealHostRecord(envelope.snapshot)
  }
}

export function sessionJsonlPath(workspaceRoot: string, sessionId: string): string {
  return join(dirname(hostKernelSnapshotPath(workspaceRoot, sessionId)), 'session.jsonl')
}
