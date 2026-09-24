/**
 * Model Refresh Service
 *
 * Centralized service for fetching and refreshing model lists across all providers.
 * Replaces the scattered fetchAndStore*Models() functions and startCodexModelRefresh().
 *
 * Fallback chain (same for every provider):
 * 1. Provider runtime discovery via backend driver dispatch
 * 2. Persisted connection.models — previously fetched, survives offline/restart
 * 3. MODEL_REGISTRY — hardcoded offline seed data, last resort
 */

import type { ModelFetcherMap, ModelFetcherCredentials, FetchableProvider } from '@craft-agent/shared/config'
import type { ModelDefinition } from '@craft-agent/shared/config'
import {
  getLlmConnections,
  getLlmConnection,
  updateLlmConnection,
  isCompatProvider,
  getModelsForProviderType,
} from '@craft-agent/shared/config'
import { MODEL_FETCHERS } from './registry'
import { mergeClaudeSdkCapabilities } from './anthropic'
import { handlerLog } from './runtime'

/** Copilot models are server-managed — refresh every 10 minutes to pick up policy changes. */
const COPILOT_REFRESH_INTERVAL_MS = 10 * 60 * 1000
/** Account catalogs are live, but do not need a minute-scale poll. */
const ACCOUNT_CATALOG_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000

function isXaiAccountCatalog(connection: { providerType: string; piAuthProvider?: string; authType?: string }): boolean {
  return connection.providerType === 'pi' && connection.piAuthProvider === 'xai'
    && (connection.authType === 'api_key' || connection.authType === 'oauth')
}

function isCodexAccountCatalog(connection: { providerType: string; piAuthProvider?: string; authType?: string; customEndpoint?: unknown }): boolean {
  return connection.providerType === 'pi' && connection.piAuthProvider === 'openai-codex'
    && connection.authType === 'oauth' && !connection.customEndpoint
}

function isApiAccountCatalog(connection: { providerType: string; piAuthProvider?: string; authType?: string; baseUrl?: string; customEndpoint?: unknown }): boolean {
  if (connection.providerType !== 'pi' || connection.authType !== 'api_key' || connection.customEndpoint) return false
  const baseUrl = connection.baseUrl?.trim().replace(/\/+$/, '')
  return (connection.piAuthProvider === 'openai' && (!baseUrl || baseUrl === 'https://api.openai.com/v1'))
    || (connection.piAuthProvider === 'deepseek' && (!baseUrl || baseUrl === 'https://api.deepseek.com'))
    || (connection.piAuthProvider === 'groq' && (!baseUrl || baseUrl === 'https://api.groq.com/openai/v1'))
    || (connection.piAuthProvider === 'mistral' && (!baseUrl || baseUrl === 'https://api.mistral.ai'))
}

// ============================================================
// Types
// ============================================================

type CredentialResolver = (slug: string) => Promise<ModelFetcherCredentials>
export type ModelRefreshSource = 'provider' | 'sdk' | 'saved' | 'registry' | 'manual' | 'unavailable' | 'superseded'
export interface ModelRefreshOutcome {
  source: ModelRefreshSource
  error?: string
}
type ModelRefreshStore = {
  getConnection: typeof getLlmConnection
  getConnections: typeof getLlmConnections
  updateConnection: typeof updateLlmConnection
  fallbackModels: typeof getModelsForProviderType
}

const defaultStore: ModelRefreshStore = {
  getConnection: getLlmConnection,
  getConnections: getLlmConnections,
  updateConnection: updateLlmConnection,
  fallbackModels: getModelsForProviderType,
}

// ============================================================
// ModelRefreshService
// ============================================================

export class ModelRefreshService {
  private timers = new Map<string, ReturnType<typeof setInterval>>()
  private inFlight = new Map<string, Promise<ModelRefreshOutcome>>()
  private generations = new Map<string, number>()

  constructor(
    private fetchers: ModelFetcherMap,
    private getCredentials: CredentialResolver,
    private store: ModelRefreshStore = defaultStore,
  ) {}

  /** Refine an OAuth account's existing catalog from its active Claude SDK query. */
  noteClaudeSdkSupportedModels(
    slug: string,
    account: { createdAt: number; uuid?: string; email?: string },
    raw: unknown,
  ): boolean {
    if (!account.uuid && !account.email) return false
    const current = this.store.getConnection(slug)
    if (!current || current.providerType !== 'anthropic' || current.authType !== 'oauth'
      || current.createdAt !== account.createdAt
      || current.oauthAccountUuid !== account.uuid
      || current.oauthAccountEmail !== account.email
      || !current.models?.length
      || current.models.some(model => typeof model === 'string')) return false

    const models = current.models as ModelDefinition[]
    const refined = mergeClaudeSdkCapabilities(models, raw)
    if (refined === models) return false
    this.store.updateConnection(slug, { models: refined })
    return true
  }

  /**
   * Fetch models for a connection through the fallback chain.
   * Periodic callers share an in-flight refresh. A credential change or manual
   * refresh supersedes it, so an old account cannot publish after a new one.
   */
  async refreshConnection(slug: string, supersede = false): Promise<ModelRefreshOutcome> {
    const existing = this.inFlight.get(slug)
    if (existing && !supersede) return existing

    const generation = (this.generations.get(slug) ?? 0) + 1
    this.generations.set(slug, generation)
    const promise = this._doRefresh(slug, generation).finally(() => {
      if (this.inFlight.get(slug) === promise) this.inFlight.delete(slug)
    })
    this.inFlight.set(slug, promise)
    return promise
  }

  /**
   * Internal: actual refresh logic with fallback chain.
   * Skips compat providers (not in fetcher map).
   * Preserves user's defaultModel if still valid.
   * Updates connection.models in storage on success.
   */
  private async _doRefresh(slug: string, generation: number): Promise<ModelRefreshOutcome> {
    const connection = this.store.getConnection(slug)
    if (!connection) {
      handlerLog.warn(`Model refresh: connection not found: ${slug}`)
      return { source: 'unavailable', error: 'Connection not found' }
    }

    // Skip compat providers — users configure models manually
    if (isCompatProvider(connection.providerType)) {
      return { source: 'manual' }
    }

    const providerType = connection.providerType as FetchableProvider
    const fetcher = this.fetchers[providerType]
    if (!fetcher) {
      handlerLog.warn(`Model refresh: no fetcher for provider type: ${providerType}`)
      return { source: 'unavailable', error: 'No model fetcher for this provider' }
    }

    let newModels: ModelDefinition[] | null = null
    let serverDefault: string | undefined
    let fetchedSource: 'provider' | 'sdk' = 'sdk'
    let fetchError: string | undefined

    // Layer 1: Provider API/SDK
    try {
      const credentials = await this.getCredentials(slug)
      handlerLog.info(`Model refresh [${slug}]: fetching (provider=${connection.providerType}, piAuth=${connection.piAuthProvider}, hasOAuthRefresh=${!!credentials.oauthRefreshToken}, hasOAuthAccess=${!!credentials.oauthAccessToken})`)
      const result = await fetcher.fetchModels(connection, credentials)
      if (result.models.length === 0) throw new Error('Model catalog was empty')
      newModels = result.models
      serverDefault = result.serverDefault
      fetchedSource = result.source ?? 'sdk'
      handlerLog.info(`Model refresh [${slug}]: fetched ${newModels.length} models from provider: ${newModels.map(m => m.id).join(', ')}`)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      fetchError = msg
      handlerLog.warn(`Model refresh [${slug}]: provider fetch failed: ${msg}`)
    }

    // Publish only from the newest refresh for the same connection identity.
    // Read the current record again: setup can replace the account/provider or
    // delete and recreate a slug while a network request is still in flight.
    const current = this.store.getConnection(slug)
    if (this.generations.get(slug) !== generation || !current
      || current.providerType !== connection.providerType
      || current.piAuthProvider !== connection.piAuthProvider
      || current.authType !== connection.authType
      || current.baseUrl !== connection.baseUrl
      || current.createdAt !== connection.createdAt
      || current.oauthAccountUuid !== connection.oauthAccountUuid
      || current.oauthAccountEmail !== connection.oauthAccountEmail) {
      handlerLog.info(`Model refresh [${slug}]: discarded superseded result`)
      return { source: 'superseded' }
    }

    // Layer 2: Persisted connection.models (keep what we have)
    if (!newModels && current.models && current.models.length > 0) {
      handlerLog.warn(`Model refresh [${slug}]: keeping ${current.models.length} stale persisted models (live fetch failed)`)
      return { source: 'saved', error: fetchError } // Nothing to update
    }

    // Layer 3: MODEL_REGISTRY hardcoded fallback
    if (!newModels) {
      const registryModels = this.store.fallbackModels(providerType, current.piAuthProvider)
      if (registryModels.length > 0) {
        newModels = registryModels
        fetchedSource = 'sdk'
        handlerLog.info(`Model refresh [${slug}]: using ${newModels.length} models from MODEL_REGISTRY`)
      }
    }

    if (!newModels || newModels.length === 0) {
      handlerLog.warn(`Model refresh [${slug}]: no models available from any source`)
      return { source: 'unavailable', error: fetchError ?? 'No models available' }
    }

    // For Pi connections with explicit user-owned 3-tier selection,
    // never overwrite model lists from background refresh.
    // Exceptions: account-scoped Copilot, xAI, Codex and official API catalogs
    // catalogs are account-managed. Keep
    // an existing selected default when it remains available, but refresh the
    // membership list so a legacy 3-tier setup cannot hide newly granted
    // models or retain a model the account can no longer use.
    const isCopilot = current.providerType === 'pi' && current.piAuthProvider === 'github-copilot'
    const isXaiAccount = isXaiAccountCatalog(current)
    const isApiAccount = isApiAccountCatalog(current)
    const isCodexAccount = isCodexAccountCatalog(current)
    if (current.providerType === 'pi' && current.modelSelectionMode === 'userDefined3Tier'
      && !isCopilot && !isXaiAccount && !isApiAccount && !isCodexAccount) {
      const modelCount = current.models?.length ?? 0
      handlerLog.info(`Model refresh [${slug}]: preserving user-defined Pi model list (${modelCount} models)`)
      if (modelCount > 10) {
        handlerLog.warn(`Model refresh [${slug}]: userDefined3Tier has suspicious model count (${modelCount})`)
      }
      return { source: 'manual' }
    }

    // An SDK/registry list is only a bundled snapshot, not an account's model
    // entitlement. Keep a selected model that the snapshot does not know yet,
    // including its saved metadata when available. Only a live provider
    // catalog may replace an unavailable selection.
    const currentDefault = current.defaultModel
    const stillListed = !!currentDefault && newModels.some(m => m.id === currentDefault)
    const authoritative = fetchedSource === 'provider' && !fetchError
    let modelsToSave: Array<ModelDefinition | string> = newModels
    if (currentDefault && !stillListed && !authoritative) {
      const saved = current.models?.find(m => (typeof m === 'string' ? m : m.id) === currentDefault)
      modelsToSave = [...newModels, saved ?? currentDefault]
    }
    const newDefault = currentDefault && (!authoritative || stillListed)
      ? currentDefault
      : serverDefault ?? newModels[0]?.id

    const saved = this.store.updateConnection(slug, {
      models: modelsToSave,
      ...(newDefault && newDefault !== currentDefault ? { defaultModel: newDefault } : {}),
    })
    if (!saved) return { source: 'unavailable', error: 'Could not save the model list' }
    return { source: fetchError ? 'registry' : fetchedSource, error: fetchError }
  }

  /**
   * Start periodic refresh timers for all existing connections.
   * Also runs an immediate non-blocking fetch for each.
   * Call on app startup after IPC handlers are registered.
   */
  startAll(): void {
    const connections = this.store.getConnections()

    for (const conn of connections) {
      if (isCompatProvider(conn.providerType)) continue

      const providerType = conn.providerType as FetchableProvider
      const fetcher = this.fetchers[providerType]
      if (!fetcher) continue

      // Immediate non-blocking fetch
      this.refreshConnection(conn.slug).catch(err => {
        handlerLog.warn(`Initial model refresh failed for ${conn.slug}: ${err instanceof Error ? err.message : err}`)
      })

      // Set up periodic refresh: Copilot connections get their own interval
      // (models are server-managed by GitHub policy), other providers use
      // the fetcher's generic interval (0 = no periodic refresh for static SDK models).
      const isCopilot = conn.providerType === 'pi' && conn.piAuthProvider === 'github-copilot'
      const isAccountCatalog = isXaiAccountCatalog(conn) || isCodexAccountCatalog(conn) || isApiAccountCatalog(conn)
      if (isCopilot) {
        this.startTimer(conn.slug, COPILOT_REFRESH_INTERVAL_MS)
      } else if (isAccountCatalog) {
        this.startTimer(conn.slug, ACCOUNT_CATALOG_REFRESH_INTERVAL_MS)
      } else if (fetcher.refreshIntervalMs > 0) {
        this.startTimer(conn.slug, fetcher.refreshIntervalMs)
      }
    }
  }

  /**
   * Stop all refresh timers. Call on app quit.
   */
  stopAll(): void {
    for (const [slug, timer] of this.timers) {
      clearInterval(timer)
      handlerLog.info(`Stopped model refresh timer for ${slug}`)
    }
    this.timers.clear()
  }

  /**
   * Trigger an immediate refresh for a specific connection.
   * Also starts a periodic timer if the fetcher supports it.
   * Called when: connection created, auth completed, user clicks refresh.
   */
  async refreshNow(slug: string): Promise<ModelRefreshOutcome> {
    const outcome = await this.refreshConnection(slug, true)

    // Ensure periodic timer is running
    const connection = this.store.getConnection(slug)
    if (!connection || isCompatProvider(connection.providerType)) return outcome

    const providerType = connection.providerType as FetchableProvider
    const fetcher = this.fetchers[providerType]
    const isCopilot = connection.providerType === 'pi' && connection.piAuthProvider === 'github-copilot'
    const isAccountCatalog = isXaiAccountCatalog(connection) || isCodexAccountCatalog(connection) || isApiAccountCatalog(connection)
    if (isCopilot && !this.timers.has(slug)) {
      this.startTimer(slug, COPILOT_REFRESH_INTERVAL_MS)
    } else if (isAccountCatalog && !this.timers.has(slug)) {
      this.startTimer(slug, ACCOUNT_CATALOG_REFRESH_INTERVAL_MS)
    } else if (fetcher && fetcher.refreshIntervalMs > 0 && !this.timers.has(slug)) {
      this.startTimer(slug, fetcher.refreshIntervalMs)
    }
    return outcome
  }

  /**
   * Stop timer for a specific connection (e.g., when deleted).
   */
  stopConnection(slug: string): void {
    this.generations.set(slug, (this.generations.get(slug) ?? 0) + 1)
    this.inFlight.delete(slug)
    const timer = this.timers.get(slug)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(slug)
    }
  }

  private startTimer(slug: string, intervalMs: number): void {
    // Don't create duplicate timers
    if (this.timers.has(slug)) return

    const timer = setInterval(async () => {
      try {
        await this.refreshConnection(slug)
      } catch (err) {
        handlerLog.warn(`Periodic model refresh failed for ${slug}: ${err instanceof Error ? err.message : err}`)
      }
    }, intervalMs)

    this.timers.set(slug, timer)
  }
}

// ============================================================
// Singleton Instance
// ============================================================

let _service: ModelRefreshService | null = null

/**
 * Get the ModelRefreshService singleton.
 * Must be initialized with initModelRefreshService() before use.
 */
export function getModelRefreshService(): ModelRefreshService {
  if (!_service) {
    throw new Error('ModelRefreshService not initialized. Call initModelRefreshService() first.')
  }
  return _service
}

/**
 * Initialize the ModelRefreshService with a credential resolver.
 * Called once during app startup.
 */
export function initModelRefreshService(getCredentials: CredentialResolver): ModelRefreshService {
  _service = new ModelRefreshService(MODEL_FETCHERS, getCredentials)
  return _service
}

export { setFetcherPlatform } from './runtime'
