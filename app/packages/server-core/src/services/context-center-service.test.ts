import { describe, expect, it } from 'bun:test'
import type { ProjectEnvironmentProfile, ProjectPackSummary, ToolCapability } from '@craft-agent/shared/protocol'
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
    expect(overview.reviewReadiness.externalExportAllowed).toEqual({ value: true, confidence: 'real', locality: 'local' })
    expect(overview.reviewReadiness.secretFindingCount).toEqual({ value: 1, confidence: 'real', locality: 'local' })
    expect(overview.reviewReadiness.estimatedPackTokens).toEqual({ value: 200, confidence: 'estimate', locality: 'local' })
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
    expect(overview.reviewReadiness.externalExportAllowed).toEqual({
      value: false,
      confidence: 'unknown',
      locality: 'unknown',
      note: '没有可外发的项目包摘要',
    })
    expect(overview.notes).toContain('未提供 sessionId，无法读取真实用量')
  })
})
