import {
  PROVIDER_CATALOG,
  getProviderCatalogEntry,
  searchProviderCatalog,
  type ProviderAuthKind,
  type ProviderCatalogEntry,
} from '@config/provider-catalog'

/**
 * State for the 添加模型 surface: a grid of provider cards where exactly one
 * expands into its connect form.
 *
 * There is no separate model layer. A provider expands and everything needed to
 * connect it — plan, credential, models — is in that one form, because splitting
 * provider and model into two levels made the user walk a hierarchy that carries
 * no decision.
 *
 * The form is *derived*, not fixed. Providers differ in ways a single hardcoded
 * layout cannot absorb: some sell both a subscription and metered API access,
 * some only the latter; some need an endpoint typed in, some have one. So
 * `connectFields()` returns the ordered boxes for a given provider and the view
 * renders that list. A provider with one auth mechanism never shows a chooser
 * with one option in it.
 *
 * Kept as a pure module so those rules are testable without mounting a dialog —
 * the previous flow put all of it inline in an 851-line `ApiKeyInput`, where the
 * only way to check behavior was to click.
 */

/**
 * Model discovery has two layers.
 *
 * The provider adapter supplies an immediate capability-bearing catalog; after
 * a credential is entered, the live endpoint can extend it with account-specific
 * models. This matches OpenCode's provider-first behavior without making a key
 * a prerequisite for seeing a known provider's models.
 */
export type ModelDiscovery =
  /** No usable credential yet — the box is present but not answerable. */
  | { status: 'awaiting-credential' }
  | { status: 'loading' }
  | { status: 'ready'; models: readonly string[] }
  /** Discovery failed; the user can still type ids by hand. */
  | { status: 'error'; message: string }

export const AWAITING_CREDENTIAL: ModelDiscovery = { status: 'awaiting-credential' }

export interface AddModelDraft {
  /** Catalog id of the provider being connected, or null while picking. */
  expandedProviderId: string | null
  /** Plan vs API, per provider. Only meaningful when a provider offers both. */
  authMode: Readonly<Record<string, ProviderAuthKind>>
  /** Ids ticked from the discovered list, per provider. */
  selectedModels: Readonly<Record<string, readonly string[]>>
  /** Ids typed through the escape hatch, per provider. */
  customModels: Readonly<Record<string, readonly string[]>>
  /** Result of asking the provider what it serves, per provider. */
  discovery: Readonly<Record<string, ModelDiscovery>>
  apiKey: string
  baseUrlOverride: string
  query: string
}

export const EMPTY_ADD_MODEL_DRAFT: AddModelDraft = {
  expandedProviderId: null,
  authMode: {},
  selectedModels: {},
  customModels: {},
  discovery: {},
  apiKey: '',
  baseUrlOverride: '',
  query: '',
}

export function discoveryFor(draft: AddModelDraft, providerId: string): ModelDiscovery {
  return draft.discovery[providerId] ?? AWAITING_CREDENTIAL
}

export function setDiscovery(
  draft: AddModelDraft,
  providerId: string,
  discovery: ModelDiscovery,
): AddModelDraft {
  return { ...draft, discovery: { ...draft.discovery, [providerId]: discovery } }
}

/**
 * Whether there is enough to ask the provider for its catalog. A subscription
 * carries no key, so it is answerable as soon as the plan is connected.
 */
export function canDiscoverModels(
  entry: ProviderCatalogEntry,
  draft: AddModelDraft,
): boolean {
  if (effectiveAuthMode(entry, draft) === 'oauth') return true
  if (!draft.apiKey.trim()) return false
  if (!entry.piProvider && !entry.baseUrl && !draft.baseUrlOverride.trim()) return false
  return true
}

/** Which mechanism the form is currently collecting for this provider. */
export function effectiveAuthMode(
  entry: ProviderCatalogEntry,
  draft: AddModelDraft,
): ProviderAuthKind {
  const chosen = draft.authMode[entry.id]
  if (chosen && entry.auth.includes(chosen)) return chosen
  return entry.auth[0] ?? 'api-key'
}

// ── Derived form shape ──────────────────────────────────────────────────────

export type ConnectField =
  /** 第一框. Omitted entirely when the provider offers a single mechanism. */
  | { kind: 'auth-mode'; options: readonly ProviderAuthKind[]; value: ProviderAuthKind }
  /** Subscription sign-in. Replaces the key box rather than sitting beside it. */
  | { kind: 'oauth'; providerLabel: string }
  /** 第二框 for metered access. */
  | { kind: 'api-key'; placeholder: string; apiKeyUrl?: string }
  /** API 地址. Required when nothing else can supply an endpoint. */
  | { kind: 'base-url'; required: boolean; placeholder?: string }
  /**
   * 第三框. Multi-select over what the provider actually serves, always with a
   * custom-id escape. Carries its own discovery state so live refresh and
   * adapter-catalog loading are explicit.
   */
  | {
      kind: 'models'
      discovery: ModelDiscovery
      /** Catalog fallback, offered only when discovery failed. */
      fallback: readonly string[]
      selected: readonly string[]
    }

export function connectFields(
  entry: ProviderCatalogEntry,
  draft: AddModelDraft,
): readonly ConnectField[] {
  const fields: ConnectField[] = []
  const mode = effectiveAuthMode(entry, draft)

  // A chooser with one option is noise, so it only appears for providers that
  // genuinely sell both a plan and metered access.
  if (entry.auth.length > 1) {
    fields.push({ kind: 'auth-mode', options: entry.auth, value: mode })
  }

  if (mode === 'oauth') {
    fields.push({ kind: 'oauth', providerLabel: entry.label })
    return fields
  }

  fields.push({
    kind: 'api-key',
    placeholder: entry.placeholder ?? 'sk-...',
    apiKeyUrl: entry.apiKeyUrl,
  })
  // Endpoint is part of every API connection. Known providers show their
  // default as an optional override; an unbacked provider with no catalog URL
  // requires one.
  fields.push({
    kind: 'base-url',
    required: !entry.piProvider && !entry.baseUrl,
    placeholder: entry.baseUrl,
  })
  fields.push({
    kind: 'models',
    discovery: discoveryFor(draft, entry.id),
    fallback: entry.models ?? [],
    selected: draftModelsFor(draft, entry.id),
  })

  return fields
}

// ── Draft transitions ───────────────────────────────────────────────────────

/** Chips shown in the model field: curated ticks first, then custom ids. */
export function draftModelsFor(draft: AddModelDraft, providerId: string): readonly string[] {
  const curated = draft.selectedModels[providerId] ?? []
  const custom = draft.customModels[providerId] ?? []
  const seen = new Set(curated)
  return [...curated, ...custom.filter((id) => !seen.has(id))]
}

/**
 * Expanding a different card discards the in-progress credential rather than
 * carrying it across providers. A key pasted for one provider is never valid for
 * another, and keeping it in the field invites submitting it to the wrong
 * endpoint.
 */
export function expandProvider(draft: AddModelDraft, providerId: string | null): AddModelDraft {
  if (draft.expandedProviderId === providerId) return draft
  return { ...draft, expandedProviderId: providerId, apiKey: '', baseUrlOverride: '' }
}

/**
 * Credentials do not erase the bundled provider catalog. A later live refresh
 * may replace or extend it, but typing a key must not make an already configured
 * provider look unconfigured.
 */
export function setCredentialField(
  draft: AddModelDraft,
  patch: { apiKey?: string; baseUrlOverride?: string },
): AddModelDraft {
  return { ...draft, ...patch }
}

/** Switching plan↔API also drops the credential: the two are not interchangeable. */
export function setAuthMode(
  draft: AddModelDraft,
  providerId: string,
  mode: ProviderAuthKind,
): AddModelDraft {
  if (effectiveAuthModeById(draft, providerId) === mode) return draft
  // Plan and API are different accounts with different entitlements, so the
  // model list fetched under one does not describe the other.
  return setDiscovery(
    {
      ...draft,
      authMode: { ...draft.authMode, [providerId]: mode },
      apiKey: '',
      baseUrlOverride: '',
    },
    providerId,
    AWAITING_CREDENTIAL,
  )
}

function effectiveAuthModeById(draft: AddModelDraft, providerId: string): ProviderAuthKind | null {
  const entry = getProviderCatalogEntry(providerId)
  return entry ? effectiveAuthMode(entry, draft) : null
}

export function toggleModel(
  draft: AddModelDraft,
  providerId: string,
  modelId: string,
): AddModelDraft {
  const current = draft.selectedModels[providerId] ?? []
  const next = current.includes(modelId)
    ? current.filter((id) => id !== modelId)
    : [...current, modelId]
  return { ...draft, selectedModels: { ...draft.selectedModels, [providerId]: next } }
}

/**
 * The escape hatch behind 使用其他模型. A curated list goes stale the day a
 * provider ships something new, so the form must never be the reason a model is
 * unreachable.
 */
export function addCustomModel(
  draft: AddModelDraft,
  providerId: string,
  rawId: string,
): AddModelDraft {
  const modelId = rawId.trim()
  if (!modelId) return draft
  if (draftModelsFor(draft, providerId).includes(modelId)) return draft
  const current = draft.customModels[providerId] ?? []
  return { ...draft, customModels: { ...draft.customModels, [providerId]: [...current, modelId] } }
}

/** Chip removal reaches both lists; a chip does not know its origin. */
export function removeModel(
  draft: AddModelDraft,
  providerId: string,
  modelId: string,
): AddModelDraft {
  return {
    ...draft,
    selectedModels: {
      ...draft.selectedModels,
      [providerId]: (draft.selectedModels[providerId] ?? []).filter((id) => id !== modelId),
    },
    customModels: {
      ...draft.customModels,
      [providerId]: (draft.customModels[providerId] ?? []).filter((id) => id !== modelId),
    },
  }
}

// ── Validation and submission ───────────────────────────────────────────────

export type AddModelMissingField =
  | 'provider'
  /** The chosen path completes via sign-in; this form has nothing to submit. */
  | 'oauth'
  | 'model'
  | 'modelsLoading'
  | 'apiKey'
  | 'baseUrl'
  | null

export interface AddModelValidation {
  canSubmit: boolean
  /** Which required box to point at first. */
  missing: AddModelMissingField
}

/**
 * Validation walks the derived field list, so a box that is not rendered can
 * never block submission — the failure mode where a form refuses to submit over
 * a field the user cannot see.
 */
export function validateDraft(draft: AddModelDraft): AddModelValidation {
  const providerId = draft.expandedProviderId
  if (!providerId) return { canSubmit: false, missing: 'provider' }

  const entry = getProviderCatalogEntry(providerId)
  if (!entry) return { canSubmit: false, missing: 'provider' }

  // A subscription completes through its own sign-in action, not through this
  // form's submit. Saying `canSubmit: true` here while `buildSubmission` returns
  // null left the two in direct contradiction: any caller trusting the first
  // renders an enabled button that does nothing when pressed. Only the current
  // caller's extra `authMode === 'api-key'` guard was hiding it.
  if (effectiveAuthMode(entry, draft) === 'oauth') {
    return { canSubmit: false, missing: 'oauth' }
  }

  for (const field of connectFields(entry, draft)) {
    if (field.kind === 'api-key' && !draft.apiKey.trim()) {
      return { canSubmit: false, missing: 'apiKey' }
    }
    if (field.kind === 'base-url' && field.required && !draft.baseUrlOverride.trim()) {
      return { canSubmit: false, missing: 'baseUrl' }
    }
    if (field.kind === 'models') {
      // Discovery runs after the credential, so an unanswered model box while a
      // fetch is pending is not a user error — reporting it as one would blame
      // the user for the form's own sequencing.
      if (field.discovery.status === 'loading') {
        return { canSubmit: false, missing: 'modelsLoading' }
      }
      if (field.selected.length === 0) {
        return { canSubmit: false, missing: 'model' }
      }
    }
  }
  return { canSubmit: true, missing: null }
}

export interface AddModelSubmission {
  providerId: string
  piProvider?: string
  authMode: ProviderAuthKind
  models: readonly string[]
  /** Empty for a subscription connection, which carries no key. */
  apiKey: string
  baseUrl?: string
}

export function buildSubmission(draft: AddModelDraft): AddModelSubmission | null {
  if (!validateDraft(draft).canSubmit) return null
  const providerId = draft.expandedProviderId as string
  const entry = getProviderCatalogEntry(providerId) as ProviderCatalogEntry
  if (effectiveAuthMode(entry, draft) === 'oauth') return null
  return {
    providerId,
    piProvider: entry.piProvider,
    authMode: effectiveAuthMode(entry, draft),
    models: draftModelsFor(draft, providerId),
    apiKey: draft.apiKey.trim(),
    baseUrl: draft.baseUrlOverride.trim() || entry.baseUrl,
  }
}

/**
 * Cards to render. The expanded card is lifted out of the grid so it can span
 * the full width, leaving the remaining providers in the two-column grid below.
 */
export function partitionCatalog(draft: AddModelDraft): {
  expanded: ProviderCatalogEntry | null
  grid: readonly ProviderCatalogEntry[]
} {
  const matches = draft.query ? searchProviderCatalog(draft.query) : PROVIDER_CATALOG
  const expanded = draft.expandedProviderId
    ? getProviderCatalogEntry(draft.expandedProviderId) ?? null
    : null
  return { expanded, grid: matches.filter((entry) => entry.id !== expanded?.id) }
}
