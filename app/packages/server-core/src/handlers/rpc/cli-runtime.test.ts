import { describe, expect, it } from 'bun:test'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer, HandlerFn } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { registerCliRuntimeHandlers } from './cli-runtime'

function createHarness() {
  const handlers = new Map<string, HandlerFn>()
  const server: RpcServer = {
    handle(channel, handler) {
      handlers.set(channel, handler)
    },
    push() {},
    async invokeClient() {},
    hasClientCapability() { return false },
    findClientsWithCapability() { return [] },
  }

  const deps: HandlerDeps = {
    sessionManager: {} as HandlerDeps['sessionManager'],
    oauthFlowStore: {} as HandlerDeps['oauthFlowStore'],
    platform: {
      appRootPath: '/',
      resourcesPath: '/',
      isPackaged: false,
      appVersion: '0.0.0-test',
      isDebugMode: true,
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
        debug: () => {},
      },
      imageProcessor: {
        getMetadata: async () => null,
        process: async () => Buffer.from(''),
      },
    },
  }

  registerCliRuntimeHandlers(server, deps, { resolveCommand: () => null })
  return handlers
}

describe('registerCliRuntimeHandlers', () => {
  it('registers catalog and test handlers', async () => {
    const handlers = createHarness()
    expect(handlers.has(RPC_CHANNELS.cliRuntime.GET_CATALOG)).toBe(true)
    expect(handlers.has(RPC_CHANNELS.cliRuntime.TEST)).toBe(true)
  })

  it('returns the detected catalog through RPC', async () => {
    const handlers = createHarness()
    const catalog = await handlers.get(RPC_CHANNELS.cliRuntime.GET_CATALOG)!({
      clientId: 'c1',
      workspaceId: 'w1',
      webContentsId: 1,
    })

    expect(Array.isArray(catalog)).toBe(true)
    expect(catalog.some((item: { id: string; supported: boolean }) => item.id === 'grok' && item.supported)).toBe(true)
    expect(catalog.some((item: { id: string; supported: boolean }) => item.id === 'claude' && !item.supported)).toBe(true)
  })
})
