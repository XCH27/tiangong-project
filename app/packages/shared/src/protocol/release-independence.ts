/**
 * Release independence checks that can run without a signed production build.
 *
 * Third-party notices fail closed when an admitted dependency has no license.
 * The update-feed checker validates a local document and does not fetch.
 * The packaging dry run checks version metadata and the unsigned artifact
 * layout used by electron-builder --publish never. It does not invoke
 * electron-builder, sign a build, or publish a feed.
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
  packagingDryRun: PackagingDryRunCheck
  signedFeed: { status: 'Locked'; phase: typeof SIGNED_PRODUCTION_FEED_PHASE }
  noticesFile: typeof RELEASE_NOTICES_FILE
  sessionJournal: 'not_written'
}

export const PACKAGING_DRY_RUN_PUBLISH = 'never' as const

export const LIVE_PUBLISH_POLICIES = ['always', 'onTag', 'onTagOrDraft'] as const

const LIVE_PUBLISH_SET = new Set<string>(LIVE_PUBLISH_POLICIES)

export interface ReleaseArtifactNames {
  platform: 'darwin' | 'win32' | 'linux'
  arch: 'x64' | 'arm64'
  updater: string
  installer: string
  manifest: string
}

/** Names already produced by the packaging scripts and electron-updater manifests. */
export const UNSIGNED_RELEASE_CHANNELS: readonly ReleaseArtifactNames[] = [
  { platform: 'darwin', arch: 'arm64', updater: 'Craft-Agents-arm64.zip', installer: 'Craft-Agents-arm64.dmg', manifest: 'latest-mac.yml' },
  { platform: 'darwin', arch: 'x64', updater: 'Craft-Agents-x64.zip', installer: 'Craft-Agents-x64.dmg', manifest: 'latest-mac.yml' },
  { platform: 'win32', arch: 'x64', updater: 'Craft-Agents-x64.exe', installer: 'Craft-Agents-x64.exe', manifest: 'latest.yml' },
  { platform: 'linux', arch: 'x64', updater: 'Craft-Agents-x64.AppImage', installer: 'Craft-Agents-x64.AppImage', manifest: 'latest-linux.yml' },
]

export interface PackagingLayoutFile {
  name: string
  role: 'updater' | 'installer' | 'manifest' | 'blockmap'
  size: number
  sha512: string
}

export interface PackagingChannelDocument {
  platform: string
  arch: string
  manifest: string
  feed: UpdateFeedDocument
  files: PackagingLayoutFile[]
}

export interface PackagingDryRunDocument {
  publish: typeof PACKAGING_DRY_RUN_PUBLISH | string
  identityDiscovery: boolean
  version: string
  channels: PackagingChannelDocument[]
}

export type PackagingDryRunCheck =
  | { outcome: 'pass'; status: 'wired'; version: string; artifacts: string[] }
  | { outcome: 'locked'; status: 'Locked'; phase: typeof SIGNED_PRODUCTION_FEED_PHASE }
  | { outcome: 'invalid'; errors: string[] }

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:[-.][0-9A-Za-z.]+)?$/

const CREDENTIAL_FILENAME = /(^\.env$|\.p12$|\.pfx$|\.pem$|\.key$|^credentials\.json$|^auth\.json$)/i

interface FixtureIntegrity {
  size: number
  sha512: string
}

const FIXTURE_INTEGRITY: Readonly<Record<string, FixtureIntegrity>> = {
  'darwin-arm64/Craft-Agents-arm64.zip': {
    size: 86,
    sha512: 'eSdjUS5Jnturw4vK64l/VG1CSBtFEReJijnEzLvUMT1RPrk6wmpRVCniB/JPbfXmBDmN49H82d5b6Eqw1wJGzQ==',
  },
  'darwin-arm64/Craft-Agents-arm64.dmg': {
    size: 88,
    sha512: 'clTEFHaeUnFhf4Y3MHxVOqvwRbbf4EnaKpTtIIIEaZ64vQoRLTaZFCzGnXqj/iQ7t5mG3QiV/X9GzD64bb2rPg==',
  },
  'darwin-arm64/latest-mac.yml': {
    size: 335,
    sha512: 'BkbYCOUeeqoSG8/YRrrI1ldVULpxgIxXSsiCAoyORWK5qfcg/riLPWsUNVvR+usdZJv6VR3Py5h7nWIuM1FdgQ==',
  },
  'darwin-x64/Craft-Agents-x64.zip': {
    size: 82,
    sha512: 'ERtLgZOtScq05Yt0jgnEA1YRddGtRU7dAOI2T0mEvyZ4z3G/fCalODP97K7QuLM2wvyWHnTRq/1s02cJwI86wA==',
  },
  'darwin-x64/Craft-Agents-x64.dmg': {
    size: 84,
    sha512: 'BSN1jycrYbkW/Pj12tNBu6WMsyT2iK1MYP/12DFGs0ae/usiKUpk3T/+KyOtjcNfZ+CL2vuFDbYoOTDPipuRvg==',
  },
  'darwin-x64/latest-mac.yml': {
    size: 331,
    sha512: 'XjZ55875f1yntMtbnSnj+1iuwtQXkddS/xloR53AtgSIuw1d2DZwQylNAwkB0AwMRj9rRMuyXyscK8+mSPH+Pg==',
  },
  'win32-x64/Craft-Agents-x64.exe': {
    size: 81,
    sha512: 'k0Ka1uZGfz5biiIVzmrdByjER7AHufIUzhSYxS/vW1IzJfYiPJflqhgSbAwKq65MAaENhR7VkpK0OH/MbmJG4A==',
  },
  'win32-x64/latest.yml': {
    size: 331,
    sha512: '7+0gACI5JEPDknJFPYmR0kDT5mk6j+TGvZtzbq0eOZ43Il4OJGyqRKMiAOA+OxBJcY0a2PF5oy0MPDLZT/cyYA==',
  },
  'linux-x64/Craft-Agents-x64.AppImage': {
    size: 86,
    sha512: 'N3QpL0S1XteUO5GlR2gTvjEs8i41lEyXmSFrvsd8IHrOJ18o2n0m76QlKxR/ONFXcBaNKWr5xffaF3Nsxrk3KA==',
  },
  'linux-x64/latest-linux.yml': {
    size: 341,
    sha512: 'Ys2o1oxi3+dwFJ/hra+/KEK94/heAZvHhLeU6GM5BWC5DrU+HBTPVkbfCNyFqdUa/8rsCAOWLZQHKT1JThEydA==',
  },
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

export function packagingChannelId(platform: string, arch: string): string {
  return `${platform}-${arch}`
}

export function dryRunArtifactPayload(channelId: string, role: 'updater' | 'installer', name: string): string {
  return `fleet-packaging-dry-run\nchannel=${channelId}\nrole=${role}\nname=${name}\n`
}

export function renderUpdateManifest(feed: Pick<UpdateFeedDocument, 'version' | 'files' | 'path' | 'sha512' | 'releaseDate'>): string {
  const fileBlocks = feed.files.map((file) => [
    `  - url: ${file.url}`,
    `    sha512: ${file.sha512}`,
    `    size: ${file.size}`,
  ].join('\n')).join('\n')
  return [
    `version: ${feed.version}`,
    'files:',
    fileBlocks,
    `path: ${feed.path}`,
    `sha512: ${feed.sha512}`,
    `releaseDate: '${feed.releaseDate}'`,
    '',
  ].join('\n')
}

export type ParsedManifest =
  | { ok: true; version: string; files: UpdateFeedFile[]; path: string; sha512: string; releaseDate: string }
  | { ok: false; error: 'live_url' | 'manifest_shape' }

export function parseUpdateManifest(text: string): ParsedManifest {
  if (/https?:\/\//i.test(text)) return { ok: false, error: 'live_url' }
  const lines = text.split('\n')
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  if (lines.length < 6 || lines[1] !== 'files:' || !lines[0].startsWith('version: ')) {
    return { ok: false, error: 'manifest_shape' }
  }
  const version = lines[0].slice('version: '.length)
  const files: UpdateFeedFile[] = []
  let index = 2
  while (index < lines.length && lines[index].startsWith('  - url: ')) {
    const shaLine = lines[index + 1]
    const sizeLine = lines[index + 2]
    if (!shaLine?.startsWith('    sha512: ') || !sizeLine?.startsWith('    size: ')) {
      return { ok: false, error: 'manifest_shape' }
    }
    const size = Number(sizeLine.slice('    size: '.length))
    if (!Number.isInteger(size)) return { ok: false, error: 'manifest_shape' }
    files.push({
      url: lines[index].slice('  - url: '.length),
      sha512: shaLine.slice('    sha512: '.length),
      size,
    })
    index += 3
  }
  if (files.length === 0 || !lines[index]?.startsWith('path: ') || !lines[index + 1]?.startsWith('sha512: ')) {
    return { ok: false, error: 'manifest_shape' }
  }
  const dateLine = lines[index + 2]
  if (!dateLine?.startsWith('releaseDate: ') || lines.length !== index + 3) {
    return { ok: false, error: 'manifest_shape' }
  }
  let releaseDate = dateLine.slice('releaseDate: '.length)
  if (releaseDate.startsWith("'") && releaseDate.endsWith("'")) releaseDate = releaseDate.slice(1, -1)
  return {
    ok: true,
    version,
    files,
    path: lines[index].slice('path: '.length),
    sha512: lines[index + 1].slice('sha512: '.length),
    releaseDate,
  }
}

export function checkVersionMetadata(versions: readonly string[], expected: string): string[] {
  const errors: string[] = []
  if (!VERSION_PATTERN.test(expected)) errors.push('version')
  if (versions.length === 0) errors.push('version_metadata_empty')
  for (const version of versions) {
    if (version !== expected) errors.push('version_mismatch')
  }
  return errors
}

export function workspaceVersions(files: Readonly<Record<string, unknown>>): string[] {
  return ADMITTED_WORKSPACE_PACKAGES.map((pin) => {
    const raw = files[pin.relPath]
    if (!raw || typeof raw !== 'object') return ''
    const version = (raw as { version?: unknown }).version
    return typeof version === 'string' ? version : ''
  })
}

function fixtureIntegrity(channelId: string, name: string): FixtureIntegrity {
  const found = FIXTURE_INTEGRITY[`${channelId}/${name}`]
  if (!found) throw new Error(`packaging fixture missing ${channelId}/${name}`)
  return found
}

function expectedLayout(spec: ReleaseArtifactNames): Array<{ name: string; role: 'updater' | 'installer' | 'manifest' }> {
  const files: Array<{ name: string; role: 'updater' | 'installer' | 'manifest' }> = [
    { name: spec.updater, role: 'updater' },
  ]
  if (spec.installer !== spec.updater) files.push({ name: spec.installer, role: 'installer' })
  files.push({ name: spec.manifest, role: 'manifest' })
  return files
}

export function samplePackagingDryRun(): PackagingDryRunDocument {
  const version = ADMITTED_WORKSPACE_PACKAGES[0]?.version ?? ''
  const channels = UNSIGNED_RELEASE_CHANNELS.map((spec) => {
    const channelId = packagingChannelId(spec.platform, spec.arch)
    const updater = fixtureIntegrity(channelId, spec.updater)
    const feed: UpdateFeedDocument = {
      schemaVersion: UPDATE_FEED_SCHEMA_VERSION,
      disposition: 'dry-run',
      platform: spec.platform,
      arch: spec.arch,
      version,
      files: [{ url: spec.updater, sha512: updater.sha512, size: updater.size }],
      path: spec.updater,
      sha512: updater.sha512,
      releaseDate: SAMPLE_DRY_RUN_FEED.releaseDate,
    }
    const files: PackagingLayoutFile[] = [
      { name: spec.updater, role: 'updater', size: updater.size, sha512: updater.sha512 },
    ]
    if (spec.installer !== spec.updater) {
      const installer = fixtureIntegrity(channelId, spec.installer)
      files.push({ name: spec.installer, role: 'installer', size: installer.size, sha512: installer.sha512 })
    }
    const manifest = fixtureIntegrity(channelId, spec.manifest)
    files.push({ name: spec.manifest, role: 'manifest', size: manifest.size, sha512: manifest.sha512 })
    return { platform: spec.platform, arch: spec.arch, manifest: spec.manifest, feed, files }
  })
  return {
    publish: PACKAGING_DRY_RUN_PUBLISH,
    identityDiscovery: false,
    version,
    channels,
  }
}

export const SAMPLE_PACKAGING_DRY_RUN: PackagingDryRunDocument = samplePackagingDryRun()

function layoutRole(role: string): PackagingLayoutFile['role'] | null {
  switch (role) {
    case 'updater':
    case 'installer':
    case 'manifest':
    case 'blockmap':
      return role
    default:
      return null
  }
}

function parseLayoutFile(value: unknown): PackagingLayoutFile | null {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.role !== 'string') return null
  if (typeof value.sha512 !== 'string' || typeof value.size !== 'number') return null
  const role = layoutRole(value.role)
  if (!role) return null
  if (!isSha512(value.sha512) || !Number.isInteger(value.size) || value.size <= 0) return null
  return { name: value.name, role, size: value.size, sha512: value.sha512 }
}

function feedForManifest(feed: Record<string, unknown>): Pick<UpdateFeedDocument, 'version' | 'files' | 'path' | 'sha512' | 'releaseDate'> | null {
  if (typeof feed.version !== 'string' || typeof feed.path !== 'string' || typeof feed.sha512 !== 'string') return null
  if (typeof feed.releaseDate !== 'string' || !Array.isArray(feed.files)) return null
  const files: UpdateFeedFile[] = []
  for (const file of feed.files) {
    if (!isRecord(file) || typeof file.url !== 'string' || typeof file.sha512 !== 'string' || typeof file.size !== 'number') return null
    files.push({ url: file.url, sha512: file.sha512, size: file.size })
  }
  return { version: feed.version, files, path: feed.path, sha512: feed.sha512, releaseDate: feed.releaseDate }
}

export function checkPackagingDryRun(
  input: unknown,
  versions: readonly string[],
  manifests?: Readonly<Record<string, string>>,
): PackagingDryRunCheck {
  if (!isRecord(input)) return { outcome: 'invalid', errors: ['packaging_not_object'] }
  const publish = input.publish
  const identityDiscovery = input.identityDiscovery
  const channels = Array.isArray(input.channels) ? input.channels : []
  const liveFeed = channels.some((channel) => isRecord(channel) && checkUpdateFeed(channel.feed).outcome === 'locked')
  const liveManifest = manifests ? Object.values(manifests).some((text) => /https?:\/\//i.test(text)) : false
  if (identityDiscovery === true || (typeof publish === 'string' && LIVE_PUBLISH_SET.has(publish)) || liveFeed || liveManifest) {
    return { outcome: 'locked', status: 'Locked', phase: SIGNED_PRODUCTION_FEED_PHASE }
  }

  const errors: string[] = []
  if (publish !== PACKAGING_DRY_RUN_PUBLISH) errors.push('publish')
  if (identityDiscovery !== false) errors.push('identity_discovery')
  const expectedVersion = typeof input.version === 'string' ? input.version : ''
  if (typeof input.version !== 'string') errors.push('version')
  errors.push(...checkVersionMetadata(versions, expectedVersion))
  if (!Array.isArray(input.channels)) errors.push('channels')

  const seen = new Set<string>()
  const artifacts: string[] = []
  for (const channel of channels) {
    if (!isRecord(channel) || typeof channel.platform !== 'string' || typeof channel.arch !== 'string') {
      errors.push('channel_shape')
      continue
    }
    const spec = UNSIGNED_RELEASE_CHANNELS.find((item) => item.platform === channel.platform && item.arch === channel.arch)
    const key = packagingChannelId(channel.platform, channel.arch)
    if (!spec) {
      errors.push('channel_unexpected')
      continue
    }
    if (seen.has(key)) errors.push('channel_duplicate')
    seen.add(key)
    if (channel.manifest !== spec.manifest) errors.push('manifest_name')

    const feedCheck = checkUpdateFeed(channel.feed)
    if (feedCheck.outcome === 'invalid') errors.push(...feedCheck.errors.map((error) => `feed_${error}`))
    const feedRecord = isRecord(channel.feed) ? channel.feed : null
    if (feedCheck.outcome === 'pass' && feedRecord) {
      if (feedRecord.version !== expectedVersion) errors.push('version_feed_mismatch')
      if (feedRecord.platform !== channel.platform || feedRecord.arch !== channel.arch) errors.push('feed_target')
      if (feedRecord.path !== spec.updater) errors.push('updater_integrity')
    }

    if (!Array.isArray(channel.files)) {
      errors.push('layout_files')
      continue
    }
    const expected = expectedLayout(spec)
    const actual = new Map<string, PackagingLayoutFile>()
    for (const file of channel.files) {
      const parsed = parseLayoutFile(file)
      if (!parsed) {
        errors.push('layout_file')
        continue
      }
      if (CREDENTIAL_FILENAME.test(parsed.name) || feedUrlClass(parsed.name) !== 'relative') {
        errors.push(CREDENTIAL_FILENAME.test(parsed.name) ? 'credential_filename' : 'file_url')
      }
      if (actual.has(parsed.name)) errors.push('layout_duplicate')
      actual.set(parsed.name, parsed)
      artifacts.push(parsed.name)
    }
    for (const item of expected) {
      const found = actual.get(item.name)
      if (!found || found.role !== item.role) errors.push(`missing_${item.role}`)
    }
    for (const [name, file] of actual) {
      const known = expected.find((item) => item.name === name)
      if (known) continue
      const blockmap = expected.some((item) => item.role !== 'manifest' && name === `${item.name}.blockmap`)
      if (!blockmap || file.role !== 'blockmap') errors.push('layout_unexpected')
    }
    const updater = actual.get(spec.updater)
    const feedFile = feedRecord && Array.isArray(feedRecord.files) ? feedRecord.files[0] : undefined
    if (!updater || !isRecord(feedFile) || updater.sha512 !== feedFile.sha512 || updater.size !== feedFile.size) {
      errors.push('updater_integrity')
    }

    if (manifests) {
      const text = manifests[key]
      if (typeof text !== 'string') {
        errors.push('manifest_missing')
      } else if (feedRecord) {
        const manifestFeed = feedForManifest(feedRecord)
        const manifestFile = actual.get(spec.manifest)
        if (!manifestFeed || text !== renderUpdateManifest(manifestFeed)) errors.push('manifest_text')
        if (!manifestFile || new TextEncoder().encode(text).length !== manifestFile.size) errors.push('manifest_size')
      }
    }
  }

  for (const spec of UNSIGNED_RELEASE_CHANNELS) {
    if (!seen.has(packagingChannelId(spec.platform, spec.arch))) errors.push('channel_missing')
  }
  if (manifests) {
    for (const key of Object.keys(manifests)) {
      const known = UNSIGNED_RELEASE_CHANNELS.some((spec) => packagingChannelId(spec.platform, spec.arch) === key)
      if (!known) errors.push('manifest_unexpected')
    }
  }

  if (errors.length > 0) return { outcome: 'invalid', errors }
  return {
    outcome: 'pass',
    status: 'wired',
    version: expectedVersion,
    artifacts: [...new Set(artifacts)].sort(),
  }
}

export function releaseAboutModel(files?: Readonly<Record<string, unknown>>): ReleaseAboutModel {
  const source = files ?? snapshotWorkspaceFiles()
  const report = verifyAdmittedDeps(admittedDepsFromWorkspaceJson(source))
  return {
    notices: report.ok ? { ok: true, status: 'wired', count: report.count } : { ok: false, errors: report.errors },
    dryRunFeed: checkUpdateFeed(SAMPLE_DRY_RUN_FEED),
    packagingDryRun: checkPackagingDryRun(SAMPLE_PACKAGING_DRY_RUN, workspaceVersions(source)),
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
