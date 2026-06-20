import { describe, expect, it } from 'bun:test'
import type { ProjectEnvironmentProfile, ProjectPackPlanPreviewSummary, ProjectPackSummary, ToolCapability } from '@craft-agent/shared/protocol'
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
})
