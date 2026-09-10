export interface ContextUsageProjection {
  currentInputTokens: number
  contextWindow: number | null
  percent: number | null
  remainingTokens: number | null
}

/**
 * Current-context snapshot for meters and popovers. Since 2026-08 the server
 * accumulates `inputTokens` across turns (for cost rollups) and keeps the
 * last-turn context size in `contextTokens`. Sessions persisted before that
 * change have `contextTokens: 0` and the snapshot still in `inputTokens`.
 */
export function currentContextTokens(
  tokenUsage: { inputTokens: number; contextTokens?: number } | undefined,
): number | undefined {
  if (!tokenUsage) return undefined
  return tokenUsage.contextTokens && tokenUsage.contextTokens > 0
    ? tokenUsage.contextTokens
    : tokenUsage.inputTokens
}

interface ContextWindowModel {
  id: string
  contextWindow?: number
}

function normalizeModelId(modelId: string): string {
  return modelId.replace(/^pi\//, '')
}

/**
 * Resolve the context limit from the existing provider/model authority.
 *
 * Dynamic Pi models are intentionally absent from the static MODEL_REGISTRY,
 * so the connection-discovered model metadata must be checked before the
 * static fallback. A usage event remains authoritative once it reports a
 * context window.
 */
export function resolveContextWindow(
  reportedContextWindow: number | undefined,
  currentModelId: string,
  availableModels: Array<string | ContextWindowModel>,
  staticContextWindow?: number,
): number | undefined {
  if (reportedContextWindow && reportedContextWindow > 0) {
    return reportedContextWindow
  }

  const normalizedCurrentId = normalizeModelId(currentModelId)
  const discoveredModel = availableModels.find((model) => {
    const modelId = typeof model === 'string' ? model : model.id
    return normalizeModelId(modelId) === normalizedCurrentId
  })
  const discoveredContextWindow = typeof discoveredModel === 'string'
    ? undefined
    : discoveredModel?.contextWindow

  if (discoveredContextWindow && discoveredContextWindow > 0) {
    return discoveredContextWindow
  }

  return staticContextWindow && staticContextWindow > 0
    ? staticContextWindow
    : undefined
}

export function hasKnownContextUsage(
  usage: ContextUsageProjection,
): usage is ContextUsageProjection & {
  contextWindow: number
  percent: number
  remainingTokens: number
} {
  return usage.percent !== null
}

/**
 * Project the provider-normalized current context without adding output or
 * cache counters a second time. Unknown model limits remain unknown.
 */
export function projectContextUsage(
  currentInputTokens?: number,
  contextWindow?: number,
): ContextUsageProjection {
  const input = Math.max(0, currentInputTokens ?? 0)
  const limit = contextWindow && contextWindow > 0 ? contextWindow : null
  return {
    currentInputTokens: input,
    contextWindow: limit,
    percent: limit === null ? null : Math.min(100, (input / limit) * 100),
    remainingTokens: limit === null ? null : Math.max(0, limit - input),
  }
}
