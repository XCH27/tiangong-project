#!/usr/bin/env bun
/**
 * 使用 FLEET_ELECTRON_UPDATE_URL 打包 Electron 发行版（B6）。
 *
 * Usage:
 *   FLEET_ELECTRON_UPDATE_URL=https://updates.example.com/fleet/electron/latest \
 *     bun run electron:dist:mac:fleet
 */

import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { getFleetElectronUpdateUrl, isFleetOwnedUpdateUrl } from '../packages/shared/src/fleet-publish'

const APP_ROOT = resolve(import.meta.dir, '..')
const platform = process.argv[2] ?? 'mac'

const publishUrl = getFleetElectronUpdateUrl()
if (!isFleetOwnedUpdateUrl(publishUrl)) {
  console.warn(
    'Warning: FLEET_ELECTRON_UPDATE_URL not set — packaging with craft default update URL.',
  )
  console.warn('Set FLEET_ELECTRON_UPDATE_URL before shipping Fleet builds to end users.')
}

const platformArgs: Record<string, string[]> = {
  mac: ['--mac'],
  win: ['--win'],
  linux: ['--linux'],
}

const extra = platformArgs[platform]
if (!extra) {
  console.error(`Unknown platform "${platform}". Use: mac | win | linux`)
  process.exit(1)
}

console.log(`electron-builder publish.url = ${publishUrl}`)

const build = spawnSync(
  'bun',
  ['run', 'electron:build'],
  { cwd: APP_ROOT, stdio: 'inherit', env: process.env },
)
if (build.status !== 0) process.exit(build.status ?? 1)

const dist = spawnSync(
  'npx',
  ['electron-builder', '--config', 'electron-builder.yml', ...extra, `--config.publish.url=${publishUrl}`],
  { cwd: resolve(APP_ROOT, 'apps/electron'), stdio: 'inherit', env: process.env },
)
process.exit(dist.status ?? 1)
