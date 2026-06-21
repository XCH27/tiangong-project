import { describe, expect, it } from 'bun:test'
import type { SpawnSyncReturns } from 'node:child_process'
import { SystemToolsRegistry } from './system-tools-registry'
import { buildCompressionStats } from './context-adapter-compression-stats'
import { compressCommandOutputFallback, compressWithRtkAdapter } from './context-adapter-rtk'
import { queryWithCodegraphAdapter, queryCodegraphFallback } from './context-adapter-codegraph'
import { resolveContextAdapterTool } from './context-adapter-registry'
import type { SpawnAdapter } from './system-tools-detector'

function mockSpawn(responses: Record<string, { stdout?: string; stderr?: string; status?: number }>): SpawnAdapter {
  return {
    exec(command, args) {
      const key = `${command} ${args.join(' ')}`
      const hit = responses[key] ?? responses[command]
      return {
        stdout: hit?.stdout ?? '',
        stderr: hit?.stderr ?? '',
        status: hit?.status ?? (hit ? 0 : 127),
        signal: null,
        output: [null, hit?.stdout ?? '', hit?.stderr ?? ''],
        pid: 1,
      } as SpawnSyncReturns<string>
    },
  }
}

describe('context adapter compression stats', () => {
  it('computes before/after char and token savings', () => {
    const stats = buildCompressionStats('a'.repeat(400), 'a'.repeat(100))
    expect(stats.beforeChars).toBe(400)
    expect(stats.afterChars).toBe(100)
    expect(stats.savedChars).toBe(300)
    expect(stats.savedCharPercent).toBe(75)
    expect(stats.beforeTokens).toBe(100)
    expect(stats.afterTokens).toBe(25)
    expect(stats.savedTokens).toBe(75)
    expect(stats.savedTokenPercent).toBe(75)
    expect(stats.tokenEstimateKind).toBe('estimate')
  })
})

describe('context adapter registry', () => {
  it('resolves rtk path via System Tools instead of direct which', async () => {
    const spawn = mockSpawn({
      'which -a rtk': { stdout: '/opt/homebrew/bin/rtk\n' },
      '/opt/homebrew/bin/rtk --version': { stdout: 'rtk 1.2.3\n' },
    })
    const registry = new SystemToolsRegistry({ spawn, initialPath: '/usr/bin' })
    const availability = await resolveContextAdapterTool(registry, 'rtk', true)
    expect(availability.available).toBe(true)
    if (availability.available) {
      expect(availability.path).toBe('/opt/homebrew/bin/rtk')
    }
  })

  it('reports missing codegraph without direct path probing outside registry', async () => {
    const spawn = mockSpawn({})
    const registry = new SystemToolsRegistry({ spawn, initialPath: '/usr/bin' })
    const availability = await resolveContextAdapterTool(registry, 'codegraph', true)
    expect(availability.available).toBe(false)
    if (!availability.available) {
      expect(availability.reason).toContain('未安装')
    }
  })
})

describe('context adapter rtk', () => {
  it('uses sidecar output when System Tools resolves rtk', async () => {
    const spawn = mockSpawn({
      'which -a rtk': { stdout: '/usr/local/bin/rtk\n' },
      '/usr/local/bin/rtk --version': { stdout: 'rtk 1.0.0\n' },
    })
    const registry = new SystemToolsRegistry({ spawn })
    const input = ['line', 'line', 'line', '', '', 'unique'].join('\n')
    const result = await compressWithRtkAdapter(
      {
        registry,
        runSidecar: (_exe, text) => ({ ok: true, output: text.replace(/line\n/g, 'line\n').slice(0, 12) }),
      },
      { input },
    )

    expect(result.applied).toBe(true)
    expect(result.stats.savedChars).toBeGreaterThan(0)
    expect(result.stats.savedTokenPercent).toBeGreaterThanOrEqual(0)
  })

  it('falls back when rtk is missing', async () => {
    const registry = new SystemToolsRegistry({ spawn: mockSpawn({}) })
    const input = `${'x'.repeat(300)}\n${'x'.repeat(300)}\n`
    const result = await compressWithRtkAdapter({ registry }, { input })
    expect(result.applied).toBe(false)
    expect(result.output).toBe(compressCommandOutputFallback(input))
    expect(result.stats.beforeChars).toBeGreaterThan(result.stats.afterChars)
  })
})

describe('context adapter codegraph', () => {
  it('returns structured fallback matches with savings stats', async () => {
    const { mkdtemp, mkdir, writeFile, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'codegraph-adapter-'))
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'src', 'index.ts'), 'export function findUser() { return 1 }\n')

    const registry = new SystemToolsRegistry({ spawn: mockSpawn({}) })
    const result = await queryWithCodegraphAdapter({ registry }, { rootPath: root, query: 'findUser' })
    expect(result.applied).toBe(false)
    expect(result.structuredOutput).toContain('findUser')
    expect(result.stats.savedChars).toBeGreaterThanOrEqual(0)

    await rm(root, { recursive: true, force: true })
  })

  it('uses codegraph sidecar when resolved via System Tools', async () => {
    const spawn = mockSpawn({
      'which -a codegraph': { stdout: '/usr/local/bin/codegraph\n' },
      '/usr/local/bin/codegraph --version': { stdout: 'codegraph 1.0.0\n' },
      '/usr/local/bin/codegraph query findUser --json --limit 20': {
        stdout: '{"matches":[{"symbol":"findUser"}]}',
      },
    })
    const registry = new SystemToolsRegistry({ spawn })
    const result = await queryWithCodegraphAdapter(
      { registry, spawn },
      { rootPath: '/tmp/project', query: 'findUser' },
    )
    expect(result.applied).toBe(true)
    expect(result.structuredOutput).toContain('findUser')
  })

  it('fallback helper returns empty match note', async () => {
    const { mkdtemp, rm } = await import('node:fs/promises')
    const { tmpdir } = await import('node:os')
    const { join } = await import('node:path')
    const root = await mkdtemp(join(tmpdir(), 'codegraph-empty-'))
    const output = await queryCodegraphFallback({ rootPath: root, query: 'missing' })
    expect(output).toContain('"matches": []')
    await rm(root, { recursive: true, force: true })
  })
})
