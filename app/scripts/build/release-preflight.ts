/**
 * Filesystem gate for the release independence check.
 * Packaging scripts call this before electron-builder. It reads admitted
 * package.json files and the checked-in notices file. It does not upload,
 * sign, or contact an update server.
 */

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ADMITTED_WORKSPACE_PACKAGES,
  RELEASE_NOTICES_FILE,
  SAMPLE_DRY_RUN_FEED,
  SAMPLE_PACKAGING_DRY_RUN,
  UNSIGNED_RELEASE_CHANNELS,
  admittedDepsFromWorkspaceJson,
  checkPackagingDryRun,
  checkUpdateFeed,
  dryRunArtifactPayload,
  packagingChannelId,
  renderThirdPartyNotices,
  renderUpdateManifest,
  verifyWorkspacePaths,
  workspaceVersions,
} from '../../packages/shared/src/protocol/release-independence.ts'

export function listWorkspacePackagePaths(appRoot: string): string[] {
  const found = ['package.json']
  for (const dir of ['packages', 'apps']) {
    const abs = join(appRoot, dir)
    if (!existsSync(abs)) throw new Error(`notices_incomplete: ${dir} is missing`)
    for (const name of readdirSync(abs)) {
      const relPath = `${dir}/${name}/package.json`
      if (existsSync(join(appRoot, relPath))) found.push(relPath)
    }
  }
  return found.sort()
}

export function assertRepoReleaseIndependence(appRoot: string): void {
  const rootPackage = join(appRoot, 'package.json')
  if (!existsSync(rootPackage)) {
    throw new Error('notices_incomplete: craft-agent package.json was not found')
  }
  const root = JSON.parse(readFileSync(rootPackage, 'utf8')) as { name?: string }
  if (root.name !== 'craft-agent') {
    throw new Error('notices_incomplete: expected the craft-agent workspace root')
  }

  const pathErrors = verifyWorkspacePaths(listWorkspacePackagePaths(appRoot))
  if (pathErrors.length > 0) {
    throw new Error(`notices_incomplete: ${pathErrors.join('; ')}`)
  }

  const files: Record<string, unknown> = {}
  for (const pin of ADMITTED_WORKSPACE_PACKAGES) {
    const abs = join(appRoot, pin.relPath)
    if (!existsSync(abs)) throw new Error(`notices_incomplete: ${pin.relPath}: missing_workspace`)
    files[pin.relPath] = JSON.parse(readFileSync(abs, 'utf8'))
  }

  const text = renderThirdPartyNotices(admittedDepsFromWorkspaceJson(files))
  const noticesPath = join(appRoot, RELEASE_NOTICES_FILE)
  if (!existsSync(noticesPath)) {
    throw new Error(`notices_incomplete: ${RELEASE_NOTICES_FILE} is missing`)
  }
  const stored = readFileSync(noticesPath, 'utf8')
  if (stored !== text) {
    throw new Error(`notices_incomplete: ${RELEASE_NOTICES_FILE} does not match the admitted licenses`)
  }

  const dryRun = checkUpdateFeed(SAMPLE_DRY_RUN_FEED)
  if (dryRun.outcome !== 'pass') {
    throw new Error('update_feed_invalid: the dry-run fixture failed')
  }
  const signed = checkUpdateFeed({ ...SAMPLE_DRY_RUN_FEED, disposition: 'production', signed: true })
  if (signed.outcome !== 'locked') {
    throw new Error('update_feed_invalid: a production feed must stay Locked')
  }

  assertPackagingDryRun(appRoot)
}

function sha512Base64(bytes: Buffer): string {
  return createHash('sha512').update(bytes).digest('base64')
}

export function assertPackagingDryRun(appRoot: string): void {
  const fixturePath = join(appRoot, 'scripts/build/fixtures/packaging-dry-run.json')
  if (!existsSync(fixturePath)) {
    throw new Error('packaging_dry_run_invalid: fixture json is missing')
  }
  const parsed = JSON.parse(readFileSync(fixturePath, 'utf8')) as unknown
  if (JSON.stringify(parsed) !== JSON.stringify(SAMPLE_PACKAGING_DRY_RUN)) {
    throw new Error('packaging_dry_run_invalid: fixture json does not match the dry-run contract')
  }

  const manifests: Record<string, string> = {}
  for (const spec of UNSIGNED_RELEASE_CHANNELS) {
    const channelId = packagingChannelId(spec.platform, spec.arch)
    const dir = join(appRoot, 'scripts/build/fixtures/packaging-dry-run', channelId)
    const channel = SAMPLE_PACKAGING_DRY_RUN.channels.find((item) => item.platform === spec.platform && item.arch === spec.arch)
    if (!channel) throw new Error(`packaging_dry_run_invalid: ${channelId} is missing from the contract`)
    const names = spec.installer === spec.updater
      ? [spec.updater, spec.manifest]
      : [spec.updater, spec.installer, spec.manifest]
    for (const name of names) {
      const abs = join(dir, name)
      if (!existsSync(abs)) throw new Error(`packaging_dry_run_invalid: ${channelId}/${name} is missing`)
      const bytes = readFileSync(abs)
      const declared = channel.files.find((file) => file.name === name)
      if (!declared || bytes.length !== declared.size || sha512Base64(bytes) !== declared.sha512) {
        throw new Error(`packaging_dry_run_invalid: ${channelId}/${name} integrity does not match`)
      }
      if (name === spec.manifest) {
        const text = bytes.toString('utf8')
        manifests[channelId] = text
        if (text !== renderUpdateManifest(channel.feed)) {
          throw new Error(`packaging_dry_run_invalid: ${channelId}/${name} is not the local updater manifest`)
        }
      } else {
        const role = name === spec.updater ? 'updater' : 'installer'
        if (bytes.toString('utf8') !== dryRunArtifactPayload(channelId, role, name)) {
          throw new Error(`packaging_dry_run_invalid: ${channelId}/${name} bytes are not the dry-run payload`)
        }
      }
    }
  }

  const versions = workspaceVersions(Object.fromEntries(ADMITTED_WORKSPACE_PACKAGES.map((pin) => {
    return [pin.relPath, JSON.parse(readFileSync(join(appRoot, pin.relPath), 'utf8'))]
  })))
  const result = checkPackagingDryRun(parsed, versions, manifests)
  if (result.outcome !== 'pass') {
    const detail = result.outcome === 'invalid' ? result.errors.join('; ') : result.phase
    throw new Error(`packaging_dry_run_invalid: ${detail}`)
  }
}
