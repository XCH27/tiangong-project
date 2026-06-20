import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  diagnoseLockfiles,
  diagnosePythonEnv,
  collectToolDiagnostics,
  diagnoseExecutableBit,
  diagnosePathMismatch,
  lockfileToPackageManager,
  KNOWN_LOCKFILES,
} from './system-tools-diagnostics'
import type { ToolCapability } from '@craft-agent/shared/protocol'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'systools-diag-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('diagnoseLockfiles', () => {
  it('returns empty when no lockfiles', () => {
    const r = diagnoseLockfiles(dir)
    expect(r.found).toEqual([])
    expect(r.diagnostics).toEqual([])
  })

  it('returns found without warning when single lockfile', () => {
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '')
    const r = diagnoseLockfiles(dir)
    expect(r.found).toEqual(['pnpm-lock.yaml'])
    expect(r.diagnostics).toEqual([])
  })

  it('warns on multiple lockfiles', () => {
    writeFileSync(join(dir, 'package-lock.json'), '')
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '')
    const r = diagnoseLockfiles(dir)
    expect(r.found.length).toBe(2)
    expect(r.diagnostics.some((d) => d.code === 'lockfile-conflict')).toBe(true)
  })
})

describe('diagnosePythonEnv', () => {
  it('returns empty when no python markers', () => {
    const r = diagnosePythonEnv(dir)
    expect(r.envs).toEqual([])
    expect(r.diagnostics).toEqual([])
  })

  it('info when venv + project marker present', () => {
    mkdirSync(join(dir, '.venv'))
    writeFileSync(join(dir, 'pyproject.toml'), '[project]')
    const r = diagnosePythonEnv(dir)
    expect(r.envs).toEqual(['.venv'])
    expect(r.diagnostics.some((d) => d.code === 'python-project-env')).toBe(true)
  })

  it('warns on multiple venvs', () => {
    mkdirSync(join(dir, '.venv'))
    mkdirSync(join(dir, 'venv'))
    writeFileSync(join(dir, 'pyproject.toml'), '')
    const r = diagnosePythonEnv(dir)
    expect(r.envs.length).toBe(2)
    expect(r.diagnostics.some((d) => d.code === 'python-multi-env')).toBe(true)
  })
})

describe('collectToolDiagnostics', () => {
  it('aggregates diagnostics with tool name prefix', () => {
    const tools: ToolCapability[] = [
      {
        toolId: 'node',
        category: 'runtime',
        displayName: 'Node.js',
        status: 'broken',
        source: 'system-path',
        scope: 'global',
        capabilities: [],
        risk: 'local-exec',
        diagnostics: [{ level: 'error', code: 'version-verify-failed', message: 'failed' }],
      },
    ]
    const out = collectToolDiagnostics(tools)
    expect(out.length).toBe(1)
    expect(out[0]!.message).toContain('[Node.js]')
    expect(out[0]!.message).toContain('failed')
  })
})

describe('diagnoseExecutableBit', () => {
  it('returns path-not-found for missing path', () => {
    const d = diagnoseExecutableBit(join(dir, 'nope'))
    expect(d?.code).toBe('path-not-found')
  })

  it('returns not-executable for a directory', () => {
    const d = diagnoseExecutableBit(dir)
    expect(d?.code).toBe('not-executable')
  })

  it('returns null for an executable file on unix', () => {
    const f = join(dir, 'tool')
    writeFileSync(f, '#!/bin/sh\n')
    chmodSync(f, 0o755)
    const d = diagnoseExecutableBit(f)
    // win32 没有可执行位概念，跳过 null 断言
    if (process.platform !== 'win32') {
      expect(d).toBeNull()
    }
  })

  it('returns permission-missing for non-executable file on unix', () => {
    const f = join(dir, 'tool2')
    writeFileSync(f, 'x')
    chmodSync(f, 0o644)
    const d = diagnoseExecutableBit(f)
    if (process.platform !== 'win32') {
      expect(d?.code).toBe('permission-missing')
    }
  })
})

describe('diagnosePathMismatch', () => {
  it('returns null when login shell path null', () => {
    expect(diagnosePathMismatch('/usr/bin', null)).toBeNull()
  })

  it('returns null when no missing dirs', () => {
    expect(diagnosePathMismatch('/usr/bin:/opt/bin', '/usr/bin:/opt/bin')).toBeNull()
  })

  it('returns warning when shell has dirs missing from app path', () => {
    const d = diagnosePathMismatch('/usr/bin', '/usr/bin:/opt/homebrew/bin')
    expect(d?.code).toBe('path-mismatch')
    expect(d?.message).toContain('homebrew')
  })
})

describe('lockfileToPackageManager', () => {
  it('maps known lockfiles', () => {
    expect(lockfileToPackageManager('pnpm-lock.yaml')).toBe('pnpm')
    expect(lockfileToPackageManager('package-lock.json')).toBe('npm')
    expect(lockfileToPackageManager('bun.lock')).toBe('bun')
    expect(lockfileToPackageManager('yarn.lock')).toBe('yarn')
  })

  it('returns undefined for unknown', () => {
    expect(lockfileToPackageManager('foo.txt')).toBeUndefined()
  })
})

describe('KNOWN_LOCKFILES', () => {
  it('includes the four canonical lockfiles', () => {
    expect(KNOWN_LOCKFILES).toContain('package-lock.json')
    expect(KNOWN_LOCKFILES).toContain('pnpm-lock.yaml')
    expect(KNOWN_LOCKFILES).toContain('yarn.lock')
    expect(KNOWN_LOCKFILES).toContain('bun.lock')
  })
})
