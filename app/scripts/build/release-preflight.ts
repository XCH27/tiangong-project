/**
 * Filesystem gate for the release independence check.
 * Packaging scripts call this before electron-builder. It reads admitted
 * package.json files and the checked-in notices file. It does not upload,
 * sign, or contact an update server.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ADMITTED_WORKSPACE_PACKAGES,
  RELEASE_NOTICES_FILE,
  SAMPLE_DRY_RUN_FEED,
  admittedDepsFromWorkspaceJson,
  checkUpdateFeed,
  renderThirdPartyNotices,
  verifyWorkspacePaths,
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
}
