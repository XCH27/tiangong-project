import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildProjectEnvironmentProfile,
  recommendCommands,
  findGitRoot,
} from './system-tools-project'

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'systools-proj-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

describe('findGitRoot', () => {
  it('returns dir when .git present', () => {
    mkdirSync(join(dir, '.git'))
    const sub = join(dir, 'src', 'a')
    mkdirSync(sub, { recursive: true })
    expect(findGitRoot(sub)).toBe(dir)
  })

  it('returns undefined when no .git upward', () => {
    expect(findGitRoot(dir)).toBeUndefined()
  })
})

describe('buildProjectEnvironmentProfile', () => {
  it('detects single lockfile + recommends pnpm', () => {
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '')
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: { build: 'tsc', test: 'bun test' } }))
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.lockfiles).toEqual(['pnpm-lock.yaml'])
    expect(p.recommendedPackageManager).toBe('pnpm')
    expect(p.packageScripts).toEqual(['build', 'test'])
  })

  it('flags lockfile conflict when multiple lockfiles', () => {
    writeFileSync(join(dir, 'package-lock.json'), '')
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '')
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.lockfiles.length).toBe(2)
    expect(p.diagnostics.some((d) => d.code === 'lockfile-conflict')).toBe(true)
  })

  it('records git root when .git present', () => {
    mkdirSync(join(dir, '.git'))
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.gitRoot).toBe(dir)
  })

  it('adds info diagnostic when not a git repo', () => {
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.diagnostics.some((d) => d.code === 'not-a-git-repo')).toBe(true)
  })

  it('records python envs without reading secrets', () => {
    mkdirSync(join(dir, '.venv'))
    writeFileSync(join(dir, 'pyproject.toml'), '[project]')
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.pythonEnvs).toEqual(['.venv'])
    expect(p.diagnostics.some((d) => d.code === 'python-project-env')).toBe(true)
  })

  it('records env file candidate paths only (no content)', () => {
    writeFileSync(join(dir, '.env'), 'SECRET=xxx')
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.envFileCandidates).toEqual(['.env'])
    // 诊断只记路径存在，不读内容
    expect(p.diagnostics.some((d) => d.code === 'env-files-present')).toBe(true)
  })

  it('warns no-lockfile when package.json present without lockfile', () => {
    writeFileSync(join(dir, 'package.json'), '{}')
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.lockfiles).toEqual([])
    expect(p.diagnostics.some((d) => d.code === 'no-lockfile')).toBe(true)
  })

  it('lastCheckedAt is set', () => {
    const p = buildProjectEnvironmentProfile(dir)
    expect(p.lastCheckedAt).toBeGreaterThan(0)
  })

  it('carries workspaceId', () => {
    const p = buildProjectEnvironmentProfile(dir, { workspaceId: 'ws-1' })
    expect(p.workspaceId).toBe('ws-1')
  })

  it('returns an error profile for missing roots', () => {
    const p = buildProjectEnvironmentProfile(join(dir, 'missing'))
    expect(p.lockfiles).toEqual([])
    expect(p.diagnostics.some((d) => d.code === 'project-root-not-found')).toBe(true)
  })

  it('returns an error profile when root is a file', () => {
    const file = join(dir, 'not-a-dir.txt')
    writeFileSync(file, 'not a directory')
    const p = buildProjectEnvironmentProfile(file)
    expect(p.packageScripts).toEqual([])
    expect(p.diagnostics.some((d) => d.code === 'project-root-not-directory')).toBe(true)
  })
})

describe('recommendCommands', () => {
  it('recommends install + known scripts for pnpm', () => {
    const p = buildProjectEnvironmentProfile(dir)
    p.recommendedPackageManager = 'pnpm'
    p.packageScripts = ['build', 'test', 'typecheck', 'lint', 'dev']
    const cmds = recommendCommands(p)
    expect(cmds).toContain('pnpm install')
    expect(cmds).toContain('pnpm run build')
    expect(cmds).toContain('pnpm run test')
    expect(cmds).toContain('pnpm run typecheck')
    expect(cmds).toContain('pnpm run lint')
    expect(cmds.some((c) => c.includes('dev'))).toBe(false) // dev 不在推荐里
  })

  it('recommends python venv activation when venv present', () => {
    const p = buildProjectEnvironmentProfile(dir)
    p.pythonEnvs = ['.venv']
    const cmds = recommendCommands(p)
    expect(cmds.some((c) => c.includes('.venv') && c.includes('activate'))).toBe(true)
  })
})
