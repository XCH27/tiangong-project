/**
 * R3 acceptance convention over ordinary workspace files.
 *
 * Not ArtifactRef (R5): bytes stay in the Project folder. The delivered copy
 * is the accepted revision plus a parseable provenance header. Recovery is
 * honest — `none` unless the Project is a Git repository.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { atomicWriteFileSync } from '../utils/files.ts'

export const DELIVERABLES_DIR = 'deliverables'
export const DELIVERABLE_FORMAT = 1

export type DeliverableRecovery = 'none' | 'git'

export interface DeliverableEvidenceRef {
  kind: 'file' | 'session-evidence' | 'url'
  id: string
}

export interface DeliverableProvenance {
  format: typeof DELIVERABLE_FORMAT
  sessionId: string
  acceptedAt: string
  source: string
  sha256: string
  recovery: DeliverableRecovery
  evidence: readonly DeliverableEvidenceRef[]
}

export interface AcceptDeliverableInput {
  workspaceRoot: string
  sessionId: string
  sourcePath: string
  evidence?: readonly DeliverableEvidenceRef[]
  acceptedAt?: string
}

export type AcceptDeliverableFailure = {
  ok: false
  reason:
    | 'source-missing'
    | 'source-outside-workspace'
    | 'dest-outside-workspace'
    | 'overwrite-conflict'
    | 'invalid-session'
  message: string
}

export type AcceptDeliverableSuccess = {
  ok: true
  destPath: string
  sha256: string
  recovery: DeliverableRecovery
  provenance: DeliverableProvenance
}

export type AcceptDeliverableResult = AcceptDeliverableSuccess | AcceptDeliverableFailure

export function detectWorkspaceRecovery(workspaceRoot: string): DeliverableRecovery {
  return existsSync(join(resolve(workspaceRoot), '.git')) ? 'git' : 'none'
}

export function sha256Text(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex')
}

export function formatDeliverableDocument(
  provenance: DeliverableProvenance,
  body: string,
): string {
  const evidenceLines = provenance.evidence.length === 0
    ? ['evidence:']
    : [
        'evidence:',
        ...provenance.evidence.map((entry) => `  - ${entry.kind}:${entry.id}`),
      ]
  return [
    '---',
    `fleet-deliverable: ${provenance.format}`,
    `session: ${provenance.sessionId}`,
    `accepted-at: ${provenance.acceptedAt}`,
    `source: ${provenance.source}`,
    `sha256: ${provenance.sha256}`,
    `recovery: ${provenance.recovery}`,
    ...evidenceLines,
    '---',
    body,
  ].join('\n')
}

export function parseDeliverableDocument(content: string): {
  provenance: DeliverableProvenance
  body: string
} | null {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null
  const close = content.indexOf('\n---\n', 4)
  if (close < 0) return null
  const rawHeader = content.slice(content.startsWith('---\r\n') ? 5 : 4, close)
  const body = content.slice(close + '\n---\n'.length)
  const fields = new Map<string, string>()
  const evidence: DeliverableEvidenceRef[] = []
  for (const line of rawHeader.split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(file|session-evidence|url):(.+)$/)
    if (item?.[1] && item[2]) {
      evidence.push({ kind: item[1] as DeliverableEvidenceRef['kind'], id: item[2].trim() })
      continue
    }
    const field = line.match(/^([a-z0-9-]+):\s*(.*)$/)
    if (field?.[1] !== undefined) fields.set(field[1], field[2] ?? '')
  }
  const format = Number(fields.get('fleet-deliverable'))
  const sessionId = fields.get('session')
  const acceptedAt = fields.get('accepted-at')
  const source = fields.get('source')
  const sha256 = fields.get('sha256')
  const recovery = fields.get('recovery')
  if (
    format !== DELIVERABLE_FORMAT
    || !sessionId
    || !acceptedAt
    || !source
    || !sha256
    || (recovery !== 'none' && recovery !== 'git')
  ) {
    return null
  }
  return {
    provenance: {
      format: DELIVERABLE_FORMAT,
      sessionId,
      acceptedAt,
      source,
      sha256,
      recovery,
      evidence,
    },
    body,
  }
}

export function acceptDeliverable(input: AcceptDeliverableInput): AcceptDeliverableResult {
  const sessionId = input.sessionId.trim()
  if (!sessionId) {
    return fail('invalid-session', 'A session id is required so the delivered copy can be traced.')
  }

  const workspaceRoot = resolve(input.workspaceRoot)
  const sourceAbs = resolve(workspaceRoot, input.sourcePath)
  if (!isLexicallyInside(workspaceRoot, sourceAbs)) {
    return fail('source-outside-workspace', 'The source file is outside this Project folder.')
  }
  if (!existsSync(sourceAbs)) {
    return fail('source-missing', 'The accepted file is missing.')
  }
  if (!isPathInsideWorkspace(sourceAbs, workspaceRoot, false)) {
    return fail('source-outside-workspace', 'The source file is outside this Project folder.')
  }

  const sourceRel = toWorkspaceRelative(sourceAbs, workspaceRoot)
  const destAbs = resolve(workspaceRoot, DELIVERABLES_DIR, basename(sourceAbs))
  if (!isPathInsideWorkspace(destAbs, workspaceRoot, true)) {
    return fail('dest-outside-workspace', 'The deliverables path would leave this Project folder.')
  }

  const body = readFileSync(sourceAbs, 'utf8')
  const sha256 = sha256Text(body)
  const recovery = detectWorkspaceRecovery(workspaceRoot)
  const provenance: DeliverableProvenance = {
    format: DELIVERABLE_FORMAT,
    sessionId,
    acceptedAt: input.acceptedAt ?? new Date().toISOString(),
    source: sourceRel,
    sha256,
    recovery,
    evidence: input.evidence ?? [],
  }

  if (existsSync(destAbs)) {
    const existing = parseDeliverableDocument(readFileSync(destAbs, 'utf8'))
    if (!existing || existing.provenance.sha256 !== sha256 || existing.body !== body) {
      return fail(
        'overwrite-conflict',
        'A different deliverable already exists at this name. Rename the source or remove the stale copy.',
      )
    }
    return { ok: true, destPath: destAbs, sha256, recovery, provenance: existing.provenance }
  }

  mkdirSync(dirname(destAbs), { recursive: true })
  atomicWriteFileSync(destAbs, formatDeliverableDocument(provenance, body))
  return { ok: true, destPath: destAbs, sha256, recovery, provenance }
}

function fail(
  reason: AcceptDeliverableFailure['reason'],
  message: string,
): AcceptDeliverableFailure {
  return { ok: false, reason, message }
}

function toWorkspaceRelative(target: string, workspaceRoot: string): string {
  return relative(workspaceRoot, target).split('\\').join('/')
}

function isPathInsideWorkspace(
  targetPath: string,
  workspaceRoot: string,
  forCreation: boolean,
): boolean {
  const root = resolve(workspaceRoot)
  const target = resolve(targetPath)
  if (!isLexicallyInside(root, target)) return false

  const realRoot = existsSync(root) ? resolveReal(root) : root
  if (existsSync(target)) {
    return isLexicallyInside(realRoot, resolveReal(target))
  }
  if (!forCreation) return false

  let current = dirname(target)
  while (true) {
    if (existsSync(current)) {
      return isLexicallyInside(realRoot, resolveReal(current))
    }
    const parent = dirname(current)
    if (parent === current) return false
    current = parent
  }
}

function isLexicallyInside(base: string, target: string): boolean {
  const rel = relative(base, target)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function resolveReal(path: string): string {
  return realpathSync.native(path)
}
