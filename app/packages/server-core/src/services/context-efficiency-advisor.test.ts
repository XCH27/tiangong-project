import { describe, expect, it } from 'bun:test'
import type { ContextCenterOverview, ToolCapability } from '@craft-agent/shared/protocol'
import { buildContextEfficiencyRecommendations, buildContextCenterSidecarNotes } from './context-efficiency-advisor'

function tool(toolId: string, capabilities: ToolCapability['capabilities']): ToolCapability {
  return {
    toolId,
    displayName: toolId,
    category: 'context',
    status: 'available',
    source: 'system-path',
    scope: 'global',
    capabilities,
    risk: 'read-only',
    diagnostics: [],
  }
}

function overview(): Omit<ContextCenterOverview, 'recommendations'> {
  return {
    generatedAt: 1,
    usage: {
      sessionId: 'session-1',
      inputTokens: { value: 80, confidence: 'real', locality: 'local' },
      outputTokens: { value: 10, confidence: 'real', locality: 'local' },
      reportedCostUsd: { value: 0, confidence: 'real', locality: 'local' },
      estimatedContextPercent: { value: 0.8, confidence: 'estimate', locality: 'local' },
    },
    contextTools: {
      value: [tool('codegraph', ['graph-query']), tool('rtk', ['search-content'])],
      confidence: 'real',
      locality: 'local',
    },
    reviewReadiness: {
      status: { value: 'ready', confidence: 'real', locality: 'local' },
      reasons: { value: [], confidence: 'real', locality: 'local' },
      externalExportAllowed: { value: true, confidence: 'real', locality: 'local' },
    },
    notes: [],
  }
}

describe('context efficiency advisor', () => {
  it('recommends available graph, compression, and review actions with honest permissions', () => {
    const recommendations = buildContextEfficiencyRecommendations(overview())
    expect(recommendations.find((item) => item.action === 'query_code_graph')?.status).toBe('ready')
    expect(recommendations.find((item) => item.action === 'compress_command_output')).toMatchObject({
      status: 'ready',
      requiresPermission: true,
    })
    expect(recommendations.find((item) => item.action === 'submit_external_review')).toMatchObject({
      status: 'ready',
      requiresPermission: true,
    })
  })

  it('recommends unavailable sidecar actions when tools are missing', () => {
    const base = overview()
    const recommendations = buildContextEfficiencyRecommendations({
      ...base,
      contextTools: { value: [], confidence: 'real', locality: 'local' },
    })
    expect(recommendations.find((item) => item.action === 'query_code_graph')?.status).toBe('unavailable')
    expect(recommendations.find((item) => item.action === 'compress_command_output')?.reason).toContain(
      'Fleet 本地降级压缩逻辑',
    )
  })

  it('buildContextCenterSidecarNotes describes missing and available tools', () => {
    expect(buildContextCenterSidecarNotes([])).toEqual([
      'codegraph 未纳入 System Tools 检测结果。',
      'rtk 未纳入 System Tools 检测结果。',
    ])
    const notes = buildContextCenterSidecarNotes([
      tool('codegraph', ['graph-query']),
      {
        ...tool('rtk', ['search-content']),
        status: 'missing',
        diagnostics: [{ level: 'info', code: 'missing', message: 'not found', repairSuggestion: 'brew install rtk' }],
      },
    ])
    expect(notes[0]).toContain('codegraph 可用')
    expect(notes[1]).toContain('不在 PATH')
  })
})

