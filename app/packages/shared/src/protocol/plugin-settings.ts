/**
 * Settings → Plugins page state.
 *
 * Five views share one catalog. Workspace skills and MCP sources are local.
 * Catalog reads can add Market entries. Market content filters narrow that
 * list. Install, enable, and disable admit plugin.loadout_mutate. The row is
 * L2, so an unapproved call does not write. The Settings page does not call
 * that API and does not write the loadout. The MCP Apps side pane reads this
 * loadout and admits sidebar focus on its own host. This file does not. Its
 * sandboxed app view stays Locked. A local Agent
 * Plugins 1.0.0 package can list skills and MCP servers. A remote store stays
 * Locked.
 * This is not a plugin marketplace.
 */

export const PLUGIN_VIEWS = ['installed', 'market', 'skills', 'mcp', 'hooks'] as const
export type PluginView = (typeof PLUGIN_VIEWS)[number]

export const MARKET_CONTENT_FILTERS = ['all', 'skill', 'mcp', 'hook', 'command'] as const
export type MarketContentFilter = (typeof MARKET_CONTENT_FILTERS)[number]

export const PLUGIN_PHASES = [
  'third_party_hook_approval',
  'mcp_apps_side_pane',
  'mcp_apps_sandbox',
  'agent_plugins_1_0_0',
] as const
export type PluginPhase = (typeof PLUGIN_PHASES)[number]

export const LOCKED_PLUGIN_PHASES = [
  'mcp_apps_sandbox',
] as const
export type LockedPluginPhase = (typeof LOCKED_PLUGIN_PHASES)[number]

export type PluginGrantDecision = 'approved' | 'denied'

export interface PluginGrantRecord {
  id: string
  decision: PluginGrantDecision
}

export type PluginContentKind = Exclude<MarketContentFilter, 'all'>
export type PluginTrust = 'first_party' | 'third_party'
export type PluginOrigin = 'workspace' | 'caller' | 'catalog'

export interface PluginCatalogEntry {
  id: string
  name: string
  description: string
  kind: PluginContentKind
  origin: PluginOrigin
  trust: PluginTrust
}

export interface PluginLoadoutRecord {
  id: string
  installed: boolean
  enabled: boolean
}

export interface PluginLoadoutFile {
  version: 1
  records: PluginLoadoutRecord[]
  /** Per-plugin human decision. Absence is not an approval. */
  grants?: PluginGrantRecord[]
}

export interface PluginSettingsState {
  view: PluginView
  marketFilter: MarketContentFilter
  catalog: readonly PluginCatalogEntry[]
  loadout: PluginLoadoutFile
}

export interface WorkspacePluginSkill {
  slug: string
  name: string
  description: string
}

export interface WorkspacePluginSource {
  slug: string
  name: string
  type: string
  description?: string
}

export const PLUGIN_SETTINGS_SESSION_ID = 'plugin-settings'

export function emptyPluginLoadout(): PluginLoadoutFile {
  return { version: 1, records: [] }
}

export function pluginLoadoutPath(workspaceRoot: string): string {
  const root = workspaceRoot.replace(/[\\/]+$/, '')
  return `${root}/.claude-plugin/loadout.json`
}

export function isPluginView(value: string): value is PluginView {
  return (PLUGIN_VIEWS as readonly string[]).includes(value)
}

export function isMarketContentFilter(value: string): value is MarketContentFilter {
  return (MARKET_CONTENT_FILTERS as readonly string[]).includes(value)
}

export function parsePluginView(value: string): PluginView | null {
  return isPluginView(value) ? value : null
}

export function parseMarketFilter(value: string): MarketContentFilter | null {
  return isMarketContentFilter(value) ? value : null
}

export function pluginPhaseStatus(phase: PluginPhase): 'display-only' | 'Locked' {
  switch (phase) {
    case 'mcp_apps_side_pane':
    case 'agent_plugins_1_0_0':
      return 'display-only'
    case 'third_party_hook_approval':
    case 'mcp_apps_sandbox':
      return 'Locked'
    default: {
      const unexpected: never = phase
      return unexpected
    }
  }
}

export function needsThirdPartyEnableApproval(entry: PluginCatalogEntry): boolean {
  if (entry.trust !== 'third_party') return false
  switch (entry.kind) {
    case 'hook':
    case 'mcp':
      return true
    case 'skill':
    case 'command':
      return false
    default: {
      const unexpected: never = entry.kind
      return unexpected
    }
  }
}

export function pluginGrant(loadout: PluginLoadoutFile, id: string): PluginGrantRecord | undefined {
  return loadout.grants?.find((grant) => grant.id === id)
}

export function withPluginGrant(loadout: PluginLoadoutFile, grant: PluginGrantRecord): PluginLoadoutFile {
  const grants = (loadout.grants ?? []).filter((item) => item.id !== grant.id)
  grants.push(grant)
  return { version: 1, records: loadout.records, grants }
}

export function projectWorkspacePlugins(input: {
  skills?: readonly WorkspacePluginSkill[]
  sources?: readonly WorkspacePluginSource[]
  extra?: readonly PluginCatalogEntry[]
}): PluginCatalogEntry[] {
  const entries: PluginCatalogEntry[] = []
  for (const skill of input.skills ?? []) {
    if (!safeSlug(skill.slug)) continue
    entries.push({
      id: `skill:${skill.slug}`,
      name: skill.name,
      description: skill.description,
      kind: 'skill',
      origin: 'workspace',
      trust: 'first_party',
    })
  }
  for (const source of input.sources ?? []) {
    if (source.type !== 'mcp' || !safeSlug(source.slug)) continue
    entries.push({
      id: `mcp:${source.slug}`,
      name: source.name,
      description: source.description ?? '',
      kind: 'mcp',
      origin: 'workspace',
      trust: 'first_party',
    })
  }
  for (const entry of input.extra ?? []) {
    if (!entries.some((existing) => existing.id === entry.id)) entries.push(entry)
  }
  return entries
}

export function createPluginSettingsState(input: {
  catalog?: readonly PluginCatalogEntry[]
  loadout?: PluginLoadoutFile
  view?: PluginView
  marketFilter?: MarketContentFilter
} = {}): PluginSettingsState {
  return {
    view: input.view ?? 'installed',
    marketFilter: input.marketFilter ?? 'all',
    catalog: input.catalog ?? [],
    loadout: input.loadout ?? emptyPluginLoadout(),
  }
}

export function selectPluginView(state: PluginSettingsState, view: PluginView): PluginSettingsState {
  return { ...state, view }
}

export function selectMarketFilter(
  state: PluginSettingsState,
  marketFilter: MarketContentFilter,
): PluginSettingsState {
  return { ...state, marketFilter }
}

export function entriesForView(state: PluginSettingsState): PluginCatalogEntry[] {
  switch (state.view) {
    case 'installed':
      return state.catalog.filter((entry) => loadoutRecord(state.loadout, entry.id)?.installed === true)
    case 'market':
      return filterMarket(state.catalog, state.marketFilter)
    case 'skills':
      return state.catalog.filter((entry) => entry.kind === 'skill')
    case 'mcp':
      return state.catalog.filter((entry) => entry.kind === 'mcp')
    case 'hooks':
      return state.catalog.filter((entry) => entry.kind === 'hook')
    default: {
      const unexpected: never = state.view
      return unexpected
    }
  }
}

export function loadoutRecord(loadout: PluginLoadoutFile, id: string): PluginLoadoutRecord | undefined {
  return loadout.records.find((record) => record.id === id)
}

export type PluginMutationName = 'install' | 'enable' | 'disable'

export type PluginMutationPlan =
  | { status: 'unchanged'; loadout: PluginLoadoutFile }
  | { status: 'write'; loadout: PluginLoadoutFile }
  | { status: 'approval'; loadout: PluginLoadoutFile }
  | { status: 'failed'; reason: string }
  | { status: 'Locked'; phase: LockedPluginPhase }

export function planPluginMutation(
  catalog: readonly PluginCatalogEntry[],
  loadout: PluginLoadoutFile,
  op: PluginMutationName,
  pluginId: string,
): PluginMutationPlan {
  if (loadout.version !== 1) return { status: 'failed', reason: 'unsupported_loadout_version' }
  const entry = catalog.find((item) => item.id === pluginId)
  if (!entry) return { status: 'failed', reason: 'unknown_plugin' }
  const current = loadoutRecord(loadout, pluginId)
  switch (op) {
    case 'install':
      if (current?.installed) return { status: 'unchanged', loadout }
      return {
        status: 'write',
        loadout: upsert(loadout, { id: pluginId, installed: true, enabled: false }),
      }
    case 'enable': {
      if (!current?.installed) return { status: 'failed', reason: 'not_installed' }
      if (current.enabled) return { status: 'unchanged', loadout }
      const enabled = upsert(loadout, { id: pluginId, installed: true, enabled: true })
      if (needsThirdPartyEnableApproval(entry) && pluginGrant(loadout, pluginId)?.decision !== 'approved') {
        // The L2 card is the approval. This plan does not store decision approved.
        return {
          status: 'approval',
          loadout: enabled,
        }
      }
      return { status: 'write', loadout: enabled }
    }
    case 'disable':
      if (!current?.installed) return { status: 'failed', reason: 'not_installed' }
      if (!current.enabled) return { status: 'unchanged', loadout }
      return {
        status: 'write',
        loadout: upsert(loadout, { id: pluginId, installed: true, enabled: false }),
      }
    default: {
      const unexpected: never = op
      return { status: 'failed', reason: `unknown_plugin_op:${String(unexpected)}` }
    }
  }
}

export function isPluginLoadoutFile(value: unknown): value is PluginLoadoutFile {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.records)) return false
  if (!value.records.every((record) => {
    if (!isRecord(record)) return false
    return typeof record.id === 'string'
      && record.id.trim().length > 0
      && typeof record.installed === 'boolean'
      && typeof record.enabled === 'boolean'
  })) return false
  if (value.grants === undefined) return true
  if (!Array.isArray(value.grants)) return false
  return value.grants.every((grant) => {
    if (!isRecord(grant)) return false
    return typeof grant.id === 'string'
      && grant.id.trim().length > 0
      && (grant.decision === 'approved' || grant.decision === 'denied')
  })
}

function filterMarket(
  catalog: readonly PluginCatalogEntry[],
  filter: MarketContentFilter,
): PluginCatalogEntry[] {
  switch (filter) {
    case 'all':
      return [...catalog]
    case 'skill':
    case 'mcp':
    case 'hook':
    case 'command':
      return catalog.filter((entry) => entry.kind === filter)
    default: {
      const unexpected: never = filter
      return unexpected
    }
  }
}

function upsert(loadout: PluginLoadoutFile, record: PluginLoadoutRecord): PluginLoadoutFile {
  const records = loadout.records.filter((item) => item.id !== record.id)
  records.push(record)
  return {
    version: 1,
    records,
    ...(loadout.grants ? { grants: loadout.grants } : {}),
  }
}

function safeSlug(value: string): boolean {
  return value.trim().length > 0 && !value.includes('..') && !value.includes('/') && !value.includes('\\')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
