import { describe, expect, it } from 'bun:test'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scanTextForSecrets } from './project-pack-secret-scan'
import { estimateTokensFromText, isEnvFile, isBinaryPath, resolveScopeRoot } from './project-pack-ignore'
import { ProjectPackService, getProjectPackDataDir } from './project-pack-service'

describe('project-pack-secret-scan', () => {
  it('detects high-severity patterns', () => {
    const findings = scanTextForSecrets('config.ts', 'const key = "sk-abcdefghijklmnopqrstuvwxyz123456"')
    expect(findings.some((f) => f.ruleId === 'openai-key' && f.severity === 'high')).toBe(true)
  })

  it('detects private key blocks', () => {
    const findings = scanTextForSecrets('key.pem', '-----BEGIN RSA PRIVATE KEY-----')
    expect(findings.some((f) => f.ruleId === 'private-key')).toBe(true)
  })

  it('ignores placeholder env values', () => {
    const findings = scanTextForSecrets('.env.example', 'API_KEY=your-key')
    expect(findings.filter((f) => f.ruleId === 'env-secret')).toHaveLength(0)
  })

  it('flags real-looking env secrets', () => {
    const findings = scanTextForSecrets('.env.example', 'API_SECRET=supersecretvalue123456')
    expect(findings.some((f) => f.ruleId === 'env-secret')).toBe(true)
  })
})

describe('project-pack-ignore helpers', () => {
  it('classifies env and binary paths', () => {
    expect(isEnvFile('.env.local')).toBe(true)
    expect(isBinaryPath('assets/logo.png')).toBe(true)
  })

  it('estimates tokens from text length', () => {
    expect(estimateTokensFromText('abcd')).toBe(1)
    expect(estimateTokensFromText('a'.repeat(100))).toBe(25)
  })

  it('keeps directory scopes inside the project root', () => {
    const root = '/tmp/fleet-project-pack-root'
    expect(resolveScopeRoot(root, 'src')).toBe('/tmp/fleet-project-pack-root/src')
    expect(resolveScopeRoot(root, '/tmp/fleet-project-pack-root/src')).toBe('/tmp/fleet-project-pack-root/src')
    expect(() => resolveScopeRoot(root, '../outside')).toThrow('inside rootPath')
    expect(() => resolveScopeRoot(root, '/tmp/outside')).toThrow('inside rootPath')
  })
})

describe('ProjectPackService', () => {
  it('packs a small directory with markdown output and summary', async () => {
    const root = await mkdtemp(join(tmpdir(), 'project-pack-'))
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'README.md'), '# Hello\n')
    await writeFile(join(root, 'src', 'index.ts'), 'export const x = 1\n')

    const service = new ProjectPackService()
    const result = await service.pack({ rootPath: root, scope: 'directory' })

    expect(result.summary.fileCount).toBe(2)
    expect(result.summary.tokenEstimateKind).toBe('estimate')
    expect(result.summary.estimatedTokens).toBeGreaterThan(0)
    expect(result.summary.bundlePath.endsWith('.md')).toBe(true)
    expect(result.markdownPreview).toContain('# Project Pack')

    const markdown = await readFile(result.summary.bundlePath, 'utf-8')
    expect(markdown).toContain('src/index.ts')
    expect(markdown).toContain('export const x = 1')

    await rm(root, { recursive: true, force: true })
  })

  it('excludes env files and binary extensions', async () => {
    const root = await mkdtemp(join(tmpdir(), 'project-pack-'))
    await writeFile(join(root, '.env'), 'API_SECRET=supersecretvalue123456\n')
    await writeFile(join(root, 'photo.png'), Buffer.from([0, 1, 2, 3]))

    const service = new ProjectPackService()
    const result = await service.pack({ rootPath: root, scope: 'directory' })

    expect(result.summary.fileCount).toBe(0)
    expect(result.summary.excluded.some((e) => e.reason === 'env_file')).toBe(true)
    expect(result.summary.excluded.some((e) => e.reason === 'binary')).toBe(true)
    expect(result.summary.secretScan.findingCount).toBe(0)

    await rm(root, { recursive: true, force: true })
  })

  it('respects maxFiles limit', async () => {
    const root = await mkdtemp(join(tmpdir(), 'project-pack-'))
    for (let i = 0; i < 5; i++) {
      await writeFile(join(root, `file-${i}.txt`), `content ${i}\n`)
    }

    const service = new ProjectPackService()
    const result = await service.pack({ rootPath: root, scope: 'directory', maxFiles: 2 })

    expect(result.summary.fileCount).toBe(2)
    expect(result.summary.excluded.some((e) => e.reason === 'max_files')).toBe(true)

    await rm(root, { recursive: true, force: true })
  })

  it('stores bundles under Fleet data directory', async () => {
    const root = await mkdtemp(join(tmpdir(), 'project-pack-'))
    await writeFile(join(root, 'a.txt'), 'hello\n')

    const service = new ProjectPackService()
    const result = await service.pack({ rootPath: root, scope: 'directory' })

    expect(result.summary.bundlePath.startsWith(getProjectPackDataDir())).toBe(true)
    const loaded = await service.getSummary(result.summary.bundleId)
    expect(loaded?.bundleId).toBe(result.summary.bundleId)

    await rm(root, { recursive: true, force: true })
  })

  it('rejects directory scopes outside the project root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'project-pack-'))
    const outside = await mkdtemp(join(tmpdir(), 'project-pack-outside-'))
    await writeFile(join(root, 'a.txt'), 'inside\n')
    await writeFile(join(outside, 'secret.txt'), 'outside\n')

    const service = new ProjectPackService()

    await expect(service.pack({ rootPath: root, scope: 'directory', relativePath: '../outside' }))
      .rejects.toThrow('inside rootPath')
    await expect(service.pack({ rootPath: root, scope: 'directory', relativePath: outside }))
      .rejects.toThrow('inside rootPath')

    await rm(root, { recursive: true, force: true })
    await rm(outside, { recursive: true, force: true })
  })
})
