/**
 * Post-build asset validation (the `build:validate` step).
 *
 * Both pinned upstream checkouts reference this script from their build
 * pipeline but neither ships it, so the inherited `bun run build` could never
 * pass. Fleet restores the guard's intent: fail the build when a
 * packaged-critical output is missing or suspiciously empty, so a broken
 * bundler step cannot produce a "successful" build that launches to a blank
 * window.
 */

import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const distRoot = join(import.meta.dir, '..', 'dist')

/** Paths relative to dist/ that a launchable build must contain. */
const REQUIRED_ASSETS = [
  'main.cjs',
  'bootstrap-preload.cjs',
  'browser-toolbar-preload.cjs',
  'interceptor.cjs',
  'renderer/index.html',
  'renderer/browser-toolbar.html',
  'renderer/browser-empty-state.html',
  'resources',
]

let failed = false

for (const relative of REQUIRED_ASSETS) {
  const path = join(distRoot, relative)
  if (!existsSync(path)) {
    console.error(`✗ missing required build asset: dist/${relative}`)
    failed = true
    continue
  }
  const stats = statSync(path)
  if (stats.isFile() && stats.size === 0) {
    console.error(`✗ required build asset is empty: dist/${relative}`)
    failed = true
    continue
  }
  console.log(`✓ dist/${relative}`)
}

if (failed) {
  console.error('Build asset validation failed.')
  process.exit(1)
}

console.log('Build asset validation passed.')
