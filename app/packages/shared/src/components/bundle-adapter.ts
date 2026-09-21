/**
 * Reads Claude / Codex / Cursor / Agent-Plugins bundles into one `ComponentManifest`.
 *
 * Pure: the caller injects `exists`, so this file never touches `fs` and stays browser-safe like
 * the rest of this module. Decision P11 and `docs/design-library/12-capability---skill---plugin-system.md`
 * §16 own the rules; the three that are load-bearing here:
 *
 *   1. declared paths MERGE with conventional ones — a bundle that declares nothing still installs;
 *   2. `capabilities` are DERIVED from what is on disk, never read from the manifest, so a bundle
 *      cannot claim what it does not ship nor hide what it does;
 *   3. `bundleFormat` provenance survives install.
 */

import type { ComponentManifest, ComponentSource, PluginBundleFormat } from './types.ts'

/** Where each foreign layout keeps its manifest, relative to the bundle root. */
export const BUNDLE_MANIFEST_PATHS: Record<Exclude<PluginBundleFormat, 'fleet'>, string> = {
  agent: 'plugin.json',
  claude: '.claude-plugin/plugin.json',
  codex: '.codex-plugin/plugin.json',
  cursor: '.cursor-plugin/plugin.json',
}

/** The neutral standard. A root `plugin.json` is only an Agent bundle when `$schema` matches. */
export const AGENT_MANIFEST_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'

/** Fleet's reverse-domain namespace inside the neutral manifest's `extensions`. */
export const FLEET_EXTENSION_NAMESPACE = 'ai.fleet'

/** Primitives a bundle can contribute. Mirrors what the four ecosystems actually ship. */
export type BundleCapability =
  | 'skills' | 'commands' | 'agents' | 'hooks' | 'mcpServers' | 'lspServers'
  | 'outputStyles' | 'rules' | 'apps' | 'settings'

export type BundleReadResult =
  | { ok: true; manifest: ComponentManifest }
  | { ok: false; error: string }

/** Does a path exist inside the bundle root? Injected so this module performs no I/O. */
export type BundleEntryExists = (relativePath: string) => boolean

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const text = (value: unknown): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : undefined
}

/** Manifest path fields are a string or a list of strings; both normalize to a deduped list. */
function pathList(value: unknown): string[] {
  const raw = typeof value === 'string' ? [value] : Array.isArray(value) ? value : []
  const out: string[] = []
  for (const entry of raw) {
    const trimmed = text(entry)
    if (trimmed && !out.includes(trimmed)) out.push(trimmed)
  }
  return out
}

function merge(...groups: string[][]): string[] {
  const out: string[] = []
  for (const group of groups) for (const entry of group) if (!out.includes(entry)) out.push(entry)
  return out
}

/**
 * Declared paths merged with the conventional defaults, then filtered by what is actually on disk.
 *
 * Both halves matter. Merging is what lets a bundle that declares nothing still install. Filtering
 * after the merge is what stops a manifest claiming a capability it does not ship: without it, a
 * declared-but-absent `skills` path would make the bundle report a skills capability and the
 * permission prompt would be a lie. Declared-and-absent is dead weight in either case.
 */
function resolvePaths(
  raw: Record<string, unknown>, key: string, defaults: string[], exists: BundleEntryExists,
): string[] {
  return merge(defaults, pathList(raw[key])).filter(exists)
}

/** An inline manifest value counts as a capability even with no file on disk. */
function hasInline(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (isRecord(value)) return Object.keys(value).length > 0
  return value === true
}

function slugify(name: string | undefined, fallback: string): string {
  const slug = (name ?? fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || 'bundle-plugin'
}

/**
 * Canonical fingerprint of a catalog source.
 *
 * A catalog's name comes from its own manifest and is reusable, so removing source A and adding a
 * same-named source B produces identical synthesized ids and would let an unrelated repository
 * "update" A's installed components. Ownership is therefore keyed by this fingerprint as well.
 *
 * Serialization must be unambiguous. Separator joining collides by construction —
 * `sparsePaths: ['a,b', 'c']` and `['a', 'b,c']` under `join(',')`, or `ref 'x'` with `['p']` and
 * `ref 'x:p'` with `[]` under `ref:sparse` — and two different sources judged identical defeat the
 * check entirely. A JSON array delimits every element and cannot collide this way.
 */
export function componentSourceKey(source: ComponentSource): string {
  return source.type === 'local'
    ? JSON.stringify(['local', source.path])
    : JSON.stringify(['git', source.url, source.ref ?? null, source.sparsePaths ?? []])
}

/** Which bundle layout a root uses, or null when it is not a foreign bundle. */
export function detectBundleFormat(exists: BundleEntryExists): Exclude<PluginBundleFormat, 'fleet'> | null {
  for (const format of ['codex', 'cursor', 'claude'] as const) {
    if (exists(BUNDLE_MANIFEST_PATHS[format])) return format
  }
  return exists(BUNDLE_MANIFEST_PATHS.agent) ? 'agent' : null
}

interface Shape {
  skills: string[]
  contributionPaths: string[]
  capabilities: BundleCapability[]
}

/** Per-ecosystem discovery. Every entry pairs the manifest key with its conventional default. */
function shapeFor(
  format: Exclude<PluginBundleFormat, 'fleet'>, raw: Record<string, unknown>, exists: BundleEntryExists,
): Shape {
  const capabilities: BundleCapability[] = []
  const add = (capability: BundleCapability, present: boolean) => {
    if (present && !capabilities.includes(capability)) capabilities.push(capability)
  }

  if (format === 'agent') {
    // The neutral schema assigns no capability semantics, so everything here is by convention.
    const skills = exists('skills') ? ['skills'] : []
    add('skills', skills.length > 0)
    add('mcpServers', exists('mcp.json'))
    return { skills, contributionPaths: [], capabilities }
  }

  if (format === 'codex') {
    const skills = resolvePaths(raw, 'skills', ['skills'], exists)
    const hooks = resolvePaths(raw, 'hooks', ['hooks'], exists)
    add('skills', skills.length > 0)
    add('hooks', hooks.length > 0)
    add('mcpServers', hasInline(raw.mcpServers) || exists('.mcp.json'))
    add('apps', hasInline(raw.apps) || exists('.app.json'))
    return { skills, contributionPaths: hooks, capabilities }
  }

  if (format === 'cursor') {
    const skills = resolvePaths(raw, 'skills', ['skills'], exists)
    const commands = resolvePaths(raw, 'commands', ['.cursor/commands'], exists)
    const agents = merge(
      resolvePaths(raw, 'subagents', ['.cursor/agents'], exists),
      pathList(raw.agents).filter(exists),
    )
    add('skills', skills.length > 0)
    add('commands', commands.length > 0)
    add('agents', agents.length > 0)
    add('hooks', hasInline(raw.hooks) || exists('.cursor/hooks.json'))
    add('rules', hasInline(raw.rules) || exists('.cursor/rules'))
    add('mcpServers', hasInline(raw.mcpServers) || exists('.mcp.json'))
    return { skills: merge(skills, commands), contributionPaths: agents, capabilities }
  }

  const skills = resolvePaths(raw, 'skills', ['skills'], exists)
  const commands = resolvePaths(raw, 'commands', ['commands'], exists)
  const agents = resolvePaths(raw, 'agents', ['agents'], exists)
  const outputStyles = resolvePaths(raw, 'outputStyles', ['output-styles'], exists)
  const hooks = resolvePaths(raw, 'hooks', ['hooks/hooks.json'], exists)
  add('skills', skills.length > 0)
  add('commands', commands.length > 0)
  add('agents', agents.length > 0)
  add('outputStyles', hasInline(raw.outputStyles) || outputStyles.length > 0)
  add('hooks', hasInline(raw.hooks) || hooks.length > 0)
  add('mcpServers', hasInline(raw.mcpServers) || resolvePaths(raw, 'mcpServers', ['.mcp.json'], exists).length > 0)
  add('lspServers', hasInline(raw.lspServers) || resolvePaths(raw, 'lspServers', ['.lsp.json'], exists).length > 0)
  add('settings', exists('settings.json'))
  return {
    skills: merge(skills, commands, outputStyles),
    contributionPaths: merge(agents, hooks),
    capabilities,
  }
}

/** Keys the adapter consumes. Everything else is preserved under `vendor` rather than dropped. */
const CONSUMED_KEYS = new Set([
  '$schema', 'name', 'description', 'shortDescription', 'version', 'author', 'license',
  'skills', 'commands', 'agents', 'subagents', 'outputStyles', 'hooks', 'rules',
  'mcpServers', 'lspServers', 'apps',
])

/**
 * Normalize one foreign bundle manifest into a `ComponentManifest`.
 *
 * `rootName` is the bundle directory's own name, used as the id fallback. `exists` is resolved
 * against the bundle root. `source` is recorded so ownership can be checked by fingerprint.
 */
export function readBundleManifest(params: {
  format: Exclude<PluginBundleFormat, 'fleet'>
  raw: unknown
  rootName: string
  exists: BundleEntryExists
  source?: ComponentSource
}): BundleReadResult {
  const { format, rootName, exists } = params
  if (!isRecord(params.raw)) return { ok: false, error: `${format} manifest must be a JSON object` }
  const raw = params.raw

  if (format === 'agent' && raw.$schema !== AGENT_MANIFEST_SCHEMA) {
    return { ok: false, error: `root plugin.json is not an Agent Plugins manifest; expected $schema ${AGENT_MANIFEST_SCHEMA}` }
  }

  const name = text(raw.name)
  if (format === 'agent' && !name) {
    return { ok: false, error: 'agent plugin manifest name must be a non-empty string' }
  }

  const shape = shapeFor(format, raw, exists)
  const vendor: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    if (!CONSUMED_KEYS.has(key)) vendor[key] = value
  }

  const author = isRecord(raw.author) ? text(raw.author.name) : text(raw.author)
  const manifest: ComponentManifest = {
    id: slugify(name, rootName),
    version: text(raw.version) ?? '0.0.0',
    publisher: author ?? 'unknown',
    license: text(raw.license) ?? 'UNKNOWN',
    contributions: [],
    bundleFormat: format,
  }

  const description = text(raw.description)
    ?? text(raw.shortDescription)
    ?? (isRecord(raw.interface) ? text(raw.interface.shortDescription) : undefined)
  if (description) manifest.vendor = { description }
  if (shape.skills.length > 0) manifest.skills = shape.skills
  if (Object.keys(vendor).length > 0) manifest.vendor = { ...manifest.vendor, ...vendor }
  if (params.source) {
    manifest.vendor = { ...manifest.vendor, sourceKey: componentSourceKey(params.source) }
  }

  return { ok: true, manifest }
}

/** Capabilities a bundle root actually ships, derived from disk. Never read from the manifest. */
export function deriveBundleCapabilities(params: {
  format: Exclude<PluginBundleFormat, 'fleet'>
  raw: unknown
  exists: BundleEntryExists
}): BundleCapability[] {
  if (!isRecord(params.raw)) return []
  return shapeFor(params.format, params.raw, params.exists).capabilities
}
