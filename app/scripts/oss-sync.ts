#!/usr/bin/env bun
/**
 * oss-sync.ts — soft-fork upstream sync for Fleet app/ (craft-agents-oss baseline).
 *
 * Applies upstream commits onto local Fleet changes using three-way merge:
 *   base  = lastSyncedCommit in upstream repo
 *   ours  = current file in app/
 *   theirs = target commit in upstream repo
 *
 * State is tracked in `.oss-sync-state.json` (committed). Temp work uses `.oss-sync-temp/`.
 *
 * Usage:
 *   bun run oss:sync                  # sync to upstream HEAD
 *   bun run oss:sync -- --status      # show sync state
 *   bun run oss:sync -- --dry-run     # preview changes
 *   bun run oss:sync -- --fetch       # fetch upstream before sync
 *   bun run oss:sync -- --target v0.10.4
 *   bun run oss:sync -- --finalize --target v0.10.4   # after manual conflict resolution
 *   bun run oss:sync -- --review                      # semantic impact report (no merge)
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const APP_ROOT = resolve(import.meta.dir, '..')
const STATE_PATH = join(APP_ROOT, '.oss-sync-state.json')
const TEMP_DIR = join(APP_ROOT, '.oss-sync-temp')

/** Lockfiles are regenerated after package.json merges — never 3-way merged. */
const REGENERATE_LOCKFILES = new Set(['bun.lock', 'package-lock.json', 'yarn.lock'])

interface OssSyncState {
  upstreamRemote: string
  upstreamLocalPath: string
  baselineCommit: string
  lastSyncedCommit: string
}

interface DiffEntry {
  status: string
  oldPath: string
  newPath: string
}

interface SyncResult {
  added: string[]
  merged: string[]
  deleted: string[]
  skipped: string[]
  conflicts: string[]
  lockfileRegenerated: boolean
}

function loadState(): OssSyncState {
  if (!existsSync(STATE_PATH)) {
    throw new Error(`Missing ${STATE_PATH}. Run from a Fleet app/ tree with oss-sync state.`)
  }
  return JSON.parse(readFileSync(STATE_PATH, 'utf-8')) as OssSyncState
}

function saveState(state: OssSyncState): void {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf-8')
}

function git(
  cwd: string,
  args: string[],
  options: { allowFailure?: boolean } = {},
): { stdout: string; stderr: string; status: number } {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
  })
  const status = result.status ?? 1
  if (status !== 0 && !options.allowFailure) {
    const detail = (result.stderr || result.stdout || '').trim()
    throw new Error(`git ${args.join(' ')} failed in ${cwd}${detail ? `\n${detail}` : ''}`)
  }
  return {
    stdout: (result.stdout ?? '').trimEnd(),
    stderr: (result.stderr ?? '').trimEnd(),
    status,
  }
}

function resolveUpstreamRepo(state: OssSyncState): string {
  const localPath = resolve(APP_ROOT, state.upstreamLocalPath)
  if (existsSync(join(localPath, '.git'))) {
    return localPath
  }
  const tempClone = join(TEMP_DIR, 'upstream-clone')
  if (!existsSync(tempClone)) {
    mkdirSync(dirname(tempClone), { recursive: true })
    git(APP_ROOT, [
      'clone',
      '--filter=blob:none',
      state.upstreamRemote,
      tempClone,
    ])
  }
  return tempClone
}

function resolveCommit(repo: string, ref: string): string {
  const { stdout } = git(repo, ['rev-parse', '--verify', ref])
  return stdout
}

function gitShow(repo: string, commit: string, filePath: string): Buffer | null {
  const result = git(repo, ['show', `${commit}:${filePath}`], { allowFailure: true })
  if (result.status !== 0) {
    return null
  }
  return Buffer.from(result.stdout, 'utf-8')
}

function readLocalFile(appRelativePath: string): Buffer | null {
  const fullPath = join(APP_ROOT, appRelativePath)
  if (!existsSync(fullPath)) {
    return null
  }
  return readFileSync(fullPath)
}

function writeLocalFile(appRelativePath: string, content: Buffer): void {
  const fullPath = join(APP_ROOT, appRelativePath)
  mkdirSync(dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, content)
}

function buffersEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && a.equals(b)
}

function parseDiffNameStatus(output: string): DiffEntry[] {
  if (!output.trim()) {
    return []
  }
  return output
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, ...rest] = line.split('\t')
      if (status.startsWith('R') || status.startsWith('C')) {
        const [oldPath, newPath] = rest
        return { status: status.charAt(0), oldPath, newPath }
      }
      const filePath = rest[0]
      return { status, oldPath: filePath, newPath: filePath }
    })
}

function listUpstreamDiff(repo: string, from: string, to: string): DiffEntry[] {
  const { stdout } = git(repo, ['diff', '--name-status', `${from}..${to}`])
  return parseDiffNameStatus(stdout)
}

function mergeFile(
  repo: string,
  filePath: string,
  baseCommit: string,
  targetCommit: string,
  localPath: string,
): 'merged' | 'conflict' | 'unchanged' | 'deleted-upstream' {
  const base = gitShow(repo, baseCommit, filePath)
  const theirs = gitShow(repo, targetCommit, filePath)
  const ours = readLocalFile(localPath)

  if (!theirs && base) {
    // Upstream deleted the file.
    if (!ours || (base && buffersEqual(ours, base))) {
      const fullPath = join(APP_ROOT, localPath)
      if (existsSync(fullPath)) {
        rmSync(fullPath)
      }
      return 'deleted-upstream'
    }
    return 'conflict'
  }

  if (!theirs) {
    return 'unchanged'
  }

  if (!base) {
    writeLocalFile(localPath, theirs)
    return 'merged'
  }

  if (!ours) {
    writeLocalFile(localPath, theirs)
    return 'merged'
  }

  if (buffersEqual(ours, theirs)) {
    return 'unchanged'
  }

  if (buffersEqual(ours, base)) {
    writeLocalFile(localPath, theirs)
    return 'merged'
  }

  if (buffersEqual(base, theirs)) {
    return 'unchanged'
  }

  mkdirSync(TEMP_DIR, { recursive: true })
  const oursTemp = join(TEMP_DIR, 'ours')
  const baseTemp = join(TEMP_DIR, 'base')
  const theirsTemp = join(TEMP_DIR, 'theirs')
  writeFileSync(oursTemp, ours)
  writeFileSync(baseTemp, base)
  writeFileSync(theirsTemp, theirs)

  const mergeResult = spawnSync('git', ['merge-file', oursTemp, baseTemp, theirsTemp], {
    encoding: 'utf-8',
  })
  const merged = readFileSync(oursTemp)
  writeLocalFile(localPath, merged)
  return mergeResult.status === 0 ? 'merged' : 'conflict'
}

function packageJsonChanged(entries: DiffEntry[]): boolean {
  return entries.some((entry) => {
    const path = entry.newPath
    return path === 'package.json' || path.endsWith('/package.json')
  })
}

function printStatus(state: OssSyncState, repo: string): void {
  const lastSynced = resolveCommit(repo, state.lastSyncedCommit)
  const upstreamHead = resolveCommit(repo, 'HEAD')
  const pending = listUpstreamDiff(repo, lastSynced, upstreamHead)
  console.log('OSS sync state')
  console.log(`  app root:          ${APP_ROOT}`)
  console.log(`  upstream repo:     ${repo}`)
  console.log(`  baseline:          ${state.baselineCommit}`)
  console.log(`  last synced:       ${lastSynced}`)
  console.log(`  upstream HEAD:     ${upstreamHead}`)
  console.log(`  pending changes:   ${pending.length} file(s)`)
  if (pending.length > 0) {
    console.log('  next sync would apply:')
    for (const entry of pending.slice(0, 12)) {
      console.log(`    ${entry.status}\t${entry.newPath}`)
    }
    if (pending.length > 12) {
      console.log(`    ... and ${pending.length - 12} more`)
    }
  } else {
    console.log('  status:            up to date')
  }
}

function runBunInstall(): void {
  console.log('Regenerating bun.lock via bun install...')
  const result = spawnSync('bun', ['install'], {
    cwd: APP_ROOT,
    encoding: 'utf-8',
    stdio: 'inherit',
  })
  if ((result.status ?? 1) !== 0) {
    throw new Error('bun install failed after oss sync')
  }
}

interface ReviewFinding {
  severity: 'high' | 'medium' | 'low'
  category: string
  file: string
  detail: string
}

const REVIEW_PATTERNS: Array<{
  category: string
  severity: ReviewFinding['severity']
  pattern: RegExp
  detail: string
}> = [
  {
    category: 'protocol',
    severity: 'high',
    pattern: /^packages\/shared\/src\/protocol\//,
    detail: 'Shared protocol change — verify Fleet contracts and RPC handlers still align',
  },
  {
    category: 'session',
    severity: 'high',
    pattern: /SessionManager\.ts$/,
    detail: 'SessionManager change — verify Fleet team/CLI/memory hooks still compile and behave',
  },
  {
    category: 'renderer',
    severity: 'medium',
    pattern: /^apps\/electron\/src\/renderer\//,
    detail: 'Renderer change — may conflict with Fleet UI; check AppShell/SessionList/input',
  },
  {
    category: 'sdk-migration',
    severity: 'medium',
    pattern: /@mariozechner\/|@earendil-works\//,
    detail: 'Pi SDK import scope change — run typecheck:all after sync',
  },
  {
    category: 'rpc-channel',
    severity: 'high',
    pattern: /RPC_CHANNELS|channels\.ts/,
    detail: 'RPC channel change — Lead must reconcile Fleet-only channels',
  },
  {
    category: 'event-semantics',
    severity: 'medium',
    pattern: /willRetry|agent_end|SessionEvent/,
    detail: 'Event semantics may have changed — verify event-adapter and timeline',
  },
  {
    category: 'auto-update',
    severity: 'low',
    pattern: /auto-update|electron-updater|electron-builder/,
    detail: 'Auto-update/publish config — Fleet publish URL still points at craft unless changed',
  },
  {
    category: 'i18n',
    severity: 'medium',
    pattern: /^packages\/shared\/src\/i18n\/locales\//,
    detail: 'Locale keys changed — run lint:i18n:parity after sync',
  },
]

function reviewUpstreamChanges(
  repo: string,
  from: string,
  to: string,
): ReviewFinding[] {
  const entries = listUpstreamDiff(repo, from, to)
  const findings: ReviewFinding[] = []
  const seen = new Set<string>()

  for (const entry of entries) {
    const filePath = entry.newPath
    for (const rule of REVIEW_PATTERNS) {
      if (!rule.pattern.test(filePath)) continue
      const key = `${rule.category}:${filePath}`
      if (seen.has(key)) continue
      seen.add(key)
      findings.push({
        severity: rule.severity,
        category: rule.category,
        file: filePath,
        detail: rule.detail,
      })
    }

    const diff = git(repo, ['diff', `${from}..${to}`, '--', filePath], {
      allowFailure: true,
    }).stdout
    for (const rule of REVIEW_PATTERNS) {
      if (!rule.pattern.test(diff)) continue
      const key = `${rule.category}:${filePath}:body`
      if (seen.has(key)) continue
      seen.add(key)
      if (!findings.some((f) => f.file === filePath && f.category === rule.category)) {
        findings.push({
          severity: rule.severity,
          category: rule.category,
          file: filePath,
          detail: `${rule.detail} (matched in diff body)`,
        })
      }
    }
  }

  const order: Record<ReviewFinding['severity'], number> = {
    high: 0,
    medium: 1,
    low: 2,
  }
  return findings.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.file.localeCompare(b.file),
  )
}

function printReview(findings: ReviewFinding[], from: string, to: string): void {
  console.log(`OSS sync semantic review (${from.slice(0, 12)}..${to.slice(0, 12)})`)
  if (findings.length === 0) {
    console.log('  No high-signal semantic risks detected by heuristics.')
    console.log('  Still run typecheck:all and targeted tests after merging.')
    return
  }
  for (const finding of findings) {
    console.log(`  [${finding.severity.toUpperCase()}] ${finding.category}`)
    console.log(`    file:   ${finding.file}`)
    console.log(`    note:   ${finding.detail}`)
  }
  console.log('')
  console.log('Post-sync checklist:')
  console.log('  1. ./scripts/craft.sh run typecheck:all')
  console.log('  2. Re-run Fleet-specific tests (team/memory/cli-runtime/internal-action)')
  console.log('  3. Manual smoke: Electron UI, CLI runtime, terminal PTY if touched')
  console.log('  4. Resolve conflicts with --finalize after manual merge')
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const shouldFetch = args.includes('--fetch')
  const statusOnly = args.includes('--status')
  const reviewOnly = args.includes('--review')
  const finalizeOnly = args.includes('--finalize')
  const targetArgIndex = args.indexOf('--target')
  const targetRef =
    targetArgIndex >= 0 ? args[targetArgIndex + 1] : undefined

  const state = loadState()
  const repo = resolveUpstreamRepo(state)

  if (shouldFetch) {
    console.log(`Fetching ${state.upstreamRemote}...`)
    git(repo, ['fetch', 'origin'])
  }

  if (statusOnly) {
    printStatus(state, repo)
    return
  }

  const lastSynced = resolveCommit(repo, state.lastSyncedCommit)
  const targetCommit = resolveCommit(repo, targetRef ?? 'HEAD')

  if (reviewOnly) {
    printReview(reviewUpstreamChanges(repo, lastSynced, targetCommit), lastSynced, targetCommit)
    return
  }

  if (finalizeOnly) {
    if (!dryRun) {
      state.lastSyncedCommit = targetCommit
      saveState(state)
    }
    console.log(`Finalized sync state at ${targetCommit}`)
    printStatus(state, repo)
    return
  }

  if (lastSynced === targetCommit) {
    console.log(`Already synced to ${targetCommit}`)
    printStatus(state, repo)
    return
  }

  const entries = listUpstreamDiff(repo, lastSynced, targetCommit)
  if (entries.length === 0) {
    console.log(`No file changes between ${lastSynced} and ${targetCommit}`)
    if (!dryRun) {
      state.lastSyncedCommit = targetCommit
      saveState(state)
    }
    return
  }

  console.log(
    `OSS sync ${lastSynced.slice(0, 12)} -> ${targetCommit.slice(0, 12)} (${entries.length} files)`,
  )
  if (dryRun) {
    for (const entry of entries) {
      console.log(`  ${entry.status}\t${entry.newPath}`)
    }
    return
  }

  const result: SyncResult = {
    added: [],
    merged: [],
    deleted: [],
    skipped: [],
    conflicts: [],
    lockfileRegenerated: false,
  }

  const lockfilePaths = new Set<string>()
  const deferredEntries: DiffEntry[] = []

  for (const entry of entries) {
    if (entry.status === 'D') {
      const mergeOutcome = mergeFile(repo, entry.oldPath, lastSynced, targetCommit, entry.oldPath)
      if (mergeOutcome === 'deleted-upstream') {
        result.deleted.push(entry.oldPath)
      } else if (mergeOutcome === 'conflict') {
        result.conflicts.push(entry.oldPath)
      } else {
        result.skipped.push(entry.oldPath)
      }
      continue
    }

    if (entry.status === 'R' || entry.status === 'C') {
      const oldOutcome = mergeFile(repo, entry.oldPath, lastSynced, targetCommit, entry.oldPath)
      if (oldOutcome === 'deleted-upstream') {
        result.deleted.push(entry.oldPath)
      }
      deferredEntries.push({ status: 'A', oldPath: entry.newPath, newPath: entry.newPath })
      continue
    }

    if (REGENERATE_LOCKFILES.has(entry.newPath)) {
      lockfilePaths.add(entry.newPath)
      continue
    }

    deferredEntries.push(entry)
  }

  for (const entry of deferredEntries) {
    const filePath = entry.newPath
    const mergeOutcome = mergeFile(repo, filePath, lastSynced, targetCommit, filePath)
    switch (mergeOutcome) {
      case 'merged':
        if (entry.status === 'A') {
          result.added.push(filePath)
        } else {
          result.merged.push(filePath)
        }
        break
      case 'deleted-upstream':
        result.deleted.push(filePath)
        break
      case 'conflict':
        result.conflicts.push(filePath)
        break
      case 'unchanged':
        result.skipped.push(filePath)
        break
      default: {
        const _exhaustive: never = mergeOutcome
        throw new Error(`Unhandled merge outcome: ${_exhaustive}`)
      }
    }
  }

  const needsLockfileRegen =
    lockfilePaths.size > 0 || packageJsonChanged(entries)
  if (needsLockfileRegen) {
    runBunInstall()
    result.lockfileRegenerated = true
    for (const lockPath of lockfilePaths) {
      result.merged.push(lockPath)
    }
  }

  if (!dryRun && result.conflicts.length === 0) {
    state.lastSyncedCommit = targetCommit
    saveState(state)
  }

  rmSync(TEMP_DIR, { recursive: true, force: true })

  console.log('')
  console.log('OSS sync summary')
  console.log(`  added:               ${result.added.length}`)
  console.log(`  merged:              ${result.merged.length}`)
  console.log(`  deleted:             ${result.deleted.length}`)
  console.log(`  unchanged/skipped:   ${result.skipped.length}`)
  console.log(`  lockfile regenerated:${result.lockfileRegenerated ? ' yes' : ' no'}`)
  console.log(`  conflicts:           ${result.conflicts.length}`)

  if (result.conflicts.length > 0) {
    console.error('\nConflicted files (resolve manually, then re-run oss:sync):')
    for (const file of result.conflicts) {
      console.error(`  - ${file}`)
    }
    process.exit(1)
  }

  console.log(`\nSynced to ${targetCommit}`)
  printReview(reviewUpstreamChanges(repo, lastSynced, targetCommit), lastSynced, targetCommit)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`oss-sync failed: ${message}`)
  process.exit(1)
})
