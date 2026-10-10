/**
 * Check third-party notices and the local update-feed dry run.
 * Exit 0 when notices match and the sample feed is a dry run.
 * This process does not publish a feed and does not sign a build.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertRepoReleaseIndependence } from './build/release-preflight.ts'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

assertRepoReleaseIndependence(appRoot)
console.log('Third-party notices: wired')
console.log('Update feed dry run: wired')
console.log('Packaging dry run: wired')
console.log('Signed production feed: Locked')
