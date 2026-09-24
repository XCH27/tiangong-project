import type { ModelDefinition } from '@config/models'

/** Settings-only catalog projection. Routing still belongs to the connection and Pi adapter. */
export type ModelCapabilityFilter = 'all' | 'chat' | 'multimodal' | 'image' | 'video' | 'audio'

/**
 * A chat model remains a chat model even when it accepts images or audio.
 * Only an explicit input declaration (or Pi's image-input flag) earns a
 * multimodal label. Names such as "audio-preview" are never used as evidence.
 */
export function chatInputModalities(model: ModelDefinition | undefined): Array<'image' | 'audio' | 'video'> {
  if (!model) return []
  const input = new Set(model.modalities?.input ?? [])
  if (model.supportsImages === true) input.add('image')
  return (['image', 'audio', 'video'] as const).filter(kind => input.has(kind))
}

export function chatModelMatchesFilter(
  model: ModelDefinition | undefined,
  filter: ModelCapabilityFilter,
): boolean {
  return filter === 'all' || filter === 'chat'
    || (filter === 'multimodal' && chatInputModalities(model).length > 0)
}

export function mediaModelMatchesFilter(
  kind: 'image' | 'video' | 'audio',
  filter: ModelCapabilityFilter,
): boolean {
  return filter === 'all' || filter === kind
}
