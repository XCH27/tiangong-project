import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  acceptDeliverable,
  detectWorkspaceRecovery,
  parseDeliverableDocument,
  sha256Text,
} from '../deliverable-acceptance.ts'

const dirs: string[] = []

function fixtureWorkspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-r3-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('R3 deliverable acceptance convention', () => {
  test('copies the accepted bytes under deliverables/ and names session + evidence', () => {
    const root = fixtureWorkspace()
    const source = join(root, 'brief.md')
    const body = '# Brief\n\nResearch notes.\n'
    writeFileSync(source, body)

    const result = acceptDeliverable({
      workspaceRoot: root,
      sessionId: 'sess-1',
      sourcePath: 'brief.md',
      acceptedAt: '2026-08-12T00:00:00.000Z',
      evidence: [{ kind: 'session-evidence', id: 'ev-research' }],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.sha256).toBe(sha256Text(body))
    expect(result.recovery).toBe('none')
    const written = readFileSync(result.destPath, 'utf8')
    const parsed = parseDeliverableDocument(written)
    expect(parsed?.body).toBe(body)
    expect(parsed?.provenance).toEqual({
      format: 1,
      sessionId: 'sess-1',
      acceptedAt: '2026-08-12T00:00:00.000Z',
      source: 'brief.md',
      sha256: sha256Text(body),
      recovery: 'none',
      evidence: [{ kind: 'session-evidence', id: 'ev-research' }],
    })
  })

  test('is idempotent for the same accepted bytes', () => {
    const root = fixtureWorkspace()
    writeFileSync(join(root, 'brief.md'), 'same')
    const first = acceptDeliverable({ workspaceRoot: root, sessionId: 'sess-1', sourcePath: 'brief.md' })
    const second = acceptDeliverable({ workspaceRoot: root, sessionId: 'sess-1', sourcePath: 'brief.md' })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
  })

  test('refuses to overwrite a different delivered file', () => {
    const root = fixtureWorkspace()
    writeFileSync(join(root, 'brief.md'), 'first')
    expect(acceptDeliverable({ workspaceRoot: root, sessionId: 'sess-1', sourcePath: 'brief.md' }).ok).toBe(true)
    writeFileSync(join(root, 'brief.md'), 'second')
    const conflict = acceptDeliverable({ workspaceRoot: root, sessionId: 'sess-1', sourcePath: 'brief.md' })
    expect(conflict).toMatchObject({ ok: false, reason: 'overwrite-conflict' })
    const parsed = parseDeliverableDocument(readFileSync(join(root, 'deliverables', 'brief.md'), 'utf8'))
    expect(parsed?.body).toBe('first')
  })

  test('does not write when the source path escapes the Project folder', () => {
    const root = fixtureWorkspace()
    const escaped = acceptDeliverable({
      workspaceRoot: root,
      sessionId: 'sess-1',
      sourcePath: '../secret.md',
    })
    expect(escaped).toMatchObject({ ok: false, reason: 'source-outside-workspace' })
    expect(existsSync(join(root, 'deliverables'))).toBe(false)
  })

  test('does not follow a source symlink out of the Project folder', () => {
    const root = fixtureWorkspace()
    const outside = fixtureWorkspace()
    writeFileSync(join(outside, 'secret.md'), 'secret')
    symlinkSync(join(outside, 'secret.md'), join(root, 'brief.md'))
    const escaped = acceptDeliverable({
      workspaceRoot: root,
      sessionId: 'sess-1',
      sourcePath: 'brief.md',
    })
    expect(escaped).toMatchObject({ ok: false, reason: 'source-outside-workspace' })
    expect(existsSync(join(root, 'deliverables'))).toBe(false)
  })

  test('does not write when the source is missing', () => {
    const root = fixtureWorkspace()
    const missing = acceptDeliverable({
      workspaceRoot: root,
      sessionId: 'sess-1',
      sourcePath: 'brief.md',
    })
    expect(missing).toMatchObject({ ok: false, reason: 'source-missing' })
    expect(existsSync(join(root, 'deliverables'))).toBe(false)
  })

  test('reports git recovery only when the Project is a repository', () => {
    const root = fixtureWorkspace()
    expect(detectWorkspaceRecovery(root)).toBe('none')
    mkdirSync(join(root, '.git'))
    expect(detectWorkspaceRecovery(root)).toBe('git')
  })

  test('does not follow a deliverables symlink out of the Project folder', () => {
    const root = fixtureWorkspace()
    const outside = fixtureWorkspace()
    writeFileSync(join(root, 'brief.md'), 'body')
    symlinkSync(outside, join(root, 'deliverables'))
    const escaped = acceptDeliverable({
      workspaceRoot: root,
      sessionId: 'sess-1',
      sourcePath: 'brief.md',
    })
    expect(escaped).toMatchObject({ ok: false, reason: 'dest-outside-workspace' })
    expect(existsSync(join(outside, 'brief.md'))).toBe(false)
  })

  test('refuses an empty session id so the copy cannot be unattributed', () => {
    const root = fixtureWorkspace()
    writeFileSync(join(root, 'brief.md'), 'body')
    expect(acceptDeliverable({
      workspaceRoot: root,
      sessionId: '  ',
      sourcePath: 'brief.md',
    })).toMatchObject({ ok: false, reason: 'invalid-session' })
  })
})
