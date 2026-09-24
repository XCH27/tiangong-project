import { toPiRuntimeModelEntries, type ProviderDriver, type DriverTestConnectionArgs } from '../driver-types.ts';
import type { ModelDefinition } from '../../../../config/models.ts';
import { getAllPiModels, getPiModelsForAuthProvider } from '../../../../config/models-pi.ts';
import { getPiProviderBaseUrl } from '../../../../config/models-pi.ts';
import { fetchXaiApiModels, fetchXaiSubscriptionModels, XAI_SUBSCRIPTION_BASE } from './xai-models.ts';
import { getValidXaiSubscriptionToken } from '../../../../auth/xai-subscription.ts';
import { getValidChatGptOAuthToken } from '../../../../auth/state.ts';
import { fetchOAuthToken } from '../../../../auth/oauth-token-fetch.ts';

// Official endpoints establish account membership. Some add capability fields;
// Pi remains the execution transport and fallback capability source.
const API_ACCOUNT_CATALOGS = {
  openai: { baseUrl: 'https://api.openai.com/v1', modelsUrl: 'https://api.openai.com/v1/models' },
  google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models' },
  deepseek: { baseUrl: 'https://api.deepseek.com', modelsUrl: 'https://api.deepseek.com/models' },
  groq: { baseUrl: 'https://api.groq.com/openai/v1', modelsUrl: 'https://api.groq.com/openai/v1/models' },
  mistral: { baseUrl: 'https://api.mistral.ai', modelsUrl: 'https://api.mistral.ai/v1/models' },
} as const;
type ApiAccountProvider = keyof typeof API_ACCOUNT_CATALOGS;

function isApiAccountProvider(value: string | undefined): value is ApiAccountProvider {
  return !!value && Object.hasOwn(API_ACCOUNT_CATALOGS, value);
}

const CODEX_SUBSCRIPTION_BASE = 'https://chatgpt.com/backend-api/codex';
const CODEX_CLIENT_VERSION = '0.13.4';
const MAX_MODEL_CATALOG_BYTES = 2 * 1024 * 1024;
const CODEX_EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;

async function readBoundedModelJson(response: Response, provider: string): Promise<unknown> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (declaredLength > MAX_MODEL_CATALOG_BYTES) throw new Error(`${provider} model catalog exceeded the response limit`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error(`${provider} returned an empty model catalog`);
  const decoder = new TextDecoder();
  let size = 0;
  let text = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_MODEL_CATALOG_BYTES) {
        await reader.cancel();
        throw new Error(`${provider} model catalog exceeded the response limit`);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${provider} returned invalid model JSON`);
  }
}

function jsonRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function positiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function extractCodexAccountId(...tokens: Array<string | undefined>): string | null {
  for (const token of tokens) {
    if (!token) continue;
    const accountId = extractCodexAccountIdFromToken(token);
    if (accountId) return accountId;
  }
  return null;
}

function extractCodexAccountIdFromToken(token: string): string | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
    const payload = JSON.parse(atob(normalized)) as Record<string, unknown>;
    const auth = jsonRecord(payload['https://api.openai.com/auth']);
    return typeof auth?.chatgpt_account_id === 'string' && auth.chatgpt_account_id.length > 0
      ? auth.chatgpt_account_id
      : null;
  } catch {
    return null;
  }
}

/** Merge the authenticated Codex catalog with Pi's executable metadata. */
export function matchCodexAccountModels(
  payload: unknown,
  sdkModels: readonly ModelDefinition[],
): ModelDefinition[] {
  const rows = jsonRecord(payload)?.models;
  if (!Array.isArray(rows)) throw new Error('Codex returned an invalid model list');
  const native = new Map(sdkModels.map(model => [model.id.replace(/^pi\//, ''), model]));
  const seen = new Set<string>();
  const result: ModelDefinition[] = [];

  for (const value of rows) {
    const row = jsonRecord(value);
    if (!row) continue;
    const id = typeof row?.slug === 'string' ? row.slug.trim() : '';
    if (!id || seen.has(id)) continue;
    if (row?.visibility !== undefined && row.visibility !== 'list') continue;
    const bundled = native.get(id);
    // The current Pi adapter supplies the wire protocol and required output
    // limits. A new server slug is not runnable until Pi knows that route.
    if (!bundled) continue;

    const effortRows = Array.isArray(row.supported_reasoning_levels) ? row.supported_reasoning_levels : undefined;
    const effortValues = effortRows
      ? effortRows.flatMap(item => {
        const effort = jsonRecord(item)?.effort;
        return typeof effort === 'string' ? [effort] : [];
      })
      : undefined;
    const reasoningEfforts = effortValues
      ? CODEX_EFFORTS.filter(level => effortValues.includes(level))
      : bundled.reasoningEfforts;
    const inputModalities = Array.isArray(row.input_modalities)
      ? row.input_modalities.filter((item): item is string => typeof item === 'string')
      : undefined;
    // max_context_window is the ceiling for a user override, not the active
    // context size. Only context_window may replace the Pi adapter's value.
    const contextWindow = positiveInteger(row.context_window) ?? bundled.contextWindow;

    // Pi's bundled cost table is an API estimate. A ChatGPT subscription is
    // allowance-based, so never carry those API prices into the account list.
    const { pricingPerMillion: _pricingPerMillion, ...withoutSubscriptionPricing } = bundled;

    seen.add(id);
    result.push({
      ...withoutSubscriptionPricing,
      id: `pi/${id}`,
      name: typeof row.display_name === 'string' && row.display_name.trim() ? row.display_name.trim() : bundled.name,
      shortName: typeof row.display_name === 'string' && row.display_name.trim() ? row.display_name.trim() : bundled.shortName,
      description: typeof row.description === 'string' ? row.description : bundled.description,
      ...(contextWindow ? { contextWindow } : {}),
      ...(effortRows ? {
        reasoningEfforts: reasoningEfforts ?? [],
        supportsThinking: effortValues?.some(level => level !== 'none' && level !== 'off') ?? false,
        reasoningDisableSupported: effortValues?.includes('none') || effortValues?.includes('off') || false,
      } : {}),
      ...(inputModalities ? { supportsImages: inputModalities.includes('image') } : {}),
      catalogSource: 'provider',
    });
  }
  return result;
}

async function fetchCodexSubscriptionModels(
  accessToken: string,
  idToken: string | undefined,
  timeoutMs: number,
): Promise<ModelDefinition[]> {
  if (!accessToken) throw new Error('ChatGPT access token is required for model discovery');
  // Codex derives the workspace header from the stored ID token. The access
  // token is retained as a fallback for older OAuth payloads that duplicated
  // the account claim there.
  const accountId = extractCodexAccountId(idToken, accessToken);
  if (!accountId) throw new Error('ChatGPT access token has no account identity for model discovery');

  const url = `${CODEX_SUBSCRIPTION_BASE}/models?client_version=${encodeURIComponent(CODEX_CLIENT_VERSION)}`;
  const response = await fetchOAuthToken(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'chatgpt-account-id': accountId,
      originator: 'pi',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`Codex model discovery failed (HTTP ${response.status})`);
  const payload = await readBoundedModelJson(response, 'Codex');
  const models = matchCodexAccountModels(payload, getPiModelsForAuthProvider('openai-codex'));
  if (!models.length) throw new Error('Codex returned no models executable by the installed Pi adapter');
  return models;
}

function hasOfficialCatalogEndpoint(connection: { baseUrl?: string; customEndpoint?: unknown }, provider: ApiAccountProvider): boolean {
  if (connection.customEndpoint) return false;
  const configured = connection.baseUrl?.trim().replace(/\/+$/, '');
  return !configured || configured === API_ACCOUNT_CATALOGS[provider].baseUrl
    || (provider === 'mistral' && configured === 'https://api.mistral.ai/v1');
}

/** Keep only account-visible models for which the installed Pi adapter can execute. */
export function matchApiAccountModels(
  payload: unknown,
  sdkModels: readonly ModelDefinition[],
): ModelDefinition[] {
  if (!payload || typeof payload !== 'object' || !('data' in payload) || !Array.isArray(payload.data)) {
    throw new Error('Provider returned an invalid model list');
  }
  const native = new Map(sdkModels.map(model => [model.id.replace(/^pi\//, ''), model]));
  const seen = new Set<string>();
  const models: ModelDefinition[] = [];
  for (const row of payload.data) {
    if (!row || typeof row !== 'object') continue;
    const id = typeof row.id === 'string' ? row.id.trim() : '';
    if (!id || seen.has(id) || (row.object !== undefined && row.object !== 'model')
      || row.active === false || row.archived === true) continue;
    const capabilities = jsonRecord(row.capabilities);
    if (capabilities?.completion_chat === false) continue;
    seen.add(id);
    const supported = native.get(id);
    if (supported) {
      // Groq and Mistral additionally publish real limits/capabilities. OpenAI
      // and DeepSeek return IDs only, so they retain Pi's installed metadata.
      const contextWindow = positiveInteger(row.context_window) ?? positiveInteger(row.max_context_length);
      const maxOutputTokens = positiveInteger(row.max_completion_tokens);
      const hasProviderMetadata = contextWindow !== undefined || maxOutputTokens !== undefined
        || typeof capabilities?.vision === 'boolean';
      models.push(hasProviderMetadata ? {
        ...supported,
        ...(contextWindow ? { contextWindow } : {}),
        ...(maxOutputTokens ? { maxOutputTokens } : {}),
        ...(typeof capabilities?.vision === 'boolean' ? { supportsImages: capabilities.vision } : {}),
        catalogSource: 'provider',
      } : supported);
    }
  }
  return models;
}

/** Google lists resource names and generation methods, not OpenAI-style model rows. */
export function matchGoogleAccountModels(
  rows: unknown,
  sdkModels: readonly ModelDefinition[],
): ModelDefinition[] {
  if (!Array.isArray(rows)) throw new Error('Google returned an invalid model list');
  const native = new Map(sdkModels.map(model => [model.id.replace(/^pi\//, ''), model]));
  const seen = new Set<string>();
  const models: ModelDefinition[] = [];
  for (const value of rows) {
    const row = jsonRecord(value);
    if (!row) continue;
    const resource = row.name;
    if (typeof resource !== 'string' || !resource.startsWith('models/')) continue;
    const id = resource.slice('models/'.length);
    if (!id || seen.has(id) || !Array.isArray(row.supportedGenerationMethods)
      || !row.supportedGenerationMethods.includes('generateContent')) continue;
    seen.add(id);
    const supported = native.get(id);
    if (!supported) continue;
    const contextWindow = positiveInteger(row.inputTokenLimit);
    const maxOutputTokens = positiveInteger(row.outputTokenLimit);
    const name = typeof row.displayName === 'string' && row.displayName.trim()
      ? row.displayName.trim() : supported.name;
    models.push({
      ...supported,
      name,
      ...(contextWindow ? { contextWindow } : {}),
      ...(maxOutputTokens ? { maxOutputTokens } : {}),
      catalogSource: 'provider',
    });
  }
  return models;
}

async function fetchGoogleAccountModels(apiKey: string, timeoutMs: number): Promise<ModelDefinition[]> {
  const rows: unknown[] = [];
  const seenTokens = new Set<string>();
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const url = new URL(API_ACCOUNT_CATALOGS.google.modelsUrl);
    url.searchParams.set('pageSize', '100');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetchOAuthToken(url.toString(), {
      method: 'GET',
      headers: { 'x-goog-api-key': apiKey, Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) throw new Error(`Google model discovery failed (HTTP ${response.status})`);
    const payload = jsonRecord(await readBoundedModelJson(response, 'Google'));
    if (!payload || !Array.isArray(payload.models)) throw new Error('Google returned an invalid model list');
    rows.push(...payload.models);
    const next = typeof payload.nextPageToken === 'string' ? payload.nextPageToken : undefined;
    if (!next) {
      const models = matchGoogleAccountModels(rows, getPiModelsForAuthProvider('google'));
      if (!models.length) throw new Error('Google returned no models executable by the installed Pi adapter');
      return models;
    }
    if (seenTokens.has(next)) throw new Error('Google model catalog repeated a page token');
    seenTokens.add(next);
    pageToken = next;
  }
  throw new Error('Google model catalog exceeded the page limit');
}

async function fetchIdOnlyAccountModels(
  provider: ApiAccountProvider,
  apiKey: string,
  timeoutMs: number,
): Promise<ModelDefinition[]> {
  if (!apiKey) throw new Error(`${provider} API key is required for model discovery`);
  if (provider === 'google') return fetchGoogleAccountModels(apiKey, timeoutMs);
  const response = await fetchOAuthToken(API_ACCOUNT_CATALOGS[provider].modelsUrl, {
    method: 'GET',
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${provider} model discovery failed (HTTP ${response.status})`);
  const payload = await readBoundedModelJson(response, provider);
  const models = matchApiAccountModels(payload, getPiModelsForAuthProvider(provider));
  if (!models.length) throw new Error(`${provider} returned no models executable by the installed Pi adapter`);
  return models;
}

// ── Copilot model types ────────────────────────────────────────────────
type RawCopilotModel = {
  id: string;
  name: string;
  supportedReasoningEfforts?: string[];
  policy?: { state: string };
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsImages?: boolean;
  runtimeApi?: 'anthropic-messages' | 'openai-completions' | 'openai-responses';
  pickerEnabled?: boolean;
  streaming?: boolean;
  toolCalls?: boolean;
};

const COPILOT_REASONING_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'] as const;
type CopilotReasoningLevel = typeof COPILOT_REASONING_LEVELS[number];

function advertisedCopilotEfforts(value: readonly string[] | undefined): CopilotReasoningLevel[] | undefined {
  if (!value) return undefined;
  const levels = value.filter((level): level is CopilotReasoningLevel =>
    COPILOT_REASONING_LEVELS.includes(level as CopilotReasoningLevel),
  );
  return levels.length > 0 ? [...new Set(levels)] : [];
}

// ── Direct HTTP approach ─────────────────────────────────────────────

/** Headers that identify us as a VS Code Copilot client (same as Pi SDK). */
const COPILOT_HEADERS = {
  'User-Agent': 'GitHubCopilotChat/0.35.0',
  'Editor-Version': 'vscode/1.107.0',
  'Editor-Plugin-Version': 'copilot-chat/0.35.0',
  'Copilot-Integration-Id': 'vscode-chat',
} as const;

/**
 * Fetch models directly from the Copilot API via HTTP.
 *
 * 1. Exchange GitHub OAuth token → Copilot API token (via Pi SDK)
 * 2. Extract base URL from token's proxy-ep field
 * 3. GET /models to list available models with policy state
 *
 * No CLI subprocess, no PATH issues, no env contamination.
 */
async function listModelsViaHttp(
  githubToken: string,
  timeoutMs: number,
): Promise<RawCopilotModel[]> {
  const { refreshGitHubCopilotToken, getBaseUrlFromToken } = await import('../../../../auth/github-copilot.ts');

  // Step 1: Exchange GitHub OAuth token → Copilot API token
  const creds = await refreshGitHubCopilotToken(githubToken, { timeoutMs });
  const copilotToken = creds.access;

  // Step 2: Extract base URL from token
  const baseUrl = getBaseUrlFromToken(copilotToken);
  if (!baseUrl) {
    throw new Error('Could not extract API base URL from Copilot token (missing proxy-ep)');
  }

  console.warn(`[listModelsViaHttp] token exchange OK, baseUrl=${baseUrl}`);

  // Step 3: GET /models
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { fetchOAuthToken } = await import('../../../../auth/oauth-token-fetch.ts');
    const res = await fetchOAuthToken(`${baseUrl}/models`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${copilotToken}`,
        ...COPILOT_HEADERS,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Copilot API ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = await res.json() as Record<string, unknown>;
    // Handle both { models: [...] } and { data: [...] } response formats
    const models = (data.models || data.data || []) as Record<string, unknown>[];

    console.warn(`[listModelsViaHttp] GET /models returned ${models.length} models`);

    return parseCopilotAccountModels(models);
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('Copilot models API timed out');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** The account catalog is the membership source; unknown fields stay unknown. */
export function parseCopilotAccountModels(entries: Record<string, unknown>[]): RawCopilotModel[] {
  const result: RawCopilotModel[] = [];
  for (const entry of entries) {
    const id = typeof entry.id === 'string' ? entry.id.trim() : '';
    if (!id || id.startsWith('accounts/') || (entry.object && entry.object !== 'model')) continue;
    const capabilities = entry.capabilities && typeof entry.capabilities === 'object'
      ? entry.capabilities as Record<string, unknown> : {};
    if (capabilities.type && capabilities.type !== 'chat') continue;
    const limits = capabilities.limits && typeof capabilities.limits === 'object'
      ? capabilities.limits as Record<string, unknown> : {};
    const supports = capabilities.supports && typeof capabilities.supports === 'object'
      ? capabilities.supports as Record<string, unknown> : {};
    const vendor = typeof entry.vendor === 'string' ? entry.vendor.toLowerCase() : '';
    // Same transport split used by OpenClaw's Copilot adapter. Pi owns the
    // request implementation; this metadata only selects its existing API.
    const runtimeApi = vendor === 'anthropic' || id.toLowerCase().includes('claude')
      ? 'anthropic-messages' as const
      : /(?:^|[-_.])gemini(?:$|[-_.])/.test(id.toLowerCase())
        ? 'openai-completions' as const
        : 'openai-responses' as const;
    const efforts = supports.reasoning_effort ?? entry.supportedReasoningEfforts ?? entry.supported_reasoning_efforts;
    const context = limits.max_context_window_tokens;
    const output = limits.max_output_tokens;
    result.push({
      id,
      name: typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim() : id,
      supportedReasoningEfforts: Array.isArray(efforts) ? efforts.filter((value): value is string => typeof value === 'string') : undefined,
      policy: entry.policy && typeof entry.policy === 'object' ? entry.policy as { state: string } : undefined,
      contextWindow: typeof context === 'number' && Number.isSafeInteger(context) && context > 0 ? context : undefined,
      maxOutputTokens: typeof output === 'number' && Number.isSafeInteger(output) && output > 0 ? output : undefined,
      supportsImages: typeof supports.vision === 'boolean' ? supports.vision : undefined,
      runtimeApi,
      pickerEnabled: typeof entry.model_picker_enabled === 'boolean' ? entry.model_picker_enabled : undefined,
      streaming: typeof supports.streaming === 'boolean' ? supports.streaming : undefined,
      toolCalls: typeof supports.tool_calls === 'boolean' ? supports.tool_calls : undefined,
    });
  }
  return result;
}

/** Model ID prefixes to exclude — legacy models that clutter the selector. */
const EXCLUDED_MODEL_PREFIXES = ['gpt-4', 'gpt-3.5'];

/** Filter raw models to only those explicitly enabled by policy, excluding legacy models. */
function filterEnabledModels(models: RawCopilotModel[]): RawCopilotModel[] {
  return models.filter(m =>
    m.policy?.state === 'enabled'
    && m.pickerEnabled !== false
    && m.streaming !== false
    && m.toolCalls !== false
    && !EXCLUDED_MODEL_PREFIXES.some(prefix => m.id.startsWith(prefix)),
  );
}

/** Convert raw Copilot models to our ModelDefinition format. */
export function toCopilotModelDefinitions(models: RawCopilotModel[], sdkModels = getPiModelsForAuthProvider('github-copilot')): ModelDefinition[] {
  const bundled = new Map(sdkModels.map(model => [model.id.replace(/^pi\//, ''), model]));
  return models.flatMap(m => {
    const native = bundled.get(m.id);
    const contextWindow = m.contextWindow ?? native?.contextWindow;
    const maxOutputTokens = m.maxOutputTokens ?? native?.maxOutputTokens;
    // An unknown model without limits cannot be registered safely in Pi.
    if (!contextWindow || !maxOutputTokens) return [];
    const reasoningEfforts = advertisedCopilotEfforts(m.supportedReasoningEfforts);
    return [{
      id: m.id,
      name: m.name,
      shortName: m.name,
      description: '',
      provider: 'pi' as const,
      contextWindow,
      maxOutputTokens,
      runtimeApi: native?.runtimeApi ?? m.runtimeApi,
      supportsImages: m.supportsImages ?? native?.supportsImages,
      supportsThinking: reasoningEfforts !== undefined ? reasoningEfforts.length > 0 : native?.supportsThinking,
      ...(reasoningEfforts !== undefined ? { reasoningEfforts } : {}),
      catalogSource: 'provider' as const,
    }];
  });
}

/** Log a breakdown of models by policy state. */
function logModelBreakdown(tag: string, models: RawCopilotModel[]): void {
  const byState = new Map<string, string[]>();
  for (const m of models) {
    const state = m.policy?.state ?? 'no-policy';
    const list = byState.get(state) ?? [];
    list.push(m.id);
    byState.set(state, list);
  }
  const breakdown = [...byState.entries()].map(([s, ids]) => `${s}=${ids.length}(${ids.join(',')})`).join('; ');
  console.warn(`[fetchCopilotModels] ${tag}: total=${models.length} enabled=${filterEnabledModels(models).length} | ${breakdown}`);
}

/**
 * Fetch account membership. ModelRefreshService owns fallback order so a
 * failed account request cannot replace a previously saved live catalog with
 * the unscoped Pi SDK catalog.
 */
async function fetchCopilotModels(
  piSdkGitHubToken: string,
  timeoutMs: number,
): Promise<{ models: ModelDefinition[]; source: 'provider' | 'sdk' }> {
  try {
    const raw = await listModelsViaHttp(piSdkGitHubToken, timeoutMs);
    if (raw.length > 0) {
      logModelBreakdown('tier1-httpApi', raw);
      const enabled = filterEnabledModels(raw);
      if (enabled.length > 0) {
        const runnable = toCopilotModelDefinitions(enabled);
        if (runnable.length > 0) return { models: runnable, source: 'provider' };
        console.warn('[fetchCopilotModels] live models lacked runnable context/output metadata');
      }
      console.warn(`[fetchCopilotModels] account catalog returned no runnable enabled models`);
    }
  } catch (err) {
    console.warn(`[fetchCopilotModels] tier1-httpApi failed: ${(err as Error).message}`);
    throw err;
  }
  throw new Error('No runnable Copilot models in the account catalog');
}

/**
 * Lightweight direct HTTP test for Pi providers that expose an Anthropic-compatible
 * messages endpoint. Avoids spawning a full Pi subprocess (which can exceed the
 * 20s test timeout due to SDK initialization overhead).
 */
async function testAnthropicCompatible(
  apiKey: string,
  baseUrl: string,
  model: string,
  timeoutMs: number,
): Promise<{ success: boolean; error?: string }> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/messages`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 16,
        messages: [{ role: 'user', content: 'Say ok' }],
      }),
    });

    if (res.ok) return { success: true };

    const text = await res.text().catch(() => '');
    return { success: false, error: `${res.status} ${text}`.slice(0, 500) };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { success: false, error: 'Connection test timed out' };
    }
    return { success: false, error: (err as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

export const piDriver: ProviderDriver = {
  provider: 'pi',
  buildRuntime: ({ context, providerOptions, resolvedPaths }) => ({
    paths: {
      piServer: resolvedPaths.piServerPath,
      interceptor: resolvedPaths.interceptorBundlePath,
      node: resolvedPaths.nodeRuntimePath,
    },
    piAuthProvider: providerOptions?.piAuthProvider || context.connection?.piAuthProvider,
    baseUrl: context.connection?.baseUrl,
    customEndpoint: context.connection?.customEndpoint,
    customModels: toPiRuntimeModelEntries(context.connection?.models),
  }),
  fetchModels: async ({ connection, credentials, timeoutMs }) => {
    // Copilot OAuth: fetch models directly from the Copilot API via HTTP.
    // Uses the GitHub OAuth token (our refreshToken) to exchange for a
    // Copilot API token, then queries GET /models for the live model list.
    const copilotGitHubToken = credentials.oauthRefreshToken || credentials.oauthAccessToken;
    if (connection.piAuthProvider === 'github-copilot' && copilotGitHubToken) {
      return fetchCopilotModels(copilotGitHubToken, timeoutMs);
    }

    // xAI API keys have an official live catalog. Its model membership and
    // capabilities are account-scoped; the bundled Pi catalog is only an
    // offline fallback retained by ModelRefreshService.
    if (connection.piAuthProvider === 'xai' && connection.authType === 'api_key') {
      const models = await fetchXaiApiModels(credentials.apiKey ?? '', timeoutMs);
      return { models, source: 'provider', serverDefault: models.find(m => m.id === connection.defaultModel)?.id ?? models[0]?.id };
    }
    if (connection.piAuthProvider === 'xai' && connection.authType === 'oauth') {
      const models = await fetchXaiSubscriptionModels(await getValidXaiSubscriptionToken(connection.slug), timeoutMs);
      return { models, source: 'provider', serverDefault: models.find(m => m.id === connection.defaultModel)?.id ?? models[0]?.id };
    }

    // ChatGPT subscriptions expose an account-scoped Codex catalog with
    // capability metadata. Keep the OAuth account identity in the request and
    // merge the response into Pi's existing openai-codex adapter.
    if (connection.piAuthProvider === 'openai-codex' && connection.authType === 'oauth') {
      const models = await fetchCodexSubscriptionModels(
        credentials.oauthAccessToken ?? '',
        credentials.oauthIdToken,
        timeoutMs,
      );
      return { models, source: 'provider', serverDefault: models.find(m => m.id === connection.defaultModel)?.id ?? models[0]?.id };
    }

    // Official API lists establish account membership. Groq and Mistral also
    // return bounded capability metadata; Pi still owns the runnable adapter.
    // Custom endpoints retain their explicit user-configured model list.
    const accountProvider = connection.piAuthProvider;
    if (connection.authType === 'api_key' && isApiAccountProvider(accountProvider)
      && hasOfficialCatalogEndpoint(connection, accountProvider)) {
      const models = await fetchIdOnlyAccountModels(accountProvider, credentials.apiKey ?? '', timeoutMs);
      return { models, source: 'provider', serverDefault: models.find(m => m.id === connection.defaultModel)?.id ?? models[0]?.id };
    }

    // All other Pi providers: use static Pi SDK model registry
    const models = connection.piAuthProvider
      ? getPiModelsForAuthProvider(connection.piAuthProvider)
      : getAllPiModels();

    if (models.length === 0) {
      throw new Error(
        `No Pi models found for provider: ${connection.piAuthProvider ?? 'all'}`,
      );
    }

    return { models, source: 'sdk' };
  },
  testConnection: async (args: DriverTestConnectionArgs): Promise<{ success: boolean; error?: string } | null> => {
    const piAuthProvider = args.connection?.piAuthProvider;
    if (!piAuthProvider) {
      // No provider hint — fall back to generic subprocess path
      return null;
    }

    if (piAuthProvider === 'xai'
      && args.baseUrl?.trim().replace(/\/+$/, '') === XAI_SUBSCRIPTION_BASE
      && !args.connection?.customEndpoint) {
      try {
        await fetchXaiSubscriptionModels(args.apiKey, args.timeoutMs);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    if (piAuthProvider === 'xai'
      && (!args.baseUrl || args.baseUrl.trim().replace(/\/+$/, '') === 'https://api.x.ai/v1')
      && !args.connection?.customEndpoint) {
      try {
        // xAI's account-scoped catalog validates the API key without charging
        // for an inference. The selected model is reconciled after discovery.
        await fetchXaiApiModels(args.apiKey, args.timeoutMs);
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    // Resolve the model's API type from the Pi SDK registry.
    // For anthropic-messages providers, do a lightweight direct HTTP test
    // instead of spawning a full Pi subprocess (which can exceed the timeout).
    let modelApi: string | undefined;
    let modelBaseUrl: string | undefined;
    try {
      const { getModels } = await import('@earendil-works/pi-ai/compat');
      const models = getModels(piAuthProvider as Parameters<typeof getModels>[0]);
      const requestedId = args.model.startsWith('pi/') ? args.model.slice(3) : args.model;
      const match = models.find(m => m.id === requestedId) || models[0];
      if (match) {
        modelApi = (match as { api?: string }).api;
        modelBaseUrl = (match as { baseUrl?: string }).baseUrl;
      }
    } catch { /* ignore — fall through to subprocess */ }

    if (modelApi !== 'anthropic-messages') {
      // Non-Anthropic API types need the full Pi SDK — let factory.ts handle it
      return null;
    }

    const baseUrl = args.baseUrl?.trim() || modelBaseUrl || getPiProviderBaseUrl(piAuthProvider);
    if (!baseUrl) {
      return { success: false, error: 'Could not determine API endpoint for provider' };
    }

    // Strip Pi SDK's 'pi/' prefix — Anthropic-compatible endpoints only accept bare model IDs
    let bareModel = args.model.startsWith('pi/') ? args.model.slice(3) : args.model;
    // MiniMax CN API doesn't accept the 'MiniMax-' prefix on model names
    if (piAuthProvider === 'minimax-cn' && bareModel.startsWith('MiniMax-')) {
      bareModel = bareModel.slice('MiniMax-'.length);
    }
    return testAnthropicCompatible(args.apiKey, baseUrl, bareModel, args.timeoutMs);
  },
  validateStoredConnection: async ({ slug, connection, credentialManager }) => {
    const selectedUnavailable = (models: readonly ModelDefinition[], account: string) =>
      connection.defaultModel && !models.some(model => model.id === connection.defaultModel)
        ? { success: false, error: `Selected ${account} model is unavailable: ${connection.defaultModel}`, shouldRefreshModels: true }
        : null;

    if (connection.piAuthProvider === 'xai' && connection.authType === 'oauth') {
      const models = await fetchXaiSubscriptionModels(await getValidXaiSubscriptionToken(slug), 15_000);
      const unavailable = selectedUnavailable(models, 'Grok subscription');
      if (unavailable) return unavailable;
      return { success: true, shouldRefreshModels: true };
    }
    if (connection.piAuthProvider === 'xai' && connection.authType === 'api_key') {
      const apiKey = await credentialManager.getLlmApiKey(slug);
      if (!apiKey) return { success: false, error: 'xAI API key is missing' };
      // A read-only catalog request proves the key can access xAI's inference
      // API without charging for a completion. It does not claim a paid model
      // request or Grok subscription was tested.
      const models = await fetchXaiApiModels(apiKey, 15_000);
      const unavailable = selectedUnavailable(models, 'xAI');
      if (unavailable) return unavailable;
      return { success: true, shouldRefreshModels: true };
    }
    if (connection.piAuthProvider === 'github-copilot' && connection.authType === 'oauth') {
      const stored = await credentialManager.getLlmOAuth(slug);
      const githubToken = stored?.refreshToken || stored?.accessToken;
      if (!githubToken) return { success: false, error: 'GitHub Copilot credential is missing' };
      const { models } = await fetchCopilotModels(githubToken, 15_000);
      const unavailable = selectedUnavailable(models, 'GitHub Copilot');
      if (unavailable) return unavailable;
      return { success: true, shouldRefreshModels: true };
    }
    if (connection.piAuthProvider === 'openai-codex' && connection.authType === 'oauth' && !connection.customEndpoint) {
      const token = await getValidChatGptOAuthToken(slug, credentialManager);
      if (!token.accessToken) return { success: false, error: 'ChatGPT credential is missing or expired' };
      const models = await fetchCodexSubscriptionModels(token.accessToken, token.idToken, 15_000);
      const unavailable = selectedUnavailable(models, 'ChatGPT/Codex');
      if (unavailable) return unavailable;
      return { success: true, shouldRefreshModels: true };
    }
    const accountProvider = connection.piAuthProvider;
    if (connection.authType === 'api_key' && isApiAccountProvider(accountProvider)
      && hasOfficialCatalogEndpoint(connection, accountProvider)) {
      const apiKey = await credentialManager.getLlmApiKey(slug);
      if (!apiKey) return { success: false, error: `${accountProvider} API key is missing` };
      const models = await fetchIdOnlyAccountModels(accountProvider, apiKey, 15_000);
      const unavailable = selectedUnavailable(models, accountProvider);
      if (unavailable) return unavailable;
      return { success: true, shouldRefreshModels: true };
    }
    // Providers without an account catalog retain Craft's inherited behavior.
    // This is only a credential-presence check, not an inference probe.
    return { success: true };
  },
};
