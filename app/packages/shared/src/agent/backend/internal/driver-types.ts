import type {
  AgentProvider,
  BackendConfig,
  BackendHostRuntimeContext,
  CoreBackendConfig,
  LlmAuthType,
  LlmProviderType,
} from '../types.ts';
import type { LlmConnection } from '../../../config/storage.ts';
import type { ModelFetchResult } from '../../../config/model-fetcher.ts';
import type { ModelDefinition, ModelPricingPerMillion } from '../../../config/models.ts';
import type { CredentialManager } from '../../../credentials/manager.ts';
import type { ResolvedBackendRuntimePaths } from './runtime-resolver.ts';

export interface BackendRuntimePaths {
  copilotCli?: string;
  interceptor?: string;
  sessionServer?: string;
  node?: string;
  bridgeServer?: string;
  piServer?: string;
}

export type PiRuntimeModelEntry = string | {
  id: string;
  contextWindow?: number;
  supportsImages?: boolean;
  reasoningEfforts?: Array<'low' | 'medium' | 'high' | 'xhigh' | 'max'>;
  maxOutputTokens?: number;
  runtimeApi?: 'anthropic-messages' | 'openai-completions' | 'openai-responses';
  /** Only an authenticated provider catalog may introduce an official native route. */
  catalogSource?: 'provider' | 'sdk';
  pricingPerMillion?: ModelPricingPerMillion;
};

/** One projection for startup, live refresh, and runtime drift detection. */
export function toPiRuntimeModelEntries(
  models: readonly (ModelDefinition | string)[] | undefined,
): PiRuntimeModelEntry[] | undefined {
  return models?.map(model => {
    if (typeof model === 'string') return model;
    const supportsImages = typeof model.supportsImages === 'boolean' ? model.supportsImages : undefined;
    if (!model.contextWindow && supportsImages === undefined && !model.reasoningEfforts
      && !model.maxOutputTokens && !model.runtimeApi && !model.pricingPerMillion
      && model.catalogSource !== 'provider') return model.id;
    return {
      id: model.id,
      ...(model.contextWindow ? { contextWindow: model.contextWindow } : {}),
      ...(supportsImages !== undefined ? { supportsImages } : {}),
      ...(model.reasoningEfforts ? { reasoningEfforts: model.reasoningEfforts } : {}),
      ...(model.maxOutputTokens ? { maxOutputTokens: model.maxOutputTokens } : {}),
      ...(model.runtimeApi ? { runtimeApi: model.runtimeApi } : {}),
      ...(model.catalogSource === 'provider' ? { catalogSource: 'provider' as const } : {}),
      ...(model.pricingPerMillion ? { pricingPerMillion: model.pricingPerMillion } : {}),
    };
  });
}

export interface BackendRuntimePayload extends Record<string, unknown> {
  paths?: BackendRuntimePaths;
  piAuthProvider?: string;
  /** Custom base URL from the LLM connection (e.g. Azure OpenAI endpoint). */
  baseUrl?: string;
  /** Custom endpoint protocol config (api type for routing). */
  customEndpoint?: { api: string; supportsImages?: boolean };
  /** Selected connection models; custom endpoints register routes, official native catalogs may refine or add proven routes. */
  customModels?: PiRuntimeModelEntry[];
}

export interface BackendResolutionContext {
  connection: LlmConnection | null;
  provider: AgentProvider;
  authType?: LlmAuthType;
  resolvedModel: string;
  capabilities: {
    needsHttpPoolServer: boolean;
  };
}

export interface BackendProviderOptions {
  piAuthProvider?: string;
}

export interface BackendModelFetchCredentials {
  apiKey?: string;
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthIdToken?: string;
}

export interface DriverHostRuntimeArgs {
  hostRuntime: BackendHostRuntimeContext;
  resolvedPaths: ResolvedBackendRuntimePaths;
}

export interface DriverBuildArgs {
  context: BackendResolutionContext;
  coreConfig: CoreBackendConfig;
  hostRuntime: BackendHostRuntimeContext;
  resolvedPaths: ResolvedBackendRuntimePaths;
  providerOptions?: BackendProviderOptions;
}

export interface DriverFetchModelsArgs extends DriverHostRuntimeArgs {
  connection: LlmConnection;
  credentials: BackendModelFetchCredentials;
  timeoutMs: number;
}

export interface StoredConnectionValidationResult {
  success: boolean;
  error?: string;
  shouldRefreshModels?: boolean;
}

export interface DriverValidateStoredConnectionArgs extends DriverHostRuntimeArgs {
  slug: string;
  connection: LlmConnection;
  credentialManager: CredentialManager;
}

export interface DriverTestConnectionArgs extends DriverHostRuntimeArgs {
  provider: AgentProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  connection?: Pick<LlmConnection, 'providerType' | 'piAuthProvider' | 'customEndpoint'>;
  timeoutMs: number;
}

export interface ProviderDriver {
  provider: AgentProvider;
  initializeHostRuntime?: (args: DriverHostRuntimeArgs) => void;
  fetchModels?: (args: DriverFetchModelsArgs) => Promise<ModelFetchResult>;
  validateStoredConnection?: (args: DriverValidateStoredConnectionArgs) => Promise<StoredConnectionValidationResult>;
  testConnection?: (args: DriverTestConnectionArgs) => Promise<{ success: boolean; error?: string } | null>;
  prepareRuntime?: (args: DriverBuildArgs) => void;
  buildRuntime: (args: DriverBuildArgs) => BackendRuntimePayload;
}

/**
 * Internal resolved config consumed by concrete backend implementations.
 */
export interface ResolvedBackendConfig extends BackendConfig {
  runtime?: BackendRuntimePayload;
}

export function getBackendRuntime(config: BackendConfig): BackendRuntimePayload {
  return (config.runtime ?? {}) as BackendRuntimePayload;
}

export function getDefaultProviderType(provider: AgentProvider): LlmProviderType {
  switch (provider) {
    case 'anthropic':
      return 'anthropic';
    case 'pi':
      return 'pi';
  }
}
