#!/usr/bin/env bun
/**
 * File-size ratchet.
 *
 * `06-CODE-MAP.md` has said for months that a renderer file over 1,500 lines must
 * be extracted before it grows further. The rule held nothing: `AppShell.tsx`
 * reached 4,188 lines and `SessionManager.ts` 9,394 while it was in force,
 * because a rule with no gate is advice.
 *
 * This is the gate. Every file over the budget is frozen at the size it has
 * today, in `config/file-size-baseline.txt`. Growing one fails. Adding a new one
 * fails. Shrinking one is expected and the baseline is rewritten with
 * `--update`, which may only ever lower a number or drop a line — the script
 * refuses to raise one.
 *
 * Deliberately measured rather than lint-suppression-based, so there is no
 * escape hatch: Orca ships the same idea keyed on `oxlint-disable max-lines`
 * comments, and its own `App.tsx` is 2,831 lines opening with exactly such a
 * comment. The evidence that the comment-based version does not hold is in the
 * project that wrote it.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { readdirSync, statSync } from 'node:fs'

const ROOT = join(import.meta.dir, '..')
const BASELINE = join(ROOT, 'config/file-size-baseline.txt')

/** One budget, matching the rule `06-CODE-MAP.md` already states. */
export const LINE_BUDGET = 1500

const SCAN_ROOTS = ['apps', 'packages']
const SKIP_DIR = new Set(['node_modules', 'dist', 'out', '.next', 'build', 'coverage'])

function isSource(path: string): boolean {
  if (!/\.(ts|tsx)$/.test(path)) return false
  if (/\.(test|spec)\.(ts|tsx)$/.test(path)) return false
  if (path.includes('/__tests__/')) return false
  if (path.endsWith('.d.ts')) return false
  return true
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (isSource(full)) out.push(full)
  }
  return out
}

export function measure(): Map<string, number> {
  const sizes = new Map<string, number>()
  for (const root of SCAN_ROOTS) {
    const dir = join(ROOT, root)
    if (!existsSync(dir)) continue
    for (const file of walk(dir)) {
      const lines = readFileSync(file, 'utf-8').split('\n').length
      if (lines > LINE_BUDGET) sizes.set(relative(ROOT, file), lines)
    }
  }
  return sizes
}

export function parseBaseline(text: string): Map<string, number> {
  const map = new Map<string, number>()
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const [count, ...rest] = line.split(/\s+/)
    map.set(rest.join(' '), Number(count))
  }
  return map
}

function serialize(sizes: Map<string, number>): string {
  const rows = [...sizes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return [
    `# Files over ${LINE_BUDGET} lines, frozen at the size they had when added.`,
    '# This list may only shrink. Growing a file here, or adding a new one, fails',
    '# `bun run lint:file-size`. Regenerate with `--update` after making a file smaller.',
    '',
    ...rows.map(([path, count]) => `${count} ${path}`),
    '',
  ].join('\n')
}

const current = measure()
const update = process.argv.includes('--update')
const baseline = existsSync(BASELINE) ? parseBaseline(readFileSync(BASELINE, 'utf-8')) : new Map()

if (update) {
  // `--update` records shrinkage. It refuses to raise a number, because a
  // command that silently rewrites the ceiling upward is the same as no gate.
  const raised: string[] = []
  for (const [path, count] of current) {
    const was = baseline.get(path)
    if (was !== undefined && count > was) raised.push(`${path}: ${was} → ${count}`)
  }
  if (raised.length > 0) {
    console.error('Refusing to update: these files grew. Shrink them, do not raise the baseline.')
    for (const line of raised) console.error(`  ${line}`)
    process.exit(1)
  }
  writeFileSync(BASELINE, serialize(current), 'utf-8')
  console.log(`Baseline updated: ${current.size} files over ${LINE_BUDGET} lines.`)
  process.exit(0)
}

const grew: string[] = []
const added: string[] = []
for (const [path, count] of current) {
  const was = baseline.get(path)
  if (was === undefined) added.push(`${path} (${count} lines)`)
  else if (count > was) grew.push(`${path}: ${was} → ${count} (+${count - was})`)
}
const shrank = [...baseline.entries()].filter(([path, was]) => {
  const now = current.get(path)
  return now === undefined || now < was
})

if (added.length > 0 || grew.length > 0) {
  console.error(`File-size ratchet failed. Budget is ${LINE_BUDGET} lines.\n`)
  if (added.length > 0) {
    console.error('New files over budget — split them instead of adding to the baseline:')
    for (const line of added) console.error(`  ${line}`)
    console.error('')
  }
  if (grew.length > 0) {
    console.error('These files are already over budget and grew:')
    for (const line of grew) console.error(`  ${line}`)
    console.error('')
  }
  console.error('Extract the concern you were adding into its own module.')
  process.exit(1)
}

const suffix = shrank.length > 0
  ? ` — ${shrank.length} shrank, run \`bun run lint:file-size -- --update\` to lock it in`
  : ''
console.log(`File-size ratchet OK: ${current.size} files over ${LINE_BUDGET} lines${suffix}.`)
