#!/usr/bin/env bun
/**
 * Fleet 一键自动化验证（Lead 门禁）。
 *
 * 覆盖当前主线可机器验收项：类型、i18n、核心单测、oss-sync 状态、Internal Action 注册表。
 * 不替代 A2 视觉验收、A3 真实 CLI smoke、Phase C/D 创作面（见 docs/32 §8.4）。
 *
 * Usage:
 *   bun run validate:fleet
 *   bun run validate:fleet -- --skip-slow
 *   bun run validate:fleet -- --with-electron-lint
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createAllInternalActions } from '../packages/server-core/src/services/internal-action-registry'
import { getFleetElectronUpdateUrl, isFleetOwnedUpdateUrl } from '../packages/shared/src/fleet-publish'

const APP_ROOT = resolve(import.meta.dir, '..')
const args = new Set(process.argv.slice(2))
const skipSlow = args.has('--skip-slow')
const withElectronLint = args.has('--with-electron-lint')

interface StepResult {
  name: string
  ok: boolean
  detail?: string
}

function run(name: string, cmd: string[], cwd = APP_ROOT): StepResult {
  const started = Date.now()
  const result = spawnSync(cmd[0], cmd.slice(1), {
    cwd,
    encoding: 'utf-8',
    env: process.env,
  })
  const ms = Date.now() - started
  if (result.status === 0) {
    return { name, ok: true, detail: `${ms}ms` }
  }
  const stderr = (result.stderr || result.stdout || '').trim()
  const tail = stderr.split('\n').slice(-8).join('\n')
  return { name, ok: false, detail: tail || `exit ${result.status}` }
}

function checkOssSyncState(): StepResult {
  const statePath = join(APP_ROOT, '.oss-sync-state.json')
  if (!existsSync(statePath)) {
    return { name: 'oss-sync state file', ok: false, detail: 'missing .oss-sync-state.json' }
  }
  try {
    const state = JSON.parse(readFileSync(statePath, 'utf-8')) as { lastSyncedCommit?: string }
    if (!state.lastSyncedCommit?.trim()) {
      return { name: 'oss-sync state file', ok: false, detail: 'lastSyncedCommit empty' }
    }
    return { name: 'oss-sync state file', ok: true, detail: `lastSynced=${state.lastSyncedCommit.slice(0, 8)}` }
  } catch (error) {
    return {
      name: 'oss-sync state file',
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

function checkInternalActionRegistry(): StepResult {
  const actions = createAllInternalActions()
  const ids = actions.map(a => a.id)
  const required = [
    'files.inspect_workspace',
    'session.set_progress',
    'memory.list_entries',
    'team.get_projection',
  ]
  const missing = required.filter(id => !ids.includes(id))
  if (missing.length > 0) {
    return { name: 'internal-action registry', ok: false, detail: `missing: ${missing.join(', ')}` }
  }
  return { name: 'internal-action registry', ok: true, detail: `${ids.length} actions registered` }
}

function checkFleetPublishConfig(): StepResult {
  const url = getFleetElectronUpdateUrl()
  const builderYml = join(APP_ROOT, 'apps/electron/electron-builder.yml')
  if (!existsSync(builderYml)) {
    return { name: 'fleet publish config', ok: false, detail: 'electron-builder.yml missing' }
  }
  const yml = readFileSync(builderYml, 'utf-8')
  const hasPublishBlock = /publish:\s*\n\s*provider:\s*generic/.test(yml)
  if (!hasPublishBlock) {
    return { name: 'fleet publish config', ok: false, detail: 'publish block missing in electron-builder.yml' }
  }
  const owned = isFleetOwnedUpdateUrl(url)
  return {
    name: 'fleet publish config',
    ok: true,
    detail: owned
      ? `FLEET_ELECTRON_UPDATE_URL=${url}`
      : `default craft URL (set FLEET_ELECTRON_UPDATE_URL for Fleet releases)`,
  }
}

const SPINE_TESTS = [
  'packages/server-core/src/services/internal-action-registry.test.ts',
  'packages/server-core/src/services/internal-action-executor.test.ts',
  'packages/server-core/src/services/external-job-service.test.ts',
  'packages/server-core/src/services/memory-store.test.ts',
  'packages/shared/src/protocol/__tests__/progress.test.ts',
  'packages/session-tools-core/src/handlers/internal-action.test.ts',
  'packages/session-tools-core/src/handlers/team.test.ts',
]

async function main(): Promise<void> {
  console.log('Fleet validate:fleet — automated gate\n')

  const results: StepResult[] = []

  results.push(run('typecheck:all', ['bun', 'run', 'typecheck:all']))
  results.push(run('lint:i18n:parity', ['bun', 'run', 'lint:i18n:parity']))
  results.push(run('lint:i18n:sorted', ['bun', 'run', 'lint:i18n:sorted']))

  if (!skipSlow) {
    results.push(run('test:shared:all', ['bun', 'run', 'test:shared:all']))
    results.push(run('spine unit tests', ['bun', 'test', ...SPINE_TESTS]))
    if (withElectronLint) {
      results.push(run('lint:electron', ['bun', 'run', 'lint:electron']))
    }
  } else {
    results.push({ name: 'test:shared:all', ok: true, detail: 'skipped (--skip-slow)' })
    results.push({ name: 'spine unit tests', ok: true, detail: 'skipped (--skip-slow)' })
  }

  results.push(checkOssSyncState())
  results.push(checkInternalActionRegistry())
  results.push(checkFleetPublishConfig())

  const failed = results.filter(r => !r.ok)
  for (const r of results) {
    const mark = r.ok ? '✓' : '✗'
    console.log(`${mark} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`)
  }

  console.log('')
  if (failed.length === 0) {
    console.log('validate:fleet PASSED')
    console.log('')
    console.log('仍须人工/环境验收（不可自动化）：')
    console.log('  · A2 Electron 视觉清单（docs/32 §8.2）')
    console.log('  · A3 真实 CLI smoke（Codex/Claude one-shot）')
    console.log('  · Phase C/D：S2/S13/S9/S11（许可证 + 大功能）')
    process.exit(0)
  }

  console.error(`validate:fleet FAILED (${failed.length}/${results.length})`)
  process.exit(1)
}

void main()
