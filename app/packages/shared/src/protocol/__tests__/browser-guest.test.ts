import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import {
  BUILTIN_BROWSER_PARTITION,
  captureDomFromAgent,
  captureDomFromHuman,
  createBrowserGuestHost,
  listBrowserGuestSurfaces,
  runGuestActionFromAgent,
  runGuestActionFromHuman,
  type ChromiumGuestPort,
  type GuestDomSnapshot,
  type PageFindResult,
} from '../browser-guest'
import { InternalActionId } from '../internal-action'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('built-in chromium guest', () => {
  test('page find, loading stop, and native actions stay on the built-in profile', async () => {
    expect(listBrowserGuestSurfaces()).toEqual([
      { id: 'page_find', status: 'wired' },
      { id: 'loading_stop', status: 'wired' },
      { id: 'native_guest', status: 'wired' },
      { id: 'dom_snapshot', status: 'test-only' },
      { id: 'screenshot_evidence', status: 'Locked' },
      { id: 'chrome_store', status: 'Locked' },
    ])
    const guest = fakeGuest()
    guest.isLoading = true

    const found = await runGuestActionFromHuman(guest, { kind: 'find', query: 'Alpha' }, humanCaller('sess-1'))
    expect(found).toMatchObject({ status: 'completed', action: 'find', find: { matches: 2, activeMatchOrdinal: 1 } })
    expect(guest.calls).toEqual(['find:Alpha'])

    const stopped = await runGuestActionFromAgent(guest, { kind: 'stopLoading' }, agentCaller('sess-1'))
    expect(stopped).toMatchObject({ status: 'completed', action: 'stopLoading', isLoading: false })
    expect(guest.isLoading).toBe(false)

    await runGuestActionFromHuman(guest, { kind: 'navigate', url: 'https://example.com/docs' }, humanCaller('sess-1'))
    await runGuestActionFromAgent(guest, { kind: 'goBack' }, agentCaller('sess-1'))
    await runGuestActionFromAgent(guest, { kind: 'goForward' }, agentCaller('sess-1'))
    await runGuestActionFromHuman(guest, { kind: 'reload' }, humanCaller('sess-1'))
    await runGuestActionFromHuman(guest, { kind: 'stopFind', action: 'clearSelection' }, humanCaller('sess-1'))
    expect(guest.calls).toEqual([
      'find:Alpha',
      'stopLoading',
      'navigate:https://example.com/docs',
      'goBack',
      'goForward',
      'reload',
      'stopFind:clearSelection',
    ])
  })

  test('an agent cannot find or stop a guest it does not own, and a second profile is rejected', async () => {
    const guest = fakeGuest()
    const foreign = await runGuestActionFromAgent(guest, { kind: 'find', query: 'Alpha' }, agentCaller('other'))
    expect(foreign).toMatchObject({ status: 'failed', reason: 'owner_mismatch' })

    const manual = fakeGuest({ ownerType: 'manual', ownerSessionId: null })
    const manualFind = await runGuestActionFromAgent(manual, { kind: 'stopLoading' }, agentCaller('sess-1'))
    expect(manualFind).toMatchObject({ status: 'failed', reason: 'owner_mismatch' })

    const otherProfile = fakeGuest({ partition: 'persist:other' })
    const rejected = await runGuestActionFromHuman(otherProfile, { kind: 'reload' }, humanCaller('sess-1'))
    expect(rejected).toMatchObject({ status: 'failed', reason: 'profile_rejected' })
    expect(guest.calls).toEqual([])
    expect(manual.calls).toEqual([])
    expect(otherProfile.calls).toEqual([])
  })

  test('chrome store advertising and screenshot evidence stay Locked', async () => {
    const guest = fakeGuest()
    const store = await runGuestActionFromHuman(guest, { kind: 'chromeStore' }, humanCaller('sess-1'))
    const shot = await runGuestActionFromAgent(guest, { kind: 'screenshotEvidence' }, agentCaller('sess-1'))
    expect(store).toEqual({ status: 'Locked', surface: 'chrome_store', reason: 'extension_lifecycle_unproven' })
    expect(shot).toEqual({ status: 'Locked', surface: 'screenshot_evidence', reason: 'governed_screenshot_unfinished' })
    expect(guest.calls).toEqual([])
    expect(guest.reads).toBe(0)
  })

  test('human and agent DOM captures are refused and do not write', async () => {
    const root = workspace()
    const humanPath = join(root, 'human-snapshot.json')
    const agentPath = join(root, 'agent-snapshot.json')
    const guest = fakeGuest()
    const shared = createBrowserGuestHost()

    const humanCapture = await captureDomFromHuman(shared, {
      guest,
      filePath: humanPath,
      sessionId: 'sess-1',
      invocationId: 'cap-human',
      actor: human,
    })
    expect(humanCapture).toMatchObject({
      status: 'denied',
      reason: 'action_owner_mismatch:dom_evidence',
    })

    const agentCapture = await captureDomFromAgent(shared, {
      guest,
      filePath: agentPath,
      sessionId: 'sess-1',
      invocationId: 'cap-agent',
      actor: agent,
    })
    expect(agentCapture).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:dom_evidence' })
    expect(existsSync(humanPath)).toBe(false)
    expect(existsSync(agentPath)).toBe(false)
    expect(guest.reads).toBe(0)

    const turns = shared.kernel.snapshot().turns
    expect(turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.FILE_CREATE,
      InternalActionId.FILE_CREATE,
    ])
    expect(turns.every((turn) => turn.phase === 'denied')).toBe(true)
    expect(turns.every((turn) => turn.request.invocation.payload.captureKind === 'dom_snapshot')).toBe(true)
  })

  test('a mismatched agent capture does not read the page', async () => {
    const guest = fakeGuest()
    const filePath = join(workspace(), 'leak.json')
    const shared = createBrowserGuestHost()
    const result = await captureDomFromAgent(shared, {
      guest,
      filePath,
      sessionId: 'other',
      invocationId: 'cap-foreign',
      actor: agent,
    })
    expect(result).toMatchObject({ status: 'failed', reason: 'owner_mismatch' })
    expect(guest.reads).toBe(0)
    expect(shared.kernel.snapshot().turns).toEqual([])
    expect(existsSync(filePath)).toBe(false)
  })

  test('stop before run does not read or write the snapshot', async () => {
    const guest = fakeGuest()
    const filePath = join(workspace(), 'stopped.json')
    const shared = createBrowserGuestHost({
      beforeRun(invocationId, kernel) {
        kernel.stop(invocationId)
      },
    })
    const result = await captureDomFromHuman(shared, {
      guest,
      filePath,
      sessionId: 'sess-1',
      invocationId: 'cap-stop',
      actor: human,
    })
    expect(result).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:dom_evidence' })
    expect(guest.reads).toBe(0)
    expect(existsSync(filePath)).toBe(false)
  })

  test('credential text in the DOM is not written', async () => {
    const guest = fakeGuest({ snapshot: { url: 'https://example.com', title: 'Example', text: 'bearer live-token' } })
    const filePath = join(workspace(), 'secret.json')
    const shared = createBrowserGuestHost()
    const result = await captureDomFromAgent(shared, {
      guest,
      filePath,
      sessionId: 'sess-1',
      invocationId: 'cap-secret',
      actor: agent,
    })
    expect(result).toMatchObject({ status: 'denied', reason: 'action_owner_mismatch:dom_evidence' })
    expect(guest.reads).toBe(0)
    expect(existsSync(filePath)).toBe(false)
    expect(JSON.stringify(shared.kernel.snapshot())).not.toContain('live-token')
  })

  test('an unsafe capture path fails closed', async () => {
    const guest = fakeGuest()
    const shared = createBrowserGuestHost()
    const result = await captureDomFromHuman(shared, {
      guest,
      filePath: 'sessions/../secret.json',
      sessionId: 'sess-1',
      invocationId: 'cap-unsafe',
      actor: human,
    })
    expect(result).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })
    expect(guest.reads).toBe(0)
  })
})

function humanCaller(sessionId: string) {
  return { kind: 'human_ui' as const, sessionId }
}

function agentCaller(sessionId: string) {
  return { kind: 'agent' as const, sessionId }
}

function workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-guest-'))
  dirs.push(dir)
  return dir
}

function fakeGuest(overrides: {
  partition?: string
  ownerType?: 'session' | 'manual'
  ownerSessionId?: string | null
  snapshot?: GuestDomSnapshot
} = {}): ChromiumGuestPort & { calls: string[]; reads: number } {
  const snapshot = overrides.snapshot ?? { url: 'https://example.com', title: 'Example', text: 'Hello' }
  const guest = {
    id: 'guest-1',
    partition: overrides.partition ?? BUILTIN_BROWSER_PARTITION,
    ownerType: overrides.ownerType ?? 'session',
    ownerSessionId: overrides.ownerSessionId === undefined ? 'sess-1' : overrides.ownerSessionId,
    isLoading: false,
    calls: [] as string[],
    reads: 0,
    async findInPage(text: string): Promise<PageFindResult> {
      guest.calls.push(`find:${text}`)
      return { requestId: 1, activeMatchOrdinal: 1, matches: 2, finalUpdate: true }
    },
    stopFindInPage(action: 'clearSelection' | 'keepSelection' | 'activateSelection') {
      guest.calls.push(`stopFind:${action}`)
    },
    stopLoading() {
      guest.calls.push('stopLoading')
      guest.isLoading = false
    },
    async navigate(url: string) {
      guest.calls.push(`navigate:${url}`)
    },
    goBack() {
      guest.calls.push('goBack')
    },
    goForward() {
      guest.calls.push('goForward')
    },
    reload() {
      guest.calls.push('reload')
    },
    async readDom(signal: AbortSignal): Promise<GuestDomSnapshot> {
      if (signal.aborted) throw abortError()
      guest.reads += 1
      guest.calls.push('readDom')
      return snapshot
    },
  }
  return guest
}

function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}
