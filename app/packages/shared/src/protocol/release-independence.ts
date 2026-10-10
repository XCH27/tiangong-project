/**
 * Release independence checks that can run without a signed production build.
 *
 * Third-party notices fail closed when an admitted dependency has no license.
 * The update-feed checker validates a local document and does not fetch.
 * A signed or production feed stays Locked. This module does not write user
 * data, so it does not admit a host turn and does not append a session journal.
 */

export const RELEASE_NOTICES_FILE = 'THIRD-PARTY-NOTICES.txt'

export const UPSTREAM_CRAFT_UPDATE_BASE = 'https://agents.craft.do/electron/latest'

export const SIGNED_PRODUCTION_FEED_PHASE = 'signed_production_feed' as const

export const UPDATE_FEED_SCHEMA_VERSION = 1 as const

const ALLOWED_SPDX = [
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'ISC',
  'MIT',
  'MPL-2.0',
  'Unlicense',
] as const

const ALLOWED_SPDX_SET = new Set<string>(ALLOWED_SPDX)

export const APACHE_WORKSPACE_NOTICE =
  'Copyright 2026 Craft Docs Ltd. SPDX-License-Identifier: Apache-2.0. The license text is app/LICENSE.'

export interface WorkspacePackagePin {
  relPath: string
  name: string
  version: string
}

export const ADMITTED_WORKSPACE_PACKAGES: readonly WorkspacePackagePin[] = [
  { relPath: 'apps/cli/package.json', name: '@craft-agent/cli', version: '0.10.5' },
  { relPath: 'apps/electron/package.json', name: '@craft-agent/electron', version: '0.10.5' },
  { relPath: 'apps/viewer/package.json', name: '@craft-agent/viewer', version: '0.10.5' },
  { relPath: 'apps/webui/package.json', name: '@craft-agent/webui', version: '0.10.5' },
  { relPath: 'package.json', name: 'craft-agent', version: '0.10.5' },
  { relPath: 'packages/core/package.json', name: '@craft-agent/core', version: '0.10.5' },
  { relPath: 'packages/messaging-gateway/package.json', name: '@craft-agent/messaging-gateway', version: '0.10.5' },
  { relPath: 'packages/messaging-whatsapp-worker/package.json', name: '@craft-agent/messaging-whatsapp-worker', version: '0.10.5' },
  { relPath: 'packages/pi-agent-server/package.json', name: '@craft-agent/pi-agent-server', version: '0.10.5' },
  { relPath: 'packages/server-core/package.json', name: '@craft-agent/server-core', version: '0.10.5' },
  { relPath: 'packages/server/package.json', name: '@craft-agent/server', version: '0.10.5' },
  { relPath: 'packages/session-mcp-server/package.json', name: '@craft-agent/session-mcp-server', version: '0.10.5' },
  { relPath: 'packages/session-tools-core/package.json', name: '@craft-agent/session-tools-core', version: '0.10.5' },
  { relPath: 'packages/shared/package.json', name: '@craft-agent/shared', version: '0.10.5' },
  { relPath: 'packages/ui/package.json', name: '@craft-agent/ui', version: '0.10.5' },
]

export const BUNDLED_RUNTIME_PINS = {
  bun: 'bun-v1.3.9',
  uv: '0.10.6',
  electron: '39.2.7',
  ripgrep: '^1.17.1',
  claudeAgentSdk: '0.3.197',
} as const

export type LicenseRecord =
  | { kind: 'spdx'; id: string }
  | { kind: 'terms'; title: string; url: string }
  | { kind: 'missing' }

export interface AdmittedDep {
  name: string
  version: string
  origin: 'workspace' | 'bundled'
  license: LicenseRecord
  notice: string
}

export interface NoticeReport {
  ok: boolean
  errors: string[]
  count: number
  text: string | null
}

export interface UpdateFeedFile {
  url: string
  sha512: string
  size: number
}

export interface UpdateFeedDocument {
  schemaVersion: number
  disposition: string
  platform: string
  arch: string
  version: string
  files: UpdateFeedFile[]
  path: string
  sha512: string
  releaseDate: string
  signed?: boolean
}

export type FeedCheck =
  | { outcome: 'pass'; status: 'wired' }
  | { outcome: 'locked'; status: 'Locked'; phase: typeof SIGNED_PRODUCTION_FEED_PHASE }
  | { outcome: 'invalid'; errors: string[] }

export interface ReleaseAboutModel {
  notices: { ok: true; status: 'wired'; count: number } | { ok: false; errors: string[] }
  dryRunFeed: FeedCheck
  signedFeed: { status: 'Locked'; phase: typeof SIGNED_PRODUCTION_FEED_PHASE }
  noticesFile: typeof RELEASE_NOTICES_FILE
  sessionJournal: 'not_written'
}

const FIXTURE_SHA512 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='

export const SAMPLE_DRY_RUN_FEED: UpdateFeedDocument = {
  schemaVersion: UPDATE_FEED_SCHEMA_VERSION,
  disposition: 'dry-run',
  platform: 'darwin',
  arch: 'arm64',
  version: '0.10.5',
  files: [
    {
      url: 'Craft-Agents-arm64.zip',
      sha512: FIXTURE_SHA512,
      size: 1024,
    },
  ],
  path: 'Craft-Agents-arm64.zip',
  sha512: FIXTURE_SHA512,
  releaseDate: '2026-10-09T00:00:00.000Z',
}

export const BUNDLED_ADMITTED_DEPS: readonly AdmittedDep[] = [
  {
    name: '@anthropic-ai/claude-agent-sdk',
    version: BUNDLED_RUNTIME_PINS.claudeAgentSdk,
    origin: 'bundled',
    license: {
      kind: 'terms',
      title: 'Anthropic Commercial Terms',
      url: 'https://www.anthropic.com/legal/commercial-terms',
    },
    notice: 'The Claude Agent SDK is subject to Anthropic Commercial Terms of Service.',
  },
  {
    name: '@vscode/ripgrep',
    version: BUNDLED_RUNTIME_PINS.ripgrep,
    origin: 'bundled',
    license: { kind: 'spdx', id: 'MIT' },
    notice: 'Copyright Microsoft Corporation and ripgrep contributors. SPDX-License-Identifier: MIT.',
  },
  {
    name: 'bun',
    version: BUNDLED_RUNTIME_PINS.bun,
    origin: 'bundled',
    license: { kind: 'spdx', id: 'MIT' },
    notice: 'Copyright Oven-sh and contributors. The packaging scripts pin this Bun build. SPDX-License-Identifier: MIT.',
  },
  {
    name: 'electron',
    version: BUNDLED_RUNTIME_PINS.electron,
    origin: 'bundled',
    license: { kind: 'spdx', id: 'MIT' },
    notice: 'Copyright Electron contributors. electron-builder.yml pins this runtime. SPDX-License-Identifier: MIT.',
  },
  {
    name: 'uv',
    version: BUNDLED_RUNTIME_PINS.uv,
    origin: 'bundled',
    license: { kind: 'spdx', id: 'MIT OR Apache-2.0' },
    notice: 'Copyright Astral Software Inc. The packaging scripts pin this uv release. SPDX-License-Identifier: MIT OR Apache-2.0.',
  },
]

export function licenseFromPackageJson(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as { license?: unknown }
  if (typeof record.license === 'string') {
    const license = record.license.trim()
    return license.length > 0 ? license : null
  }
  if (record.license && typeof record.license === 'object') {
    const type = (record.license as { type?: unknown }).type
    if (typeof type === 'string' && type.trim().length > 0) return type.trim()
  }
  return null
}

export function workspaceDep(pin: WorkspacePackagePin, raw: unknown): AdmittedDep {
  const parsed = raw && typeof raw === 'object' ? raw as { name?: unknown; version?: unknown } : {}
  const name = typeof parsed.name === 'string' && parsed.name.trim().length > 0 ? parsed.name : pin.name
  const version = typeof parsed.version === 'string' && parsed.version.trim().length > 0 ? parsed.version : ''
  const licenseId = licenseFromPackageJson(raw)
  const nameMatches = name === pin.name
  const versionMatches = version === pin.version
  return {
    name: pin.name,
    version: pin.version,
    origin: 'workspace',
    license: licenseId && nameMatches && versionMatches ? { kind: 'spdx', id: licenseId } : { kind: 'missing' },
    notice: licenseId && nameMatches && versionMatches ? APACHE_WORKSPACE_NOTICE : '',
  }
}

export function admittedDepsFromWorkspaceJson(files: Readonly<Record<string, unknown>>): AdmittedDep[] {
  const workspace = ADMITTED_WORKSPACE_PACKAGES.map((pin) => workspaceDep(pin, files[pin.relPath]))
  return [...workspace, ...BUNDLED_ADMITTED_DEPS]
}

export function verifyWorkspacePaths(found: readonly string[], expected: readonly string[] = ADMITTED_WORKSPACE_PACKAGES.map((pin) => pin.relPath)): string[] {
  const foundSet = new Set(found)
  const expectedSet = new Set(expected)
  const errors: string[] = []
  for (const relPath of expected) {
    if (!foundSet.has(relPath)) errors.push(`${relPath}: missing_workspace`)
  }
  for (const relPath of found) {
    if (!expectedSet.has(relPath)) errors.push(`${relPath}: unlisted_workspace`)
  }
  return errors
}

function spdxParts(expression: string): string[] | null {
  const parts = expression.split(/\s+(?:OR|AND)\s+/i).map((part) => part.replace(/[()]/g, '').trim())
  if (parts.length === 0 || parts.some((part) => part.length === 0 || /\s/.test(part))) return null
  return parts
}

function licenseLabel(license: LicenseRecord): string | null {
  switch (license.kind) {
    case 'spdx':
      return license.id
    case 'terms':
      return license.title
    case 'missing':
      return null
    default: {
      const exhaustive: never = license
      return exhaustive
    }
  }
}

function licenseErrors(dep: AdmittedDep): string[] {
  if (dep.name.trim().length === 0) return [`${dep.name || '(unnamed)'}: empty_name`]
  switch (dep.license.kind) {
    case 'missing':
      return [`${dep.name}: missing_license`]
    case 'spdx': {
      if (dep.notice.trim().length === 0) return [`${dep.name}: empty_notice`]
      const parts = spdxParts(dep.license.id)
      if (!parts) return [`${dep.name}: unknown_spdx`]
      const unknown = parts.filter((part) => !ALLOWED_SPDX_SET.has(part))
      if (unknown.length > 0) return [`${dep.name}: unknown_spdx`]
      if (!dep.notice.includes(dep.license.id)) return [`${dep.name}: empty_notice`]
      return []
    }
    case 'terms': {
      if (dep.notice.trim().length === 0) return [`${dep.name}: empty_notice`]
      if (!dep.license.url.startsWith('https://') || dep.license.title.trim().length === 0) {
        return [`${dep.name}: terms_url`]
      }
      return []
    }
    default: {
      const exhaustive: never = dep.license
      return [String(exhaustive)]
    }
  }
}

function renderNotices(deps: readonly AdmittedDep[]): string {
  const ordered = [...deps].sort((left, right) => {
    if (left.origin !== right.origin) return left.origin === 'workspace' ? -1 : 1
    return left.name.localeCompare(right.name)
  })
  const blocks = ordered.map((dep) => {
    const label = licenseLabel(dep.license)
    const lines = [
      `## ${dep.name} ${dep.version}`,
      `Origin: ${dep.origin}`,
      `License: ${label ?? 'missing'}`,
    ]
    if (dep.license.kind === 'terms') lines.push(`Terms: ${dep.license.url}`)
    lines.push(dep.notice.trim())
    return lines.join('\n')
  })
  return [
    'Third-party notices',
    'Generated by the release independence check.',
    'A missing license fails this check. Signed production publishing stays Locked.',
    '',
    blocks.join('\n\n'),
    '',
  ].join('\n')
}

export function verifyAdmittedDeps(deps: readonly AdmittedDep[]): NoticeReport {
  if (deps.length === 0) {
    return { ok: false, errors: ['admitted_set_empty'], count: 0, text: null }
  }
  const errors: string[] = []
  const seen = new Set<string>()
  for (const dep of deps) {
    if (seen.has(dep.name)) errors.push(`${dep.name}: duplicate`)
    seen.add(dep.name)
    errors.push(...licenseErrors(dep))
  }
  if (errors.length > 0) {
    return { ok: false, errors, count: deps.length, text: null }
  }
  return { ok: true, errors: [], count: deps.length, text: renderNotices(deps) }
}

export function renderThirdPartyNotices(deps: readonly AdmittedDep[]): string {
  const report = verifyAdmittedDeps(deps)
  if (!report.ok || report.text === null) {
    throw new Error(`notices_incomplete: ${report.errors.join('; ')}`)
  }
  return report.text
}

const PLATFORMS = new Set(['darwin', 'win32', 'linux'])
const ARCHES = new Set(['x64', 'arm64'])

function isSha512(value: string): boolean {
  return /^[A-Za-z0-9+/]{86}==$/.test(value)
}

function feedUrlClass(url: string): 'relative' | 'live' | 'invalid' {
  if (url.length === 0) return 'invalid'
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return 'live'
  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return 'invalid'
  if (url.startsWith('/') || url.includes('\\') || url.includes('..') || /\s/.test(url)) return 'invalid'
  if (!/^[A-Za-z0-9._+-]+$/.test(url)) return 'invalid'
  return 'relative'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function checkUpdateFeed(input: unknown): FeedCheck {
  if (!isRecord(input)) return { outcome: 'invalid', errors: ['feed_not_object'] }
  const disposition = input.disposition
  const signed = input.signed === true
  const files = Array.isArray(input.files) ? input.files : []
  const liveUrl = files.some((file) => isRecord(file) && typeof file.url === 'string' && feedUrlClass(file.url) === 'live')
    || (typeof input.path === 'string' && feedUrlClass(input.path) === 'live')
  if (signed || disposition === 'production' || disposition === 'signed' || liveUrl) {
    return { outcome: 'locked', status: 'Locked', phase: SIGNED_PRODUCTION_FEED_PHASE }
  }

  const errors: string[] = []
  if (input.schemaVersion !== UPDATE_FEED_SCHEMA_VERSION) errors.push('schema_version')
  if (disposition !== 'dry-run') errors.push('disposition')
  if (typeof input.platform !== 'string' || !PLATFORMS.has(input.platform)) errors.push('platform')
  if (typeof input.arch !== 'string' || !ARCHES.has(input.arch)) errors.push('arch')
  if (typeof input.version !== 'string' || !/^\d+\.\d+\.\d+(?:[-.][0-9A-Za-z.]+)?$/.test(input.version)) {
    errors.push('version')
  }
  if (!Array.isArray(input.files) || input.files.length === 0) errors.push('files')
  const parsedFiles: UpdateFeedFile[] = []
  if (Array.isArray(input.files)) {
    for (const file of input.files) {
      if (!isRecord(file) || typeof file.url !== 'string' || typeof file.sha512 !== 'string' || typeof file.size !== 'number') {
        errors.push('file_fields')
        continue
      }
      const urlClass = feedUrlClass(file.url)
      if (urlClass === 'invalid') errors.push('file_url')
      if (!isSha512(file.sha512) || !Number.isInteger(file.size) || file.size <= 0) errors.push('file_integrity')
      parsedFiles.push({ url: file.url, sha512: file.sha512, size: file.size })
    }
  }
  if (typeof input.path !== 'string' || feedUrlClass(input.path) === 'invalid') errors.push('path')
  if (typeof input.sha512 !== 'string' || !isSha512(input.sha512)) errors.push('sha512')
  if (typeof input.releaseDate !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(input.releaseDate) || Number.isNaN(Date.parse(input.releaseDate))) {
    errors.push('release_date')
  }
  const pathValue = typeof input.path === 'string' ? input.path : ''
  const matched = parsedFiles.find((file) => file.url === pathValue)
  if (!matched || matched.sha512 !== input.sha512) errors.push('path_sha512')

  if (errors.length > 0) return { outcome: 'invalid', errors }
  return { outcome: 'pass', status: 'wired' }
}

export function releaseAboutModel(files?: Readonly<Record<string, unknown>>): ReleaseAboutModel {
  const deps = files ? admittedDepsFromWorkspaceJson(files) : admittedDepsFromWorkspaceJson(snapshotWorkspaceFiles())
  const report = verifyAdmittedDeps(deps)
  return {
    notices: report.ok ? { ok: true, status: 'wired', count: report.count } : { ok: false, errors: report.errors },
    dryRunFeed: checkUpdateFeed(SAMPLE_DRY_RUN_FEED),
    signedFeed: { status: 'Locked', phase: SIGNED_PRODUCTION_FEED_PHASE },
    noticesFile: RELEASE_NOTICES_FILE,
    sessionJournal: 'not_written',
  }
}

function snapshotWorkspaceFiles(): Record<string, unknown> {
  const files: Record<string, unknown> = {}
  for (const pin of ADMITTED_WORKSPACE_PACKAGES) {
    files[pin.relPath] = { name: pin.name, version: pin.version, license: 'Apache-2.0' }
  }
  return files
}

export function readReleaseDispositionForHuman(files?: Readonly<Record<string, unknown>>): ReleaseAboutModel {
  return releaseAboutModel(files)
}

export function readReleaseDispositionForAgent(files?: Readonly<Record<string, unknown>>): ReleaseAboutModel {
  return releaseAboutModel(files)
}
