/**
 * Catalog sources for Settings → Plugins → Market.
 *
 * MCP Registry and skill-repository documents become catalog entries. Market
 * content filters narrow that list the same way the Sources navigator narrows
 * a list by source type. A read that fails returns no entries. Live fetch is
 * optional. Install stays on the plugin loadout host.
 */

import { containsCredentialMaterial, isSecretString } from './credential-boundary'
import {
  createPluginSettingsState,
  entriesForView,
  projectWorkspacePlugins,
  type LockedPluginPhase,
  type MarketContentFilter,
  type PluginCatalogEntry,
  type PluginContentKind,
  type WorkspacePluginSkill,
  type WorkspacePluginSource,
} from './plugin-settings'

export const CATALOG_SOURCE_KINDS = ['mcp_registry', 'skill_repository'] as const
export type CatalogSourceKind = (typeof CATALOG_SOURCE_KINDS)[number]

export interface CatalogSourceRef {
  kind: CatalogSourceKind
  slug: string
  name: string
}

export interface CatalogSourceFilter {
  kind: 'type'
  sourceKind: CatalogSourceKind
}

export const MCP_REGISTRY_LIST_URL = 'https://registry.modelcontextprotocol.io/v0.1/servers'

export const MCP_REGISTRY_SOURCE: CatalogSourceRef = {
  kind: 'mcp_registry',
  slug: 'mcp-registry',
  name: 'MCP Registry',
}

export const SKILL_REPOSITORY_SOURCE: CatalogSourceRef = {
  kind: 'skill_repository',
  slug: 'skill-repository',
  name: 'Skill repositories',
}

const MCP_REGISTRY_ORIGIN = 'https://registry.modelcontextprotocol.io'
const MCP_REGISTRY_PATH = '/v0.1/servers'
const AGENT_PLUGINS_SCHEMA = 'agent-plugins.org/schemas/1.0.0'
const MARKETPLACE_SCHEMA = 'claude-code-marketplace'
const OFFICIAL_META = 'io.modelcontextprotocol.registry/official'
const MAX_BODY_CHARS = 1_000_000
const MAX_ENTRIES = 100
const SERVER_NAME = /^[a-zA-Z0-9][a-zA-Z0-9.-]*\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/
const SKILL_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SOURCE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_REGISTRY_QUERY = new Set(['cursor', 'limit', 'search', 'version'])

export type CatalogRead =
  | { status: 'ok'; source: CatalogSourceRef; entries: PluginCatalogEntry[] }
  | { status: 'closed'; source: CatalogSourceRef; reason: string; entries: [] }
  | { status: 'Locked'; source: CatalogSourceRef; phase: LockedPluginPhase; entries: [] }

export interface CatalogFetchInit {
  method?: string
  redirect?: 'manual'
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface CatalogFetchResponse {
  status: number
  headers: { get(name: string): string | null }
  text(): Promise<string>
}

export type CatalogFetch = (url: string, init?: CatalogFetchInit) => Promise<CatalogFetchResponse>

export function catalogSourceStatus(kind: CatalogSourceKind): 'wired' {
  switch (kind) {
    case 'mcp_registry':
    case 'skill_repository':
      return 'wired'
    default: {
      const unexpected: never = kind
      return unexpected
    }
  }
}

export function isCatalogSourceKind(value: string): value is CatalogSourceKind {
  return (CATALOG_SOURCE_KINDS as readonly string[]).includes(value)
}

export function parseCatalogSourceKind(value: string): CatalogSourceKind | null {
  return isCatalogSourceKind(value) ? value : null
}

export function filterCatalogSources<T extends { kind: CatalogSourceKind }>(
  items: readonly T[],
  filter: CatalogSourceFilter | null | undefined,
): T[] {
  if (!filter) return [...items]
  switch (filter.kind) {
    case 'type':
      return items.filter((item) => item.kind === filter.sourceKind)
    default: {
      const unexpected: never = filter.kind
      return unexpected
    }
  }
}

export function listCatalogMarket(input: {
  skills?: readonly WorkspacePluginSkill[]
  sources?: readonly WorkspacePluginSource[]
  reads?: readonly CatalogRead[]
  sourceFilter?: CatalogSourceFilter | null
  contentFilter?: MarketContentFilter
}): PluginCatalogEntry[] {
  const contentFilter = input.contentFilter ?? 'all'
  const remote = entriesFromReads(input.reads ?? [], input.sourceFilter ?? null)
  const local = input.sourceFilter
    ? []
    : projectWorkspacePlugins({ skills: input.skills, sources: input.sources })
  const catalog = dedupe([...local, ...remote])
  return entriesForView(createPluginSettingsState({
    catalog,
    view: 'market',
    marketFilter: contentFilter,
  }))
}

export async function readCatalogSource(input: {
  source: CatalogSourceRef
  document?: unknown
  body?: string
  allowNetwork?: boolean
  url?: string
  fetchImpl?: CatalogFetch
}): Promise<CatalogRead> {
  if (!isSourceRef(input.source)) {
    return { status: 'closed', source: input.source, reason: 'invalid_source', entries: [] }
  }
  if (input.document !== undefined) return interpret(input.source, input.document)
  if (input.body !== undefined) return interpretBody(input.source, input.body)
  if (input.allowNetwork !== true) {
    return { status: 'closed', source: input.source, reason: 'network_disabled', entries: [] }
  }
  if (!input.url) {
    return { status: 'closed', source: input.source, reason: 'source_url_missing', entries: [] }
  }
  if (!isAllowedCatalogUrl(input.source.kind, input.url)) {
    return { status: 'closed', source: input.source, reason: 'unsafe_url', entries: [] }
  }
  const fetchImpl = input.fetchImpl ?? readGlobalFetch()
  if (!fetchImpl) {
    return { status: 'closed', source: input.source, reason: 'fetch_failed', entries: [] }
  }
  return fetchCatalog(input.source, input.url, fetchImpl)
}

export function isAllowedCatalogUrl(kind: CatalogSourceKind, url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return false
  switch (kind) {
    case 'mcp_registry':
      return isOfficialRegistryUrl(parsed)
    case 'skill_repository':
      return !isPrivateHostname(parsed.hostname) && parsed.pathname.endsWith('.json')
    default: {
      const unexpected: never = kind
      return unexpected
    }
  }
}

function entriesFromReads(
  reads: readonly CatalogRead[],
  filter: CatalogSourceFilter | null,
): PluginCatalogEntry[] {
  const selected = filterCatalogSources(reads.map((read) => ({ kind: read.source.kind, read })), filter)
  return selected.flatMap((item) => (item.read.status === 'ok' ? item.read.entries : []))
}

function interpretBody(source: CatalogSourceRef, body: string): CatalogRead {
  if (body.length > MAX_BODY_CHARS) {
    return { status: 'closed', source, reason: 'response_too_large', entries: [] }
  }
  let document: unknown
  try {
    document = JSON.parse(body)
  } catch {
    return { status: 'closed', source, reason: 'invalid_catalog', entries: [] }
  }
  return interpret(source, document)
}

function interpret(source: CatalogSourceRef, document: unknown): CatalogRead {
  switch (source.kind) {
    case 'mcp_registry':
      return interpretMcpRegistry(source, document)
    case 'skill_repository':
      return interpretSkillRepository(source, document)
    default: {
      const unexpected: never = source.kind
      return { status: 'closed', source, reason: `unknown_catalog_source:${String(unexpected)}`, entries: [] }
    }
  }
}

function interpretMcpRegistry(source: CatalogSourceRef, document: unknown): CatalogRead {
  const blocked = blockedDocument(source, document)
  if (blocked) return blocked
  if (!isRecord(document) || !Array.isArray(document.servers)) {
    return { status: 'closed', source, reason: 'invalid_catalog', entries: [] }
  }
  const entries: PluginCatalogEntry[] = []
  const seen = new Set<string>()
  for (const item of document.servers) {
    if (entries.length >= MAX_ENTRIES) break
    const entry = mcpEntry(item)
    if (!entry || seen.has(entry.id)) continue
    seen.add(entry.id)
    entries.push(entry)
  }
  return { status: 'ok', source, entries }
}

function interpretSkillRepository(source: CatalogSourceRef, document: unknown): CatalogRead {
  const blocked = blockedDocument(source, document)
  if (blocked) return blocked
  if (!isRecord(document) || !Array.isArray(document.skills)) {
    return { status: 'closed', source, reason: 'invalid_catalog', entries: [] }
  }
  const entries: PluginCatalogEntry[] = []
  const seen = new Set<string>()
  for (const item of document.skills) {
    if (entries.length >= MAX_ENTRIES) break
    const entry = skillEntry(item)
    if (!entry || seen.has(entry.id)) continue
    seen.add(entry.id)
    entries.push(entry)
  }
  return { status: 'ok', source, entries }
}

function blockedDocument(source: CatalogSourceRef, document: unknown): CatalogRead | null {
  if (!isRecord(document)) return null
  const schema = typeof document.$schema === 'string' ? document.$schema : ''
  if (schema.includes(AGENT_PLUGINS_SCHEMA)) {
    return { status: 'Locked', source, phase: 'agent_plugins_1_0_0', entries: [] }
  }
  if (schema.includes(MARKETPLACE_SCHEMA) || (Array.isArray(document.plugins) && isRecord(document.owner))) {
    return { status: 'closed', source, reason: 'plugin_marketplace_rejected', entries: [] }
  }
  return null
}

function mcpEntry(value: unknown): PluginCatalogEntry | null {
  if (!isRecord(value) || !isRecord(value.server)) return null
  if (!keepRegistryStatus(registryStatus(value))) return null
  const name = typeof value.server.name === 'string' ? value.server.name : ''
  const description = typeof value.server.description === 'string' ? value.server.description.trim() : ''
  const title = typeof value.server.title === 'string' ? value.server.title.trim() : ''
  if (!SERVER_NAME.test(name) || name.includes('..') || !description || description.length > 500) return null
  const visible = { name: title || name, description }
  if (containsCredentialMaterial(visible) || isSecretString(description) || isSecretString(visible.name)) return null
  return {
    id: `mcp:${name}`,
    name: visible.name,
    description,
    kind: 'mcp',
    origin: 'catalog',
    trust: 'third_party',
  }
}

function skillEntry(value: unknown): PluginCatalogEntry | null {
  if (!isRecord(value)) return null
  const slug = typeof value.slug === 'string' ? value.slug : typeof value.id === 'string' ? value.id : ''
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const description = typeof value.description === 'string' ? value.description.trim() : ''
  const kind = skillContentKind(value.kind)
  if (!SKILL_SLUG.test(slug) || slug.includes('..') || !name || !description || description.length > 500 || !kind) {
    return null
  }
  const visible = { name, description }
  if (containsCredentialMaterial(visible) || isSecretString(description) || isSecretString(name)) return null
  return {
    id: `${kind}:${slug}`,
    name,
    description,
    kind,
    origin: 'catalog',
    trust: 'third_party',
  }
}

function skillContentKind(value: unknown): PluginContentKind | null {
  if (value === undefined || value === 'skill') return 'skill'
  if (value === 'hook') return 'hook'
  if (value === 'command') return 'command'
  return null
}

function registryStatus(value: Record<string, unknown>): string | null {
  if (!isRecord(value._meta)) return null
  const official = value._meta[OFFICIAL_META]
  if (!isRecord(official) || typeof official.status !== 'string') return null
  return official.status
}

function keepRegistryStatus(status: string | null): boolean {
  switch (status) {
    case null:
    case 'active':
    case 'deprecated':
      return true
    case 'deleted':
      return false
    default:
      return false
  }
}

async function fetchCatalog(
  source: CatalogSourceRef,
  url: string,
  fetchImpl: CatalogFetch,
): Promise<CatalogRead> {
  let response: CatalogFetchResponse
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
  } catch {
    return { status: 'closed', source, reason: 'fetch_failed', entries: [] }
  }
  if (response.status >= 300 && response.status < 400) {
    return { status: 'closed', source, reason: 'redirect_rejected', entries: [] }
  }
  if (response.status !== 200) {
    return { status: 'closed', source, reason: 'fetch_failed', entries: [] }
  }
  const contentType = response.headers.get('content-type')
  if (contentType && !contentType.toLowerCase().includes('json')) {
    return { status: 'closed', source, reason: 'invalid_catalog', entries: [] }
  }
  const lengthHeader = response.headers.get('content-length')
  if (lengthHeader && Number(lengthHeader) > MAX_BODY_CHARS) {
    return { status: 'closed', source, reason: 'response_too_large', entries: [] }
  }
  let body = ''
  try {
    body = await response.text()
  } catch {
    return { status: 'closed', source, reason: 'fetch_failed', entries: [] }
  }
  return interpretBody(source, body)
}

function isOfficialRegistryUrl(parsed: URL): boolean {
  if (parsed.origin !== MCP_REGISTRY_ORIGIN || parsed.pathname !== MCP_REGISTRY_PATH) return false
  for (const key of parsed.searchParams.keys()) {
    if (!ALLOWED_REGISTRY_QUERY.has(key)) return false
  }
  const version = parsed.searchParams.get('version')
  return version === null || version === 'latest'
}

function isPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost'
    || host.endsWith('.localhost')
    || host.endsWith('.local')
    || host.endsWith('.internal')
    || host === '::1'
    || host === '0.0.0.0'
  ) {
    return true
  }
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (!match) return false
  const octets = match.slice(1).map((part) => Number(part))
  if (octets.some((part) => part > 255)) return true
  const a = octets[0]
  const b = octets[1]
  if (a === undefined || b === undefined) return true
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

function isSourceRef(source: CatalogSourceRef): boolean {
  return isCatalogSourceKind(source.kind)
    && SOURCE_SLUG.test(source.slug)
    && source.name.trim().length > 0
}

function readGlobalFetch(): CatalogFetch | undefined {
  const host = globalThis as { fetch?: CatalogFetch }
  return typeof host.fetch === 'function' ? host.fetch : undefined
}

function dedupe(entries: readonly PluginCatalogEntry[]): PluginCatalogEntry[] {
  const seen = new Set<string>()
  const result: PluginCatalogEntry[] = []
  for (const entry of entries) {
    if (seen.has(entry.id)) continue
    seen.add(entry.id)
    result.push(entry)
  }
  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
