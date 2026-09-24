/** Account-scoped xAI model discovery for distinct Console and Grok subscription routes. */
import type { ModelDefinition } from '../../../../config/models.ts';
import { getPiModelsForAuthProvider } from '../../../../config/models-pi.ts';
import { getModels } from '@earendil-works/pi-ai/compat';

type JsonRecord = Record<string, unknown>;
const XAI_API_BASE = 'https://api.x.ai/v1';
export const XAI_SUBSCRIPTION_BASE = 'https://cli-chat-proxy.grok.com/v1';
const EFFORT_ORDER = ['low', 'medium', 'high', 'xhigh'] as const;

// Desktop installs a host fetch that follows Electron's configured or system
// proxy. Headless callers keep their normal fetch, and tests may inject one.
export type XaiCatalogFetcher = (url: string, init: RequestInit) => Promise<Response>;
export interface XaiMediaModel {
  id: string;
  name: string;
  kind: 'image' | 'video';
  inputModalities?: string[];
  outputModalities?: string[];
}

export interface XaiMediaCatalog {
  models: XaiMediaModel[];
  status: 'available' | 'partial' | 'unavailable';
}
let catalogFetcher: XaiCatalogFetcher = (url, init) => globalThis.fetch(url, init);

export function setXaiCatalogFetcher(fetcher: XaiCatalogFetcher | null): void {
  catalogFetcher = fetcher ?? ((url, init) => globalThis.fetch(url, init));
}

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : undefined;
}

function pricePerMillion(value: unknown): number | undefined {
  // xAI reports USD cents per 100 million tokens.
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value / 10_000
    : undefined;
}

function efforts(value: unknown): ModelDefinition['reasoningEfforts'] | undefined {
  if (!Array.isArray(value)) return undefined;
  return EFFORT_ORDER.filter(level => value.includes(level));
}

function advertisedModalities(row: JsonRecord): ModelDefinition['modalities'] | undefined {
  const parse = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value) || value.length > 16) return undefined;
    const entries = value.map(item => typeof item === 'string' ? item.toLowerCase() : '');
    if (entries.some(item => !/^[a-z][a-z0-9_]{0,63}$/.test(item))) return undefined;
    return [...new Set(entries)];
  };
  const input = parse(row.input_modalities ?? row.inputModalities);
  const output = parse(row.output_modalities ?? row.outputModalities);
  return input && output ? { input, output } : undefined;
}

/** The endpoint, not a name guess, classifies these non-chat models. */
export function parseXaiMediaModels(payload: unknown, kind: XaiMediaModel['kind']): XaiMediaModel[] {
  const rows = record(payload)?.models;
  if (!Array.isArray(rows)) throw new Error(`xAI ${kind} model catalog response is invalid`);
  const seen = new Set<string>();
  return rows.flatMap(value => {
    const row = record(value);
    const id = typeof row?.id === 'string' ? row.id.trim() : '';
    if (!id || seen.has(id)) return [];
    const declaredOutput = row?.output_modalities ?? row?.outputModalities;
    if (Array.isArray(declaredOutput) && !declaredOutput.includes(kind)) return [];
    const modalities = advertisedModalities(row!);
    seen.add(id);
    return [{
      id,
      name: typeof row?.name === 'string' && row.name.trim() ? row.name.trim() : id,
      kind,
      ...(modalities ? { inputModalities: modalities.input, outputModalities: modalities.output } : {}),
    }];
  });
}

/** Read the authenticated Console catalog without treating it as an executor. */
export async function fetchXaiApiMediaModels(
  apiKey: string,
  timeoutMs = 15_000,
  fetcher: XaiCatalogFetcher = catalogFetcher,
): Promise<XaiMediaCatalog> {
  if (!apiKey.trim()) throw new Error('xAI API key is required for model discovery');
  const kinds = ['image', 'video'] as const;
  const results = await Promise.allSettled(kinds.map(async kind => {
    const response = await fetcher(`${XAI_API_BASE}/${kind}-generation-models`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error(`xAI ${kind} catalog returned HTTP ${response.status}`);
    }
    return parseXaiMediaModels(await response.json(), kind);
  }));
  const successes = results.filter(result => result.status === 'fulfilled');
  return {
    models: successes.flatMap(result => result.value),
    status: successes.length === kinds.length ? 'available' : successes.length ? 'partial' : 'unavailable',
  };
}

/**
 * Join the language-model endpoint (modalities and native efforts) with the
 * general models endpoint (context length). Never turn a pricing threshold
 * into a context limit, or manufacture a reasoning tier from a model name.
 */
export function parseXaiApiModels(languagePayload: unknown, modelsPayload: unknown): ModelDefinition[] {
  const languageRows = record(languagePayload)?.models;
  const modelRows = record(modelsPayload)?.data;
  if (!Array.isArray(languageRows) || !Array.isArray(modelRows)) {
    throw new Error('xAI model catalog response is invalid');
  }

  const catalogModels = new Map<string, JsonRecord>();
  for (const value of modelRows) {
    const row = record(value);
    if (!row || typeof row.id !== 'string') continue;
    catalogModels.set(row.id, row);
  }

  const sdkModels = new Map(getModels('xai').map(model => [model.id, model]));
  const sdkDefinitions = new Map(getPiModelsForAuthProvider('xai').map(model => [model.id, model]));
  const seen = new Set<string>();
  const result: ModelDefinition[] = [];

  for (const value of languageRows) {
    const row = record(value);
    if (!row || typeof row.id !== 'string' || !row.id.trim() || seen.has(row.id)) continue;
    const input = row.input_modalities;
    const output = row.output_modalities;
    if (Array.isArray(input) && !input.includes('text')) continue;
    if (Array.isArray(output) && !output.includes('text')) continue;
    const modalities = advertisedModalities(row);

    const sdk = sdkModels.get(row.id);
    const previous = sdkDefinitions.get(`pi/${row.id}`);
    const catalog = catalogModels.get(row.id);
    const context = positiveInteger(row.context_length)
      ?? positiveInteger(catalog?.context_length)
      ?? sdk?.contextWindow;
    // The Pi runtime requires a context length. Skip an unknown model rather
    // than expose an unexecutable entry with an invented window.
    if (!context) continue;

    const capability = record(row.capabilities) ?? record(catalog?.capabilities);
    const nativeEfforts = efforts(capability?.reasoning_effort);
    const sdkEfforts = sdk?.thinkingLevelMap
      ? EFFORT_ORDER.filter(level => sdk.thinkingLevelMap?.[level] != null)
      : undefined;
    const reasoningEfforts = nativeEfforts ?? sdkEfforts;
    const inputPrice = pricePerMillion(row.prompt_text_token_price ?? catalog?.prompt_text_token_price);
    const outputPrice = pricePerMillion(row.completion_text_token_price ?? catalog?.completion_text_token_price);
    const cachePrice = pricePerMillion(row.cached_prompt_text_token_price ?? catalog?.cached_prompt_text_token_price);
    const longThreshold = positiveInteger(row.long_context_threshold ?? catalog?.long_context_threshold);
    const longInputPrice = pricePerMillion(row.prompt_text_token_price_long_context ?? catalog?.prompt_text_token_price_long_context);
    const longOutputPrice = pricePerMillion(row.completion_text_token_price_long_context ?? catalog?.completion_text_token_price_long_context);
    const longCachePrice = pricePerMillion(row.cached_prompt_text_token_price_long_context ?? catalog?.cached_prompt_text_token_price_long_context);
    // The Pi adapter needs cost metadata to register a new model. Do not
    // advertise one that would later disappear from the runnable registry.
    if (!sdk && (inputPrice === undefined || outputPrice === undefined)) continue;
    const name = typeof row.name === 'string' && row.name.trim()
      ? row.name.trim()
      : sdk?.name ?? row.id;

    seen.add(row.id);
    result.push({
      id: `pi/${row.id}`,
      name,
      shortName: name,
      description: previous?.description ?? '',
      provider: 'pi',
      contextWindow: context,
      supportsThinking: reasoningEfforts !== undefined ? reasoningEfforts.length > 0 : sdk?.reasoning ?? false,
      supportsImages: Array.isArray(input) ? input.includes('image') : sdk?.input.includes('image') ?? false,
      ...(modalities ? { modalities } : {}),
      ...(reasoningEfforts !== undefined ? { reasoningEfforts } : {}),
      ...(sdk?.thinkingLevelMap ? { reasoningDisableSupported: sdk.thinkingLevelMap.off != null } : {}),
      ...(positiveInteger(row.max_output_tokens ?? row.max_completion_tokens) ?? sdk?.maxTokens
        ? { maxOutputTokens: positiveInteger(row.max_output_tokens ?? row.max_completion_tokens) ?? sdk?.maxTokens }
        : {}),
      ...(inputPrice !== undefined && outputPrice !== undefined
        ? { pricingPerMillion: {
            input: inputPrice,
            output: outputPrice,
            ...(cachePrice !== undefined ? { cacheRead: cachePrice } : {}),
            ...(longThreshold && (longInputPrice !== undefined || longOutputPrice !== undefined || longCachePrice !== undefined)
              ? { longContext: {
                  inputTokensAtOrAbove: longThreshold,
                  input: longInputPrice ?? inputPrice,
                  output: longOutputPrice ?? outputPrice,
                  ...((longCachePrice ?? cachePrice) !== undefined
                    ? { cacheRead: longCachePrice ?? cachePrice }
                    : {}),
                } }
              : {}),
          } }
        : {}),
      catalogSource: context === sdk?.contextWindow && !positiveInteger(catalog?.context_length) && !positiveInteger(row.context_length)
        ? 'sdk'
        : 'provider',
    });
  }

  if (result.length === 0) throw new Error('xAI returned no runnable language models');
  return result;
}

/**
 * The Grok subscription proxy has its own account catalog. Membership comes
 * from that response; capabilities come only from fields it returns or from
 * the bundled Pi definition for the exact same ID. Incomplete unknown rows
 * are not presented as runnable models.
 */
export function parseXaiSubscriptionModels(payload: unknown): ModelDefinition[] {
  const body = record(payload);
  const rows = body?.data ?? body?.models;
  if (!Array.isArray(rows)) throw new Error('Grok subscription model catalog is invalid');
  const sdkModels = new Map(getModels('xai').map(model => [model.id, model]));
  const seen = new Set<string>();
  const result: ModelDefinition[] = [];
  for (const value of rows) {
    const row = record(value);
    if (!row) continue;
    const id = typeof row.id === 'string' ? row.id : typeof row.model === 'string' ? row.model : undefined;
    if (!id || seen.has(id)) continue;
    const backend = row?.api_backend ?? row?.apiBackend ?? row?.backend;
    if (typeof backend === 'string' && !['responses', 'chat', 'language'].includes(backend.toLowerCase())) continue;
    const input = row?.input_modalities ?? row?.inputModalities;
    const outputModalities = row?.output_modalities ?? row?.outputModalities;
    if (Array.isArray(input) && !input.includes('text')) continue;
    if (Array.isArray(outputModalities) && !outputModalities.includes('text')) continue;
    const mode = typeof row?.mode === 'string' ? row.mode.toLowerCase() : undefined;
    if (mode && /^(?:image|video|audio|embedding|music|speech|tts|stt|realtime)(?:[-_].*)?$/.test(mode)) continue;
    const modalities = advertisedModalities(row);
    const sdk = sdkModels.get(id);
    // A Responses transport alone does not prove that an unknown account
    // model can answer text: that same account may expose media endpoints.
    // The installed SDK or explicit catalog metadata must establish a chat
    // route before this row can enter Pi's language-model registry.
    const declaredChatRoute = mode === 'chat' || mode === 'language'
      || (typeof backend === 'string' && backend.toLowerCase() === 'chat');
    if (!sdk && !declaredChatRoute && (!modalities?.input.includes('text') || !modalities.output.includes('text'))) continue;
    const context = positiveInteger(row?.context_window ?? row?.contextWindow) ?? sdk?.contextWindow;
    const output = positiveInteger(row?.max_completion_tokens ?? row?.maxCompletionTokens) ?? sdk?.maxTokens;
    if (!context || !output) continue;
    // Unknown models also need a declared transport; Pi's native xAI entries
    // already have one. Do not guess from a bare model name.
    if (!sdk && typeof backend !== 'string') continue;
    const nativeEfforts = efforts(row?.reasoning_efforts ?? record(row?.capabilities)?.reasoning_effort);
    const sdkEfforts = sdk?.thinkingLevelMap
      ? EFFORT_ORDER.filter(level => sdk.thinkingLevelMap?.[level] != null)
      : undefined;
    const reasoningEfforts = nativeEfforts ?? sdkEfforts;
    const name = typeof row?.name === 'string' && row.name.trim() ? row.name.trim() : sdk?.name ?? id;
    seen.add(id);
    result.push({
      id: `pi/${id}`,
      name,
      shortName: name,
      description: '',
      provider: 'pi',
      contextWindow: context,
      maxOutputTokens: output,
      supportsThinking: reasoningEfforts !== undefined ? reasoningEfforts.length > 0 : sdk?.reasoning ?? false,
      supportsImages: Array.isArray(input) ? input.includes('image') : sdk?.input.includes('image') ?? false,
      ...(modalities ? { modalities } : {}),
      ...(reasoningEfforts ? { reasoningEfforts } : {}),
      ...(sdk?.thinkingLevelMap ? { reasoningDisableSupported: sdk.thinkingLevelMap.off != null } : {}),
      catalogSource: 'provider',
    });
  }
  if (!result.length) throw new Error('Grok subscription returned no runnable models');
  return result;
}

export async function fetchXaiSubscriptionModels(
  accessToken: string,
  timeoutMs = 15_000,
  fetcher: XaiCatalogFetcher = catalogFetcher,
): Promise<ModelDefinition[]> {
  if (!accessToken.trim()) throw new Error('Grok subscription access token is missing');
  const response = await fetcher(`${XAI_SUBSCRIPTION_BASE}/models`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`Grok subscription model catalog failed (HTTP ${response.status})`);
  }
  return parseXaiSubscriptionModels(await response.json());
}

export async function fetchXaiApiModels(
  apiKey: string,
  timeoutMs: number,
  fetchImpl?: XaiCatalogFetcher,
): Promise<ModelDefinition[]> {
  if (!apiKey.trim()) throw new Error('xAI API key is required for model discovery');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const request = fetchImpl ?? catalogFetcher;
  const read = async (path: string): Promise<unknown> => {
    const response = await request(`${XAI_API_BASE}${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`xAI model catalog ${path} returned HTTP ${response.status}`);
    return response.json();
  };
  try {
    const [language, models] = await Promise.all([
      read('/language-models'),
      read('/models'),
    ]);
    return parseXaiApiModels(language, models);
  } finally {
    clearTimeout(timer);
  }
}
