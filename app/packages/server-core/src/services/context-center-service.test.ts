import { describe, expect, it } from 'bun:test'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type {
  ProjectEnvironmentProfile,
  ProjectPackPlanPreviewSummary,
  ProjectPackSummary,
  ToolCapability,
} from '@craft-agent/shared/protocol'
import type { HandlerFn, RequestContext, RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handlers/handler-deps'
import { registerContextCenterHandlers } from '../handlers/rpc/context-center'
import { buildContextCenterOverview } from './context-center-service'

function tool(toolId: string): ToolCapability {
  return {
    toolId,
    category: 'context',
    displayName: toolId,
    status: 'available',
    source: 'system-path',
    scope: 'global',
    capabilities: ['repo-pack'],
    risk: 'read-only',
    diagnostics: [],
  }
}

function createContextCenterRpcHarness() {
  const handlers = new Map<string, HandlerFn>()

  const server: RpcServer = {
    handle(channel, handler) {
      handlers.set(channel, handler)
    },
    push() {},
    async invokeClient() {
      return undefined
    },
    hasClientCapability() { return false },
    findClientsWithCapability() { return [] },
  }

  const deps = {
    sessionManager: {
      async getSession() {
        throw new Error('getSession should not run for invalid input')
      },
    },
    platform: {},
    oauthFlowStore: {},
  } as unknown as HandlerDeps

  registerContextCenterHandlers(server, deps)

  const getOverview = handlers.get(RPC_CHANNELS.contextCenter.GET_OVERVIEW)
  if (!getOverview) {
    throw new Error('context-center handlers not registered')
  }

  const ctx: RequestContext = {
    clientId: 'client-1',
    workspaceId: 'workspace-1',
    webContentsId: 1,
  }

  return { getOverview, ctx }
}

describe('ContextCenter overview', () => {
  it('combines usage, environment, tools, and pack summary with honest labels', () => {
    const projectEnvironment: ProjectEnvironmentProfile = {
      rootDir: '/repo',
      workspaceId: 'workspace-1',
      recommendedPackageManager: 'bun',
      lockfiles: ['bun.lock'],
      pythonEnvs: [],
      packageScripts: ['test'],
      envFileCandidates: ['.env'],
      diagnostics: [],
      lastCheckedAt: 123,
    }
    const projectPackSummary = {
      bundleId: 'bundle-1',
      bundleHash: 'hash',
      bundlePath: '/tmp/bundle.md',
      scope: 'repo',
      rootPath: '/repo',
      gitCommit: 'abc',
      gitBranch: 'main',
      gitDirty: false,
      fileCount: 2,
      totalBytes: 120,
      estimatedTokens: 200,
      tokenEstimateKind: 'estimate',
      excluded: [],
      files: [],
      secretScan: {
        scannedFileCount: 2,
        findingCount: 1,
        findings: [],
        hasHighSeverity: false,
      },
      createdAt: 456,
      markdownBytes: 800,
      externalExportAllowed: true,
    } satisfies ProjectPackSummary

    const overview = buildContextCenterOverview({
      input: { sessionId: 'session-1', workspaceId: 'workspace-1', rootPath: '/repo', bundleId: 'bundle-1' },
      session: {
        id: 'session-1',
        tokenUsage: {
          inputTokens: 100,
          outputTokens: 20,
          totalTokens: 120,
          contextTokens: 0,
          costUsd: 0,
          contextWindow: 1000,
        },
      },
      contextTools: [tool('rtk')],
      projectEnvironment,
      projectPackSummary,
      generatedAt: 789,
    })

    expect(overview.usage?.inputTokens).toEqual({ value: 100, confidence: 'real', locality: 'local' })
    expect(overview.usage?.estimatedContextPercent).toEqual({ value: 0.1, confidence: 'estimate', locality: 'local' })
    expect(overview.projectEnvironment?.confidence).toBe('real')
    expect(overview.contextTools.value.map((item) => item.toolId)).toEqual(['rtk'])
    expect(overview.projectPackSummary?.confidence).toBe('real')
    expect(overview.reviewReadiness.status).toEqual({ value: 'ready', confidence: 'real', locality: 'local' })
    expect(overview.reviewReadiness.reasons).toEqual({
      value: ['项目包摘要可用，且未发现 high severity secret 阻断项'],
      confidence: 'real',
      locality: 'local',
    })
    expect(overview.reviewReadiness.externalExportAllowed).toEqual({ value: true, confidence: 'real', locality: 'local' })
    expect(overview.reviewReadiness.secretHighSeverityBlocked).toEqual({
      value: false,
      confidence: 'real',
      locality: 'local',
    })
    expect(overview.reviewReadiness.secretFindingCount).toEqual({ value: 1, confidence: 'real', locality: 'local' })
    expect(overview.reviewReadiness.estimatedPackTokens).toEqual({ value: 200, confidence: 'estimate', locality: 'local' })
  })

  it('blocks review readiness when high severity secrets are present', () => {
    const projectPackSummary = {
      bundleId: 'bundle-2',
      bundleHash: 'hash',
      bundlePath: '/tmp/bundle.md',
      scope: 'repo',
      rootPath: '/repo',
      gitCommit: 'abc',
      gitBranch: 'main',
      gitDirty: false,
      fileCount: 2,
      totalBytes: 120,
      estimatedTokens: 200,
      tokenEstimateKind: 'estimate',
      excluded: [],
      files: [],
      secretScan: {
        scannedFileCount: 2,
        findingCount: 1,
        findings: [
          {
            relativePath: '.env',
            line: 1,
            ruleId: 'openai-key',
            severity: 'high',
            message: 'OpenAI API key',
            snippet: 'OPENAI_API_KEY=sk-...',
          },
        ],
        hasHighSeverity: true,
      },
      createdAt: 456,
      markdownBytes: 800,
      externalExportAllowed: false,
    } satisfies ProjectPackSummary

    const overview = buildContextCenterOverview({
      input: { bundleId: 'bundle-2', rootPath: '/repo' },
      contextTools: [],
      projectPackSummary,
      generatedAt: 1,
    })

    expect(overview.reviewReadiness.status).toEqual({ value: 'blocked', confidence: 'real', locality: 'local' })
    expect(overview.reviewReadiness.reasons.value).toContain('发现 high severity secret，外部审查被阻断')
    expect(overview.reviewReadiness.secretHighSeverityBlocked).toEqual({
      value: true,
      confidence: 'real',
      locality: 'local',
    })
    expect(overview.reviewReadiness.externalExportAllowed).toEqual({ value: false, confidence: 'real', locality: 'local' })
  })

  it('does not pretend missing inputs are known', () => {
    const overview = buildContextCenterOverview({
      input: {},
      contextTools: [],
      generatedAt: 1,
    })

    expect(overview.usage).toBeUndefined()
    expect(overview.projectEnvironment).toBeUndefined()
    expect(overview.projectPackSummary).toBeUndefined()
    expect(overview.reviewReadiness.status).toEqual({
      value: 'needs_pack',
      confidence: 'real',
      locality: 'local',
    })
    expect(overview.reviewReadiness.reasons).toEqual({
      value: ['尚未提供项目包摘要；需要先生成或选择已有项目包后才能判断外部审查 readiness'],
      confidence: 'real',
      locality: 'local',
    })
    expect(overview.reviewReadiness.externalExportAllowed).toEqual({
      value: false,
      confidence: 'unknown',
      locality: 'unknown',
      note: '没有可外发的项目包摘要',
    })
    expect(overview.notes).toContain('未提供 sessionId，无法读取真实用量')
  })

  it('uses dry-run ProjectPack preview for review readiness without requiring a saved bundle', () => {
    const projectPackPlanPreview = {
      scope: 'diff',
      rootPath: '/repo',
      gitCommit: 'abc',
      gitBranch: 'main',
      gitDirty: true,
      fileCount: 3,
      totalBytes: 1200,
      estimatedTokens: 900,
      tokenEstimateKind: 'estimate',
      excluded: [],
      files: [],
      secretScan: {
        scannedFileCount: 3,
        findingCount: 0,
        findings: [],
        hasHighSeverity: false,
      },
      externalExportAllowed: true,
    } satisfies ProjectPackPlanPreviewSummary

    const overview = buildContextCenterOverview({
      input: {
        rootPath: '/repo',
        projectPackPreviewRequest: { rootPath: '/repo', scope: 'diff' },
      },
      contextTools: [],
      projectPackPlanPreview,
      generatedAt: 1,
    })

    expect(overview.projectPackSummary).toBeUndefined()
    expect(overview.projectPackPlanPreview?.value).toEqual(projectPackPlanPreview)
    expect(overview.reviewReadiness.status).toEqual({ value: 'ready', confidence: 'real', locality: 'local' })
    expect(overview.reviewReadiness.estimatedPackTokens).toEqual({ value: 900, confidence: 'estimate', locality: 'local' })
  })

  it('marks review readiness unknown when a requested pack summary is unavailable', () => {
    const overview = buildContextCenterOverview({
      input: { bundleId: 'missing-bundle' },
      contextTools: [],
      generatedAt: 1,
    })

    expect(overview.reviewReadiness.status).toEqual({
      value: 'unknown',
      confidence: 'unknown',
      locality: 'unknown',
      note: '请求了项目包摘要但未读取到结果',
    })
    expect(overview.reviewReadiness.reasons).toEqual({
      value: ['请求了项目包摘要或 dry-run 预览，但没有读取到结果；不能确认外部审查 readiness'],
      confidence: 'unknown',
      locality: 'unknown',
      note: '缺少项目包摘要',
    })
  })

  it('adds sidecar notes when context tools are present or missing', () => {
    const overview = buildContextCenterOverview({
      input: {},
      contextTools: [
        tool('codegraph'),
        { ...tool('rtk'), status: 'missing', diagnostics: [{ level: 'info', code: 'missing', message: 'missing' }] },
      ],
      generatedAt: 1,
    })

    expect(overview.notes.some((n) => n.includes('codegraph 可用'))).toBe(true)
    expect(overview.notes.some((n) => n.includes('rtk'))).toBe(true)
  })

  it('emits distinct notes for missing session, bundle, and preview evidence', () => {
    const overview = buildContextCenterOverview({
      input: {
        sessionId: 'missing-session',
        bundleId: 'missing-bundle',
        projectPackPreviewRequest: { rootPath: '/repo', scope: 'repo' },
      },
      contextTools: [],
      generatedAt: 1,
    })

    expect(overview.notes).toContain('sessionId=missing-session 不存在，无法读取真实用量')
    expect(overview.notes).toContain('bundleId=missing-bundle 未找到已保存的项目包摘要')
    expect(overview.notes).toContain('ProjectPack dry-run 预览请求未返回结果')
    expect(overview.notes).not.toContain('未提供 sessionId，无法读取真实用量')
  })
})

describe('registerContextCenterHandlers', () => {
  it('rejects malformed overview input before service work runs', async () => {
    const { getOverview, ctx } = createContextCenterRpcHarness()

    await expect(getOverview(ctx)).rejects.toThrow('contextCenter:getOverview input must be an object')
    await expect(getOverview(ctx, null)).rejects.toThrow('contextCenter:getOverview input must be an object')
    await expect(getOverview(ctx, [])).rejects.toThrow('contextCenter:getOverview input must be an object')
    await expect(getOverview(ctx, { sessionId: 123 })).rejects.toThrow(
      'contextCenter:getOverview sessionId must be a string',
    )
    await expect(getOverview(ctx, { rootPath: false })).rejects.toThrow(
      'contextCenter:getOverview rootPath must be a string',
    )
    await expect(getOverview(ctx, { workspaceId: 123 })).rejects.toThrow(
      'contextCenter:getOverview workspaceId must be a string',
    )
    await expect(getOverview(ctx, { bundleId: 123 })).rejects.toThrow(
      'contextCenter:getOverview bundleId must be a string',
    )
    await expect(getOverview(ctx, { forceToolDetection: 'yes' })).rejects.toThrow(
      'contextCenter:getOverview forceToolDetection must be a boolean',
    )
  })

  it('rejects malformed ProjectPack preview requests', async () => {
    const { getOverview, ctx } = createContextCenterRpcHarness()

    await expect(getOverview(ctx, { projectPackPreviewRequest: 'repo' })).rejects.toThrow(
      'contextCenter:getOverview projectPackPreviewRequest must be an object',
    )
    await expect(getOverview(ctx, { projectPackPreviewRequest: { scope: 'repo' } })).rejects.toThrow(
      'contextCenter:getOverview projectPackPreviewRequest.rootPath must be a string',
    )
    await expect(getOverview(ctx, { projectPackPreviewRequest: { rootPath: '/repo', scope: 'all' } })).rejects.toThrow(
      'contextCenter:getOverview projectPackPreviewRequest.scope must be one of repo, diff, directory',
    )
    await expect(
      getOverview(ctx, { projectPackPreviewRequest: { rootPath: '/repo', scope: 'directory', relativePath: 1 } }),
    ).rejects.toThrow('contextCenter:getOverview projectPackPreviewRequest.relativePath must be a string')
    await expect(
      getOverview(ctx, { projectPackPreviewRequest: { rootPath: '/repo', scope: 'repo', maxFileBytes: 'large' } }),
    ).rejects.toThrow('contextCenter:getOverview projectPackPreviewRequest.maxFileBytes must be a number')
    await expect(
      getOverview(ctx, { projectPackPreviewRequest: { rootPath: '/repo', scope: 'repo', maxFiles: Number.NaN } }),
    ).rejects.toThrow('contextCenter:getOverview projectPackPreviewRequest.maxFiles must be a number')
  })
})
