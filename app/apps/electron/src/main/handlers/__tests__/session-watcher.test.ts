/**
 * Session file watcher isolation tests.
 *
 * Verifies per-client watcher lifecycle: creation, cleanup, disconnect,
 * and that concurrent clients don't interfere with each other.
 *
 * Uses real temp directories + real fs.watch to avoid mocking fs
 * (which breaks transitive imports that need real fs exports).
 *
 * Timing: real fs.watch is asynchronous in two ways that a fixed sleep cannot
 * cover, so this file never sleeps a fixed amount and then asserts. See
 * `touchUntil` and `waitUntilQuiet` below.
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import type { RpcServer, RequestContext } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { RPC_CHANNELS } from '../../../shared/types'

// ---------------------------------------------------------------------------
// Electron mock (needed by transitive imports)
// ---------------------------------------------------------------------------

mock.module('electron', () => ({
  app: { isPackaged: false, getAppPath: () => '/', quit: () => {}, dock: { setIcon: () => {}, setBadge: () => {} } },
  nativeTheme: { shouldUseDarkColors: false },
  nativeImage: { createFromPath: () => ({ isEmpty: () => true }), createFromDataURL: () => ({}) },
  dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }), showMessageBox: async () => ({ response: 0 }) },
  shell: { openExternal: async () => {}, openPath: async () => '', showItemInFolder: () => {} },
  BrowserWindow: { fromWebContents: () => null, getFocusedWindow: () => null, getAllWindows: () => [] },
  Menu: { buildFromTemplate: () => ({ popup: () => {} }) },
  session: {},
}))

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface PushCall {
  channel: string
  target: any
  args: any[]
}

let tempDirs: string[] = []

function makeTempSessionDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'watcher-test-'))
  tempDirs.push(dir)
  return dir
}

// The handler debounces notifications by 100ms, so retried writes must be
// spaced wider than that — a tighter retry loop would keep resetting the
// debounce timer and starve the very notification it is waiting for.
const HANDLER_DEBOUNCE_MS = 100
const TOUCH_INTERVAL_MS = HANDLER_DEBOUNCE_MS + 150
const POLL_INTERVAL_MS = 20
// Generous: only reached when the watcher is genuinely broken, in which case
// the assertion that follows reports the real failure.
const OBSERVE_TIMEOUT_MS = 10_000
// How long the recorder must stay silent before we trust a "nothing arrived"
// assertion. Observed delivery latency under a saturated machine is <60ms.
const QUIET_MS = 400

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

let touchSeq = 0

/** Write a file with fresh content, so every call is a real change event. */
function touchFile(dir: string, name: string): void {
  writeFileSync(join(dir, name), `touch-${++touchSeq}`)
}

/**
 * Write into a watched directory until `satisfied()` becomes true.
 *
 * fs.watch arms asynchronously — on macOS the FSEvents stream is started on
 * another thread after watch() returns — so a write that lands before it is
 * armed is dropped and never reported, no matter how long we then wait. Under
 * full-suite load that window is wide enough to hit regularly (~10% of writes
 * in a loaded probe), which is what made a write-once-then-sleep(300) test
 * flaky. Retrying the write is the only thing that closes that race; polling
 * for the notification (rather than sleeping a fixed amount) then keeps the
 * wait independent of how loaded the machine is.
 */
async function touchUntil(touch: () => void, satisfied: () => boolean): Promise<void> {
  const deadline = Date.now() + OBSERVE_TIMEOUT_MS
  while (!satisfied() && Date.now() < deadline) {
    touch()
    const nextTouch = Date.now() + TOUCH_INTERVAL_MS
    while (Date.now() < nextTouch && !satisfied()) {
      await sleep(POLL_INTERVAL_MS)
    }
  }
}

/**
 * Resolve once no further push has been recorded for QUIET_MS.
 *
 * Used before asserting that a client received *nothing*: it settles any
 * in-flight or coalesced event so a straggler cannot land just after we look,
 * and it gives a notification that should never come a fair window to appear.
 */
async function waitUntilQuiet(pushCalls: PushCall[]): Promise<void> {
  const deadline = Date.now() + OBSERVE_TIMEOUT_MS
  let seen = pushCalls.length
  let quietSince = Date.now()
  while (Date.now() - quietSince < QUIET_MS && Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS)
    if (pushCalls.length !== seen) {
      seen = pushCalls.length
      quietSince = Date.now()
    }
  }
}

function createTestHarness(sessionPaths: Map<string, string>) {
  const handlers = new Map<string, Function>()
  const pushCalls: PushCall[] = []

  const server: RpcServer = {
    handle(channel: string, handler: Function) {
      handlers.set(channel, handler as any)
    },
    push(channel: string, target: any, ...args: any[]) {
      pushCalls.push({ channel, target, args })
    },
    async invokeClient() {},
    hasClientCapability() { return false },
    findClientsWithCapability() { return [] },
  }

  const deps: HandlerDeps = {
    sessionManager: {
      getSessionPath: (sessionId: string) => sessionPaths.get(sessionId) ?? null,
      waitForInit: async () => {},
      getSessions: () => [...sessionPaths.keys()].map(id => ({ id, workspaceId: 'ws-1' })),
    } as unknown as HandlerDeps['sessionManager'],
    platform: {
      appRootPath: '',
      resourcesPath: '',
      isPackaged: false,
      appVersion: '0.0.0-test',
      isDebugMode: true,
      logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
      imageProcessor: { getMetadata: async () => null, process: async () => Buffer.from('') },
    } as unknown as HandlerDeps['platform'],
    oauthFlowStore: {
      store: () => {}, getByState: () => null, remove: () => {}, cleanup: () => {}, dispose: () => {}, size: 0,
    } as unknown as HandlerDeps['oauthFlowStore'],
  }

  return { server, deps, handlers, pushCalls }
}

function makeCtx(clientId: string, workspaceId = 'ws-1'): RequestContext {
  return { clientId, workspaceId, webContentsId: null }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('session file watcher isolation', () => {
  afterEach(() => {
    for (const dir of tempDirs) {
      try { rmSync(dir, { recursive: true, force: true }) } catch {}
    }
    tempDirs = []
  })

  it('creates independent watchers per client and cleans up on disconnect', async () => {
    const dir1 = makeTempSessionDir()
    const dir2 = makeTempSessionDir()
    const sessionPaths = new Map([['s1', dir1], ['s2', dir2]])
    const { server, deps, handlers, pushCalls } = createTestHarness(sessionPaths)

    const { registerSessionsHandlers, cleanupSessionFileWatchForClient } = await import('@craft-agent/server-core/handlers/rpc')
    registerSessionsHandlers(server, deps)

    const watchHandler = handlers.get(RPC_CHANNELS.sessions.WATCH_FILES)!
    const unwatchHandler = handlers.get(RPC_CHANNELS.sessions.UNWATCH_FILES)!

    const pushesTo = (clientId: string) => pushCalls.filter(p => p.target?.clientId === clientId)

    // Client A watches session s1, Client B watches session s2
    await watchHandler(makeCtx('client-a'), 's1')
    await watchHandler(makeCtx('client-b'), 's2')

    // Prove both watchers are actually delivering before asserting isolation:
    // "client B heard nothing" means nothing if B's watcher was never armed.
    await touchUntil(() => {
      touchFile(dir1, 'armed.txt')
      touchFile(dir2, 'armed.txt')
    }, () => pushesTo('client-a').length > 0 && pushesTo('client-b').length > 0)
    expect(pushesTo('client-a').length).toBeGreaterThanOrEqual(1)
    expect(pushesTo('client-b').length).toBeGreaterThanOrEqual(1)

    await waitUntilQuiet(pushCalls)
    pushCalls.length = 0

    // Trigger a change in s1 only
    await touchUntil(() => touchFile(dir1, 'output.txt'), () => pushesTo('client-a').length > 0)
    await waitUntilQuiet(pushCalls)

    // Only client-a should have received the notification
    const clientAPushes = pushesTo('client-a')
    const clientBPushes = pushesTo('client-b')
    expect(clientAPushes.length).toBeGreaterThanOrEqual(1)
    expect(clientBPushes.length).toBe(0)

    // Verify push target is client-specific, not broadcast
    expect(clientAPushes[0].channel).toBe(RPC_CHANNELS.sessions.FILES_CHANGED)
    expect(clientAPushes[0].target).toEqual({ to: 'client', clientId: 'client-a' })

    // Unwatch client A — should not affect client B
    await unwatchHandler(makeCtx('client-a'))

    // Clear push history
    pushCalls.length = 0

    // Trigger a change in s2
    await touchUntil(() => touchFile(dir2, 'data.json'), () => pushesTo('client-b').length > 0)

    // Client B should still receive notifications
    const clientBAfter = pushesTo('client-b')
    expect(clientBAfter.length).toBeGreaterThanOrEqual(1)

    // Disconnect cleanup for client B
    cleanupSessionFileWatchForClient('client-b')

    // Double cleanup is a no-op (doesn't throw)
    cleanupSessionFileWatchForClient('client-b')
  })

  it('cleans up previous watcher when same client watches a different session', async () => {
    const dir1 = makeTempSessionDir()
    const dir2 = makeTempSessionDir()
    const sessionPaths = new Map([['s1', dir1], ['s2', dir2]])
    const { server, deps, handlers, pushCalls } = createTestHarness(sessionPaths)

    const { registerSessionsHandlers, cleanupSessionFileWatchForClient } = await import('@craft-agent/server-core/handlers/rpc')
    registerSessionsHandlers(server, deps)

    const watchHandler = handlers.get(RPC_CHANNELS.sessions.WATCH_FILES)!

    const pushesFor = (sessionId: string) => pushCalls.filter(p =>
      p.args[0] === sessionId && p.channel === RPC_CHANNELS.sessions.FILES_CHANGED
    )

    // Client A watches s1
    await watchHandler(makeCtx('client-a'), 's1')

    // Client A switches to s2 — old watcher should be cleaned up
    await watchHandler(makeCtx('client-a'), 's2')

    // Write to s1 — should NOT trigger notification (old watcher closed).
    // Written first so it has the whole s2 exchange below, on a watcher we
    // know is live, as its window to wrongly show up.
    writeFileSync(join(dir1, 'old.txt'), 'stale')

    // Write to s2 — should trigger notification
    await touchUntil(() => touchFile(dir2, 'new.txt'), () => pushesFor('s2').length > 0)
    await waitUntilQuiet(pushCalls)

    expect(pushesFor('s1').length).toBe(0)
    expect(pushesFor('s2').length).toBeGreaterThanOrEqual(1)

    cleanupSessionFileWatchForClient('client-a')
  })

  it('ignores internal session.jsonl and hidden files', async () => {
    const dir = makeTempSessionDir()
    const sessionPaths = new Map([['s1', dir]])
    const { server, deps, handlers, pushCalls } = createTestHarness(sessionPaths)

    const { registerSessionsHandlers, cleanupSessionFileWatchForClient } = await import('@craft-agent/server-core/handlers/rpc')
    registerSessionsHandlers(server, deps)

    const watchHandler = handlers.get(RPC_CHANNELS.sessions.WATCH_FILES)!
    await watchHandler(makeCtx('client-a'), 's1')

    // Prove the watcher is delivering first — otherwise "internal files were
    // ignored" would also pass on a watcher that reports nothing at all.
    await touchUntil(() => touchFile(dir, 'armed.txt'), () => pushCalls.length > 0)
    expect(pushCalls.length).toBeGreaterThanOrEqual(1)

    await waitUntilQuiet(pushCalls)
    pushCalls.length = 0

    // Write internal files — should be ignored
    writeFileSync(join(dir, 'session.jsonl'), 'log entry')
    writeFileSync(join(dir, '.hidden'), 'secret')
    await waitUntilQuiet(pushCalls)

    expect(pushCalls.length).toBe(0)

    // Write a normal file — should trigger notification
    await touchUntil(() => touchFile(dir, 'result.txt'), () => pushCalls.length > 0)

    expect(pushCalls.length).toBeGreaterThanOrEqual(1)

    cleanupSessionFileWatchForClient('client-a')
  })
})
