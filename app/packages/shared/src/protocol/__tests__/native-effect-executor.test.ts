import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { InternalActionId } from '../internal-action'
import { applyAtomicJsonEffect, NativeEffectRegistry } from '../native-effect-executor'
import { HostTurnKernel, type KernelSnapshot } from '../turn-admission'
import type { ActorRef } from '../actor'
import type { ActionInvocation } from '../internal-action'

const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-effect-'))
  dirs.push(dir)
  return dir
}

function invocation(actionId: ActionInvocation['actionId'], invocationId: string, payload: Record<string, unknown> = {}): ActionInvocation {
  return {
    invocationId,
    actionId,
    payload,
    targets: [],
    callerKind: 'agent',
    sessionId: 'session-1',
    createdAt: '2026-10-09T00:00:00.000Z',
  }
}

function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}

describe('native effect executor', () => {
  test('the adapter does not import Pi or decide permission', () => {
    const source = readFileSync(new URL('../native-effect-executor.ts', import.meta.url), 'utf8')
    expect(source.includes('@earendil-works')).toBe(false)
    expect(source.includes('full Pi SDK')).toBe(false)
    expect(source.includes('permission authority')).toBe(true)
  })

  test('an admitted L0 flag and L1 file update commit through the atomic effect', async () => {
    const root = workspace()
    const flagPath = join(root, 'flag.json')
    const filePath = join(root, 'note.json')
    const registry = new NativeEffectRegistry()
    let calls = 0
    registry.register(InternalActionId.SESSION_FLAG, async ({ signal, commit }) => {
      calls += 1
      const applied = await applyAtomicJsonEffect({
        filePath: flagPath,
        next: { flagged: true },
        signal,
        commit,
      })
      return { output: applied.output }
    })
    registry.register(InternalActionId.FILE_UPDATE, async ({ signal, commit }) => {
      calls += 1
      const applied = await applyAtomicJsonEffect({
        filePath,
        next: { bytes: 4 },
        signal,
        commit,
      })
      return {
        output: applied.output,
        undoHandle: { undoId: 'undo-note', label: 'edit', snapshot: applied.previous },
      }
    })
    const host = new HostTurnKernel(undefined, { nativeEffects: registry })
    host.admit({ invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-flag'), actor: agent })
    host.admit({ invocation: invocation(InternalActionId.FILE_UPDATE, 'inv-file'), actor: agent })

    const flagged = await host.run('inv-flag')
    const edited = await host.run('inv-file')
    expect(flagged).toMatchObject({ status: 'completed', output: { flagged: true } })
    expect(edited).toMatchObject({ status: 'completed', output: { bytes: 4 } })
    expect(JSON.parse(readFileSync(flagPath, 'utf8'))).toEqual({ flagged: true })
    expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual({ bytes: 4 })
    expect(host.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-flag')?.nativeCommitted).toBe(true)
    expect(host.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-file')?.nativeCommitted).toBe(true)

    await host.run('inv-flag')
    await host.run('inv-file')
    expect(calls).toBe(2)
  })

  test('stop before commit does not write the native effect', async () => {
    const root = workspace()
    const filePath = join(root, 'flag.json')
    const registry = new NativeEffectRegistry()
    let calls = 0
    let release: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      release = resolve
    })
    registry.register(InternalActionId.SESSION_FLAG, async ({ signal }) => {
      calls += 1
      release?.()
      await new Promise((_resolve, reject) => {
        if (signal.aborted) {
          reject(abortError())
          return
        }
        signal.addEventListener('abort', () => reject(abortError()))
      })
      return { output: { flagged: true } }
    })
    const host = new HostTurnKernel(undefined, { nativeEffects: registry })
    host.admit({ invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-stop'), actor: agent })
    const running = host.run('inv-stop')
    await started
    expect(host.stop('inv-stop').reason).toBe('stop_requested')
    await expect(running).resolves.toMatchObject({ status: 'interrupted' })
    expect(existsSync(filePath)).toBe(false)
    expect(host.snapshot().turns[0]?.nativeCommitted).toBe(false)
    expect(calls).toBe(1)
  })

  test('a crash after the native write restores reconciling and does not run again', async () => {
    const root = workspace()
    const filePath = join(root, 'note.json')
    const registry = new NativeEffectRegistry()
    let calls = 0
    let snapshot: KernelSnapshot | undefined
    const host = new HostTurnKernel(undefined, { nativeEffects: registry })
    registry.register(InternalActionId.FILE_UPDATE, async ({ signal, commit }) => {
      calls += 1
      const applied = await applyAtomicJsonEffect({
        filePath,
        next: { bytes: 9 },
        signal,
        commit,
      })
      snapshot = host.snapshot()
      throw new Error('crash after native commit')
    })
    host.admit({ invocation: invocation(InternalActionId.FILE_UPDATE, 'inv-crash'), actor: agent })
    await expect(host.run('inv-crash')).resolves.toMatchObject({ status: 'reconciling' })
    expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual({ bytes: 9 })

    const restored = HostTurnKernel.restore(JSON.parse(JSON.stringify(snapshot)) as KernelSnapshot)
    await restored.run('inv-crash', async () => {
      calls += 1
      return { output: { bytes: 0 } }
    })
    expect(calls).toBe(1)
    expect(restored.snapshot().turns[0]?.phase).toBe('reconciling')
    expect(JSON.parse(readFileSync(filePath, 'utf8'))).toEqual({ bytes: 9 })
  })

  test('a missing effect fails closed and does not pretend the turn completed', async () => {
    const host = new HostTurnKernel(undefined, { nativeEffects: new NativeEffectRegistry() })
    host.admit({ invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-none'), actor: agent })
    await expect(host.run('inv-none')).resolves.toMatchObject({ status: 'failed', reason: 'no_executor' })
    expect(host.events('session-1').some((event) => event.kind === 'action_completed')).toBe(false)
  })
})
