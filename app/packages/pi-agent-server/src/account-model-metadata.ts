/** Apply authenticated catalog limits to Pi's existing, executable model routes. */
import { getModels } from '@earendil-works/pi-ai/compat';
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';
import type { PiRuntimeModelEntry } from '../../shared/src/agent/backend/internal/driver-types.ts';

type AccountProvider = 'groq' | 'mistral' | 'openai-codex';

/** Never bind account metadata to an unrelated custom host or auth method. */
export function accountMetadataProvider(config: {
  provider?: string;
  authType?: string;
  baseUrl?: string;
  customEndpoint?: unknown;
}): AccountProvider | null {
  if (config.customEndpoint) return null;
  const baseUrl = config.baseUrl?.trim().replace(/\/+$/, '');
  if (config.provider === 'openai-codex' && config.authType === 'oauth'
    && (!baseUrl || baseUrl === 'https://chatgpt.com/backend-api/codex')) return 'openai-codex';
  if (config.authType !== 'api_key') return null;
  if (config.provider === 'groq' && (!baseUrl || baseUrl === 'https://api.groq.com/openai/v1')) return 'groq';
  if (config.provider === 'mistral' && (!baseUrl || baseUrl === 'https://api.mistral.ai' || baseUrl === 'https://api.mistral.ai/v1')) return 'mistral';
  return null;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * Pi owns the request protocol, provider URL, auth, and compatibility flags.
 * A live account list may only refine limits and image input for a model that
 * this installed Pi catalog can already execute. Rebuild from the bundled
 * catalog on each update so a removed override cannot linger in the runtime.
 */
export function registerAccountModelMetadata(
  registry: ModelRegistry,
  provider: AccountProvider,
  entries: readonly PiRuntimeModelEntry[],
): number {
  const native = getModels(provider);
  const knownIds = new Set(native.map(model => model.id));
  const overrides = new Map<string, Extract<PiRuntimeModelEntry, { id: string }>>();
  for (const entry of entries) {
    if (typeof entry === 'string') continue;
    const id = entry.id.startsWith('pi/') ? entry.id.slice(3) : entry.id;
    if (knownIds.has(id)) overrides.set(id, entry);
  }
  if (!overrides.size) return 0;

  let changed = 0;
  const models = native.map(model => {
    const override = overrides.get(model.id);
    if (!override) return model;
    const contextWindow = positiveInteger(override.contextWindow)
      ? override.contextWindow : model.contextWindow;
    const maxTokens = positiveInteger(override.maxOutputTokens)
      ? Math.min(override.maxOutputTokens, contextWindow)
      : Math.min(model.maxTokens, contextWindow);
    const input = typeof override.supportsImages === 'boolean'
      ? (override.supportsImages ? ['text', 'image'] as const : ['text'] as const)
      : model.input;
    if (contextWindow === model.contextWindow && maxTokens === model.maxTokens
      && input.join(',') === model.input.join(',')) return model;
    changed++;
    return { ...model, contextWindow, maxTokens, input: [...input] };
  });
  // Re-register even when the new snapshot equals the bundled values: the
  // previous account snapshot may have supplied an override that must go away.
  registry.registerProvider(provider, { models });
  return changed;
}
