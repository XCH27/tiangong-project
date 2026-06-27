/**
 * 模型路由运行时 — SessionManager 接线层
 *
 * 持有 Budget / Semantic / DataCollector 单例，并提供 Fusion 配置与 queryLlm 适配。
 */

import { hasLeaderLabel } from '@craft-agent/shared/labels'
import type { LLMQueryRequest, LLMQueryResult } from '@craft-agent/shared/agent/llm-tool'
import { BudgetTracker, type AgentRole } from './budget-gatekeeper.ts'
import { SemanticCache } from './semantic-cache.ts'
import { RoutingDataCollector } from './routing-data-collector.ts'
import { enforceAgentPolicy } from './agent-routing-policy.ts'
import type { QueryLlmAdapter } from './fusion-pipeline.ts'
import type {
  FusionConfig,
  ModelRoutingPrefs,
  PanelMember,
  RoutingDecision,
} from './fusion-types.ts'

export const budgetTracker = new BudgetTracker()
export const semanticCache = new SemanticCache()
export const routingDataCollector = new RoutingDataCollector()

const PANEL_ROLE_CYCLE: PanelMember['role'][] = ['logic', 'code', 'language']

export function resolveSessionAgentRole(sessionId: string, labels?: string[]): AgentRole {
  if (sessionId.includes('manager') || sessionId.startsWith('manager:')) {
    return 'manager'
  }
  if (hasLeaderLabel(labels ?? [])) {
    return 'leader'
  }
  return 'executor'
}

export function applyRoutingPolicy(
  agentRole: AgentRole,
  decision: RoutingDecision,
  prefs: ModelRoutingPrefs,
): RoutingDecision {
  const check = enforceAgentPolicy(agentRole, decision, prefs)
  if (!check.allowed && check.overriddenDecision) {
    return check.overriddenDecision
  }
  return decision
}

export function buildFusionConfig(
  prefs: ModelRoutingPrefs,
  connectionSlug: string,
): FusionConfig | null {
  const panelIds = prefs.fusion.panelModels.slice(0, prefs.fusion.panelSize)
  if (panelIds.length < 2) return null

  const panel: PanelMember[] = panelIds.map((modelId, index) => ({
    connectionSlug,
    modelId,
    role: PANEL_ROLE_CYCLE[index % PANEL_ROLE_CYCLE.length],
    timeoutMs: 120_000,
  }))

  const judgeId = prefs.fusion.judgeModel || panelIds[0]
  const writerId = prefs.fusion.writerModel || panelIds[panelIds.length - 1]

  return {
    panel,
    judgeModel: { connectionSlug, modelId: judgeId },
    writerModel: { connectionSlug, modelId: writerId },
    fusionDepth: 0,
    budgetCap: {
      maxTokens: prefs.fusion.budgetCap.maxTokens,
      maxPanelists: prefs.fusion.budgetCap.maxPanelists,
    },
    verification: prefs.fusion.verification,
    panelCacheEnabled: prefs.cache.panelIntermediate,
  }
}

export interface QueryLlmAgent {
  queryLlm?(request: LLMQueryRequest): Promise<LLMQueryResult>
}

export function createQueryLlmAdapter(agent: QueryLlmAgent): QueryLlmAdapter {
  return async (_connectionSlug, modelId, prompt, options) => {
    if (!agent.queryLlm) {
      throw new Error('Agent backend does not support queryLlm')
    }
    const result = await agent.queryLlm({
      prompt,
      systemPrompt: options?.systemPrompt,
      model: modelId,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      outputSchema: options?.outputSchema,
    })
    return {
      text: result.text,
      usage: {
        inputTokens: result.inputTokens ?? 0,
        outputTokens: result.outputTokens ?? 0,
      },
    }
  }
}

export function syncSemanticCacheEnabled(prefs: ModelRoutingPrefs): void {
  semanticCache.setEnabled(prefs.cache.semantic)
}

export function estimateFusionTokens(prefs: ModelRoutingPrefs): number {
  const panelCount = Math.min(prefs.fusion.panelSize, prefs.fusion.panelModels.length)
  return panelCount > 0 ? panelCount * 4000 + 8000 : 12000
}
