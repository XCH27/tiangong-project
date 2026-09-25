import { RPC_CHANNELS, type LlmConnectionSetup } from '@craft-agent/shared/protocol'
import { getLlmConnections, getLlmConnection, addLlmConnection, updateLlmConnection, deleteLlmConnection, getDefaultLlmConnection, setDefaultLlmConnection, touchLlmConnection, isCompatProvider, isAnthropicProvider, getDefaultModelsForConnection, getDefaultModelForConnection, getModelsForProviderType, applyManualModelSettings, type LlmConnection, type LlmConnectionWithStatus, type ManualModelSettings, type ModelDefinition, type CustomEndpointApi, toBedrockNativeId, deriveBedrockRegionPrefix } from '@craft-agent/shared/config'
import { getCredentialManager } from '@craft-agent/shared/credentials'
import { setSetupDeferred } from '@craft-agent/shared/config/storage'
import {
  resolveSetupTestConnectionHint,
  testBackendConnection,
  validateStoredBackendConnection,
  fetchBackendModels,
  fetchCustomEndpointModelIds,
  fetchXaiApiModels,
  fetchXaiApiMediaModels,
  fetchXaiSubscriptionModels,
  XAI_SUBSCRIPTION_BASE,
} from '@craft-agent/shared/agent/backend'
import { getModelRefreshService } from '@craft-agent/server-core/model-fetchers'
import { parseTestConnectionError, createBuiltInConnection, validateModelList, piAuthProviderDisplayName, validateSetupTestInput, setupTestRequiresApiKey, resolveCustomEndpointSetup, canReuseStoredApiKey } from '@craft-agent/server-core/domain'
import { getWorkspaceOrThrow, buildBackendHostRuntimeContext } from '@craft-agent/server-core/handlers'
import { pushTyped, type RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { randomUUID } from 'node:crypto'
import { CLIENT_OPEN_EXTERNAL } from '@craft-agent/server-core/transport'
import { assertWorkspaceModelSelection, reconcileWorkspaceModelOverride } from '../../sessions/model-defaults'

// Local OAuth state
let copilotOAuthAbort: AbortController | null = null
let xaiOAuthAbort: AbortController | null = null

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.llmConnections.LIST,
  RPC_CHANNELS.llmConnections.LIST_WITH_STATUS,
  RPC_CHANNELS.llmConnections.GET,
  RPC_CHANNELS.llmConnections.GET_API_KEY,
  RPC_CHANNELS.llmConnections.SAVE,
  RPC_CHANNELS.llmConnections.SET_MODEL,
  RPC_CHANNELS.llmConnections.SET_MODEL_VISIBILITY,
  RPC_CHANNELS.llmConnections.SET_MODEL_DETAILS,
  RPC_CHANNELS.llmConnections.DELETE,
  RPC_CHANNELS.llmConnections.TEST,
  RPC_CHANNELS.llmConnections.SET_DEFAULT,
  RPC_CHANNELS.llmConnections.SET_WORKSPACE_DEFAULT,
  RPC_CHANNELS.llmConnections.REFRESH_MODELS,
  RPC_CHANNELS.chatgpt.START_OAUTH,
  RPC_CHANNELS.chatgpt.COMPLETE_OAUTH,
  RPC_CHANNELS.chatgpt.CANCEL_OAUTH,
  RPC_CHANNELS.chatgpt.GET_AUTH_STATUS,
  RPC_CHANNELS.chatgpt.READ_USAGE,
  RPC_CHANNELS.chatgpt.LOGOUT,
  RPC_CHANNELS.copilot.START_OAUTH,
  RPC_CHANNELS.copilot.CANCEL_OAUTH,
  RPC_CHANNELS.copilot.GET_AUTH_STATUS,
  RPC_CHANNELS.copilot.LOGOUT,
  RPC_CHANNELS.xai.START_OAUTH,
  RPC_CHANNELS.xai.CANCEL_OAUTH,
  RPC_CHANNELS.xai.READ_USAGE,
  RPC_CHANNELS.settings.SETUP_LLM_CONNECTION,
  RPC_CHANNELS.settings.TEST_LLM_CONNECTION_SETUP,
  RPC_CHANNELS.pi.GET_API_KEY_PROVIDERS,
  RPC_CHANNELS.pi.GET_PROVIDER_BASE_URL,
  RPC_CHANNELS.pi.GET_PROVIDER_MODELS,
] as const

export function registerLlmConnectionsHandlers(server: RpcServer, deps: HandlerDeps): void {
  const { sessionManager } = deps

  // Fire-and-forget model-list refresh after a credential change (setup, re-auth,
  // validation). Re-auth can switch to an account with different model
  // entitlements, so the cached list from the previous account must be replaced
  // (#820). Never throws into the caller — a failed refresh must not fail the
  // credential flow that triggered it.
  const refreshModelsInBackground = (slug: string, context: string) => {
    try {
      getModelRefreshService().refreshNow(slug).catch(err => {
        deps.platform.logger?.warn(`Model refresh after ${context} failed for ${slug}: ${err instanceof Error ? err.message : err}`)
      })
    } catch (err) {
      deps.platform.logger?.warn(`Model refresh service unavailable after ${context} for ${slug}: ${err instanceof Error ? err.message : err}`)
    }
  }

  // Unified handler for LLM connection setup
  server.handle(RPC_CHANNELS.settings.SETUP_LLM_CONNECTION, async (_ctx, setup: LlmConnectionSetup): Promise<{ success: boolean; error?: string }> => {
    try {
      const manager = getCredentialManager()

      // Ensure connection exists in config
      let connection = getLlmConnection(setup.slug)
      let isNewConnection = false
      if (!connection) {
        // Reauth guard: if updateOnly is set, the connection must already exist.
        // Clean up any orphaned credentials from a preceding OAuth flow.
        if (setup.updateOnly) {
          await manager.deleteLlmCredentials(setup.slug).catch(() => {})
          deps.platform.logger?.warn(`[SETUP_LLM_CONNECTION] updateOnly rejected for missing slug: ${setup.slug}`)
          return { success: false, error: 'Connection not found. Cannot re-authenticate a non-existent connection.' }
        }
        // Create connection with appropriate defaults based on slug
        connection = createBuiltInConnection(setup.slug, setup.baseUrl)
        isNewConnection = true
      }

      const updates: Partial<LlmConnection> = {}
      // Older xAI setup forms persisted the official URL as though it were a
      // custom endpoint. Treat that exact URL as Pi's native xAI endpoint so
      // account discovery and runtime model registration still apply on edit.
      const isNativeXaiEndpoint = setup.piAuthProvider === 'xai'
        && !setup.customEndpoint
        && setup.baseUrl?.trim().replace(/\/+$/, '') === 'https://api.x.ai/v1'
      const configuredBaseUrl = isNativeXaiEndpoint ? undefined : setup.baseUrl?.trim() || undefined
      const hasConfiguredBaseUrl = !!configuredBaseUrl
      const replacingCredential = !!setup.credential?.trim() && !setup.credential.includes('••')
      if (!isNewConnection && (connection.authType === 'api_key' || connection.authType === 'api_key_with_endpoint')
        && !replacingCredential && !canReuseStoredApiKey(connection, {
          providerType: setup.customEndpoint ? 'pi_compat' : connection.providerType,
          baseUrl: configuredBaseUrl,
          piAuthProvider: setup.piAuthProvider ?? connection.piAuthProvider,
          customEndpoint: setup.customEndpoint,
        })) {
        return { success: false, error: 'Re-enter the API key after changing the provider, endpoint or API format' }
      }
      if (setup.baseUrl !== undefined) {
        updates.baseUrl = configuredBaseUrl

        // Only mutate providerType for API key connections (not OAuth connections)
        if (isAnthropicProvider(connection.providerType) && connection.authType !== 'oauth') {
          if (hasConfiguredBaseUrl) {
            updates.providerType = 'pi_compat'
            updates.authType = 'api_key_with_endpoint'
            updates.customEndpoint = { api: 'anthropic-messages' }
          } else {
            updates.providerType = 'anthropic'
            updates.authType = 'api_key'
            updates.models = getDefaultModelsForConnection('anthropic')
            updates.defaultModel = getDefaultModelForConnection('anthropic')
          }
        }

        // Pi API key flow: store baseUrl on the connection (Pi SDK doesn't use it yet,
        // but it's persisted for future backend support)

      }

      if (setup.defaultModel !== undefined) {
        updates.defaultModel = setup.defaultModel ?? undefined
      }
      if (setup.models !== undefined) {
        updates.models = setup.models ?? undefined
      }
      if (setup.modelSelectionMode !== undefined) {
        updates.modelSelectionMode = setup.modelSelectionMode
      }

      const customEndpoint = hasConfiguredBaseUrl ? setup.customEndpoint : undefined
      const isCustomEndpointCompat = !!customEndpoint
      if (customEndpoint) {
        updates.customEndpoint = customEndpoint
        updates.providerType = 'pi_compat'
        const branch = resolveCustomEndpointSetup({
          baseUrl: setup.baseUrl ?? undefined,
          credential: setup.credential ?? undefined,
          customEndpointApi: customEndpoint.api,
        })
        // A blank edit keeps the already keyed local endpoint keyed.
        updates.authType = !replacingCredential && connection.authType === 'api_key_with_endpoint'
          ? connection.authType : branch.authType
        if (branch.name !== undefined) updates.name = branch.name
        if (branch.piAuthProvider !== undefined) updates.piAuthProvider = branch.piAuthProvider

        // Brand-name override on first setup only (user-renamed connections aren't clobbered on re-save).
        if (isNewConnection && !updates.name && setup.baseUrl?.toLowerCase().includes('manifest.build')) {
          updates.name = 'Manifest'
        }
      } else if (setup.baseUrl !== undefined) {
        // Base URL was explicitly updated without custom protocol config.
        // Treat this as non-custom mode and clear stale custom endpoint metadata.
        // Only downgrade existing connections — new ones already have the correct
        // providerType from createBuiltInConnection().
        updates.customEndpoint = undefined
        if (connection.providerType === 'pi_compat' && connection.authType !== 'oauth' && !isNewConnection) {
          updates.providerType = 'pi'
          updates.authType = 'api_key'
        }
      }

      // Pi API key flow: set piAuthProvider from setup data (e.g. 'anthropic', 'google', 'openai').
      // Skip when custom endpoint protocol is driving routing.
      if (setup.piAuthProvider && !isCustomEndpointCompat) {
        updates.piAuthProvider = setup.piAuthProvider
        if (connection.authType !== 'oauth') {
          // API-key presets use the provider name; a subscription keeps its
          // built-in account name and discovers its own account-scoped models.
          const providerName = piAuthProviderDisplayName(setup.piAuthProvider)
          if (providerName && (isNewConnection || /^Craft Agents Backend \([^)]+\)(?: \d+)?$/.test(connection.name))) {
            // Pi API-key slugs are numbered across every vendor. Number the
            // visible connection only among accounts of this provider.
            const sameProviderCount = getLlmConnections().filter(candidate => candidate.slug !== setup.slug
              && candidate.authType === 'api_key' && candidate.piAuthProvider === setup.piAuthProvider).length
            updates.name = sameProviderCount ? `${providerName} ${sameProviderCount + 1}` : providerName
          }
          // Only seed models for a standard Pi API-key provider when none were selected.
          if (!hasConfiguredBaseUrl && !setup.models?.length) {
            updates.models = getDefaultModelsForConnection('pi', setup.piAuthProvider)
            if (!setup.defaultModel) {
              updates.defaultModel = getDefaultModelForConnection('pi', setup.piAuthProvider)
            }
            updates.modelSelectionMode ??= 'automaticallySyncedFromProvider'
          }
        }
      }

      if (setup.piAuthProvider === 'xai' && connection.authType === 'oauth' && !isCustomEndpointCompat) {
        const { getValidXaiSubscriptionToken } = await import('@craft-agent/shared/auth')
        const accountModels = await fetchXaiSubscriptionModels(await getValidXaiSubscriptionToken(setup.slug), 15_000)
        updates.baseUrl = XAI_SUBSCRIPTION_BASE
        updates.models = accountModels
        updates.modelSelectionMode = 'automaticallySyncedFromProvider'
        if (!setup.defaultModel) updates.defaultModel = accountModels.find(model => model.id === 'pi/grok-4.7')?.id ?? accountModels[0]?.id
      } else if (setup.piAuthProvider === 'xai' && !hasConfiguredBaseUrl && !isCustomEndpointCompat) {
        const suppliedKey = setup.credential?.includes('••') ? undefined : setup.credential?.trim()
        const key = suppliedKey || await manager.getLlmApiKey(setup.slug)
        if (!key) return { success: false, error: 'xAI API key is required' }
        // Resolve the account catalog before validating the selected model.
        // A bundled SDK list may be older than this account's real models.
        const accountModels = await fetchXaiApiModels(key, 15_000)
        updates.models = accountModels
        updates.modelSelectionMode = 'automaticallySyncedFromProvider'
        if (!setup.defaultModel) updates.defaultModel = accountModels[0]?.id
      }

      // Pi+Bedrock auth method override — set authType for IAM or environment auth.
      // providerType stays 'pi' (Bedrock routes through Pi SDK).
      if (setup.bedrockAuthMethod) {
        updates.authType = setup.bedrockAuthMethod
      }

      // Resolved Anthropic OAuth identity (issue #838). Threaded through SETUP so
      // it persists on both the new-connection path (addLlmConnection) and the
      // re-auth path (updateLlmConnection) via the shared pendingConnection/updates
      // flow below. Fail-soft: only stamp when at least one identity block arrived.
      const oauthIdentity = setup.oauthIdentity
      if (oauthIdentity?.account || oauthIdentity?.organization) {
        // Set only fields that are actually present, so `updates` never carries an
        // explicit `undefined` (matches the guarded-assignment style used above and
        // keeps the update intent clean). Missing sub-fields are simply not touched;
        // on re-auth the storage allowlist then preserves any prior value.
        if (oauthIdentity.account?.uuid) updates.oauthAccountUuid = oauthIdentity.account.uuid
        if (oauthIdentity.account?.emailAddress) updates.oauthAccountEmail = oauthIdentity.account.emailAddress
        if (oauthIdentity.organization?.uuid) updates.oauthOrganizationUuid = oauthIdentity.organization.uuid
        if (oauthIdentity.organization?.name) updates.oauthOrganizationName = oauthIdentity.organization.name
        updates.oauthProfileVerifiedAt = Date.now()
      }

      const effectiveProviderType = updates.providerType ?? connection.providerType
      if (effectiveProviderType === 'pi' || effectiveProviderType === 'pi_compat') {
        const isBedrockPi = (updates.piAuthProvider ?? connection.piAuthProvider) === 'amazon-bedrock'
        // For Pi+Bedrock, normalize bare Anthropic IDs to Bedrock-native before adding pi/ prefix
        // so that resolvePiModel() can find them in the amazon-bedrock registry.
        // Use the configured AWS region to select the correct inference profile prefix (us/eu).
        const regionPrefix = isBedrockPi ? deriveBedrockRegionPrefix(setup.awsRegion) : undefined
        const toPiModelId = (id: string) => {
          const bare = id.startsWith('pi/') ? id.slice(3) : id
          const normalized = isBedrockPi ? toBedrockNativeId(bare, regionPrefix) : bare
          return `pi/${normalized}`
        }
        if (updates.models) {
          updates.models = updates.models.map(m => typeof m === 'string' ? toPiModelId(m) : { ...m, id: toPiModelId(m.id) })
        }
        if (updates.defaultModel) {
          updates.defaultModel = toPiModelId(updates.defaultModel)
        }
      }

      const pendingConnection: LlmConnection = {
        ...connection,
        ...updates,
      }

      // OAuth token exchange already stored access, refresh and expiry data in
      // the credential manager. A setup payload containing only the access
      // token must never replace that complete record.
      if (pendingConnection.authType === 'oauth' && setup.credential && !setup.credential.includes('••')) {
        return { success: false, error: 'OAuth credentials are managed by the sign-in flow. Sign in again to change accounts.' }
      }

      if (pendingConnection.providerType === 'pi') {
        const modelIds = (pendingConnection.models ?? []).map(m => typeof m === 'string' ? m : m.id)
        deps.platform.logger?.info('Pi setup pending connection snapshot', {
          slug: pendingConnection.slug,
          piAuthProvider: pendingConnection.piAuthProvider,
          modelSelectionMode: pendingConnection.modelSelectionMode,
          defaultModel: pendingConnection.defaultModel,
          modelCount: modelIds.length,
          modelsFirst5: modelIds.slice(0, 5),
          setupModelCount: setup.models?.length,
          setupDefaultModel: setup.defaultModel,
        })
      }

      if (pendingConnection.providerType === 'pi' && pendingConnection.piAuthProvider && !pendingConnection.modelSelectionMode) {
        const inferredMode = setup.models?.length
          ? 'userDefined3Tier'
          : 'automaticallySyncedFromProvider'
        pendingConnection.modelSelectionMode = inferredMode
        updates.modelSelectionMode = inferredMode
      }

      if (updates.models && updates.models.length > 0) {
        const validation = validateModelList(updates.models, pendingConnection.defaultModel)
        if (!validation.valid) {
          return { success: false, error: validation.error }
        }
        if (validation.resolvedDefaultModel) {
          pendingConnection.defaultModel = validation.resolvedDefaultModel
          updates.defaultModel = validation.resolvedDefaultModel
        }
      }

      if (isCompatProvider(pendingConnection.providerType) && !pendingConnection.defaultModel) {
        return { success: false, error: 'Default model is required for compatible endpoints.' }
      }

      if (isNewConnection) {
        const added = addLlmConnection(pendingConnection)
        if (!added) {
          deps.platform.logger?.error(`Failed to persist LLM connection: ${setup.slug} (config may be inaccessible)`)
          return { success: false, error: 'Failed to save connection. Check server logs for details.' }
        }
        deps.platform.logger?.info(`Created LLM connection: ${setup.slug}`)
      } else if (Object.keys(updates).length > 0) {
        const updated = updateLlmConnection(setup.slug, updates)
        if (!updated) {
          deps.platform.logger?.error(`Failed to update LLM connection: ${setup.slug}`)
          return { success: false, error: 'Failed to update connection. Check server logs for details.' }
        }
        deps.platform.logger?.info(`Updated LLM connection settings: ${setup.slug}`)
      }

      // Store credential if provided (skip masked placeholders from GET_API_KEY)
      const isMasked = setup.credential?.includes('••')
      if (setup.credential && !isMasked) {
        await manager.setLlmApiKey(setup.slug, setup.credential)
        deps.platform.logger?.info('Saved API key to LLM connection')
      }

      // Pi+Bedrock IAM credentials — stored separately from API keys
      if (setup.iamCredentials) {
        await manager.setLlmIamCredentials(setup.slug, {
          ...setup.iamCredentials,
          region: setup.awsRegion,
        })
        deps.platform.logger?.info('Saved IAM credentials to LLM connection')
      }

      // Set as default only if no default exists yet (first connection)
      if (!getDefaultLlmConnection()) {
        setDefaultLlmConnection(setup.slug)
        deps.platform.logger?.info(`Set default LLM connection: ${setup.slug}`)
      }

      // Fetch available models before returning to the UI.
      // Always refresh for auto-synced connections (e.g. Copilot, Bedrock) — the static
      // catalog from setup is just a seed that needs replacing with live API data
      // filtered by the user's policy. For user-defined connections, only refresh
      // when no models were populated during setup.
      // Awaited so the model selector shows real available models immediately.
      const pendingModels = Array.isArray(pendingConnection.models) ? pendingConnection.models : []
      const isAutoSynced = pendingConnection.modelSelectionMode === 'automaticallySyncedFromProvider'
      if (!pendingModels.length || isAutoSynced) {
        try {
          await getModelRefreshService().refreshNow(setup.slug)
        } catch (err) {
          deps.platform.logger?.warn(`Model refresh after setup failed for ${setup.slug}: ${err instanceof Error ? err.message : err}`)
        }
      }

      // Reinitialize auth for the connection that was just created/updated,
      // not the global default (which may be a different connection).
      await sessionManager.reinitializeAuth(setup.slug)
      deps.platform.logger?.info('Reinitialized auth after LLM connection setup')

      // Clear "Setup later" flag now that user has configured a provider
      setSetupDeferred(false)

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      deps.platform.logger?.error('Failed to setup LLM connection:', message)
      return { success: false, error: message }
    }
  })

  // Unified connection test — uses the agent factory to spawn a real agent subprocess
  // and validate credentials via runMiniCompletion(). Same code path as actual chat.
  server.handle(RPC_CHANNELS.settings.TEST_LLM_CONNECTION_SETUP, async (_ctx, params: import('@craft-agent/shared/protocol').TestLlmConnectionParams): Promise<import('@craft-agent/shared/protocol').TestLlmConnectionResult> => {
    const { provider, apiKey, baseUrl, model, piAuthProvider, customEndpoint, existingConnectionSlug } = params
    let trimmedKey = apiKey?.trim() ?? ''
    if (!trimmedKey && existingConnectionSlug) {
      const existing = getLlmConnection(existingConnectionSlug)
      if (!existing) {
        return { success: false, error: 'Existing API connection was not found' }
      }
      if (existing.authType !== 'none') {
        if (!canReuseStoredApiKey(existing, {
          providerType: customEndpoint ? 'pi_compat' : provider,
          baseUrl,
          piAuthProvider,
          customEndpoint,
        })) {
          return { success: false, error: 'Re-enter the API key after changing the provider, endpoint or API format' }
        }
        trimmedKey = await getCredentialManager().getLlmApiKey(existingConnectionSlug) ?? ''
      }
    }
    const allowEmptyApiKey = !setupTestRequiresApiKey(baseUrl)

    if (!trimmedKey && !allowEmptyApiKey) {
      return { success: false, error: 'API key is required' }
    }

    const setupValidation = validateSetupTestInput({ provider, baseUrl, piAuthProvider })
    if (!setupValidation.valid) {
      return { success: false, error: setupValidation.error }
    }

    const hint = resolveSetupTestConnectionHint({ provider, baseUrl, piAuthProvider, customEndpoint })
    deps.platform.logger?.info(`[testLlmConnectionSetup] Testing: provider=${provider}${piAuthProvider ? ` piAuth=${piAuthProvider}` : ''}${baseUrl ? ` baseUrl=${baseUrl}` : ''} hasCustomEndpoint=${!!customEndpoint} hintProvider=${hint.providerType}`)

    const startedAt = Date.now()
    try {
      const testModel = model || getDefaultModelForConnection(provider, piAuthProvider)
      deps.platform.logger?.info(`[testLlmConnectionSetup] Resolved model: ${testModel}`)
      const result = await testBackendConnection({
        provider,
        apiKey: trimmedKey,
        allowEmptyApiKey,
        model: testModel,
        baseUrl,
        timeoutMs: 45000,
        hostRuntime: buildBackendHostRuntimeContext(deps.platform),
        connection: hint,
      })
      const elapsed = Date.now() - startedAt

      if (!result.success) {
        deps.platform.logger?.info(`[testLlmConnectionSetup] Elapsed: ${elapsed}ms, success=false`)
        deps.platform.logger?.info(`[testLlmConnectionSetup] Raw error: ${(result.error || '').slice(0, 1000)}`)
        return { success: false, error: parseTestConnectionError(result.error || 'Unknown error') }
      }
      deps.platform.logger?.info(`[testLlmConnectionSetup] Elapsed: ${elapsed}ms, success=true`)
      return { success: true }
    } catch (error) {
      const elapsed = Date.now() - startedAt
      const msg = error instanceof Error ? error.message : String(error)
      deps.platform.logger?.info(`[testLlmConnectionSetup] Elapsed: ${elapsed}ms, threw: ${msg.slice(0, 1000)}`)
      return { success: false, error: parseTestConnectionError(msg) }
    }
  })

  // ============================================================
  // Pi Provider Discovery (main process only — Pi SDK can't run in renderer)
  // ============================================================

  server.handle(RPC_CHANNELS.pi.GET_API_KEY_PROVIDERS, async () => {
    const { getPiApiKeyProviders } = await import('@craft-agent/shared/config')
    return getPiApiKeyProviders()
  })

  server.handle(RPC_CHANNELS.pi.GET_PROVIDER_BASE_URL, async (_ctx, provider: string) => {
    const { getPiProviderBaseUrl } = await import('@craft-agent/shared/config')
    return getPiProviderBaseUrl(provider)
  })

  server.handle(RPC_CHANNELS.pi.GET_PROVIDER_MODELS, async (_ctx, provider: string, apiKey?: string, connectionSlug?: string, baseUrl?: string, customApi?: CustomEndpointApi) => {
    let effectiveKey = apiKey?.trim()
    if (provider === 'custom') {
      const stored = connectionSlug ? getLlmConnection(connectionSlug) : null
      const matchingStored = stored?.providerType === 'pi_compat'
        && stored.baseUrl === baseUrl && stored.customEndpoint?.api === customApi
      if (!effectiveKey && matchingStored) {
        effectiveKey = await getCredentialManager().getLlmApiKey(connectionSlug!) ?? undefined
      }
      if (!baseUrl || !customApi) {
        return { models: [], totalCount: 0, source: 'sdk' as const, error: 'API base URL and format are required' }
      }
      try {
        const ids = await fetchCustomEndpointModelIds(baseUrl, effectiveKey ?? '', customApi)
        return {
          // IDs are candidates only. This response does not confer chat,
          // context, effort or multimodal capability on a custom endpoint.
          models: ids.map(id => ({ id: `pi/${id}`, name: id, contextWindow: 0, reasoning: false })),
          totalCount: ids.length,
          source: 'provider' as const,
        }
      } catch (error) {
        return { models: [], totalCount: 0, source: 'sdk' as const,
          error: error instanceof Error ? error.message : String(error) }
      }
    }
    if (provider === 'xai' && !effectiveKey && connectionSlug) {
      const connection = getLlmConnection(connectionSlug)
      if (connection?.providerType === 'pi' && connection.piAuthProvider === 'xai' && connection.authType === 'api_key') {
        effectiveKey = await getCredentialManager().getLlmApiKey(connectionSlug) ?? undefined
      }
    }
    if (provider === 'xai' && effectiveKey) {
      try {
        const discovered = await fetchXaiApiModels(effectiveKey, 15_000)
        const mediaCatalog = await fetchXaiApiMediaModels(effectiveKey)
        return {
          models: discovered.map(model => ({
            id: model.id,
            name: model.name,
            costInput: model.pricingPerMillion?.input,
            costOutput: model.pricingPerMillion?.output,
            contextWindow: model.contextWindow,
            reasoning: model.supportsThinking ?? false,
          })),
          totalCount: discovered.length,
          source: 'provider' as const,
          mediaModels: mediaCatalog.models,
          mediaCatalogStatus: mediaCatalog.status,
        }
      } catch (error) {
        // A failed account query must stay visible. Bundled entries below are
        // only setup hints, not proof that this key may run them.
        const reason = error instanceof Error ? error.message : String(error)
        deps.platform.logger?.warn(`xAI setup catalog unavailable: ${reason}`)
        return { models: [], totalCount: 0, source: 'sdk' as const, error: reason }
      }
    }
    if (provider === 'openai' || provider === 'google' || provider === 'deepseek' || provider === 'groq' || provider === 'mistral') {
      const stored = connectionSlug && !effectiveKey ? getLlmConnection(connectionSlug) : null
      const matchingStored = stored?.providerType === 'pi' && stored.piAuthProvider === provider
        && stored.authType === 'api_key' ? stored : null
      if (!effectiveKey && matchingStored) {
        effectiveKey = await getCredentialManager().getLlmApiKey(matchingStored.slug) ?? undefined
      }
      if (effectiveKey) {
        try {
          // The backend driver owns the official endpoint allowlist and the
          // installed Pi intersection. Never send a key to a preset's arbitrary
          // edited URL or turn an unexecutable API ID into a picker choice.
          const connection: LlmConnection = matchingStored ?? {
            slug: '__setup-catalog', name: provider, providerType: 'pi',
            piAuthProvider: provider, authType: 'api_key', baseUrl, createdAt: 0,
          }
          const result = await fetchBackendModels({
            connection,
            credentials: { apiKey: effectiveKey },
            hostRuntime: buildBackendHostRuntimeContext(deps.platform),
            timeoutMs: 15_000,
          })
          if (result.source === 'provider') {
            return {
              models: result.models.map(model => ({
                id: model.id,
                name: model.name,
                costInput: model.pricingPerMillion?.input,
                costOutput: model.pricingPerMillion?.output,
                contextWindow: model.contextWindow ?? 0,
                reasoning: model.supportsThinking ?? false,
              })),
              totalCount: result.models.length,
              source: 'provider' as const,
              ...(result.mediaModels ? { mediaModels: result.mediaModels, mediaCatalogStatus: 'available' as const } : {}),
            }
          }
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          deps.platform.logger?.warn(`${provider} setup catalog unavailable: ${reason}`)
          return { models: [], totalCount: 0, source: 'sdk' as const, error: reason }
        }
      }
    }
    // Codex image generation uses the ChatGPT OAuth connection, not an OpenAI
    // Platform API key or the Pi chat-model catalog. This is a documented route,
    // not an account-specific model/allowance response: do not mark it available.
    const codexConnection = provider === 'openai-codex' && connectionSlug
      ? getLlmConnection(connectionSlug) : null
    const codexMedia = connectionSlug
      && codexConnection?.providerType === 'pi'
      && codexConnection.piAuthProvider === 'openai-codex'
      && codexConnection.authType === 'oauth'
      && await getCredentialManager().hasLlmCredentials(connectionSlug, 'oauth').catch(() => false)
      ? {
          mediaModels: [{ id: 'gpt-image-2', name: 'GPT Image (Codex)', kind: 'image' as const }],
          mediaCatalogStatus: 'documented' as const,
        }
      : {}
    const { getModels } = await import('@earendil-works/pi-ai/compat')
    try {
      const models = getModels(provider as Parameters<typeof getModels>[0])
      // Price is neither capability nor latency. Keep discovery order from the
      // provider adapter instead of implying a "best/fast" ranking by cost.
      const sorted = models
      return {
        models: sorted.map(m => ({
          id: m.id.startsWith('pi/') ? m.id : `pi/${m.id}`,
          name: m.name,
          costInput: m.cost.input,
          costOutput: m.cost.output,
          contextWindow: m.contextWindow,
          reasoning: m.reasoning,
        })),
        totalCount: models.length,
        source: 'sdk' as const,
        ...codexMedia,
      }
    } catch {
      return { models: [], totalCount: 0, source: 'sdk' as const, ...codexMedia }
    }
  })

  // ============================================================
  // LLM Connections (provider configurations)
  // ============================================================

  // List all LLM connections (includes built-in and custom)
  server.handle(RPC_CHANNELS.llmConnections.LIST, async (): Promise<LlmConnection[]> => {
    return getLlmConnections()
  })

  // List all LLM connections with authentication status
  server.handle(RPC_CHANNELS.llmConnections.LIST_WITH_STATUS, async (): Promise<LlmConnectionWithStatus[]> => {
    const connections = getLlmConnections()
    const credentialManager = getCredentialManager()
    const defaultSlug = getDefaultLlmConnection()

    return Promise.all(connections.map(async (conn): Promise<LlmConnectionWithStatus> => {
      // Check if credentials exist for this connection
      const hasCredentials = await credentialManager.hasLlmCredentials(conn.slug, conn.authType)
      return {
        ...conn,
        isAuthenticated: conn.authType === 'none' || hasCredentials,
        isDefault: conn.slug === defaultSlug,
      }
    }))
  })

  // Get a specific LLM connection by slug
  server.handle(RPC_CHANNELS.llmConnections.GET, async (_ctx, slug: string): Promise<LlmConnection | null> => {
    return getLlmConnection(slug)
  })

  // Get stored API key for an LLM connection (masked — for edit form display only)
  server.handle(RPC_CHANNELS.llmConnections.GET_API_KEY, async (_ctx, slug: string): Promise<string | null> => {
    const manager = getCredentialManager()
    const key = await manager.getLlmApiKey(slug)
    if (!key) return null
    // Show provider prefix (first 7 chars) + last 4 chars, mask the middle
    if (key.length > 15) {
      return key.slice(0, 7) + '••••••••' + key.slice(-4)
    }
    return '••••••••'
  })

  // Save (create or update) an LLM connection
  // If connection.slug exists and is found, updates it; otherwise creates new
  server.handle(RPC_CHANNELS.llmConnections.SAVE, async (_ctx, connection: LlmConnection): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if this is an update or create
      const existing = getLlmConnection(connection.slug)
      if (existing) {
        // Update existing connection (can't change slug)
        const { slug: _slug, ...updates } = connection
        const success = updateLlmConnection(connection.slug, updates)
        if (!success) {
          return { success: false, error: 'Failed to update connection' }
        }
      } else {
        // Create new connection
        const success = addLlmConnection(connection)
        if (!success) {
          return { success: false, error: 'Connection with this slug already exists' }
        }
      }
      deps.platform.logger?.info(`LLM connection saved: ${connection.slug}`)
      // Push runtime updates (e.g. supportsImages toggle) to live sessions on
      // this connection. Detached so SAVE doesn't block on the per-session
      // 15s `update_runtime_config` timeout when subprocesses are slow or
      // wedged. SessionManager serializes the refresh with the next send via
      // its per-session mutex, and the lazy `getOrCreateAgent` refresh remains
      // the correctness backstop if the detached push fails.
      sessionManager.refreshConnectionRuntime(connection.slug).catch(error => {
        deps.platform.logger?.warn(
          `Detached runtime push failed for ${connection.slug}: ${error instanceof Error ? error.message : error}`,
        )
      })
      // Reinitialize auth if the saved connection is the current default
      // (updates env vars and summarization model override)
      const defaultSlug = getDefaultLlmConnection()
      if (defaultSlug === connection.slug) {
        await sessionManager.reinitializeAuth()
      }
      return { success: true }
    } catch (error) {
      deps.platform.logger?.error('Failed to save LLM connection:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Set only the selected model. Sending an entire renderer snapshot here can
  // overwrite a catalog that finished refreshing after the page was rendered.
  server.handle(RPC_CHANNELS.llmConnections.SET_MODEL, async (_ctx, slug: string, model: string): Promise<{ success: boolean; error?: string }> => {
    const connection = getLlmConnection(slug)
    if (!connection) return { success: false, error: 'Connection not found' }
    if (!model?.trim() || (connection.models?.length && !connection.models.some(entry =>
      (typeof entry === 'string' ? entry : entry.id) === model
    ))) return { success: false, error: 'MODEL_UNAVAILABLE_FOR_CONNECTION' }
    try {
      assertWorkspaceModelSelection(model, connection)
      if (!updateLlmConnection(slug, { defaultModel: model })) {
        return { success: false, error: 'Failed to update connection' }
      }
      sessionManager.refreshConnectionRuntime(slug).catch(error => {
        deps.platform.logger?.warn(
          `Detached model runtime push failed for ${slug}: ${error instanceof Error ? error.message : error}`,
        )
      })
      if (getDefaultLlmConnection() === slug) await sessionManager.reinitializeAuth()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Visibility is a field-only update on the existing connection. It never
  // changes account discovery, the default model, or a running Session.
  server.handle(RPC_CHANNELS.llmConnections.SET_MODEL_VISIBILITY, async (_ctx, slug: string, model: string, visible: boolean): Promise<{ success: boolean; error?: string }> => {
    const connection = getLlmConnection(slug)
    if (!connection) return { success: false, error: 'Connection not found' }
    const availableModels = connection.models?.length
      ? connection.models
      : getModelsForProviderType(connection.providerType, connection.piAuthProvider)
    if (typeof visible !== 'boolean' || !model?.trim() || !availableModels.some(entry =>
      (typeof entry === 'string' ? entry : entry.id) === model
    )) return { success: false, error: 'MODEL_UNAVAILABLE_FOR_CONNECTION' }

    const hidden = new Set(connection.hiddenModelIds ?? [])
    if (visible) hidden.delete(model)
    else hidden.add(model)
    if (!updateLlmConnection(slug, { hiddenModelIds: [...hidden] })) {
      return { success: false, error: 'Failed to update connection' }
    }
    return { success: true }
  })

  // Write only this model's user correction. A full renderer snapshot would
  // overwrite a catalog refreshed while the details dialog was open.
  server.handle(RPC_CHANNELS.llmConnections.SET_MODEL_DETAILS, async (_ctx, slug: string, rawId: string, settings: ManualModelSettings, add: boolean): Promise<{ success: boolean; error?: string }> => {
    const connection = getLlmConnection(slug)
    if (!connection) return { success: false, error: 'Connection not found' }
    const bareId = rawId?.trim().replace(/^pi\//, '')
    if (!bareId || bareId.length > 160 || /\s/.test(bareId)) return { success: false, error: 'Enter a valid model ID' }
    const id = connection.providerType === 'pi' || connection.providerType === 'pi_compat' ? `pi/${bareId}` : bareId
    const bundled = getModelsForProviderType(connection.providerType, connection.piAuthProvider)
    const current = connection.models?.find(entry => (typeof entry === 'string' ? entry : entry.id) === id)
    const native = bundled.find(entry => entry.id === id)
    if (add && current) return { success: false, error: 'Model is already in this connection' }
    if (!add && !current) return { success: false, error: 'Model is no longer in this connection' }
    // Pi can register arbitrary IDs only for an explicitly configured custom
    // endpoint. Native providers must have an installed executable route.
    if (add && !connection.customEndpoint && !native) return { success: false, error: 'Model has no installed runtime route for this provider' }
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return { success: false, error: 'Invalid model settings' }
    const validInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 10_000_000
    if (settings.name !== undefined && (typeof settings.name !== 'string' || !settings.name.trim() || settings.name.length > 160)) return { success: false, error: 'Invalid model name' }
    if (settings.contextWindow !== undefined && !validInteger(settings.contextWindow)) return { success: false, error: 'Invalid context window' }
    if (settings.maxOutputTokens !== undefined && !validInteger(settings.maxOutputTokens)) return { success: false, error: 'Invalid output limit' }
    if (settings.contextWindow && settings.maxOutputTokens && settings.maxOutputTokens > settings.contextWindow) return { success: false, error: 'Output limit exceeds context window' }
    if (settings.supportsImages !== undefined && typeof settings.supportsImages !== 'boolean') return { success: false, error: 'Invalid image capability' }
    const efforts = ['low', 'medium', 'high', 'xhigh', 'max']
    if (settings.reasoningEfforts !== undefined && (!Array.isArray(settings.reasoningEfforts)
      || settings.reasoningEfforts.some(value => !efforts.includes(value)))) return { success: false, error: 'Invalid reasoning levels' }
    if (settings.reasoningDisableSupported !== undefined && typeof settings.reasoningDisableSupported !== 'boolean') return { success: false, error: 'Invalid reasoning off setting' }
    if (add && connection.customEndpoint && (!settings.contextWindow || !settings.maxOutputTokens)) return { success: false, error: 'Custom models require context and output limits' }

    const sanitized: ManualModelSettings = {
      ...(settings.name ? { name: settings.name.trim() } : {}),
      ...(settings.contextWindow ? { contextWindow: settings.contextWindow } : {}),
      ...(settings.maxOutputTokens ? { maxOutputTokens: settings.maxOutputTokens } : {}),
      ...(settings.supportsImages !== undefined ? { supportsImages: settings.supportsImages } : {}),
      ...(settings.reasoningEfforts !== undefined ? { reasoningEfforts: [...new Set(settings.reasoningEfforts)] } : {}),
      ...(settings.reasoningDisableSupported !== undefined ? { reasoningDisableSupported: settings.reasoningDisableSupported } : {}),
    }
    const manualModelIds = add ? [...new Set([...(connection.manualModelIds ?? []), id])] : connection.manualModelIds
    const manualModelOverrides = { ...connection.manualModelOverrides, [id]: sanitized }
    const base: ModelDefinition | string = native ?? {
      id, name: settings.name?.trim() || bareId, shortName: settings.name?.trim() || bareId,
      description: '', provider: connection.providerType === 'anthropic' ? 'anthropic' : 'pi',
    }
    const seed = add ? [...(connection.models ?? []), base] : connection.models ?? []
    const models = applyManualModelSettings({ ...connection, models: seed, manualModelIds, manualModelOverrides }, seed, bundled)
    if (!updateLlmConnection(slug, { models, manualModelIds, manualModelOverrides })) {
      return { success: false, error: 'Failed to save model settings' }
    }
    sessionManager.refreshConnectionRuntime(slug).catch(error => {
      deps.platform.logger?.warn(`Detached model runtime push failed for ${slug}: ${error instanceof Error ? error.message : error}`)
    })
    return { success: true }
  })

  // Delete an LLM connection (at least one connection must remain)
  server.handle(RPC_CHANNELS.llmConnections.DELETE, async (_ctx, slug: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const connection = getLlmConnection(slug)
      if (!connection) {
        return { success: false, error: 'Connection not found' }
      }
      // deleteLlmConnection handles the "at least one must remain" check
      const success = deleteLlmConnection(slug)
      if (success) {
        // Stop any periodic model refresh timer for this connection
        getModelRefreshService().stopConnection(slug)
        // Also delete associated credentials
        const credentialManager = getCredentialManager()
        await credentialManager.deleteLlmCredentials(slug)
        deps.platform.logger?.info(`LLM connection deleted: ${slug}`)
      }
      return { success }
    } catch (error) {
      deps.platform.logger?.error('Failed to delete LLM connection:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Test an LLM connection (validate credentials and connectivity with actual API call)
  server.handle(RPC_CHANNELS.llmConnections.TEST, async (_ctx, slug: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await validateStoredBackendConnection({
        slug,
        hostRuntime: buildBackendHostRuntimeContext(deps.platform),
      })

      // A valid credential can lose access to the selected model. Refresh the
      // account catalog even when validation returns that selection error, so
      // the next choice is based on the current account rather than stale rows.
      if (result.shouldRefreshModels) {
        refreshModelsInBackground(slug, 'validation')
      }

      if (!result.success) {
        return { success: false, error: result.error }
      }

      touchLlmConnection(slug)

      deps.platform.logger?.info(`LLM connection validated: ${slug}`)
      return { success: true }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      deps.platform.logger?.info(`[LLM_CONNECTION_TEST] Error for ${slug}: ${msg.slice(0, 500)}`)
      const { parseValidationError } = await import('@craft-agent/shared/config')
      return { success: false, error: parseValidationError(msg) }
    }
  })

  // Set global default LLM connection
  server.handle(RPC_CHANNELS.llmConnections.SET_DEFAULT, async (_ctx, slug: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const success = setDefaultLlmConnection(slug)
      if (success) {
        deps.platform.logger?.info(`Global default LLM connection set to: ${slug}`)
        // Reinitialize auth so env vars and summarization model override match the new default
        await sessionManager.reinitializeAuth()
      }
      return { success, error: success ? undefined : 'Connection not found' }
    } catch (error) {
      deps.platform.logger?.error('Failed to set default LLM connection:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Set workspace default LLM connection
  server.handle(RPC_CHANNELS.llmConnections.SET_WORKSPACE_DEFAULT, async (_ctx, workspaceId: string, slug: string | null): Promise<{ success: boolean; error?: string }> => {
    try {
      const workspace = getWorkspaceOrThrow(workspaceId)

      // Validate connection exists if setting (not clearing)
      if (slug) {
        const connection = getLlmConnection(slug)
        if (!connection) {
          return { success: false, error: 'Connection not found' }
        }
      }

      const { loadWorkspaceConfig, saveWorkspaceConfig } = await import('@craft-agent/shared/workspaces')
      const config = loadWorkspaceConfig(workspace.rootPath)
      if (!config) {
        return { success: false, error: 'Failed to load workspace config' }
      }

      // Update workspace defaults
      config.defaults = config.defaults || {}
      if (slug) {
        config.defaults.defaultLlmConnection = slug
      } else {
        delete config.defaults.defaultLlmConnection
      }
      if (config.defaults.model) {
        const effectiveSlug = slug ?? getDefaultLlmConnection()
        const connection = effectiveSlug ? getLlmConnection(effectiveSlug) : null
        config.defaults.model = reconcileWorkspaceModelOverride(config.defaults.model, connection)
      }

      saveWorkspaceConfig(workspace.rootPath, config)
      deps.platform.logger?.info(`Workspace ${workspaceId} default LLM connection set to: ${slug}`)
      return { success: true }
    } catch (error) {
      deps.platform.logger?.error('Failed to set workspace default LLM connection:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  })

  // Refresh available models for a connection (dynamic model discovery)
  server.handle(RPC_CHANNELS.llmConnections.REFRESH_MODELS, async (_ctx, slug: string): Promise<{ success: boolean; source?: import('../../model-fetchers/index').ModelRefreshSource; error?: string }> => {
    try {
      const connection = getLlmConnection(slug)
      if (!connection) {
        return { success: false, error: 'Connection not found' }
      }

      const result = await getModelRefreshService().refreshNow(slug)
      return {
        success: result.source !== 'unavailable' && result.source !== 'superseded',
        source: result.source,
        error: result.error,
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      deps.platform.logger?.error(`Failed to refresh models for ${slug}: ${msg}`)
      return { success: false, error: msg }
    }
  })

  // ============================================================
  // ChatGPT OAuth (for Codex chatgptAuthTokens mode)
  // Server-owned: prepare + exchange happen here, browser + callback on client.
  // ============================================================

  interface PendingChatGptFlow {
    flowId: string
    state: string
    codeVerifier: string
    connectionSlug: string
    ownerClientId: string
    createdAt: number
  }
  const pendingChatGptFlows = new Map<string, PendingChatGptFlow>()
  const CHATGPT_FLOW_TTL_MS = 5 * 60 * 1000

  function cleanupExpiredChatGptFlows() {
    const now = Date.now()
    for (const [state, flow] of pendingChatGptFlows) {
      if (now - flow.createdAt > CHATGPT_FLOW_TTL_MS) {
        pendingChatGptFlows.delete(state)
      }
    }
  }

  // chatgpt:startOAuth — prepare PKCE + auth URL, store flow, return to client
  server.handle(RPC_CHANNELS.chatgpt.START_OAUTH, async (ctx, connectionSlug: string): Promise<{
    authUrl: string
    state: string
    flowId: string
  }> => {
    cleanupExpiredChatGptFlows()
    const { prepareChatGptOAuth } = await import('@craft-agent/shared/auth')

    const prepared = prepareChatGptOAuth()
    const flowId = randomUUID()

    pendingChatGptFlows.set(prepared.state, {
      flowId,
      state: prepared.state,
      codeVerifier: prepared.codeVerifier,
      connectionSlug,
      ownerClientId: ctx.clientId,
      createdAt: Date.now(),
    })

    deps.platform.logger?.info(`[ChatGPT OAuth] Flow started for ${connectionSlug} (flow=${flowId})`)
    return { authUrl: prepared.authUrl, state: prepared.state, flowId }
  })

  // chatgpt:completeOAuth — exchange code for tokens and store credentials
  server.handle(RPC_CHANNELS.chatgpt.COMPLETE_OAUTH, async (ctx, args: {
    flowId: string
    code: string
    state: string
  }): Promise<{ success: boolean; error?: string }> => {
    const { flowId, code, state } = args
    const flow = pendingChatGptFlows.get(state)

    if (!flow) throw new Error('Unknown or expired ChatGPT OAuth flow')
    if (flow.flowId !== flowId) throw new Error('Flow ID mismatch')
    if (flow.ownerClientId !== ctx.clientId) throw new Error('OAuth flow owned by different client')
    if (Date.now() - flow.createdAt > CHATGPT_FLOW_TTL_MS) {
      pendingChatGptFlows.delete(state)
      throw new Error('ChatGPT OAuth flow expired')
    }

    try {
      const { exchangeChatGptTokens } = await import('@craft-agent/shared/auth')
      const credentialManager = getCredentialManager()

      const tokens = await exchangeChatGptTokens(code, flow.codeVerifier)

      // The renderer can close the connection form while the token exchange is
      // in flight. Cancellation removes this pending flow; skip the credential
      // write if it was cancelled before persistence begins.
      if (pendingChatGptFlows.get(state) !== flow) {
        return { success: false, error: 'ChatGPT sign-in cancelled' }
      }

      await credentialManager.setLlmOAuth(flow.connectionSlug, {
        accessToken: tokens.accessToken,
        idToken: tokens.idToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt,
      })

      pendingChatGptFlows.delete(state)
      deps.platform.logger?.info(`[ChatGPT OAuth] Flow complete for ${flow.connectionSlug}`)
      refreshModelsInBackground(flow.connectionSlug, 'ChatGPT auth')
      return { success: true }
    } catch (error) {
      pendingChatGptFlows.delete(state)
      deps.platform.logger?.error('[ChatGPT OAuth] Connection completion failed:', error instanceof Error ? error.message : String(error))
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection setup failed',
      }
    }
  })

  // Cancel ongoing ChatGPT OAuth flow
  server.handle(RPC_CHANNELS.chatgpt.CANCEL_OAUTH, async (ctx, args?: { state?: string }): Promise<{ success: boolean }> => {
    if (args?.state) {
      const flow = pendingChatGptFlows.get(args.state)
      if (flow && flow.ownerClientId === ctx.clientId) {
        pendingChatGptFlows.delete(args.state)
        deps.platform.logger?.info(`[ChatGPT OAuth] Flow cancelled for ${flow.connectionSlug}`)
      }
    }
    return { success: true }
  })

  // Get ChatGPT authentication status
  server.handle(RPC_CHANNELS.chatgpt.GET_AUTH_STATUS, async (_ctx, connectionSlug: string): Promise<{
    authenticated: boolean
    expiresAt?: number
    hasRefreshToken?: boolean
  }> => {
    try {
      const credentialManager = getCredentialManager()
      const creds = await credentialManager.getLlmOAuth(connectionSlug)

      if (!creds) {
        return { authenticated: false }
      }

      // Check if expired (with 5-minute buffer)
      const isExpired = creds.expiresAt && Date.now() > creds.expiresAt - 5 * 60 * 1000

      return {
        authenticated: !isExpired || !!creds.refreshToken, // Can refresh if has refresh token
        expiresAt: creds.expiresAt,
        hasRefreshToken: !!creds.refreshToken,
      }
    } catch (error) {
      deps.platform.logger?.error('Failed to get ChatGPT auth status:', error)
      return { authenticated: false }
    }
  })

  // Logout from ChatGPT (clear stored tokens)
  server.handle(RPC_CHANNELS.chatgpt.LOGOUT, async (_ctx, connectionSlug: string): Promise<{ success: boolean }> => {
    try {
      const credentialManager = getCredentialManager()
      await credentialManager.deleteLlmCredentials(connectionSlug)
      deps.platform.logger?.info('ChatGPT credentials cleared')
      return { success: true }
    } catch (error) {
      deps.platform.logger?.error('Failed to clear ChatGPT credentials:', error)
      return { success: false }
    }
  })

  // ============================================================
  // GitHub Copilot OAuth
  // ============================================================

  // Start GitHub Copilot OAuth flow (device flow via Pi SDK)
  server.handle(RPC_CHANNELS.copilot.START_OAUTH, async (ctx, connectionSlug: string): Promise<{
    success: boolean
    error?: string
  }> => {
    // Each request owns its controller; a cancelled older request must not
    // clear a newer request's cancellation handle.
    copilotOAuthAbort?.abort()
    const controller = new AbortController()
    copilotOAuthAbort = controller
    try {
      const { loginGitHubCopilot } = await import('@craft-agent/shared/auth')
      const credentialManager = getCredentialManager()

      deps.platform.logger?.info(`Starting GitHub Copilot OAuth device flow for connection: ${connectionSlug}`)

      // App-owned login flow (pi-ai 0.81.x no longer exports one) — handles the
      // device code flow AND the critical Copilot token exchange that determines
      // the correct API endpoint for the user's subscription tier via proxy-ep.
      const credentials = await loginGitHubCopilot({
        onDeviceCode: ({ userCode, verificationUri }) => {
          pushTyped(server, RPC_CHANNELS.copilot.DEVICE_CODE, { to: 'client', clientId: ctx.clientId }, {
            userCode,
            verificationUri,
          })
          // Open GitHub device code page on the client's machine
          server.invokeClient(ctx.clientId, CLIENT_OPEN_EXTERNAL, verificationUri).catch(err => {
            deps.platform.logger?.warn(`Failed to open browser for GitHub OAuth: ${err}`)
          })
        },
        onProgress: (message) => {
          deps.platform.logger?.info(`[GitHub OAuth] ${message}`)
        },
        signal: controller.signal,
      })

      if (controller.signal.aborted) return { success: false, error: 'GitHub sign-in cancelled' }

      // Store the full OAuth credential:
      // - accessToken = Copilot API token (contains proxy-ep for correct endpoint)
      // - refreshToken = GitHub access token (used to refresh the Copilot token)
      // - expiresAt = Copilot token expiry (short-lived, ~1 hour)
      await credentialManager.setLlmOAuth(connectionSlug, {
        accessToken: credentials.access,
        refreshToken: credentials.refresh,
        expiresAt: credentials.expires,
      })

      deps.platform.logger?.info('GitHub Copilot OAuth completed successfully')
      refreshModelsInBackground(connectionSlug, 'Copilot auth')
      return { success: true }
    } catch (error) {
      if (controller.signal.aborted) return { success: false, error: 'GitHub sign-in cancelled' }
      deps.platform.logger?.error('GitHub Copilot OAuth failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth authentication failed',
      }
    } finally {
      if (copilotOAuthAbort === controller) copilotOAuthAbort = null
    }
  })

  // Cancel ongoing GitHub OAuth flow
  server.handle(RPC_CHANNELS.copilot.CANCEL_OAUTH, async (): Promise<{ success: boolean }> => {
    if (copilotOAuthAbort) {
      copilotOAuthAbort.abort()
      copilotOAuthAbort = null
      deps.platform.logger?.info('GitHub Copilot OAuth cancelled')
    }
    return { success: true }
  })

  // Get GitHub Copilot authentication status
  server.handle(RPC_CHANNELS.copilot.GET_AUTH_STATUS, async (_ctx, connectionSlug: string): Promise<{
    authenticated: boolean
  }> => {
    try {
      const credentialManager = getCredentialManager()
      const creds = await credentialManager.getLlmOAuth(connectionSlug)

      return {
        authenticated: !!creds?.accessToken,
      }
    } catch (error) {
      deps.platform.logger?.error('Failed to get GitHub auth status:', error)
      return { authenticated: false }
    }
  })

  // Logout from Copilot (clear stored tokens)
  server.handle(RPC_CHANNELS.copilot.LOGOUT, async (_ctx, connectionSlug: string): Promise<{ success: boolean }> => {
    try {
      const credentialManager = getCredentialManager()
      await credentialManager.deleteLlmCredentials(connectionSlug)
      deps.platform.logger?.info('Copilot credentials cleared')
      return { success: true }
    } catch (error) {
      deps.platform.logger?.error('Failed to clear Copilot credentials:', error)
      return { success: false }
    }
  })

  // Grok subscription uses Pi's device-code OAuth and the separate Grok
  // subscription catalog. A successful token exchange alone is not enough to
  // claim this account can run a subscription model.
  server.handle(RPC_CHANNELS.xai.START_OAUTH, async (ctx, connectionSlug: string): Promise<{ success: boolean; error?: string }> => {
    xaiOAuthAbort?.abort()
    const controller = new AbortController()
    xaiOAuthAbort = controller
    try {
      const { loginXaiSubscription } = await import('@craft-agent/shared/auth')
      const tokens = await loginXaiSubscription({
        signal: controller.signal,
        onDeviceCode: ({ userCode, verificationUri }) => {
          pushTyped(server, RPC_CHANNELS.xai.DEVICE_CODE, { to: 'client', clientId: ctx.clientId }, {
            userCode, verificationUri,
          })
          server.invokeClient(ctx.clientId, CLIENT_OPEN_EXTERNAL, verificationUri).catch(error => {
            deps.platform.logger?.warn(`Failed to open xAI verification page: ${error}`)
          })
        },
      })
      if (controller.signal.aborted) return { success: false, error: 'Grok sign-in cancelled' }
      await fetchXaiSubscriptionModels(tokens.accessToken, 15_000)
      if (controller.signal.aborted) return { success: false, error: 'Grok sign-in cancelled' }
      await getCredentialManager().setLlmOAuth(connectionSlug, tokens)
      refreshModelsInBackground(connectionSlug, 'Grok subscription auth')
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Grok sign-in failed' }
    } finally {
      if (xaiOAuthAbort === controller) xaiOAuthAbort = null
    }
  })

  server.handle(RPC_CHANNELS.xai.CANCEL_OAUTH, async (): Promise<{ success: boolean }> => {
    xaiOAuthAbort?.abort()
    xaiOAuthAbort = null
    return { success: true }
  })

  server.handle(RPC_CHANNELS.xai.READ_USAGE, async (_ctx, connectionSlug: string) => {
    const connection = getLlmConnection(connectionSlug)
    if (!connection || connection.providerType !== 'pi' || connection.piAuthProvider !== 'xai' || connection.authType !== 'oauth') {
      throw new Error('Grok subscription connection not found')
    }
    const { fetchXaiSubscriptionUsage } = await import('@craft-agent/shared/auth')
    return fetchXaiSubscriptionUsage(connectionSlug)
  })

  server.handle(RPC_CHANNELS.chatgpt.READ_USAGE, async (_ctx, connectionSlug: string) => {
    const connection = getLlmConnection(connectionSlug)
    if (!connection || connection.providerType !== 'pi' || connection.piAuthProvider !== 'openai-codex'
      || connection.authType !== 'oauth' || connection.baseUrl) {
      throw new Error('ChatGPT/Codex subscription connection not found')
    }
    const { readCodexSubscriptionUsage } = await import('@craft-agent/shared/auth')
    return readCodexSubscriptionUsage(connectionSlug)
  })
}
