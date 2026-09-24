import type { ProviderDriver, DriverTestConnectionArgs } from '../driver-types.ts';
import type { ModelDefinition } from '../../../../config/models.ts';
import { getAllPiModels, getPiModelsForAuthProvider } from '../../../../config/models-pi.ts';
import { getPiProviderBaseUrl } from '../../../../config/models-pi.ts';
import { fetchXaiApiModels, fetchXaiSubscriptionModels, XAI_SUBSCRIPTION_BASE } from './xai-models.ts';
import { getValidXaiSubscriptionToken } from '../../../../auth/xai-subscription.ts';

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
    customModels: context.connection?.models?.map(m => {
      if (typeof m === 'string') return m;
      const supportsImages = typeof m.supportsImages === 'boolean'
        ? m.supportsImages
        : undefined;
      if (m.contextWindow || supportsImages !== undefined || m.reasoningEfforts || m.maxOutputTokens || m.runtimeApi || m.pricingPerMillion) {
        return {
          id: m.id,
          ...(m.contextWindow ? { contextWindow: m.contextWindow } : {}),
          ...(supportsImages !== undefined ? { supportsImages } : {}),
          ...(m.reasoningEfforts ? { reasoningEfforts: m.reasoningEfforts } : {}),
          ...(m.maxOutputTokens ? { maxOutputTokens: m.maxOutputTokens } : {}),
          ...(m.runtimeApi ? { runtimeApi: m.runtimeApi } : {}),
          ...(m.pricingPerMillion ? { pricingPerMillion: m.pricingPerMillion } : {}),
        };
      }
      return m.id;
    }),
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
    if (connection.piAuthProvider === 'xai' && connection.authType === 'oauth') {
      const models = await fetchXaiSubscriptionModels(await getValidXaiSubscriptionToken(slug), 15_000);
      if (connection.defaultModel && !models.some(model => model.id === connection.defaultModel)) {
        return { success: false, error: `Selected Grok subscription model is unavailable: ${connection.defaultModel}`, shouldRefreshModels: true };
      }
      return { success: true, shouldRefreshModels: true };
    }
    if (connection.piAuthProvider === 'xai' && connection.authType === 'api_key') {
      const apiKey = await credentialManager.getLlmApiKey(slug);
      if (!apiKey) return { success: false, error: 'xAI API key is missing' };
      // A read-only catalog request proves the key can access xAI's inference
      // API without charging for a completion. It does not claim a paid model
      // request or Grok subscription was tested.
      const models = await fetchXaiApiModels(apiKey, 15_000);
      const selected = connection.defaultModel;
      if (selected && !models.some(model => model.id === selected)) {
        return { success: false, error: `Selected xAI model is unavailable: ${selected}`, shouldRefreshModels: true };
      }
      return { success: true, shouldRefreshModels: true };
    }
    // Other Pi connection tests still use their inherited behavior. They must
    // not be described as an inference probe by callers.
    return { success: true };
  },
};
