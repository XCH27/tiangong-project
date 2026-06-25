import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { mkdir, realpath, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import { FileMutationService } from './file-mutation-service'

const SESSION = 'session-files-1'

let root: string
let outside: string
let service: FileMutationService

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'fleet-file-mutation-root-'))
  outside = mkdtempSync(join(tmpdir(), 'fleet-file-mutation-outside-'))
  service = new FileMutationService()
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
  rmSync(outside, { recursive: true, force: true })
})

describe('FileMutationService', () => {
  it('moves a file inside the workspace and returns an inverse patch', async () => {
    const fromPath = join(root, 'a.txt')
    const toPath = join(root, 'b.txt')
    writeFileSync(fromPath, 'hello', 'utf8')
    const realRoot = await realpath(root)

    const result = await service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath,
      actor: USER_ACTOR,
      idempotencyKey: 'move-1',
    })

    expect(existsSync(fromPath)).toBe(false)
    expect(readFileSync(toPath, 'utf8')).toBe('hello')
    expect(result.patch.forward).toEqual(expect.objectContaining({ fromPath: join(realRoot, 'a.txt'), toPath: resolve(toPath) }))
    expect(result.patch.inverse).toEqual(expect.objectContaining({ fromPath: resolve(toPath), toPath: join(realRoot, 'a.txt') }))
    expect(result.patch.actionId).toBe('move-1')
  })

  it('rejects path traversal outside the workspace', async () => {
    const fromPath = join(root, 'a.txt')
    writeFileSync(fromPath, 'hello', 'utf8')

    await expect(service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath: join(root, '..', 'escape.txt'),
      actor: USER_ACTOR,
    })).rejects.toThrow(/outside workspace/i)
  })

  it('rejects symlink source that escapes the workspace', async () => {
    const outsideFile = join(outside, 'secret.txt')
    writeFileSync(outsideFile, 'secret', 'utf8')
    const symlinkPath = join(root, 'link.txt')
    symlinkSync(outsideFile, symlinkPath)

    await expect(service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath: symlinkPath,
      toPath: join(root, 'moved.txt'),
      actor: USER_ACTOR,
    })).rejects.toThrow(/symlink.*outside workspace|outside workspace/i)
  })

  it('rejects overwrite when destination exists', async () => {
    const fromPath = join(root, 'a.txt')
    const toPath = join(root, 'b.txt')
    writeFileSync(fromPath, 'hello', 'utf8')
    writeFileSync(toPath, 'existing', 'utf8')

    await expect(service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath,
      actor: USER_ACTOR,
    })).rejects.toThrow(/already exists/i)
  })

  it('rejects stale source revision', async () => {
    const fromPath = join(root, 'a.txt')
    const toPath = join(root, 'b.txt')
    writeFileSync(fromPath, 'hello', 'utf8')

    await expect(service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath,
      actor: USER_ACTOR,
      expectedSourceRevision: 'stale-revision',
    })).rejects.toThrow(/source revision/i)
  })

  it('uses idempotencyKey to return the first patch without moving twice', async () => {
    const fromPath = join(root, 'a.txt')
    const toPath = join(root, 'b.txt')
    writeFileSync(fromPath, 'hello', 'utf8')

    const first = await service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath,
      actor: USER_ACTOR,
      idempotencyKey: 'same-request',
    })
    const second = await service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath,
      actor: USER_ACTOR,
      idempotencyKey: 'same-request',
    })

    expect(second.patch.patchId).toBe(first.patch.patchId)
    expect(readFileSync(toPath, 'utf8')).toBe('hello')
  })

  it('undo refuses when moved target changed after move', async () => {
    const fromPath = join(root, 'a.txt')
    const toPath = join(root, 'b.txt')
    writeFileSync(fromPath, 'hello', 'utf8')

    const moved = await service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath,
      actor: USER_ACTOR,
      idempotencyKey: 'move-before-change',
    })
    await writeFile(toPath, 'changed', 'utf8')

    await expect(service.undoLastEdit({
      sessionId: SESSION,
      workspaceRoot: root,
      actor: USER_ACTOR,
      patchId: moved.patch.patchId,
    })).rejects.toThrow(/changed since move/i)
  })

  it('undo moves the entry back when target revision still matches', async () => {
    const fromPath = join(root, 'a.txt')
    const toPath = join(root, 'dir', 'b.txt')
    writeFileSync(fromPath, 'hello', 'utf8')
    await mkdir(join(root, 'dir'))

    const moved = await service.moveEntry({
      sessionId: SESSION,
      workspaceRoot: root,
      fromPath,
      toPath,
      actor: USER_ACTOR,
    })
    const undone = await service.undoLastEdit({
      sessionId: SESSION,
      workspaceRoot: root,
      actor: USER_ACTOR,
      patchId: moved.patch.patchId,
    })

    expect(undone.undonePatchId).toBe(moved.patch.patchId)
    expect(readFileSync(fromPath, 'utf8')).toBe('hello')
    expect(existsSync(toPath)).toBe(false)
  })

  it('computes stable revision from file metadata', async () => {
    const path = join(root, 'a.txt')
    writeFileSync(path, 'hello', 'utf8')
    const entryStat = await stat(path)

    const revision = await service.getRevision(path)

    expect(revision).toContain(String(entryStat.size))
    expect(revision).toContain('file')
  })
})
