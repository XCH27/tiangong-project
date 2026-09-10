/**
 * Atomic JSON file write — serialize to a sibling temp file, then rename
 * over the target. A crash mid-write then corrupts only the temp file,
 * never the store the next load() reads.
 */

import { renameSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'

export function writeJsonFileAtomic(filePath: string, value: unknown): void {
  const tmpPath = `${filePath}.${randomBytes(6).toString('hex')}.tmp`
  writeFileSync(tmpPath, JSON.stringify(value, null, 2), 'utf-8')
  renameSync(tmpPath, filePath)
}
