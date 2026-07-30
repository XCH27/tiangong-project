import type { LlmConnection, ModelDefinition, ModelRuntimeMode } from '@craft-agent/shared/config'

const CATALOG_URL = 'https://models.opencode.ai/api.json'
const CACHE_TTL_MS = 5 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8_000
const INPUT_MODALITIES = new Set(['text', 'image', 'audio', 'video', 'pdf'])

interface CatalogModel {
  limit?: { context?: unknown }
  modalities?: { input?: unknown }
  reasoning?: unknown
  reasoning_options?: unknown
  experimental?: { modes?: unknown } | null
}

interface CatalogProvider {
  models?: Record<string, CatalogModel>
}

type Catalog = Record<string, CatalogProvider>

let cachedCatalog: Catalog | undefined
let cachedAt = 0
let inFlight: Promise<Catalog | undefined> | undefined

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function parseRuntimeModes(value: unknown): Record<string, ModelRuntimeMode> | undefined {
  const modes = asRecord(value)
  if (!modes) return undefined

  const parsed: Record<string, ModelRuntimeMode> = {}
  for (const [id, rawMode] of Object.entries(modes)) {
    const mode = asRecord(rawMode)
    const provider = asRecord(mode?.provider)
    const requestBody = asRecord(provider?.body)
    const rawHeaders = asRecord(provider?.headers)
    const requestHeaders = rawHeaders
      ? Object.fromEntries(Object.entries(rawHeaders).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string',
        ))
      : undefined
    const cost = asRecord(mode?.cost)
    const inputMultiplier = typeof cost?.input === 'number' ? cost.input : undefined

    if (requestBody || (requestHeaders && Object.keys(requestHeaders).length > 0)) {
      parsed[id] = {
        ...(requestBody ? { requestBody } : {}),
        ...(requestHeaders && Object.keys(requestHeaders).length > 0 ? { requestHeaders } : {}),
        ...(inputMultiplier !== undefined ? { quotaMultiplier: inputMultiplier } : {}),
      }
    }
  }
  return Object.keys(parsed).length > 0 ? parsed : undefined
}

function parseReasoningEfforts(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const supportsToggle = value.some(option => asRecord(option)?.type === 'toggle')
  for (const option of value) {
    const record = asRecord(option)
    if (record?.type !== 'effort' || !Array.isArray(record.values)) continue
    const values = record.values
      .filter((entry): entry is string => typeof entry === 'string')
      .map(entry => entry === 'none' ? 'off' : entry)
    if (supportsToggle && !values.includes('off')) values.unshift('off')
    return values.length > 0 ? values : undefined
  }
  // A toggle-only reasoning contract is not a depth scale. Preserve it as the
  // smallest honest binary projection supported by the existing session
  // authority instead of inventing six effort tiers.
  if (supportsToggle) return ['off', 'high']
  return undefined
}

function providerCatalogId(
  connection: Pick<LlmConnection, 'providerType' | 'piAuthProvider'>,
): string | undefined {
  if (connection.providerType === 'anthropic') return 'anthropic'
  if (connection.providerType !== 'pi') return undefined
  if (connection.piAuthProvider === 'openai-codex') return 'openai'
  return connection.piAuthProvider
}

function bareModelId(modelId: string): string {
  return modelId.startsWith('pi/') ? modelId.slice(3) : modelId
}

export function enrichModelsFromOpenCodeCatalog(
  connection: Pick<LlmConnection, 'providerType' | 'piAuthProvider'>,
  models: ModelDefinition[],
  catalog: Catalog,
): ModelDefinition[] {
  const providerId = providerCatalogId(connection)
  const catalogModels = providerId ? catalog[providerId]?.models : undefined
  if (!catalogModels) return models

  return models.map(model => {
    const catalogModel = catalogModels[bareModelId(model.id)]
    if (!catalogModel) return model

    const reasoningEfforts = parseReasoningEfforts(catalogModel.reasoning_options)
    const runtimeModes = parseRuntimeModes(catalogModel.experimental?.modes)
    const contextWindow = typeof catalogModel.limit?.context === 'number'
      ? catalogModel.limit.context
      : model.contextWindow
    const inputModalities = Array.isArray(catalogModel.modalities?.input)
      ? catalogModel.modalities.input.filter(
          (entry): entry is 'text' | 'image' | 'audio' | 'video' | 'pdf' =>
            typeof entry === 'string' && INPUT_MODALITIES.has(entry),
        )
      : undefined

    return {
      ...model,
      contextWindow,
      ...(typeof catalogModel.reasoning === 'boolean'
        ? { supportsThinking: catalogModel.reasoning && reasoningEfforts !== undefined }
        : {}),
      ...(reasoningEfforts ? { supportedReasoningEfforts: reasoningEfforts } : {}),
      ...(inputModalities && inputModalities.length > 0 ? { inputModalities } : {}),
      ...(runtimeModes ? { runtimeModes } : {}),
      supportsFastMode: runtimeModes?.fast !== undefined,
    }
  })
}

async function loadCatalog(): Promise<Catalog | undefined> {
  const now = Date.now()
  if (cachedCatalog && now - cachedAt < CACHE_TTL_MS) return cachedCatalog
  if (inFlight) return inFlight

  inFlight = (async () => {
    try {
      const response = await fetch(CATALOG_URL, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: { accept: 'application/json' },
      })
      if (!response.ok) return cachedCatalog
      const value = await response.json()
      const catalog = asRecord(value) as Catalog | undefined
      if (catalog) {
        cachedCatalog = catalog
        cachedAt = Date.now()
      }
      return catalog ?? cachedCatalog
    } catch {
      return cachedCatalog
    } finally {
      inFlight = undefined
    }
  })()
  return inFlight
}

export async function enrichModelsWithOpenCodeCatalog(
  connection: Pick<LlmConnection, 'providerType' | 'piAuthProvider'>,
  models: ModelDefinition[],
): Promise<ModelDefinition[]> {
  const catalog = await loadCatalog()
  return catalog ? enrichModelsFromOpenCodeCatalog(connection, models, catalog) : models
}
