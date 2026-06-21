import { describe, expect, it } from 'bun:test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer, HandlerFn } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { registerContextAdapterHandlers } from './context-adapter'
import { registerProjectPackDeltaHandlers } from './project-pack-delta'
import { registerExternalReviewJobHandlers } from './external-review-job'

function createHarness(register: (server: RpcServer, deps: HandlerDeps) => void) {
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
      logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
      imageProcessor: {
        getMetadata: async () => null,
        process: async () => Buffer.from(''),
      },
    },
  }

  register(server, deps)
  return handlers
}

const ctx = { clientId: 'c1', workspaceId: 'w1', webContentsId: 1 }

describe('context efficiency RPC handlers', () => {
  it('registers context adapter channels', () => {
    const handlers = createHarness(registerContextAdapterHandlers)
    expect(handlers.has(RPC_CHANNELS.contextAdapter.QUERY_CODEGRAPH)).toBe(true)
    expect(handlers.has(RPC_CHANNELS.contextAdapter.COMPRESS_RTK)).toBe(true)
  })

  it('compresses rtk input and marks token stats as estimate', async () => {
    const handlers = createHarness(registerContextAdapterHandlers)
    const result = await handlers.get(RPC_CHANNELS.contextAdapter.COMPRESS_RTK)!(ctx, {
      input: `${'line\n'.repeat(20)}unique\n`,
    })
    expect(result.stats.tokenEstimateKind).toBe('estimate')
    expect(result.stats.beforeChars).toBeGreaterThan(result.stats.afterChars)
  })

  it('registers project pack delta plan channel', async () => {
    const handlers = createHarness(registerProjectPackDeltaHandlers)
    expect(handlers.has(RPC_CHANNELS.projectPackDelta.PLAN)).toBe(true)

    const root = await mkdtemp(join(tmpdir(), 'rpc-delta-'))
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'src', 'index.ts'), 'export const x = 1\n')

    const plan = await handlers.get(RPC_CHANNELS.projectPackDelta.PLAN)!(ctx, {
      workspacePath: root,
      mode: 'untracked',
    })
    expect(plan.mode).toBe('untracked')
    expect(plan.tokenEstimateKind).toBe('estimate')
    await rm(root, { recursive: true, force: true })
  })

  it('registers external review job lifecycle channels', () => {
    const handlers = createHarness(registerExternalReviewJobHandlers)
    expect(handlers.has(RPC_CHANNELS.externalReviewJob.CREATE)).toBe(true)
    expect(handlers.has(RPC_CHANNELS.externalReviewJob.GET)).toBe(true)
    expect(handlers.has(RPC_CHANNELS.externalReviewJob.ADVANCE)).toBe(true)
    expect(handlers.has(RPC_CHANNELS.externalReviewJob.COMPLETE_WITH_REPORT)).toBe(true)
    expect(handlers.has(RPC_CHANNELS.externalReviewJob.LIST_BY_BUNDLE)).toBe(true)
  })
})
