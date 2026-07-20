#!/usr/bin/env bun
/**
 * Verify that every statically named i18n callsite resolves in en.json.
 *
 * Dynamic keys are intentionally skipped because their value cannot be proved
 * statically; i18next's runtime missing-key diagnostics cover that path.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, resolve } from 'node:path'

const ROOT = resolve(import.meta.dir ?? new URL('.', import.meta.url).pathname, '..')
const EN_PATH = resolve(ROOT, 'packages/shared/src/i18n/locales/en.json')
const SOURCE_ROOTS = [resolve(ROOT, 'apps'), resolve(ROOT, 'packages')]
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const IGNORED_DIRECTORIES = new Set(['dist', 'node_modules', 'out', 'build', 'coverage'])

const en = JSON.parse(readFileSync(EN_PATH, 'utf-8')) as Record<string, string>
const enKeys = new Set(Object.keys(en))

function keyExists(key: string): boolean {
  return enKeys.has(key) || (enKeys.has(`${key}_one`) && enKeys.has(`${key}_other`))
}

function* sourceFiles(directory: string): Generator<string> {
  for (const entry of readdirSync(directory).sort()) {
    if (IGNORED_DIRECTORIES.has(entry)) continue
    const path = resolve(directory, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) yield* sourceFiles(path)
    else if (SOURCE_EXTENSIONS.has(extname(entry))) yield path
  }
}

const literalCall = /\b(?:t|i18n\.t)\(\s*(['"])([^'"\n]+)\1/g
const transAttribute = /\bi18nKey\s*=\s*(?:(['"])([^'"\n]+)\1|\{\s*(['"])([^'"\n]+)\3\s*\})/g
const missing = new Map<string, Set<string>>()

function record(key: string, file: string): void {
  if (keyExists(key)) return
  const locations = missing.get(key) ?? new Set<string>()
  locations.add(file.slice(ROOT.length + 1))
  missing.set(key, locations)
}

for (const sourceRoot of SOURCE_ROOTS) {
  for (const file of sourceFiles(sourceRoot)) {
    const source = readFileSync(file, 'utf-8')
    for (const match of source.matchAll(literalCall)) record(match[2]!, file)
    for (const match of source.matchAll(transAttribute)) record((match[2] ?? match[4])!, file)
  }
}

if (missing.size > 0) {
  console.error(`i18n coverage check failed: ${missing.size} literal key(s) missing from en.json`)
  for (const [key, files] of [...missing].sort(([a], [b]) => a.localeCompare(b))) {
    console.error(`  ${key}: ${[...files].sort().join(', ')}`)
  }
  process.exit(1)
}

console.log(`i18n coverage OK (${enKeys.size} English keys)`)
