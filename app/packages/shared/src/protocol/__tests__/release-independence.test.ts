import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ADMITTED_WORKSPACE_PACKAGES,
  BUNDLED_ADMITTED_DEPS,
  BUNDLED_RUNTIME_PINS,
  RELEASE_NOTICES_FILE,
  SAMPLE_DRY_RUN_FEED,
  UPSTREAM_CRAFT_UPDATE_BASE,
  admittedDepsFromWorkspaceJson,
  checkUpdateFeed,
  readReleaseDispositionForAgent,
  readReleaseDispositionForHuman,
  releaseAboutModel,
  renderThirdPartyNotices,
  verifyAdmittedDeps,
  verifyWorkspacePaths,
  type AdmittedDep,
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
