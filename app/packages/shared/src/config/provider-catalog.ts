import {
  getPiApiKeyProviders,
  getPiProviderBaseUrl,
} from './models-pi'

/**
 * Declarative provider catalog.
 *
 * One data record per provider — no plugin runtime, no per-provider code path.
 * `PI_PROVIDER_DISPLAY` in `models-pi.ts` was a flat `{label, placeholder}` map
 * feeding a dropdown, so every provider looked the same and the picker could
 * only ever be as complete as Pi's own list. This catalog carries what the
 * connect surface actually needs to render a provider card: where to get a key,
 * which models to offer, whether the brand ships separate regional endpoints,
 * and whether Pi already implements the transport.
 *
 * Adding a provider is one entry here. It is deliberately *data*: an executable
 * plugin boundary is only worth its cost once a provider needs behavior this
 * record cannot express.
 *
 * `baseUrl` is filled only where the endpoint is stable and well known. Where it
 * is absent the connect form asks for it under 高级配置 rather than guessing —
 * a wrong base URL fails in a much more confusing way than an empty one.
 */

export type ProviderAuthKind = 'api-key' | 'oauth'

/**
 * Several brands run separate CN and global deployments with different
 * endpoints, model ids and accounts. They are separate catalog entries, not one
 * entry with a toggle, because a credential issued for one does not work on the
 * other.
 */
export type ProviderRegion = 'cn' | 'global'

export interface ProviderCatalogEntry {
  /** Stable Fleet-side id. Not necessarily Pi's provider key. */
  id: string
  label: string
  region?: ProviderRegion
  /** Auth mechanisms this provider supports, in the order to present them. */
  auth: readonly ProviderAuthKind[]
  /** API-key input hint. */
  placeholder?: string
  /** OpenAI-compatible or native base URL, when stable. */
  baseUrl?: string
  /** Deep link for "获取 API 密钥". */
  apiKeyUrl?: string
  /**
   * Well-known model ids offered in the picker. Never exhaustive — the picker
   * always keeps a custom-id escape hatch, because a curated list goes stale
   * the moment a provider ships something new.
   */
  models?: readonly string[]
  /** Pi provider key when Pi already implements the transport for this entry. */
  piProvider?: string
  /** Presentation order within the grid; lower sorts first. */
  rank?: number
}

/**
 * Frontier providers. These mostly arrive through Pi, so `piProvider` is set and
 * the entry exists to supply the card metadata Pi does not carry.
 */
const FRONTIER: readonly ProviderCatalogEntry[] = [
  {
    id: 'anthropic',
    label: 'Anthropic',
    auth: ['oauth', 'api-key'],
    placeholder: 'sk-ant-...',
    baseUrl: 'https://api.anthropic.com',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    piProvider: 'anthropic',
    rank: 0,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    auth: ['oauth', 'api-key'],
    placeholder: 'sk-...',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    piProvider: 'openai',
    rank: 1,
  },
  {
    id: 'google',
    label: 'Google AI Studio',
    auth: ['api-key'],
    placeholder: 'AIza...',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    piProvider: 'google',
    rank: 2,
  },
  {
    id: 'xai',
    label: 'xAI (Grok)',
    auth: ['oauth', 'api-key'],
    placeholder: 'xai-...',
    baseUrl: 'https://api.x.ai/v1',
    apiKeyUrl: 'https://console.x.ai',
    piProvider: 'xai',
    rank: 3,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    auth: ['api-key'],
    placeholder: 'sk-...',
    baseUrl: 'https://api.deepseek.com',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    piProvider: 'deepseek',
    rank: 4,
  },
  {
    id: 'mistral',
    label: 'Mistral',
    auth: ['api-key'],
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    piProvider: 'mistral',
    rank: 20,
  },
  {
    id: 'groq',
    label: 'Groq',
    auth: ['api-key'],
    placeholder: 'gsk_...',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyUrl: 'https://console.groq.com/keys',
    piProvider: 'groq',
    rank: 21,
  },
  {
    id: 'cerebras',
    label: 'Cerebras',
    auth: ['api-key'],
    placeholder: 'csk-...',
    baseUrl: 'https://api.cerebras.ai/v1',
    apiKeyUrl: 'https://cloud.cerebras.ai',
    piProvider: 'cerebras',
    rank: 22,
  },
]

/**
 * China-region providers. The gap this catalog exists to close: the previous
 * dropdown offered `minimax`, `kimi-coding` and `zai` and nothing else, so most
 * of the domestic market was unreachable without a custom endpoint.
 */
const CHINA: readonly ProviderCatalogEntry[] = [
  {
    id: 'volcengine',
    label: '火山引擎',
    region: 'cn',
    auth: ['api-key'],
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    apiKeyUrl: 'https://console.volcengine.com/ark',
    rank: 5,
  },
  {
    id: 'aliyun-dashscope',
    label: '阿里云百炼',
    region: 'cn',
    auth: ['api-key'],
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyUrl: 'https://bailian.console.aliyun.com',
    rank: 6,
  },
  {
    id: 'bigmodel',
    label: 'Bigmodel',
    region: 'cn',
    auth: ['api-key'],
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
    rank: 7,
  },
  {
    id: 'zai',
    label: 'Z.ai',
    region: 'global',
    auth: ['api-key'],
    baseUrl: 'https://api.z.ai/api/paas/v4',
    piProvider: 'zai',
    rank: 8,
  },
  {
    id: 'siliconflow',
    label: '硅基流动',
    region: 'cn',
    auth: ['api-key'],
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    rank: 9,
  },
  {
    id: 'moonshot-cn',
    label: 'Kimi CN',
    region: 'cn',
    auth: ['api-key'],
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    rank: 10,
  },
  {
    id: 'kimi-coding',
    label: 'Kimi (Coding)',
    auth: ['api-key'],
    placeholder: 'sk-kimi-...',
    piProvider: 'kimi-coding',
    rank: 11,
  },
  {
    id: 'minimax-cn',
    label: 'MiniMax CN',
    region: 'cn',
    auth: ['api-key'],
    apiKeyUrl: 'https://platform.minimaxi.com',
    rank: 12,
  },
  {
    id: 'minimax-global',
    label: 'MiniMax Global',
    region: 'global',
    auth: ['api-key'],
    piProvider: 'minimax',
    rank: 13,
  },
  {
    id: 'xiaomi-mimo',
    label: 'Xiaomi MIMO',
    region: 'cn',
    auth: ['api-key'],
    rank: 14,
  },
]

/** Aggregators and cloud-hosted routes. */
const GATEWAYS: readonly ProviderCatalogEntry[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    auth: ['api-key'],
    placeholder: 'sk-or-...',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyUrl: 'https://openrouter.ai/keys',
    piProvider: 'openrouter',
    rank: 15,
  },
  {
    id: 'vercel-ai-gateway',
    label: 'Vercel AI Gateway',
    auth: ['api-key'],
    piProvider: 'vercel-ai-gateway',
    rank: 30,
  },
  {
    id: 'huggingface',
    label: 'Hugging Face',
    auth: ['api-key'],
    placeholder: 'hf_...',
    piProvider: 'huggingface',
    rank: 31,
  },
  {
    id: 'amazon-bedrock',
    label: 'Amazon Bedrock',
    auth: ['api-key'],
    placeholder: 'AKIA...',
    piProvider: 'amazon-bedrock',
    rank: 32,
  },
  {
    id: 'azure-openai',
    label: 'Azure OpenAI',
    auth: ['api-key'],
    piProvider: 'azure-openai-responses',
    rank: 33,
  },
]

/**
 * Pi is the executable provider-adapter inventory. Project every adapter into
 * Settings so the UI cannot drift behind the transports the app already ships.
 * Hand-authored entries above only override richer brand/region metadata.
 */
const DECLARED_PROVIDER_IDS = new Set(
  [...FRONTIER, ...CHINA, ...GATEWAYS].flatMap((entry) =>
    [entry.id, entry.piProvider].filter((id): id is string => !!id),
  ),
)

const ADAPTER_PROVIDERS: readonly ProviderCatalogEntry[] =
  getPiApiKeyProviders()
    .filter((provider) => !DECLARED_PROVIDER_IDS.has(provider.key))
    .map((provider, index) => ({
      id: provider.key,
      label: provider.label,
      auth: ['api-key'] as const,
      placeholder: provider.placeholder,
      baseUrl: getPiProviderBaseUrl(provider.key),
      piProvider: provider.key,
      rank: 100 + index,
    }))

export const PROVIDER_CATALOG: readonly ProviderCatalogEntry[] = [
  ...FRONTIER,
  ...CHINA,
  ...GATEWAYS,
  ...ADAPTER_PROVIDERS,
].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999) || a.label.localeCompare(b.label))

const BY_ID = new Map(PROVIDER_CATALOG.map((entry) => [entry.id, entry]))

export function getProviderCatalogEntry(id: string): ProviderCatalogEntry | undefined {
  return BY_ID.get(id)
}

/**
 * Entries Pi does not implement. These need a Fleet-side OpenAI-compatible
 * transport, which is why `baseUrl` matters for them specifically.
 */
export function getUnbackedProviders(): readonly ProviderCatalogEntry[] {
  return PROVIDER_CATALOG.filter((entry) => !entry.piProvider)
}

/**
 * Substring match over id and label, so `硅基` and `siliconflow` both find the
 * same entry. A list this size is unusable without search.
 */
export function searchProviderCatalog(query: string): readonly ProviderCatalogEntry[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return PROVIDER_CATALOG
  return PROVIDER_CATALOG.filter((entry) =>
    entry.id.toLowerCase().includes(trimmed)
    || entry.label.toLowerCase().includes(trimmed),
  )
}

/**
 * Sentinel for "a provider this catalog does not list". Pinned to the top of the
 * picker rather than buried at the bottom: the people who need it already know
 * they need it, and hiding it behind a scroll is what pushes users to give up on
 * an unlisted endpoint.
 */
export const CUSTOM_PROVIDER_ID = '_custom'

export type ProviderGroupId = 'popular' | 'other'

/**
 * Ranks below this sort into the 常用 group. Grouping matters once the catalog
 * passes ~20 entries: an alphabetical wall makes the four providers most people
 * want as hard to find as the ones almost nobody does.
 */
const POPULAR_RANK_LIMIT = 20

export function providerGroupOf(entry: ProviderCatalogEntry): ProviderGroupId {
  return (entry.rank ?? 999) < POPULAR_RANK_LIMIT ? 'popular' : 'other'
}

export interface ProviderPickerGroup {
  id: ProviderGroupId
  entries: readonly ProviderCatalogEntry[]
}

/** Picker rows for a query, grouped and ordered. Empty groups are dropped. */
export function groupProviderCatalog(query = ''): readonly ProviderPickerGroup[] {
  const matches = searchProviderCatalog(query)
  const groups: ProviderPickerGroup[] = [
    { id: 'popular', entries: matches.filter((e) => providerGroupOf(e) === 'popular') },
    { id: 'other', entries: matches.filter((e) => providerGroupOf(e) === 'other') },
  ]
  return groups.filter((group) => group.entries.length > 0)
}
