/** Register account-discovered xAI API models in Pi's existing native provider. */
import { getModels } from '@earendil-works/pi-ai/compat';
import type { ModelRegistry } from '@earendil-works/pi-coding-agent';
import type { PiRuntimeModelEntry } from '../../shared/src/agent/backend/internal/driver-types.ts';

const XAI_API_BASE = 'https://api.x.ai/v1';
const XAI_SUBSCRIPTION_BASE = 'https://cli-chat-proxy.grok.com/v1';
const GROK_CLIENT_VERSION = '1.0.4';
const LEVELS = ['low', 'medium', 'high', 'xhigh'] as const;
type XaiEffort = typeof LEVELS[number];

function finiteNonnegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * The bundled SDK may lag the account catalog. A live entry is admitted to
 * Pi's runtime only when it has enough metadata to execute and attribute cost.
 * Unknown models without that data stay out of the runnable selector.
 */
export function registerXaiLiveModels(
  registry: ModelRegistry,
  entries: readonly PiRuntimeModelEntry[],
  baseUrl: string = XAI_API_BASE,
): number {
  if (baseUrl !== XAI_API_BASE && baseUrl !== XAI_SUBSCRIPTION_BASE) {
    throw new Error('Untrusted xAI model endpoint');
  }
  const subscription = baseUrl === XAI_SUBSCRIPTION_BASE;
  const bundled = new Map(getModels('xai').map(model => [model.id, model]));
  const models: NonNullable<Parameters<ModelRegistry['registerProvider']>[1]>['models'] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    if (typeof entry === 'string') continue;
    const id = entry.id.startsWith('pi/') ? entry.id.slice(3) : entry.id;
    if (!id || seen.has(id)) continue;
    const native = bundled.get(id);
    const context = entry.contextWindow ?? native?.contextWindow;
    const pricing = entry.pricingPerMillion;
    if (!context || !Number.isSafeInteger(context) || context <= 0) continue;
    if (!native && !subscription && (!pricing || !finiteNonnegative(pricing.input) || !finiteNonnegative(pricing.output))) continue;
    if (!native && subscription && !entry.maxOutputTokens) continue;

    const effortSet = entry.reasoningEfforts
      ? new Set(entry.reasoningEfforts.filter((level): level is XaiEffort => LEVELS.includes(level as XaiEffort)))
      : undefined;
    const thinkingLevelMap = effortSet
      ? {
          off: native?.thinkingLevelMap?.off ?? null,
          minimal: null,
          low: effortSet.has('low') ? 'low' : null,
          medium: effortSet.has('medium') ? 'medium' : null,
          high: effortSet.has('high') ? 'high' : null,
          xhigh: effortSet.has('xhigh') ? 'xhigh' : null,
          max: null,
        } as const
      : native?.thinkingLevelMap;

    seen.add(id);
    models.push({
      id,
      name: native?.name ?? id,
      api: 'openai-responses',
      baseUrl,
      ...(subscription ? { headers: {
        'X-XAI-Token-Auth': 'xai-grok-cli',
        'x-grok-client-version': GROK_CLIENT_VERSION,
        'x-grok-model-override': id,
      } } : {}),
      reasoning: effortSet ? effortSet.size > 0 : native?.reasoning ?? false,
      thinkingLevelMap,
      input: entry.supportsImages ?? native?.input.includes('image')
        ? ['text', 'image']
        : ['text'],
      cost: {
        // Subscription allowances are separate from Console API token prices.
        // Pi requires numeric cost fields; zero here means unpriced, not free.
        input: subscription ? 0 : pricing?.input ?? native?.cost.input ?? 0,
        output: subscription ? 0 : pricing?.output ?? native?.cost.output ?? 0,
        cacheRead: subscription ? 0 : pricing?.cacheRead ?? native?.cost.cacheRead ?? 0,
        cacheWrite: subscription ? 0 : native?.cost.cacheWrite ?? 0,
        ...(pricing?.longContext
          ? { tiers: [{
              inputTokensAbove: pricing.longContext.inputTokensAtOrAbove - 1,
              input: pricing.longContext.input,
              output: pricing.longContext.output,
              cacheRead: pricing.longContext.cacheRead ?? pricing.cacheRead ?? native?.cost.cacheRead ?? 0,
              cacheWrite: native?.cost.cacheWrite ?? 0,
            }] }
          : {}),
      },
      contextWindow: context,
      // xAI documents no separate text-output limit for Grok 4.7. Pi clamps
      // this ceiling against the request's remaining context at send time.
      maxTokens: entry.maxOutputTokens ?? native?.maxTokens
        ?? (id === 'grok-4.7' ? context : Math.min(context, 8_192)),
    });
  }

  if (!models.length) return 0;
  registry.registerProvider('xai', { baseUrl, api: 'openai-responses', models });
  return models.length;
}
