import { describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ADMITTED_WORKSPACE_PACKAGES,
  BUNDLED_ADMITTED_DEPS,
  BUNDLED_RUNTIME_PINS,
  PACKAGING_DRY_RUN_PUBLISH,
  RELEASE_NOTICES_FILE,
  SAMPLE_DRY_RUN_FEED,
  SAMPLE_PACKAGING_DRY_RUN,
  UNSIGNED_RELEASE_CHANNELS,
  UPSTREAM_CRAFT_UPDATE_BASE,
  admittedDepsFromWorkspaceJson,
  checkPackagingDryRun,
  checkUpdateFeed,
  checkVersionMetadata,
  dryRunArtifactPayload,
  packagingChannelId,
  parseUpdateManifest,
  readReleaseDispositionForAgent,
  readReleaseDispositionForHuman,
  releaseAboutModel,
  renderThirdPartyNotices,
  renderUpdateManifest,
  verifyAdmittedDeps,
  verifyWorkspacePaths,
  workspaceVersions,
  type AdmittedDep,
  type PackagingDryRunDocument,
} from '../release-independence'

const appRoot = join(import.meta.dir, '../../../../..')

function readWorkspaceFiles(): Record<string, unknown> {
  const files: Record<string, unknown> = {}
  for (const pin of ADMITTED_WORKSPACE_PACKAGES) {
    files[pin.relPath] = JSON.parse(readFileSync(join(appRoot, pin.relPath), 'utf8'))
  }
  return files
}

describe('third-party notices', () => {
  test('fails closed when an admitted dependency has no license', () => {
    const deps = admittedDepsFromWorkspaceJson(readWorkspaceFiles())
    const broken: AdmittedDep[] = deps.map((dep) => dep.name === 'bun'
      ? { ...dep, license: { kind: 'missing' }, notice: '' }
      : dep)
    const report = verifyAdmittedDeps(broken)
    expect(report.ok).toBe(false)
    expect(report.text).toBeNull()
    expect(report.errors).toContain('bun: missing_license')
    expect(() => renderThirdPartyNotices(broken)).toThrow(/notices_incomplete/)
  })

  test('fails closed on an unknown SPDX id and on an empty admitted set', () => {
    const deps = admittedDepsFromWorkspaceJson(readWorkspaceFiles())
    const gpl = deps.map((dep) => dep.name === 'electron'
      ? { ...dep, license: { kind: 'spdx' as const, id: 'GPL-3.0-only' } }
      : dep)
    expect(verifyAdmittedDeps(gpl).errors).toContain('electron: unknown_spdx')
    expect(verifyAdmittedDeps([]).errors).toEqual(['admitted_set_empty'])
  })

  test('fails closed when a workspace package.json is unlisted or missing', () => {
    const expected = ADMITTED_WORKSPACE_PACKAGES.map((pin) => pin.relPath)
    expect(verifyWorkspacePaths(expected)).toEqual([])
    expect(verifyWorkspacePaths([...expected, 'packages/new-kit/package.json'])).toContain('packages/new-kit/package.json: unlisted_workspace')
    expect(verifyWorkspacePaths(expected.filter((relPath) => relPath !== 'package.json'))).toContain('package.json: missing_workspace')
  })

  test('the checked-in notices file matches the admitted workspace licenses', () => {
    const deps = admittedDepsFromWorkspaceJson(readWorkspaceFiles())
    const text = renderThirdPartyNotices(deps)
    const stored = readFileSync(join(appRoot, RELEASE_NOTICES_FILE), 'utf8')
    expect(stored).toBe(text)
    expect(text).toContain('License: Apache-2.0')
    expect(text).toContain('License: MIT OR Apache-2.0')
    expect(text).toContain('https://www.anthropic.com/legal/commercial-terms')
    expect(text).toContain('Signed production publishing stays Locked.')
  })
})

describe('update feed dry run', () => {
  test('a relative dry-run feed is wired and does not require a live URL', () => {
    const fixture = JSON.parse(readFileSync(join(appRoot, 'scripts/build/fixtures/update-feed.dry-run.json'), 'utf8'))
    expect(fixture).toEqual(SAMPLE_DRY_RUN_FEED)
    expect(checkUpdateFeed(fixture)).toEqual({ outcome: 'pass', status: 'wired' })
    expect(JSON.stringify(SAMPLE_DRY_RUN_FEED)).not.toContain(UPSTREAM_CRAFT_UPDATE_BASE)
  })

  test('a signed, production, or absolute feed stays Locked', () => {
    const locked = { outcome: 'locked', status: 'Locked', phase: 'signed_production_feed' }
    expect(checkUpdateFeed({ ...SAMPLE_DRY_RUN_FEED, disposition: 'production' })).toEqual(locked)
    expect(checkUpdateFeed({ ...SAMPLE_DRY_RUN_FEED, disposition: 'signed' })).toEqual(locked)
    expect(checkUpdateFeed({ ...SAMPLE_DRY_RUN_FEED, signed: true })).toEqual(locked)
    expect(checkUpdateFeed({
      ...SAMPLE_DRY_RUN_FEED,
      path: `${UPSTREAM_CRAFT_UPDATE_BASE}/Craft-Agents-arm64.zip`,
      files: [{ ...SAMPLE_DRY_RUN_FEED.files[0], url: `${UPSTREAM_CRAFT_UPDATE_BASE}/Craft-Agents-arm64.zip` }],
    })).toEqual(locked)
  })

  test('a feed with a missing checksum or a parent path is invalid', () => {
    const missing = checkUpdateFeed({
      ...SAMPLE_DRY_RUN_FEED,
      sha512: '',
      files: [{ ...SAMPLE_DRY_RUN_FEED.files[0], sha512: '' }],
    })
    expect(missing.outcome).toBe('invalid')
    const traversal = checkUpdateFeed({
      ...SAMPLE_DRY_RUN_FEED,
      path: '../Craft-Agents-arm64.zip',
      files: [{ ...SAMPLE_DRY_RUN_FEED.files[0], url: '../Craft-Agents-arm64.zip' }],
    })
    expect(traversal.outcome).toBe('invalid')
  })
})

describe('release disposition', () => {
  test('the About page reads the same disposition', () => {
    const page = readFileSync(join(appRoot, 'apps/electron/src/renderer/pages/settings/AppSettingsPage.tsx'), 'utf8')
    expect(page).toContain('releaseAboutModel')
    expect(page).toContain('settings.about.fleetUpdatesLocked')
    expect(page).toContain('settings.about.noticesCount')
    expect(page).toContain('settings.about.packagingDryRun')
    expect(page).toContain('release.packagingDryRun')
    expect(page).not.toContain('autoUpdater.setFeedURL')
  })

  test('the human and agent readers share one local report', () => {
    const files = readWorkspaceFiles()
    const human = readReleaseDispositionForHuman(files)
    const agent = readReleaseDispositionForAgent(files)
    expect(agent).toEqual(human)
    expect(human.notices).toEqual({
      ok: true,
      status: 'wired',
      count: Object.keys(files).length + BUNDLED_ADMITTED_DEPS.length,
    })
    expect(human.dryRunFeed).toEqual({ outcome: 'pass', status: 'wired' })
    expect(human.packagingDryRun.outcome).toBe('pass')
    expect(human.packagingDryRun).toMatchObject({ status: 'wired', version: '0.10.5' })
    expect(human.signedFeed).toEqual({ status: 'Locked', phase: 'signed_production_feed' })
    expect(human.sessionJournal).toBe('not_written')
    expect(releaseAboutModel()).toEqual(human)
  })

  test('bundled pins match the packaging scripts', () => {
    const common = readFileSync(join(appRoot, 'scripts/build/common.ts'), 'utf8')
    const builder = readFileSync(join(appRoot, 'apps/electron/electron-builder.yml'), 'utf8')
    const rootPackage = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
    }
    expect(common).toContain(`BUN_VERSION = '${BUNDLED_RUNTIME_PINS.bun}'`)
    expect(common).toContain(`UV_VERSION = '${BUNDLED_RUNTIME_PINS.uv}'`)
    expect(builder).toContain(`electronVersion: "${BUNDLED_RUNTIME_PINS.electron}"`)
    expect(rootPackage.dependencies['@anthropic-ai/claude-agent-sdk']).toBe(BUNDLED_RUNTIME_PINS.claudeAgentSdk)
    expect(rootPackage.dependencies['@vscode/ripgrep']).toBe(BUNDLED_RUNTIME_PINS.ripgrep)
    const source = readFileSync(join(import.meta.dir, '../release-independence.ts'), 'utf8')
    expect(source.includes('fetch(')).toBe(false)
    expect(source.includes('electron-builder')).toBe(true)
    expect(source.includes('npx electron-builder')).toBe(false)
  })

  test('packaging entry points call the checker before electron-builder', () => {
    const callers = [
      'scripts/build/darwin.ts',
      'scripts/build/linux.ts',
      'scripts/build/win32.ts',
      'apps/electron/scripts/build-dmg.sh',
      'apps/electron/scripts/build-linux.sh',
      'apps/electron/scripts/build-win.ps1',
    ]
    for (const relPath of callers) {
      const source = readFileSync(join(appRoot, relPath), 'utf8')
      const marker = source.includes('assertRepoReleaseIndependence')
        ? source.indexOf('assertRepoReleaseIndependence')
        : source.indexOf('verify-release-independence.ts')
      const pack = source.indexOf('npx electron-builder')
      expect(marker).toBeGreaterThan(-1)
      expect(pack).toBeGreaterThan(marker)
    }
  })
})

function cloneDocument(document: PackagingDryRunDocument): PackagingDryRunDocument {
  return JSON.parse(JSON.stringify(document)) as PackagingDryRunDocument
}

function manifestsFor(document: PackagingDryRunDocument): Record<string, string> {
  const manifests: Record<string, string> = {}
  for (const channel of document.channels) {
    manifests[packagingChannelId(channel.platform, channel.arch)] = renderUpdateManifest(channel.feed)
  }
  return manifests
}

describe('packaging dry run', () => {
  test('the unsigned layout matches version metadata and local manifest bytes', () => {
    const files = readWorkspaceFiles()
    const versions = workspaceVersions(files)
    expect(checkVersionMetadata(versions, SAMPLE_PACKAGING_DRY_RUN.version)).toEqual([])
    expect(new Set(versions)).toEqual(new Set([SAMPLE_PACKAGING_DRY_RUN.version]))
    const stored = JSON.parse(readFileSync(join(appRoot, 'scripts/build/fixtures/packaging-dry-run.json'), 'utf8'))
    expect(stored).toEqual(SAMPLE_PACKAGING_DRY_RUN)
    expect(stored.publish).toBe(PACKAGING_DRY_RUN_PUBLISH)
    expect(stored.identityDiscovery).toBe(false)

    const manifests: Record<string, string> = {}
    for (const spec of UNSIGNED_RELEASE_CHANNELS) {
      const channelId = packagingChannelId(spec.platform, spec.arch)
      const channel = SAMPLE_PACKAGING_DRY_RUN.channels.find((item) => item.platform === spec.platform && item.arch === spec.arch)
      expect(channel).toBeDefined()
      const dir = join(appRoot, 'scripts/build/fixtures/packaging-dry-run', channelId)
      for (const file of channel!.files) {
        const bytes = readFileSync(join(dir, file.name))
        const digest = createHash('sha512').update(bytes).digest('base64')
        expect(bytes.length).toBe(file.size)
        expect(digest).toBe(file.sha512)
        if (file.role === 'manifest') {
          const text = bytes.toString('utf8')
          expect(text).toBe(renderUpdateManifest(channel!.feed))
          expect(text).not.toContain('https://')
          expect(parseUpdateManifest(text)).toMatchObject({
            ok: true,
            version: channel!.feed.version,
            path: spec.updater,
          })
          manifests[channelId] = text
        } else if (file.role === 'updater' || file.role === 'installer') {
          expect(bytes.toString('utf8')).toBe(dryRunArtifactPayload(channelId, file.role, file.name))
        }
      }
      expect(channel!.feed.path).toBe(spec.updater)
      expect(channel!.feed.path).not.toContain('x86_64')
    }

    const result = checkPackagingDryRun(SAMPLE_PACKAGING_DRY_RUN, versions, manifests)
    expect(result).toMatchObject({ outcome: 'pass', status: 'wired', version: '0.10.5' })
    expect(JSON.stringify(SAMPLE_PACKAGING_DRY_RUN)).not.toContain(UPSTREAM_CRAFT_UPDATE_BASE)
  })

  test('a version mismatch or a missing installer is invalid', () => {
    const versions = workspaceVersions(readWorkspaceFiles())
    expect(checkPackagingDryRun(SAMPLE_PACKAGING_DRY_RUN, versions.map(() => '9.9.9')).outcome).toBe('invalid')
    expect(checkVersionMetadata(['0.10.5', '0.10.6'], '0.10.5')).toContain('version_mismatch')

    const missing = cloneDocument(SAMPLE_PACKAGING_DRY_RUN)
    missing.channels[0].files = missing.channels[0].files.filter((file) => file.role !== 'installer')
    const report = checkPackagingDryRun(missing, versions, manifestsFor(missing))
    expect(report.outcome).toBe('invalid')
    if (report.outcome === 'invalid') expect(report.errors).toContain('missing_installer')
  })

  test('publish, signing discovery, and a live manifest stay Locked', () => {
    const versions = workspaceVersions(readWorkspaceFiles())
    const locked = { outcome: 'locked', status: 'Locked', phase: 'signed_production_feed' }
    const published = cloneDocument(SAMPLE_PACKAGING_DRY_RUN)
    published.publish = 'onTag'
    expect(checkPackagingDryRun(published, versions)).toEqual(locked)
    const signed = cloneDocument(SAMPLE_PACKAGING_DRY_RUN)
    signed.identityDiscovery = true
    expect(checkPackagingDryRun(signed, versions)).toEqual(locked)
    const manifests = manifestsFor(SAMPLE_PACKAGING_DRY_RUN)
    manifests['darwin-arm64'] = manifests['darwin-arm64'].replace(
      'Craft-Agents-arm64.zip',
      `${UPSTREAM_CRAFT_UPDATE_BASE}/Craft-Agents-arm64.zip`,
    )
    expect(checkPackagingDryRun(SAMPLE_PACKAGING_DRY_RUN, versions, manifests)).toEqual(locked)
  })

  test('a credential file or an unexpected artifact name is invalid', () => {
    const versions = workspaceVersions(readWorkspaceFiles())
    const leaked = cloneDocument(SAMPLE_PACKAGING_DRY_RUN)
    leaked.channels[2].files.push({
      name: '.env',
      role: 'blockmap',
      size: 4,
      sha512: SAMPLE_DRY_RUN_FEED.sha512,
    })
    const credential = checkPackagingDryRun(leaked, versions)
    expect(credential.outcome).toBe('invalid')
    if (credential.outcome === 'invalid') expect(credential.errors).toContain('credential_filename')

    const renamed = cloneDocument(SAMPLE_PACKAGING_DRY_RUN)
    const linux = renamed.channels.find((channel) => channel.platform === 'linux')
    expect(linux).toBeDefined()
    linux!.feed.path = 'Craft-Agents-x86_64.AppImage'
    linux!.feed.files[0].url = 'Craft-Agents-x86_64.AppImage'
    linux!.files = linux!.files.map((file) => file.role === 'updater'
      ? { ...file, name: 'Craft-Agents-x86_64.AppImage' }
      : file)
    const report = checkPackagingDryRun(renamed, versions)
    expect(report.outcome).toBe('invalid')
  })

  test('the dry-run entry does not publish or enable the Craft updater', () => {
    const script = readFileSync(join(appRoot, 'scripts/verify-packaging-dry-run.ts'), 'utf8')
    const preflight = readFileSync(join(appRoot, 'scripts/build/release-preflight.ts'), 'utf8')
    const pkg = JSON.parse(readFileSync(join(appRoot, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    const common = readFileSync(join(appRoot, 'scripts/build/common.ts'), 'utf8')
    const install = readFileSync(join(appRoot, 'scripts/install-app.sh'), 'utf8')
    expect(pkg.scripts['verify:packaging-dry-run']).toContain('verify-packaging-dry-run.ts')
    expect(pkg.scripts['electron:dist:dev:mac']).toContain('CSC_IDENTITY_AUTO_DISCOVERY=false')
    expect(script).not.toContain('uploadToS3')
    expect(script).not.toContain('setFeedURL')
    expect(preflight).not.toContain('uploadToS3')
    expect(preflight).toContain('assertPackagingDryRun')
    expect(common).toContain('return `Craft-Agents-${arch}.dmg`')
    expect(common).toContain('return `Craft-Agents-${arch}.exe`')
    expect(common).toContain('return `Craft-Agents-${arch}.AppImage`')
    expect(install).toContain('yml_file="latest-mac.yml"')
    expect(install).toContain('yml_file="latest-linux.yml"')
    const updater = readFileSync(join(appRoot, 'apps/electron/src/main/auto-update.ts'), 'utf8')
    expect(updater).toContain(UPSTREAM_CRAFT_UPDATE_BASE)
    expect(updater).not.toContain('checkPackagingDryRun')
  })
})
