import { afterEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { InternalActionId } from '../internal-action'
import { attributeTurnUsage } from '../usage-attribution'
import { turnUsageFromChatGpt, turnUsageFromClaude } from '../provider-usage'
import {
  FileKernelSnapshotStore,
  HOST_KERNEL_SNAPSHOT_FILE,
  hostKernelSnapshotPath,
  sessionJsonlPath,
} from '../kernel-snapshot-store'
import { HostTurnKernel, KERNEL_SNAPSHOT_VERSION, type KernelSnapshot } from '../turn-admission'
import type { ActorRef } from '../actor'
import type { ActionInvocation } from '../internal-action'

const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-kernel-'))
  dirs.push(dir)
  return dir
}

function invocation(actionId: ActionInvocation['actionId'], invocationId: string): ActionInvocation {
  return {
    invocationId,
    actionId,
    payload: {},
    targets: [],
    callerKind: 'agent',
    sessionId: 'session-1',
    createdAt: '2026-10-09T00:00:00.000Z',
  }
}

describe('provider usage boundaries', () => {
  test('Claude and ChatGPT omit missing cache and price instead of recording zero', () => {
    const claude = attributeTurnUsage(turnUsageFromClaude({
      input_tokens: 12,
      output_tokens: 3,
    }, { modelId: 'claude-test', totalCostUsd: 0.4 }))
    expect(claude.cache.status).toBe('unknown')
    expect(claude.cachedInputTokens).toBeUndefined()
    expect(claude.cost.confidence).toBe('unknown')
    expect(claude.cost.amount).toBeUndefined()

    const chatgpt = attributeTurnUsage(turnUsageFromChatGpt({
      input: 9,
      output: 2,
      cost: { total: 0.15 },
    }))
    expect(chatgpt.cache.status).toBe('unknown')
    expect(chatgpt.cost.confidence).toBe('unknown')
    expect(chatgpt.cost.amount).toBeUndefined()
  })

  test('present cache and priced cost stay labeled, and auth fields are not copied', () => {
    const miss = attributeTurnUsage(turnUsageFromClaude({
      input_tokens: 4,
      output_tokens: 1,
      cache_read_input_tokens: 0,
    }))
    expect(miss.cache).toEqual({ status: 'confirmed_miss', source: 'provider_response' })

    const hit = attributeTurnUsage(turnUsageFromChatGpt({
      input: 20,
      output: 4,
      cacheRead: 6,
      cost: { total: 0.08 },
    }, { pricingRef: 'price_chatgpt', modelId: 'gpt-test' }))
    expect(hit.cache.status).toBe('confirmed_hit')
    expect(hit.cost).toMatchObject({ confidence: 'confirmed', amount: 0.08, pricingRef: 'price_chatgpt' })

    const leaked = turnUsageFromChatGpt({
      input: 1,
      output: 1,
      access_token: 'sk-testsecretvalue',
    } as { input: number; output: number; access_token: string })
    expect(JSON.stringify(leaked)).not.toContain('sk-testsecretvalue')
    expect(turnUsageFromClaude(undefined).source).toBe('none')
    expect(turnUsageFromChatGpt(undefined).source).toBe('none')
  })
})

describe('session-directory kernel snapshot', () => {
  test('round-trips KernelSnapshot v1 beside session.jsonl and does not re-execute', async () => {
    const root = workspace()
    const sessionId = 'session-1'
    const jsonl = sessionJsonlPath(root, sessionId)
    mkdirSync(dirname(jsonl), { recursive: true })
    writeFileSync(jsonl, '{"id":"session-1"}\n')
    const before = readFileSync(jsonl, 'utf8')

    const host = new HostTurnKernel()
    host.admit({ invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-disk'), actor: agent })
    let calls = 0
    await host.run('inv-disk', async () => {
      calls += 1
      return {
        output: { flagged: true },
        usage: turnUsageFromClaude({ input_tokens: 5, output_tokens: 1 }),
      }
    })

    const filePath = hostKernelSnapshotPath(root, sessionId)
    expect(filePath.endsWith(join('sessions', sessionId, HOST_KERNEL_SNAPSHOT_FILE))).toBe(true)
    const store = new FileKernelSnapshotStore(filePath)
    store.save(host.snapshot())
    expect(readFileSync(jsonl, 'utf8')).toBe(before)

    const restored = HostTurnKernel.restore(store.load())
    await restored.run('inv-disk', async () => {
      calls += 1
      return { output: { flagged: false } }
    })
    expect(calls).toBe(1)
    expect(restored.events('session-1').map((event) => event.kind)).toEqual(['action_invoked', 'action_completed'])
    const usage = restored.events('session-1').find((event) => event.kind === 'action_completed')?.payload.usage as {
      cache: { status: string }
      cost: { confidence: string; amount?: number }
    }
    expect(usage.cache.status).toBe('unknown')
    expect(usage.cost.confidence).toBe('unknown')
    expect(usage.cost.amount).toBeUndefined()
  })

  test('credential material in executor output cannot enter the snapshot file', async () => {
    const root = workspace()
    const secret = 'sk-testsecretvalue'
    const jwt = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiJ1c2VyIn0.signature'
    const host = new HostTurnKernel()
    host.admit({ invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-secret'), actor: agent })
    await host.run('inv-secret', async () => ({
      output: { note: 'kept', access_token: secret, idToken: jwt },
    }))

    const store = new FileKernelSnapshotStore(hostKernelSnapshotPath(root, 'session-1'))
    store.save(host.snapshot())
    const onDisk = readFileSync(hostKernelSnapshotPath(root, 'session-1'), 'utf8')
    expect(onDisk).not.toContain(secret)
    expect(onDisk).not.toContain(jwt)
    expect(onDisk).toContain('kept')

    const loaded = store.load()
    const output = loaded.turns[0]?.output as { note?: string; access_token?: string; idToken?: string }
    expect(output.note).toBe('kept')
    expect(output.access_token).toBeUndefined()
    expect(output.idToken).toBeUndefined()
  })

  test('a bad version does not replace a saved v1 snapshot, and corrupt files fail closed', () => {
    const root = workspace()
    const store = new FileKernelSnapshotStore(hostKernelSnapshotPath(root, 'session-1'))
    const host = new HostTurnKernel()
    host.admit({ invocation: invocation(InternalActionId.SESSION_FLAG, 'inv-version'), actor: agent })
    store.save(host.snapshot())
    const durable = readFileSync(hostKernelSnapshotPath(root, 'session-1'), 'utf8')

    const bad = host.snapshot()
    ;(bad as { version: number }).version = 999
    expect(() => store.save(bad as KernelSnapshot)).toThrow('unsupported_snapshot_version')
    expect(readFileSync(hostKernelSnapshotPath(root, 'session-1'), 'utf8')).toBe(durable)
    expect(store.load().version).toBe(KERNEL_SNAPSHOT_VERSION)

    writeFileSync(hostKernelSnapshotPath(root, 'session-1'), '{')
    expect(() => store.load()).toThrow('corrupt_kernel_snapshot')
    expect(() => hostKernelSnapshotPath(root, '../etc/passwd')).toThrow('Security Error')
  })
})
