import * as React from 'react'
import {
  isLocalConnection,
  isCompatProvider,
  resolveEffectiveConnectionSlug,
  resolveConnectionModelDefinition,
  getModelsForProviderType,
  type LlmConnection,
  type LlmConnectionWithStatus,
} from '@config/llm-connections'
import {
  ANTHROPIC_MODELS,
  getModelShortName,
  getThinkingLevelsForModel,
  type ModelDefinition,
} from '@config/models'
import { type ThinkingLevel } from '@craft-agent/shared/agent/thinking-levels'
import { type CliRuntimeHandshake } from '@craft-agent/shared/protocol'
import { useOptionalAppShellContext } from '@/context/AppShellContext'

/**
 * Shared hook that resolves the effective connection, model, and thinking-level
 * context for compact picker components. Eliminates the copy-paste between
 * CompactModelSelector and CompactThinkingSelector — both previously
 * re-implemented the same ~60 lines of connection/model resolution.
 */
export function useModelThinkingContext(
  currentModel: string,
  currentConnection: string | undefined,
  thinkingLevel: ThinkingLevel,
  connectionUnavailable: boolean,
) {
  const appShellCtx = useOptionalAppShellContext()
  const llmConnections = React.useMemo(
    () => appShellCtx?.llmConnections ?? [],
    [appShellCtx?.llmConnections],
  )
  const workspaceDefaultConnection = appShellCtx?.workspaceDefaultLlmConnection

  const effectiveConnection = resolveEffectiveConnectionSlug(
    currentConnection,
    workspaceDefaultConnection,
    llmConnections,
  )

  const effectiveConnectionDetails =
    React.useMemo<LlmConnectionWithStatus | null>(() => {
      if (!effectiveConnection) return null
      return llmConnections.find((c) => c.slug === effectiveConnection) ?? null
    }, [llmConnections, effectiveConnection])

  const connectionDefaultModel = React.useMemo(() => {
    const conn = effectiveConnectionDetails
    if (!conn) return null
    if (!isCompatProvider(conn.providerType)) return null
    if (conn.models && conn.models.length > 1) return null
    return conn.defaultModel ?? null
  }, [effectiveConnectionDetails])

  const availableModels = React.useMemo(() => {
    if (connectionUnavailable) return []
    if (!effectiveConnectionDetails) return ANTHROPIC_MODELS
    return getConnectionModels(effectiveConnectionDetails)
  }, [effectiveConnectionDetails, connectionUnavailable])

  const selectedModelEntry = React.useMemo(() => {
    const modelId = connectionDefaultModel ?? currentModel
    return resolveConnectionModelDefinition(effectiveConnectionDetails, modelId)
  }, [effectiveConnectionDetails, connectionDefaultModel, currentModel])
  const selectedModelId = connectionDefaultModel ?? currentModel

  const thinkingDisabled = selectedModelEntry?.supportsThinking === false

  const availableThinkingLevels = React.useMemo(
    () => getThinkingLevelsForModel(selectedModelEntry),
    [selectedModelEntry],
  )

  const effectiveThinkingLevel: ThinkingLevel = availableThinkingLevels.some(
    (level) => level.id === thinkingLevel,
  )
    ? thinkingLevel
    : (availableThinkingLevels[0]?.id ?? 'off')

  return {
    effectiveConnection,
    effectiveConnectionDetails,
    connectionDefaultModel,
    availableModels,
    thinkingDisabled,
    selectedModelEntry,
    selectedModelId,
    availableThinkingLevels,
    effectiveThinkingLevel,
  }
}

/**
 * Format token count for display (e.g., 1500 -> "1.5k", 200000 -> "200k").
 * Shared by the desktop model dropdown and the compact (drawer) model picker.
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k`
  }
  return tokens.toString()
}

/**
 * Strip the "pi/" prefix from model IDs/display names so the user sees a
 * provider-agnostic label in the picker (e.g., "pi/claude-opus" → "claude-opus").
 */
export function stripPiPrefixForDisplay(value: string): string {
  return value.startsWith('pi/') ? value.slice(3) : value
}

export interface ModelPickerItem {
  connection: LlmConnectionWithStatus
  model: ModelDefinition | string
  modelId: string
  modelName: string
  searchText: string
}

export interface ModelPickerGroup {
  connection: LlmConnectionWithStatus
  providerLabel: string
  items: ModelPickerItem[]
  sourceKind?: 'api' | 'cli'
}

export function getConnectionModels(
  connection: LlmConnection,
): Array<ModelDefinition | string> {
  if (connection.models?.length) {
    return connection.models.map((model) => {
      if (typeof model !== 'string') return model
      return resolveConnectionModelDefinition(connection, model) ?? model
    })
  }

  const registryModels = getModelsForProviderType(
    connection.providerType,
    connection.piAuthProvider,
  )
  if (registryModels.length) return [...registryModels]

  if (!connection.defaultModel) return []
  return [
    resolveConnectionModelDefinition(connection, connection.defaultModel)
      ?? connection.defaultModel,
  ]
}

/**
 * Human-facing provider label used by every model picker surface. Connection
 * names remain visible as secondary identity so two accounts for the same
 * provider never collapse into one ambiguous row.
 */
export function getProviderDisplayName(connection: LlmConnection): string {
  if (connection.providerType === 'anthropic') return 'Anthropic'
  if (connection.providerType === 'pi') {
    const provider = connection.piAuthProvider
    if (provider === 'openai' || provider === 'openai-codex') return 'OpenAI'
    if (provider === 'github-copilot') return 'GitHub Copilot'
    if (provider === 'google') return 'Google'
    if (provider === 'xai') return 'xAI'
    if (provider === 'openrouter') return 'OpenRouter'
    if (provider === 'deepseek') return 'DeepSeek'
    if (provider === 'mistral') return 'Mistral'
    if (provider === 'groq') return 'Groq'
    if (provider) return provider
    return 'Pi'
  }
  if (connection.providerType === 'pi_compat') {
    if (isLocalConnection(connection)) return 'Local'
    return 'Compatible API'
  }
  return connection.providerType || connection.name
}

/**
 * One provider/model projection for desktop menu, compact drawer, and Settings.
 * This intentionally contains no UI state: all surfaces consume the same
 * connected/authenticated model inventory and only choose a suitable shell.
 */
export function buildModelPickerGroups(
  connections: readonly LlmConnectionWithStatus[],
): ModelPickerGroup[] {
  return connections
    .filter((connection) => connection.isAuthenticated)
    .map((connection) => {
      const models = getConnectionModels(connection)
      const providerLabel = getProviderDisplayName(connection)
      const items = models.map((model) => {
        const modelId = typeof model === 'string' ? model : model.id
        const modelName =
          typeof model === 'string'
            ? stripPiPrefixForDisplay(getModelShortName(model))
            : model.name || stripPiPrefixForDisplay(model.id)
        return {
          connection,
          model,
          modelId,
          modelName,
          searchText:
            `${providerLabel} ${connection.name} ${modelName} ${modelId}`.toLocaleLowerCase(),
        }
      })
      return { connection, providerLabel, items, sourceKind: 'api' as const }
    })
    .filter((group) => group.items.length > 0)
    .sort((a, b) => {
      if (a.connection.isDefault !== b.connection.isDefault) {
        return a.connection.isDefault ? -1 : 1
      }
      return a.providerLabel.localeCompare(b.providerLabel)
    })
}

/**
 * Read-only projection of a CLI capability handshake into the same inventory
 * consumed by API/subscription model pickers. The synthetic connection exists
 * only in renderer memory; it is never persisted as a second connection
 * authority.
 */
export function buildCliRuntimeModelPickerGroups(
  runtimes: readonly CliRuntimeHandshake[],
): ModelPickerGroup[] {
  return runtimes
    .filter(
      (runtime) =>
        (runtime.status === 'ready' || runtime.status === 'partial') &&
        runtime.models.length > 0,
    )
    .map((runtime) => {
      const connection: LlmConnectionWithStatus = {
        slug: `cli:${runtime.id}`,
        name: runtime.name,
        providerType: 'pi_compat',
        authType: 'api_key',
        createdAt: runtime.checkedAt,
        isAuthenticated: runtime.status === 'ready',
        isDefault: false,
        models: runtime.models.map(
          (model): ModelDefinition => ({
            id: model.id,
            name: model.name,
            shortName: model.name,
            description: model.description ?? '',
            provider: 'pi',
            contextWindow: model.contextWindow ?? 0,
            supportsThinking: model.supportedReasoningEfforts.length > 0,
            supportedReasoningEfforts: model.supportedReasoningEfforts,
            supportsImages: model.inputModalities.includes('image'),
            inputModalities: model.inputModalities,
          }),
        ),
      }
      const items = (connection.models ?? []).map((model) => {
        const definition = model as ModelDefinition
        return {
          connection,
          model: definition,
          modelId: definition.id,
          modelName: definition.name || definition.id,
          searchText:
            `${runtime.name} ${definition.name} ${definition.id}`.toLocaleLowerCase(),
        }
      })
      return {
        connection,
        providerLabel: runtime.name,
        items,
        sourceKind: 'cli' as const,
      }
    })
}

export function filterModelPickerGroups(
  groups: readonly ModelPickerGroup[],
  query: string,
): ModelPickerGroup[] {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return [...groups]
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.searchText.includes(needle)),
    }))
    .filter((group) => group.items.length > 0)
}
