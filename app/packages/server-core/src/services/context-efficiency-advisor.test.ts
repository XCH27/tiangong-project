import { describe, expect, it } from 'bun:test'
import type { ContextCenterOverview, ToolCapability } from '@craft-agent/shared/protocol'
import { buildContextEfficiencyRecommendations } from './context-efficiency-advisor'

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
})

