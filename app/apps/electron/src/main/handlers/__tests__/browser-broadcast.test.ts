/**
 * Tests for browser handler broadcast + LIST + workbench access control.
 *
 * LIST filters on the host (window registry workspace + remote mirror id).
 * Id-scoped ops require a real desktop window and refuse cross-workspace instances.
 * STATE_CHANGED still broadcasts to all; renderers re-filter with
 * filterInstancesForWorkspace for out-of-order push races.
 */

import { describe, it, expect, beforeEach, mock } from 'bun:test'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import type { BrowserInstanceInfo } from '@craft-agent/shared/protocol'

const mockHostWindow = {}

mock.module('electron', () => ({
  BrowserWindow: {
    fromWebContents: () => mockHostWindow,
  },
  ipcMain: { handle: () => {}, on: () => {} },
  webContents: {
    fromId: (id: number) => id === 7 ? { id } : null,
  },
}))

// remoteWorkspaceId resolution is optional; default mock has no remote mirror.
mock.module('@craft-agent/shared/config', () => ({
  getWorkspaceByNameOrId: () => null,
}))

type HandlerFn = (...args: unknown[]) => unknown
type Push = { channel: string; target: unknown; args: unknown[] }

interface Recorder {
  server: RpcServer
  handlers: Map<string, HandlerFn>
  pushes: Push[]
}

function makeServer(): Recorder {
  const handlers = new Map<string, HandlerFn>()
  const pushes: Push[] = []
  const server: RpcServer = {
    handle(channel, handler) {
      handlers.set(channel, handler as HandlerFn)
    },
    push(channel, target, ...args) {
      pushes.push({ channel, target, args })
    },
    async invokeClient() {},
    hasClientCapability() { return false },
    findClientsWithCapability() { return [] },
  }
  return { server, handlers, pushes }
}

function makeInstance(id: string, overrides?: Partial<BrowserInstanceInfo>): BrowserInstanceInfo {
  return {
    id,
    url: 'https://example.com',
    title: 'Example',
    favicon: null,
    isLoading: false,
    canGoBack: false,
    canGoForward: false,
    boundSessionId: null,
    ownerType: 'manual',
    ownerSessionId: null,
    isVisible: true,
    agentControlActive: false,
    themeColor: null,
    workspaceId: null,
    ...overrides,
  }
}

function makeDeps(opts: {
  instances: BrowserInstanceInfo[]
  embedInstance?: (...args: unknown[]) => void
  detachInstance?: (...args: unknown[]) => void
  navigate?: (...args: unknown[]) => unknown
  captureStateCb?: (cb: (info: BrowserInstanceInfo) => void) => void
  captureRemovedCb?: (cb: (id: string) => void) => void
  captureInteractedCb?: (cb: (id: string) => void) => void
  /** webContentsId → workspace, as the main process actually registered it. */
  windowWorkspaces?: Record<number, string>
}): HandlerDeps {
  const windowWorkspaces = opts.windowWorkspaces ?? {}
  return {
    sessionManager: {} as HandlerDeps['sessionManager'],
    platform: {
      appRootPath: '',
      resourcesPath: '',
      isPackaged: false,
      appVersion: '0.0.0-test',
      isDebugMode: false,
      logger: console,
      imageProcessor: {
        getMetadata: async () => null,
        process: async () => Buffer.from(''),
      },
    },
    windowManager: {
      getWorkspaceForWindow: (webContentsId: number) =>
        windowWorkspaces[webContentsId] ?? null,
      getWindowByWebContentsId: (webContentsId: number) =>
        webContentsId in windowWorkspaces ? { id: webContentsId } : null,
      updateWindowWorkspace: () => false,
      registerWindow: () => {},
      getAllWindowsForWorkspace: () => [],
    } as unknown as HandlerDeps['windowManager'],
    browserPaneManager: {
      listInstances: () => opts.instances,
      embedInstance: (...args: unknown[]) => opts.embedInstance?.(...args),
      detachInstance: (...args: unknown[]) => opts.detachInstance?.(...args),
      navigate: (...args: unknown[]) => opts.navigate?.(...args),
      destroyInstance: () => {},
      reload: () => {},
      stop: () => {},
      focus: () => {},
      onStateChange: (cb: (info: BrowserInstanceInfo) => void) => opts.captureStateCb?.(cb),
      onRemoved: (cb: (id: string) => void) => opts.captureRemovedCb?.(cb),
      onInteracted: (cb: (id: string) => void) => opts.captureInteractedCb?.(cb),
    } as unknown as NonNullable<HandlerDeps['browserPaneManager']>,
    oauthFlowStore: {} as HandlerDeps['oauthFlowStore'],
  }
}

describe('browser handler — workspace filtering', () => {
  let recorder: Recorder

  beforeEach(() => {
    recorder = makeServer()
  })

  describe('STATE_CHANGED broadcast target', () => {
    it('always broadcasts to all renderers (workspace-aware-filtering happens in the renderer)', async () => {
      let captured: ((info: BrowserInstanceInfo) => void) | null = null
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({
          instances: [],
          captureStateCb: (cb) => { captured = cb },
        }),
      )

      expect(captured).not.toBeNull()
      captured!(makeInstance('b-ws', { workspaceId: 'ws-1' }))
      expect(recorder.pushes).toHaveLength(1)
      expect(recorder.pushes[0].target).toEqual({ to: 'all' })

      captured!(makeInstance('b-unbound', { workspaceId: null }))
      expect(recorder.pushes).toHaveLength(2)
      expect(recorder.pushes[1].target).toEqual({ to: 'all' })
    })
  })

  describe('REMOVED / INTERACTED stay broadcast-to-all', () => {
    it('REMOVED uses { to: "all" } even when the entry was workspace-scoped', async () => {
      let captured: ((id: string) => void) | null = null
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({
          instances: [],
          captureRemovedCb: (cb) => { captured = cb },
        }),
      )

      captured!('b-removed')

      expect(recorder.pushes).toHaveLength(1)
      expect(recorder.pushes[0].target).toEqual({ to: 'all' })
      expect(recorder.pushes[0].args).toEqual(['b-removed'])
    })

    it('INTERACTED uses { to: "all" }', async () => {
      let captured: ((id: string) => void) | null = null
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({
          instances: [],
          captureInteractedCb: (cb) => { captured = cb },
        }),
      )

      captured!('b-interacted')

      expect(recorder.pushes).toHaveLength(1)
      expect(recorder.pushes[0].target).toEqual({ to: 'all' })
    })
  })

  describe('LIST handler', () => {
    function callListHandler(
      workspaceId: string | null,
      webContentsId: number | null,
    ): BrowserInstanceInfo[] {
      const listChannel = Array.from(recorder.handlers.keys())
        .find((ch) => ch.endsWith(':list') && ch.includes('browser'))
      if (!listChannel) throw new Error('LIST handler not registered')
      const handler = recorder.handlers.get(listChannel)!
      return handler({ clientId: 'c1', workspaceId, webContentsId }) as BrowserInstanceInfo[]
    }

    it('filters to host workspace + unbound; never returns foreign workspace tabs', async () => {
      const instances = [
        makeInstance('local-tab', { workspaceId: 'ws-1' }),
        makeInstance('foreign-tab', { workspaceId: 'ws-2' }),
        makeInstance('unbound', { workspaceId: null }),
      ]
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({ instances, windowWorkspaces: { 7: 'ws-1' } }),
      )

      // Host window is ws-1 — foreign-tab must not leak even if client claims ws-2.
      expect(callListHandler('ws-2', 7).map((i) => i.id).sort()).toEqual([
        'local-tab',
        'unbound',
      ])
    })

    it('returns empty list without a trusted desktop identity', async () => {
      const instances = [
        makeInstance('local-tab', { workspaceId: 'ws-1' }),
        makeInstance('unbound', { workspaceId: null }),
      ]
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(recorder.server, makeDeps({ instances }))

      expect(callListHandler('ws-1', null)).toEqual([])
      expect(callListHandler(null, null)).toEqual([])
      // Forged webContentsId with no registered window
      expect(callListHandler('ws-1', 4242)).toEqual([])
    })
  })

  describe('workbench BrowserView access', () => {
    it('embeds only a browser instance owned by the host window workspace', async () => {
      const embedCalls: unknown[][] = []
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({
          instances: [makeInstance('owned', { workspaceId: 'ws-1' })],
          embedInstance: (...args) => embedCalls.push(args),
          windowWorkspaces: { 7: 'ws-1' },
        }),
      )

      const handler = recorder.handlers.get('browser-pane:embed')
      expect(handler).toBeDefined()
      handler!(
        { clientId: 'c1', workspaceId: 'ws-1', webContentsId: 7 },
        'owned',
        { x: 1, y: 2, width: 300, height: 400 },
      )

      expect(embedCalls).toEqual([[
        'owned',
        mockHostWindow,
        { x: 1, y: 2, width: 300, height: 400 },
      ]])
    })

    it('rejects embedding from non-desktop and cross-workspace callers', async () => {
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({
          instances: [makeInstance('owned', { workspaceId: 'ws-1' })],
          windowWorkspaces: { 7: 'ws-2' },
        }),
      )

      const handler = recorder.handlers.get('browser-pane:embed')
      expect(handler).toBeDefined()
      expect(() => handler!(
        { clientId: 'c1', workspaceId: 'ws-1', webContentsId: null },
        'owned',
        { x: 0, y: 0, width: 100, height: 100 },
      )).toThrow('Browser pane actions require a desktop window')
      expect(() => handler!(
        { clientId: 'c2', workspaceId: 'ws-2', webContentsId: 7 },
        'owned',
        { x: 0, y: 0, width: 100, height: 100 },
      )).toThrow('Browser instance is not available in the current workspace')
    })

    it('scopes embedding to the registered window workspace, not the declared one', async () => {
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({
          instances: [makeInstance('owned', { workspaceId: 'ws-1' })],
          windowWorkspaces: { 7: 'ws-2' },
        }),
      )

      const handler = recorder.handlers.get('browser-pane:embed')
      expect(() => handler!(
        { clientId: 'c3', workspaceId: 'ws-1', webContentsId: 7 },
        'owned',
        { x: 0, y: 0, width: 100, height: 100 },
      )).toThrow('Browser instance is not available in the current workspace')
    })

    it('guards navigate and other id-scoped ops the same way as embed', async () => {
      const navigateCalls: unknown[][] = []
      const { registerBrowserHandlers } = await import('../browser')
      registerBrowserHandlers(
        recorder.server,
        makeDeps({
          instances: [
            makeInstance('owned', { workspaceId: 'ws-1' }),
            makeInstance('foreign', { workspaceId: 'ws-2' }),
          ],
          navigate: (...args) => { navigateCalls.push(args); return { ok: true } },
          windowWorkspaces: { 7: 'ws-1' },
        }),
      )

      const navigate = recorder.handlers.get('browser-pane:navigate')
      expect(navigate).toBeDefined()
      await navigate!(
        { clientId: 'c1', workspaceId: 'ws-1', webContentsId: 7 },
        'owned',
        'https://example.com',
      )
      expect(navigateCalls).toHaveLength(1)

      await expect(navigate!(
        { clientId: 'c1', workspaceId: 'ws-1', webContentsId: 7 },
        'foreign',
        'https://evil.example',
      )).rejects.toThrow('Browser instance is not available in the current workspace')
    })
  })
})
