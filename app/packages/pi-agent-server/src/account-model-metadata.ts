/** Apply authenticated catalog limits to Pi's existing provider routes. */
import { getModels } from '@earendil-works/pi-ai/compat';
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';
import type { PiRuntimeModelEntry } from '../../shared/src/agent/backend/internal/driver-types.ts';

type AccountProvider = 'google' | 'groq' | 'mistral' | 'openai' | 'deepseek' | 'openai-codex';

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
  if (config.provider === 'openai' && (!baseUrl || baseUrl === 'https://api.openai.com/v1')) return 'openai';
  if (config.provider === 'deepseek' && (!baseUrl || baseUrl === 'https://api.deepseek.com')) return 'deepseek';
  if (config.provider === 'google' && (!baseUrl || baseUrl === 'https://generativelanguage.googleapis.com/v1beta')) return 'google';
  if (config.provider === 'groq' && (!baseUrl || baseUrl === 'https://api.groq.com/openai/v1')) return 'groq';
  if (config.provider === 'mistral' && (!baseUrl || baseUrl === 'https://api.mistral.ai' || baseUrl === 'https://api.mistral.ai/v1')) return 'mistral';
  return null;
}

function positiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * Pi owns the request protocol, provider URL, auth, and compatibility flags.
 * A live account list may refine limits, image input and DeepSeek's exact
 * effort map. A fully described, account-advertised DeepSeek text model can
 * also use Pi's existing native DeepSeek wire adapter. Rebuild from the bundled
 * catalog on each update so a removed account model cannot linger.
 */
export function registerAccountModelMetadata(
  registry: ModelRegistry,
  provider: AccountProvider,
  entries: readonly PiRuntimeModelEntry[],
): number {
  const native = getModels(provider);
  const knownIds = new Set(native.map(model => model.id));
  const overrides = new Map<string, Extract<PiRuntimeModelEntry, { id: string }>>();
  const discovered: Extract<PiRuntimeModelEntry, { id: string }>[] = [];
  for (const entry of entries) {
    if (typeof entry === 'string') continue;
    const id = entry.id.startsWith('pi/') ? entry.id.slice(3) : entry.id;
    if (knownIds.has(id)) overrides.set(id, entry);
    else if (provider === 'deepseek' && entry.catalogSource === 'provider'
      && entry.runtimeApi === 'openai-completions'
      && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id)
      && positiveInteger(entry.contextWindow) && positiveInteger(entry.maxOutputTokens)
      && entry.maxOutputTokens <= entry.contextWindow
      && typeof entry.supportsImages === 'boolean'
      && entry.reasoningEfforts?.length
      && entry.reasoningEfforts.every(level =>
        level === 'low' || level === 'medium' || level === 'high' || level === 'xhigh' || level === 'max')) discovered.push(entry);
  }
  if (!overrides.size && !discovered.length) return 0;

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
    const thinkingLevelMap = provider === 'deepseek' && override.reasoningEfforts?.length
      ? {
          ...model.thinkingLevelMap,
          low: override.reasoningEfforts.includes('low') ? 'low' as const : null,
          medium: override.reasoningEfforts.includes('medium') ? 'medium' as const : null,
          high: override.reasoningEfforts.includes('high') ? 'high' as const : null,
          xhigh: override.reasoningEfforts.includes('xhigh') ? 'xhigh' as const : null,
          max: override.reasoningEfforts.includes('max') ? 'max' as const : null,
        }
      : model.thinkingLevelMap;
    if (contextWindow === model.contextWindow && maxTokens === model.maxTokens
      && input.join(',') === model.input.join(',')
      && (['low', 'medium', 'high', 'xhigh', 'max'] as const).every(level =>
        thinkingLevelMap?.[level] === model.thinkingLevelMap?.[level])) return model;
    changed++;
    return { ...model, contextWindow, maxTokens, input: [...input], thinkingLevelMap };
  });
  if (provider === 'deepseek') {
    const template = native.find(model => model.id === 'deepseek-flash' && model.api === 'openai-completions');
    if (template && (template.compat as { thinkingFormat?: string } | undefined)?.thinkingFormat === 'deepseek') {
      const seen = new Set<string>();
      for (const entry of discovered) {
        const id = entry.id.startsWith('pi/') ? entry.id.slice(3) : entry.id;
        if (seen.has(id)) continue;
        seen.add(id);
        const efforts = new Set(entry.reasoningEfforts);
        models.push({
          ...template,
          id, name: id, contextWindow: entry.contextWindow!, maxTokens: entry.maxOutputTokens!,
          input: entry.supportsImages ? ['text', 'image'] : ['text'],
          thinkingLevelMap: {
            off: 'none', minimal: null,
            low: efforts.has('low') ? 'low' : null,
            medium: efforts.has('medium') ? 'medium' : null,
            high: efforts.has('high') ? 'high' : null,
            xhigh: efforts.has('xhigh') ? 'xhigh' : null,
            max: efforts.has('max') ? 'max' : null,
          },
          // The account catalog does not publish prices. Pi requires a cost
          // object for accounting; the UI never treats this as a free tier.
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        });
        changed++;
      }
    }
  }
  // Re-register even when the new snapshot equals the bundled values: the
  // previous account snapshot may have supplied an override that must go away.
  registry.registerProvider(provider, { models });
  return changed;
}
