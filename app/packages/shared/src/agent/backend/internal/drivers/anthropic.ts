import type { ProviderDriver } from '../driver-types.ts';
import { applyAnthropicRuntimeBootstrap } from '../runtime-resolver.ts';
import { validateAnthropicConnection } from '../../../../config/llm-validation.ts';
import { DEFAULT_MODEL, getModelById, getModelContextWindow, isAdaptiveThinkingAlwaysOnModel, normalizeDeprecatedModelId } from '../../../../config/models.ts';

type AnthropicModelRow = {
  id: string;
  display_name: string;
  created_at: string;
  type: string;
  max_input_tokens?: number | null;
  max_tokens?: number | null;
  capabilities?: {
    effort?: {
      supported?: boolean;
      low?: { supported?: boolean } | null;
      medium?: { supported?: boolean } | null;
      high?: { supported?: boolean } | null;
      xhigh?: { supported?: boolean } | null;
      max?: { supported?: boolean } | null;
    } | null;
    thinking?: {
      supported?: boolean;
      types?: { adaptive?: { supported?: boolean } | null } | null;
    } | null;
    image_input?: { supported?: boolean } | null;
  } | null;
};

function positiveInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function advertisedEfforts(row: AnthropicModelRow): Array<'low' | 'medium' | 'high' | 'xhigh' | 'max'> | undefined {
  const effort = row.capabilities?.effort;
  if (!effort || typeof effort.supported !== 'boolean') return undefined;
  if (!effort.supported) return [];
  return (['low', 'medium', 'high', 'xhigh', 'max'] as const)
    .filter(level => effort[level]?.supported === true);
}

export const anthropicDriver: ProviderDriver = {
  provider: 'anthropic',
  initializeHostRuntime: ({ hostRuntime, resolvedPaths }) => {
    // Set paths opportunistically — don't throw on missing.
    // Missing paths will be caught at session start (prepareRuntime).
    applyAnthropicRuntimeBootstrap(hostRuntime, resolvedPaths, { strict: false });
  },
  prepareRuntime: ({ hostRuntime, resolvedPaths }) => {
    applyAnthropicRuntimeBootstrap(hostRuntime, resolvedPaths);
  },
  buildRuntime: () => ({}),
  fetchModels: async ({ connection, credentials, timeoutMs }) => {
    // After legacy migration, only direct 'anthropic' connections reach this driver.
    // iam_credentials and service_account_file are no longer valid auth types for anthropic.

    const apiKey = credentials.apiKey;
    const oauthAccessToken = credentials.oauthAccessToken;

    if (!apiKey && !oauthAccessToken) {
      throw new Error('Anthropic credentials required to fetch models');
    }

    const baseUrl = connection.baseUrl || 'https://api.anthropic.com';
    const headers: Record<string, string> = {
      'anthropic-version': '2023-06-01',
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    } else {
      headers.authorization = `Bearer ${oauthAccessToken}`;
      // Claude.ai subscription tokens require the same OAuth beta route used
      // by the Claude Code runtime; the API-key route must not send this header.
      headers['anthropic-beta'] = 'oauth-2025-04-20';
    }

    const allRawModels: AnthropicModelRow[] = [];
    let afterId: string | undefined;

    for (let page = 0; page < 5; page++) {
      const params = new URLSearchParams({ limit: '100' });
      if (afterId) params.set('after_id', afterId);

      const response = await fetch(`${baseUrl}/v1/models?${params}`, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) {
        throw new Error(`Anthropic /v1/models failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as {
        data: AnthropicModelRow[];
        has_more: boolean;
        first_id: string;
        last_id: string;
      };
      if (!Array.isArray(data.data)) {
        throw new Error('Anthropic /v1/models returned an invalid model list');
      }
      allRawModels.push(...data.data);

      if (data.has_more && data.last_id) {
        if (data.last_id === afterId) {
          throw new Error('Anthropic /v1/models returned a repeated cursor');
        }
        afterId = data.last_id;
      } else {
        break;
      }
      if (page === 4) {
        throw new Error('Anthropic /v1/models exceeded the page limit');
      }
    }

    if (allRawModels.length === 0) {
      throw new Error('No models returned from Anthropic API');
    }

    const seen = new Set<string>();
    const models = allRawModels
      .filter(m => m.id.startsWith('claude-') && !m.id.startsWith('claude-2') && !m.id.startsWith('claude-instant') && !m.id.startsWith('claude-1'))
      // The live Anthropic API can still list deprecated models. Do not persist
      // them back into active connection catalogs at startup.
      .filter(m => normalizeDeprecatedModelId(m.id) === m.id)
      .filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      })
      .map(m => {
        const registryModel = getModelById(m.id);
        const reasoningEfforts = advertisedEfforts(m);
        const contextWindow = positiveInteger(m.max_input_tokens) ?? getModelContextWindow(m.id);
        return {
          id: m.id,
          name: m.display_name?.trim() || registryModel?.name || m.id,
          shortName: registryModel?.shortName ?? (() => {
            const stripped = m.id
              .replace('claude-', '')
              .replace(/-\d{8}$/, '')
              .replace(/-latest$/, '');
            const variant = stripped
              .replace(/^[\d.-]+/, '')
              .replace(/-[\d.]+$/, '')
              .replace(/^-/, '');
            return variant ? variant.charAt(0).toUpperCase() + variant.slice(1) : stripped;
          })(),
          description: registryModel?.description ?? '',
          descriptionKey: registryModel?.descriptionKey,
          provider: 'anthropic' as const,
          ...(contextWindow ? { contextWindow } : {}),
          supportsThinking: typeof m.capabilities?.thinking?.supported === 'boolean'
            ? m.capabilities.thinking.supported
            : registryModel?.supportsThinking,
          ...(typeof m.capabilities?.thinking?.types?.adaptive?.supported === 'boolean'
            ? { adaptiveThinkingSupported: m.capabilities.thinking.types.adaptive.supported }
            : {}),
          // The Models API advertises thinking support, not whether it may be
          // disabled. Anthropic's documented always-on model families are the
          // exception; other thinking-capable Claude models accept disabled.
          ...(m.capabilities?.thinking?.supported === true
            ? { reasoningDisableSupported: !isAdaptiveThinkingAlwaysOnModel(m.id) }
            : {}),
          supportsImages: typeof m.capabilities?.image_input?.supported === 'boolean'
            ? m.capabilities.image_input.supported
            : registryModel?.supportsImages,
          ...(reasoningEfforts !== undefined ? { reasoningEfforts } : {}),
          ...(positiveInteger(m.max_tokens) !== undefined ? { maxOutputTokens: positiveInteger(m.max_tokens) } : {}),
        };
      });

    return {
      models,
      source: 'provider' as const,
      serverDefault: models.some(m => m.id === DEFAULT_MODEL) ? DEFAULT_MODEL : models[0]?.id,
    };
  },
  validateStoredConnection: async ({ slug, connection, credentialManager }) => {
    // After legacy migration, only direct 'anthropic' connections reach this driver.

    if (connection.providerType === 'anthropic' && connection.authType === 'oauth') {
      const { getValidClaudeOAuthToken } = await import('../../../../auth/state.ts');
      const tokenResult = await getValidClaudeOAuthToken(slug);
      if (!tokenResult.accessToken) {
        const errorMsg = tokenResult.migrationRequired?.message || 'OAuth token expired. Please re-authenticate.';
        return { success: false, error: errorMsg };
      }
      return { success: true };
    }

    let apiKey: string | null = null;
    let oauthToken: string | null = null;

    if (connection.authType === 'api_key' || connection.authType === 'api_key_with_endpoint') {
      apiKey = await credentialManager.getLlmApiKey(slug);
    } else if (connection.authType === 'bearer_token') {
      oauthToken = await credentialManager.getLlmApiKey(slug);
    } else if (connection.authType === 'environment') {
      apiKey = process.env.ANTHROPIC_API_KEY || null;
      if (!apiKey) {
        return { success: false, error: 'ANTHROPIC_API_KEY environment variable not set' };
      }
    } else if (connection.authType === 'none') {
      apiKey = 'ollama';
    }

    if (!apiKey && !oauthToken && connection.authType !== 'none') {
      return { success: false, error: 'Could not retrieve credentials' };
    }

    const testModel = connection.defaultModel!;
    const validationResult = await validateAnthropicConnection({
      model: testModel,
      apiKey: apiKey || undefined,
      oauthToken: oauthToken || undefined,
      baseUrl: connection.baseUrl || undefined,
    });

    if (!validationResult.success) {
      return { success: false, error: validationResult.error };
    }

    return { success: true };
  },
};
