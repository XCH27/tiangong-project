export interface PiModelInfo {
  id: string
  name: string
  costInput?: number
  costOutput?: number
  contextWindow: number
  reasoning: boolean
  supportsImages?: boolean
  reasoningEfforts?: Array<'low' | 'medium' | 'high' | 'xhigh' | 'max'>
  supportsFastMode?: boolean
  modalities?: { input: string[]; output: string[] }
}

/** Keep an existing choice even when the bundled SDK predates that model. */
export function resolvePreferredModel(_models: PiModelInfo[], savedDefault?: string): string {
  return savedDefault?.trim() ?? ''
}

/** A catalog choice owns its provider endpoint even before the user edits the form. */
export function initialBaseUrlForPreset(
  activePreset: string,
  presets: readonly { key: string; url: string }[],
  savedBaseUrl?: string,
): string {
  return savedBaseUrl ?? presets.find(preset => preset.key === activePreset)?.url ?? presets[0]?.url ?? ''
}

/** Native providers own their official endpoints, even when the form shows one. */
export function baseUrlForPiPreset(preset: string, value: string): string | undefined {
  const url = value.trim()
  if (preset === 'xai' && url.replace(/\/+$/, '') === 'https://api.x.ai/v1') return undefined
  if (preset === 'mistral' && url.replace(/\/+$/, '') === 'https://api.mistral.ai/v1') return undefined
  return url || undefined
}
