import { describe, expect, it } from 'bun:test'
import {
  EMPTY_ADD_MODEL_DRAFT,
  addCustomModel,
  buildSubmission,
  connectFields,
  draftModelsFor,
  effectiveAuthMode,
  expandProvider,
  partitionCatalog,
  removeModel,
  setAuthMode,
  setCredentialField,
  setDiscovery,
  toggleModel,
  validateDraft,
  type AddModelDraft,
} from '../add-model-model'
import {
  getProviderCatalogEntry,
  PROVIDER_CATALOG,
} from '@config/provider-catalog'

const entry = (id: string) => {
  const found = getProviderCatalogEntry(id)
  if (!found) throw new Error(`missing catalog entry: ${id}`)
  return found
}

const open = (id: string) => expandProvider(EMPTY_ADD_MODEL_DRAFT, id)
const fieldKinds = (id: string, draft: AddModelDraft = open(id)) =>
  connectFields(entry(id), draft).map((field) => field.kind)

describe('derived form shape', () => {
  // A chooser with a single option is noise.
  it('omits the plan/API chooser for a provider that only sells API access', () => {
    expect(fieldKinds('deepseek')).toEqual(['api-key', 'base-url', 'models'])
  })

  it('offers the chooser when a provider sells both, defaulting to the plan', () => {
    expect(fieldKinds('anthropic')).toEqual(['auth-mode', 'oauth'])
  })

  it('swaps the sign-in box for a key box when the user picks API', () => {
    const draft = setAuthMode(open('anthropic'), 'anthropic', 'api-key')
    expect(fieldKinds('anthropic', draft)).toEqual([
      'auth-mode',
      'api-key',
      'base-url',
      'models',
    ])
  })

  it('shows the endpoint on every API connection', () => {
    expect(fieldKinds('siliconflow')).toEqual(['api-key', 'base-url', 'models'])
    expect(fieldKinds('deepseek')).toEqual(['api-key', 'base-url', 'models'])
  })

  it('requires the endpoint only when the catalog has no default', () => {
    const known = connectFields(entry('siliconflow'), open('siliconflow'))
      .find((field) => field.kind === 'base-url')
    const unknown = connectFields(entry('xiaomi-mimo'), open('xiaomi-mimo'))
      .find((field) => field.kind === 'base-url')

    expect(known).toMatchObject({ required: false })
    expect(unknown).toMatchObject({ required: true })
  })

  it('never asks for an endpoint on a subscription connection', () => {
    expect(fieldKinds('anthropic')).not.toContain('base-url')
  })
})

describe('auth mode', () => {
  it('falls back to the provider’s first declared mechanism', () => {
    expect(effectiveAuthMode(entry('anthropic'), EMPTY_ADD_MODEL_DRAFT)).toBe('oauth')
    expect(effectiveAuthMode(entry('deepseek'), EMPTY_ADD_MODEL_DRAFT)).toBe('api-key')
  })

  // A subscription token and a metered key are not interchangeable.
  it('drops a typed credential when switching between plan and API', () => {
    const typed = { ...setAuthMode(open('anthropic'), 'anthropic', 'api-key'), apiKey: 'sk-x' }
    expect(setAuthMode(typed, 'anthropic', 'oauth').apiKey).toBe('')
  })
})

describe('provider expansion', () => {
  it('opens one provider at a time', () => {
    expect(expandProvider(open('deepseek'), 'siliconflow').expandedProviderId)
      .toBe('siliconflow')
  })

  it('discards an in-progress credential when switching provider', () => {
    const draft = expandProvider({ ...open('deepseek'), apiKey: 'sk-secret' }, 'openrouter')
    expect(draft.apiKey).toBe('')
  })

  it('is a no-op when re-expanding the already open provider', () => {
    const opened = { ...open('deepseek'), apiKey: 'sk-typed' }
    expect(expandProvider(opened, 'deepseek')).toBe(opened)
  })
})

describe('model selection', () => {
  it('keeps the adapter model catalog while the API key is typed', () => {
    const configured = setDiscovery(open('deepseek'), 'deepseek', {
      status: 'ready',
      models: ['pi/deepseek-v4-pro', 'pi/deepseek-v4-flash'],
    })
    const typed = setCredentialField(configured, { apiKey: 'sk-typed' })
    const models = connectFields(entry('deepseek'), typed)
      .find((field) => field.kind === 'models')

    expect(models).toMatchObject({
      discovery: {
        status: 'ready',
        models: ['pi/deepseek-v4-pro', 'pi/deepseek-v4-flash'],
      },
    })
  })

  it('toggles curated models on and off', () => {
    let draft = toggleModel(open('deepseek'), 'deepseek', 'deepseek-chat')
    expect(draftModelsFor(draft, 'deepseek')).toEqual(['deepseek-chat'])
    draft = toggleModel(draft, 'deepseek', 'deepseek-chat')
    expect(draftModelsFor(draft, 'deepseek')).toEqual([])
  })

  it('accepts a custom id the catalog does not know', () => {
    expect(draftModelsFor(addCustomModel(open('deepseek'), 'deepseek', 'deepseek-v4-pro'), 'deepseek'))
      .toEqual(['deepseek-v4-pro'])
  })

  it('ignores blank and duplicate custom ids', () => {
    let draft = addCustomModel(open('deepseek'), 'deepseek', '   ')
    expect(draftModelsFor(draft, 'deepseek')).toEqual([])
    draft = addCustomModel(addCustomModel(draft, 'deepseek', 'x-1'), 'deepseek', 'x-1')
    expect(draftModelsFor(draft, 'deepseek')).toEqual(['x-1'])
  })

  // A chip does not know whether it came from the curated list or the escape
  // hatch, so removal has to reach both.
  it('removes a chip from whichever list holds it', () => {
    let draft = toggleModel(open('deepseek'), 'deepseek', 'deepseek-chat')
    draft = addCustomModel(draft, 'deepseek', 'custom-1')
    draft = removeModel(removeModel(draft, 'deepseek', 'deepseek-chat'), 'deepseek', 'custom-1')
    expect(draftModelsFor(draft, 'deepseek')).toEqual([])
  })

  it('never renders the same id twice when a custom id joins the catalog', () => {
    let draft = addCustomModel(open('deepseek'), 'deepseek', 'deepseek-chat')
    draft = toggleModel(draft, 'deepseek', 'deepseek-chat')
    expect(draftModelsFor(draft, 'deepseek')).toEqual(['deepseek-chat'])
  })
})

describe('validation', () => {
  it('names the first missing box rather than failing silently', () => {
    expect(validateDraft(EMPTY_ADD_MODEL_DRAFT).missing).toBe('provider')
    expect(validateDraft(open('deepseek')).missing).toBe('apiKey')

    const keyed = { ...open('deepseek'), apiKey: 'sk-1' }
    expect(validateDraft(keyed).missing).toBe('model')
    expect(validateDraft(toggleModel(keyed, 'deepseek', 'deepseek-chat')).canSubmit).toBe(true)
  })

  // A subscription completes through its own sign-in action, so this form has
  // nothing to submit. Reporting `canSubmit: true` while `buildSubmission`
  // returns null put the two in contradiction — a caller trusting validation
  // alone renders an enabled button that does nothing.
  it('reports a subscription as sign-in rather than a submittable draft', () => {
    const draft = open('anthropic')
    expect(validateDraft(draft)).toEqual({ canSubmit: false, missing: 'oauth' })
    expect(buildSubmission(draft)).toBeNull()
    expect(validateDraft(setAuthMode(draft, 'anthropic', 'api-key')).missing).toBe('apiKey')
  })

  it('requires an endpoint for a provider with no Pi backing and no known base URL', () => {
    let draft = addCustomModel(open('xiaomi-mimo'), 'xiaomi-mimo', 'mimo-1')
    draft = { ...draft, apiKey: 'sk-1' }

    expect(validateDraft(draft).missing).toBe('baseUrl')
    expect(validateDraft({ ...draft, baseUrlOverride: 'https://api.test/v1' }).canSubmit).toBe(true)
  })

  it('does not ask for an endpoint when the catalog already knows one', () => {
    const draft = addCustomModel(open('siliconflow'), 'siliconflow', 'Qwen/Qwen3-8B')
    expect(validateDraft({ ...draft, apiKey: 'sk-1' }).canSubmit).toBe(true)
  })
})

describe('submission', () => {
  it('carries the Pi provider key, mode and resolved endpoint', () => {
    let draft = toggleModel(open('deepseek'), 'deepseek', 'deepseek-chat')
    draft = { ...draft, apiKey: '  sk-1  ' }

    expect(buildSubmission(draft)).toEqual({
      providerId: 'deepseek',
      piProvider: 'deepseek',
      authMode: 'api-key',
      models: ['deepseek-chat'],
      apiKey: 'sk-1',
      baseUrl: 'https://api.deepseek.com',
    })
  })

  it('prefers an explicit endpoint override over the catalog default', () => {
    let draft = toggleModel(open('deepseek'), 'deepseek', 'deepseek-chat')
    draft = { ...draft, apiKey: 'sk-1', baseUrlOverride: 'https://proxy.test/v1' }
    expect(buildSubmission(draft)?.baseUrl).toBe('https://proxy.test/v1')
  })

  it('refuses to build an incomplete submission', () => {
    expect(buildSubmission(open('deepseek'))).toBeNull()
  })
})

describe('catalog partitioning', () => {
  it('projects every shipped API adapter into the settings provider catalog', () => {
    expect(PROVIDER_CATALOG.length).toBeGreaterThanOrEqual(38)
    expect(getProviderCatalogEntry('fireworks')?.piProvider).toBe('fireworks')
    expect(getProviderCatalogEntry('cloudflare-workers-ai')?.piProvider)
      .toBe('cloudflare-workers-ai')
  })

  it('lifts the expanded provider out of the grid', () => {
    const { expanded, grid } = partitionCatalog(open('deepseek'))
    expect(expanded?.id).toBe('deepseek')
    expect(grid.some((item) => item.id === 'deepseek')).toBe(false)
  })

  it('searches by label as well as id', () => {
    expect(partitionCatalog({ ...EMPTY_ADD_MODEL_DRAFT, query: '硅基' }).grid).toHaveLength(1)
    expect(partitionCatalog({ ...EMPTY_ADD_MODEL_DRAFT, query: 'siliconflow' }).grid).toHaveLength(1)
  })
})
