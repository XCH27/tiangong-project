import type { LlmConnectionSetup } from '@craft-agent/shared/protocol'

export interface ProviderModelInfo {
  id: string
  name: string
  shortName?: string
  description?: string
  contextWindow: number
  reasoning: boolean
  supportsThinking?: boolean
  supportedReasoningEfforts?: readonly string[]
  supportsFastMode?: boolean
  supportsImages?: boolean
}

export interface ModelEntryAction {
  kind: 'select' | 'custom'
  modelId: string
}

/** Runtime namespaces stay internal; provider model ids are shown verbatim. */
export function modelIdForDisplay(modelId: string): string {
  return modelId.startsWith('pi/') ? modelId.slice(3) : modelId
}

/**
 * One field handles both discovery results and model ids newer than the
 * provider response. Exact results select; everything else is a custom id.
 */
export function resolveModelEntry(
  query: string,
  options: readonly string[],
  selected: readonly string[],
): ModelEntryAction | null {
  const enteredId = query.trim()
  if (!enteredId) return null
  const matchingOption = options.find(
    (modelId) =>
      modelId === enteredId || modelIdForDisplay(modelId) === enteredId,
  )
  const modelId = matchingOption ?? enteredId
  if (selected.includes(modelId)) return null
  return {
    kind: matchingOption ? 'select' : 'custom',
    modelId,
  }
}

/**
 * Preserve user order and unknown provider IDs. Known models carry capability
 * metadata; a model newer than the bundled registry stays usable as a string.
 */
export function toSelectedModelPayload(
  selectedIds: readonly string[],
  providerModels: readonly ProviderModelInfo[],
): NonNullable<LlmConnectionSetup['models']> {
  const normalizeId = (modelId: string) =>
    modelId.startsWith('pi/') ? modelId.slice(3) : modelId
  const definitions = new Map(
    providerModels.map((model) => [normalizeId(model.id), model]),
  )
  return selectedIds.map((modelId) => {
    const model = definitions.get(normalizeId(modelId))
    if (!model) return modelId
    return {
      id: model.id,
      name: model.name,
      shortName: model.shortName ?? model.name,
      description: model.description ?? '',
      provider: 'pi' as const,
      contextWindow: model.contextWindow,
      supportsThinking: model.supportsThinking ?? model.reasoning,
      supportedReasoningEfforts: model.supportedReasoningEfforts ?? [],
      supportsFastMode: model.supportsFastMode,
      supportsImages: model.supportsImages,
    }
  })
}
