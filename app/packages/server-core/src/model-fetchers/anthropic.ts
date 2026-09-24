/**
 * Anthropic Model Fetcher
 *
 * Provider-agnostic wrapper that delegates model discovery to backend drivers.
 */

import type { ModelFetcher, ModelFetchResult, ModelFetcherCredentials } from '@craft-agent/shared/config'
import type { LlmConnection, ModelDefinition } from '@craft-agent/shared/config'
import { fetchBackendModels } from '@craft-agent/shared/agent/backend'
import { handlerLog } from './runtime'
import { getHostRuntime } from './runtime'

const ANTHROPIC_TIMEOUT_MS = 30_000

/**
 * Claude Code's supportedModels() describes the active subscription's effort
 * and fast-mode capabilities. It does not provide context limits, so it may
 * refine an existing account catalog but must not invent new model rows.
 */
export function mergeClaudeSdkCapabilities(
  models: readonly ModelDefinition[],
  raw: unknown,
): ModelDefinition[] {
  if (!Array.isArray(raw) || raw.length === 0) return models as ModelDefinition[]

  const patches = new Map<string, {
    reasoningEfforts?: ModelDefinition['reasoningEfforts'];
    adaptiveThinkingSupported?: boolean;
    supportsFastMode?: boolean;
  }>()
  const validEfforts = new Set(['low', 'medium', 'high', 'xhigh', 'max'])
  for (const value of raw) {
    if (!value || typeof value !== 'object') continue
    const row = value as Record<string, unknown>
    const rawId = typeof row.resolvedModel === 'string' && row.resolvedModel.startsWith('claude-')
      ? row.resolvedModel
      : row.value
    if (typeof rawId !== 'string' || !rawId.startsWith('claude-')) continue
    const id = rawId.replace(/\[[^\]]*\]$/, '')
    const patch: {
      reasoningEfforts?: ModelDefinition['reasoningEfforts'];
      adaptiveThinkingSupported?: boolean;
      supportsFastMode?: boolean;
    } = {}
    if (row.supportsEffort === false) {
      patch.reasoningEfforts = []
    } else if (Array.isArray(row.supportedEffortLevels)) {
      patch.reasoningEfforts = row.supportedEffortLevels.filter(
        (level): level is NonNullable<ModelDefinition['reasoningEfforts']>[number] =>
          typeof level === 'string' && validEfforts.has(level),
      )
    }
    if (typeof row.supportsAdaptiveThinking === 'boolean') {
      patch.adaptiveThinkingSupported = row.supportsAdaptiveThinking
    }
    if (typeof row.supportsFastMode === 'boolean') {
      patch.supportsFastMode = row.supportsFastMode
    }
    if (Object.keys(patch).length > 0) patches.set(id, patch)
  }

  let changed = false
  const next = models.map(model => {
    const patch = patches.get(model.id) ?? patches.get(model.id.replace(/-20\d{6}$/, ''))
    if (!patch) return model
    const effortsChanged = patch.reasoningEfforts !== undefined
      && JSON.stringify(model.reasoningEfforts) !== JSON.stringify(patch.reasoningEfforts)
    const adaptiveChanged = patch.adaptiveThinkingSupported !== undefined
      && model.adaptiveThinkingSupported !== patch.adaptiveThinkingSupported
    const fastChanged = patch.supportsFastMode !== undefined
      && model.supportsFastMode !== patch.supportsFastMode
    if (!effortsChanged && !adaptiveChanged && !fastChanged) return model
    changed = true
    return { ...model, ...patch }
  })
  return changed ? next : models as ModelDefinition[]
}

export class AnthropicModelFetcher implements ModelFetcher {
  /** Refresh every 60 minutes */
  readonly refreshIntervalMs = 60 * 60 * 1000

  async fetchModels(
    connection: LlmConnection,
    credentials: ModelFetcherCredentials,
  ): Promise<ModelFetchResult> {
    const result = await fetchBackendModels({
      connection,
      credentials,
      timeoutMs: ANTHROPIC_TIMEOUT_MS,
      hostRuntime: getHostRuntime(),
    })

    handlerLog.info(`Fetched ${result.models.length} Anthropic models: ${result.models.map(m => m.id).join(', ')}`)
    return result
  }
}
