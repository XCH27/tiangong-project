import type { UsageLedgerData } from '@craft-agent/ui'

function isLikelyLocalCost(slug?: string, name?: string, authType?: string, model?: string): boolean {
  if (authType === 'none') return true
  const haystack = [slug, name, model].filter(Boolean).join(' ').toLowerCase()
  return /(?:^|[\s_\-./:])(?:local|ollama|lmstudio|llama\.cpp|gpt4all|kobold|llamacpp|cli|localhost|127\.0\.0\.1)(?:$|[\s_\-./:])/i.test(haystack)
}

export function buildUsageLedgerData(params: {
  sessionId: string
  tokenUsage?: {
    inputTokens?: number
    outputTokens?: number
    costUsd?: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
    contextWindow?: number
  }
  connectionSlug?: string
  connectionName?: string
  authType?: string
  model?: string
}): UsageLedgerData {
  const tokenUsage = params.tokenUsage ?? {}
  const inputTokens = typeof tokenUsage.inputTokens === 'number' ? tokenUsage.inputTokens : 0
  const outputTokens = typeof tokenUsage.outputTokens === 'number' ? tokenUsage.outputTokens : 0
  const reportedCostUsd = typeof tokenUsage.costUsd === 'number' ? tokenUsage.costUsd : 0
  const contextWindow = typeof tokenUsage.contextWindow === 'number' && tokenUsage.contextWindow > 0
    ? tokenUsage.contextWindow
    : undefined

  const costAttribution: UsageLedgerData['costAttribution'] = reportedCostUsd > 0
    ? 'provider-reported'
    : isLikelyLocalCost(params.connectionSlug, params.connectionName, params.authType, params.model)
      ? 'local-no-api-cost'
      : 'unknown'

  const notes: string[] = []
  if (tokenUsage.cacheReadTokens === undefined && tokenUsage.cacheCreationTokens === undefined) {
    notes.push('本次会话未报告缓存读写数据（cacheRead/cacheCreation 缺席）')
  }
  if (!contextWindow) {
    notes.push('上下文窗口大小未知，无法计算填充比例')
  }
  if (reportedCostUsd === 0 && costAttribution === 'unknown') {
    notes.push('费用为 0 或未报告；不视为 Fleet API 花费')
  }

  return {
    sessionId: params.sessionId,
    real: {
      inputTokens,
      outputTokens,
      ...(tokenUsage.cacheReadTokens !== undefined ? { cacheReadTokens: tokenUsage.cacheReadTokens } : {}),
      ...(tokenUsage.cacheCreationTokens !== undefined ? { cacheCreationTokens: tokenUsage.cacheCreationTokens } : {}),
    },
    reportedCostUsd,
    costAttribution,
    contextWindow,
    estimatedContextPercent: contextWindow && typeof tokenUsage.inputTokens === 'number'
      ? Math.max(0, Math.min(1, inputTokens / contextWindow))
      : undefined,
    notes,
  }
}
