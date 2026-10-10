/**
 * Agent Plugins 1.0.0 package reader.
 *
 * A local plugin.json is projected into Market entries only when a skill or
 * an MCP server maps onto the existing loadout. Hooks, commands, inline
 * Claude fields, and client extension files are not entries. Credential-shaped
 * text and paths that leave the package add nothing. This reader does not
 * fetch a schema, a marketplace, or a Chrome Store.
 */

import { lstatSync, readFileSync, readdirSync, realpathSync } from 'node:fs'
import { isAbsolute, join, relative, sep } from 'node:path'
import { containsCredentialMaterial, isSecretKey, isSecretString } from './credential-boundary'
import type { PluginCatalogEntry } from './plugin-settings'

export const AGENT_PLUGIN_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json'
export const AGENT_PLUGIN_MCP_SCHEMA = 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json'

const AGENT_PLUGIN_SCHEMA_ROOT = 'agent-plugins.org/schemas/'
const MAX_MANIFEST_CHARS = 256_000
const MAX_SKILL_CHARS = 64_000
const MAX_ENTRIES = 100
const PLUGIN_NAME = /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/
const SKILL_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SERVER_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/
const BARE_COMMAND = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/
export type AgentPluginProjection =
  | { status: 'ok'; entries: PluginCatalogEntry[] }
  | { status: 'closed'; reason: string; entries: [] }

interface ManifestInfo {
  name: string
  description: string
}

export function isAgentPluginSchema(value: string): boolean {
  return value.includes(AGENT_PLUGIN_SCHEMA_ROOT)
}

export function projectAgentPluginManifest(document: unknown): AgentPluginProjection {
  const manifest = acceptManifest(document)
  if (manifest.status !== 'ok') return { status: 'closed', reason: manifest.reason, entries: [] }
  return { status: 'ok', entries: [] }
}

export function readAgentPluginPackage(packageRoot: string): AgentPluginProjection {
  if (!isSafePackageRoot(packageRoot)) return closed('unsafe_package_root')
  let rootReal: string
  try {
    const stat = lstatSync(packageRoot)
    if (!stat.isDirectory()) return closed('manifest_missing')
    rootReal = realpathSync(packageRoot)
  } catch {
    return closed('manifest_missing')
  }
  const manifestPath = join(rootReal, 'plugin.json')
  const manifestText = readContainedText(rootReal, manifestPath, MAX_MANIFEST_CHARS)
  if (manifestText === 'missing') return closed('manifest_missing')
  if (manifestText === 'unsafe' || manifestText === 'too_large') return closed('unsafe_package_path')
  let document: unknown
  try {
    document = JSON.parse(manifestText)
  } catch {
    return closed('invalid_manifest')
  }
  const manifest = acceptManifest(document)
  if (manifest.status !== 'ok') return { status: 'closed', reason: manifest.reason, entries: [] }
  const entries: PluginCatalogEntry[] = []
  collectSkills(rootReal, manifest, entries)
  collectMcp(rootReal, manifest, entries)
  return { status: 'ok', entries }
}

function acceptManifest(document: unknown): { status: 'ok' } & ManifestInfo | { status: 'closed'; reason: string } {
  if (!isRecord(document)) return { status: 'closed', reason: 'invalid_manifest' }
  if (containsCredentialMaterial(document)) return { status: 'closed', reason: 'credential_material_rejected' }
  const schema = typeof document.$schema === 'string' ? document.$schema : ''
  if (!isAgentPluginSchema(schema)) return { status: 'closed', reason: 'invalid_manifest' }
  if (schema !== AGENT_PLUGIN_SCHEMA) return { status: 'closed', reason: 'unsupported_agent_plugins_version' }
  if (typeof document.name !== 'string' || !isPluginName(document.name)) {
    return { status: 'closed', reason: 'invalid_manifest' }
  }
  if (!metadataTypesMatch(document)) return { status: 'closed', reason: 'invalid_manifest' }
  const description = typeof document.description === 'string' ? document.description.trim() : ''
  if (description.length > 500) return { status: 'closed', reason: 'invalid_manifest' }
  return { status: 'ok', name: document.name, description }
}

function metadataTypesMatch(document: Record<string, unknown>): boolean {
  if ('version' in document && typeof document.version !== 'string') return false
  if ('description' in document && typeof document.description !== 'string') return false
  if ('homepage' in document && typeof document.homepage !== 'string') return false
  if ('repository' in document && typeof document.repository !== 'string') return false
  if ('license' in document && typeof document.license !== 'string') return false
  if ('author' in document && !authorMatches(document.author)) return false
  if ('keywords' in document) {
    if (!Array.isArray(document.keywords) || document.keywords.some((item) => typeof item !== 'string')) return false
  }
  return true
}

function authorMatches(value: unknown): boolean {
  if (!isRecord(value)) return false
  const allowed = new Set(['name', 'email', 'url'])
  for (const [key, child] of Object.entries(value)) {
    if (!allowed.has(key) || typeof child !== 'string') return false
  }
  return true
}

function collectSkills(rootReal: string, manifest: ManifestInfo, entries: PluginCatalogEntry[]): void {
  const skillsRoot = join(rootReal, 'skills')
  let names: string[]
  try {
    const stat = lstatSync(skillsRoot)
    if (!stat.isDirectory() && !stat.isSymbolicLink()) return
    if (!contained(rootReal, realpathSync(skillsRoot))) return
    names = readdirSync(skillsRoot)
  } catch {
    return
  }
  for (const name of names) {
    if (entries.length >= MAX_ENTRIES) return
    if (!SKILL_SLUG.test(name)) continue
    const skillFile = join(skillsRoot, name, 'SKILL.md')
    const text = readContainedText(rootReal, skillFile, MAX_SKILL_CHARS)
    if (typeof text !== 'string') continue
    const skill = skillFrontmatter(text, name)
    if (!skill) continue
    if (containsCredentialMaterial(skill) || isSecretString(skill.name) || isSecretString(skill.description)) continue
    entries.push({
      id: `skill:${manifest.name}.${name}`,
      name: skill.name,
      description: skill.description,
      kind: 'skill',
      origin: 'catalog',
      trust: 'third_party',
    })
  }
}

function collectMcp(rootReal: string, manifest: ManifestInfo, entries: PluginCatalogEntry[]): void {
  const mcpPath = join(rootReal, 'mcp.json')
  const text = readContainedText(rootReal, mcpPath, MAX_MANIFEST_CHARS)
  if (typeof text !== 'string') return
  let document: unknown
  try {
    document = JSON.parse(text)
  } catch {
    return
  }
  if (!isRecord(document)) return
  if (document.$schema !== AGENT_PLUGIN_MCP_SCHEMA) return
  const extra = Object.keys(document).filter((key) => key !== '$schema' && key !== 'mcpServers')
  if (extra.length > 0 || !isRecord(document.mcpServers)) return
  for (const [name, value] of Object.entries(document.mcpServers)) {
    if (entries.length >= MAX_ENTRIES) return
    if (containsCredentialMaterial(value)) continue
    const entry = mcpCatalogEntry(manifest, name, value)
    if (entry) entries.push(entry)
  }
}

function mcpCatalogEntry(manifest: ManifestInfo, name: string, value: unknown): PluginCatalogEntry | null {
  if (!SERVER_NAME.test(name) || name.includes('..') || !isRecord(value)) return null
  if (!serverConfigMatches(value)) return null
  const description = manifest.description || `MCP server from ${manifest.name}.`
  const visible = { name, description }
  if (containsCredentialMaterial(visible) || isSecretString(name) || isSecretString(description)) return null
  return {
    id: `mcp:${manifest.name}/${name}`,
    name,
    description,
    kind: 'mcp',
    origin: 'catalog',
    trust: 'third_party',
  }
}

function serverConfigMatches(value: Record<string, unknown>): boolean {
  const type = value.type
  if (type === 'stdio') return stdioMatches(value)
  if (type === 'streamable-http' || type === 'sse') return httpMatches(value)
  return false
}

function stdioMatches(value: Record<string, unknown>): boolean {
  const allowed = new Set(['type', 'command', 'args', 'env', 'cwd'])
  if (Object.keys(value).some((key) => !allowed.has(key))) return false
  if (typeof value.command !== 'string' || !commandToken(value.command)) return false
  if ('args' in value) {
    if (!Array.isArray(value.args) || value.args.some((item) => typeof item !== 'string' || isSecretString(item))) return false
  }
  if ('env' in value) {
    if (!isRecord(value.env)) return false
    for (const [key, child] of Object.entries(value.env)) {
      if (typeof child !== 'string') return false
      if (isReservedEnv(key) || isSecretKey(key) || isSecretString(child)) return false
    }
  }
  if ('cwd' in value && (typeof value.cwd !== 'string' || !cwdToken(value.cwd))) return false
  return true
}

function httpMatches(value: Record<string, unknown>): boolean {
  const allowed = new Set(['type', 'url', 'headers'])
  if (Object.keys(value).some((key) => !allowed.has(key))) return false
  if (typeof value.url !== 'string' || !remoteUrl(value.url)) return false
  if ('headers' in value) {
    if (!isRecord(value.headers)) return false
    const seen = new Set<string>()
    for (const [key, child] of Object.entries(value.headers)) {
      if (typeof child !== 'string' || !headerName(key) || isSecretString(child) || isSecretKey(key)) return false
      const folded = key.toLowerCase()
      if (seen.has(folded)) return false
      seen.add(folded)
    }
  }
  return true
}

function commandToken(command: string): boolean {
  if (!command || /\s/.test(command) || command.includes('$') || command.includes('..')) return false
  if (BARE_COMMAND.test(command)) return true
  if (!command.startsWith('./')) return false
  const parts = command.slice(2).split('/')
  return parts.length > 0 && parts.every((part) => part.length > 0 && part !== '.' && part !== '..' && !part.includes('\\'))
}

function cwdToken(cwd: string): boolean {
  if (cwd === '${PLUGIN_ROOT}' || cwd === '${PLUGIN_DATA}') return true
  if (cwd.startsWith('${PLUGIN_ROOT}/')) return relativeTail(cwd.slice('${PLUGIN_ROOT}/'.length))
  if (cwd.startsWith('${PLUGIN_DATA}/')) return relativeTail(cwd.slice('${PLUGIN_DATA}/'.length))
  if (!cwd.startsWith('./')) return false
  return relativeTail(cwd.slice(2))
}

function relativeTail(value: string): boolean {
  if (!value || value.includes('\\') || value.includes('$')) return false
  const parts = value.split('/')
  return parts.every((part) => part.length > 0 && part !== '.' && part !== '..')
}

function remoteUrl(value: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }
  if (parsed.username || parsed.password || parsed.hash) return false
  if (parsed.protocol === 'https:') return true
  if (parsed.protocol !== 'http:') return false
  const host = parsed.hostname.toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

function headerName(value: string): boolean {
  return /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(value)
}

function isReservedEnv(key: string): boolean {
  const folded = key.toLowerCase()
  return folded === 'plugin_root' || folded === 'plugin_data'
}

function skillFrontmatter(text: string, directoryName: string): { name: string; description: string } | null {
  const normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return null
  const end = normalized.indexOf('\n---\n', 4)
  if (end < 0) return null
  let name = ''
  let description = ''
  for (const line of normalized.slice(4, end).split('\n')) {
    const separator = line.indexOf(':')
    if (separator <= 0) continue
    const key = line.slice(0, separator).trim()
    const raw = line.slice(separator + 1).trim()
    if (key === 'name') name = unquote(raw)
    if (key === 'description') description = unquote(raw)
  }
  if (name !== directoryName || !description || description.length > 500) return null
  return { name, description }
}

function unquote(value: string): string {
  if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    return value.slice(1, -1)
  }
  return value
}

function readContainedText(rootReal: string, filePath: string, maxChars: number): string | 'missing' | 'unsafe' | 'too_large' {
  try {
    const stat = lstatSync(filePath)
    if (stat.isSymbolicLink()) {
      const target = realpathSync(filePath)
      if (!contained(rootReal, target)) return 'unsafe'
    }
    if (!stat.isFile() && !stat.isSymbolicLink()) return 'missing'
    const real = realpathSync(filePath)
    if (!contained(rootReal, real)) return 'unsafe'
    if (stat.size > maxChars) return 'too_large'
    const text = readFileSync(real, 'utf8')
    if (text.length > maxChars) return 'too_large'
    return text
  } catch {
    return 'missing'
  }
}

function contained(rootReal: string, targetReal: string): boolean {
  const rel = relative(rootReal, targetReal)
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel))
}

function isSafePackageRoot(packageRoot: string): boolean {
  if (!packageRoot.trim()) return false
  return !packageRoot.split(/[\\/]/).includes('..')
}

function isPluginName(name: string): boolean {
  return name.length >= 1 && name.length <= 64 && PLUGIN_NAME.test(name) && !name.includes('--') && !name.includes('..')
}

function closed(reason: string): AgentPluginProjection {
  return { status: 'closed', reason, entries: [] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}
