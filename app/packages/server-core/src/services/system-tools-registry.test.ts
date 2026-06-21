import { describe, it, expect } from 'bun:test'
import type { SpawnSyncReturns } from 'node:child_process'
import { SystemToolsRegistry } from './system-tools-registry'
import type { SpawnAdapter } from './system-tools-detector'

function makeResult(r: { stdout?: string; stderr?: string; status?: number; error?: Error }): SpawnSyncReturns<string> {
  return {
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
    status: r.status ?? 0,
    signal: null,
    output: [null, r.stdout ?? '', r.stderr ?? ''],
    pid: 1,
    error: r.error,
  } as SpawnSyncReturns<string>
}

/** mock spawn：which 命中 /opt/node，node --version 返回 v20。 */
function okSpawn(): SpawnAdapter {
  return {
    exec(command, args) {
      if (command === 'which' && args[0] === '-a') {
        return makeResult({ stdout: `/opt/bin/${args[1]}\n` })
      }
      if (command === 'where') {
        return makeResult({ stdout: `C:\\bin\\${args[0]}.exe\r\n` })
      }
      if (command === '/bin/zsh' || command === '/bin/bash') {
        return makeResult({ stdout: '/opt/bin' })
      }
      if (args[0] === '--version') {
        if (command.endsWith('node') || command.endsWith('node.exe')) return makeResult({ stdout: 'v20.0.0\n' })
        if (command.endsWith('git') || command.endsWith('git.exe')) return makeResult({ stdout: 'git version 2.39.0\n' })
        return makeResult({ stdout: '1.0.0\n' })
      }
      return makeResult({ status: 127 })
    },
  }
}

function missingSpawn(): SpawnAdapter {
  return {
    exec(command, args) {
      if (command === 'which' && args[0] === '-a') return makeResult({ status: 1, stdout: '' })
      if (command === 'where') return makeResult({ status: 1 })
      if (command === '/bin/zsh' || command === '/bin/bash') return makeResult({ stdout: '' })
      return makeResult({ status: 127 })
    },
  }
}

describe('SystemToolsRegistry', () => {
  it('detectTool caches result; force redetect re-runs', async () => {
    let versionCalls = 0
    const spawn: SpawnAdapter = {
      exec(command, args) {
        if (command === 'which' && args[0] === '-a') return makeResult({ stdout: '/opt/bin/node\n' })
        if (command === '/bin/zsh') return makeResult({ stdout: '/opt/bin' })
        if (command === '/opt/bin/node' && args[0] === '--version') {
          versionCalls++
          return makeResult({ stdout: `v20.0.${versionCalls}\n` })
        }
        return makeResult({ status: 127 })
      },
    }
    const reg = new SystemToolsRegistry({ spawn, platform: 'darwin', initialPath: '/opt/bin' })
    const a = await reg.detectTool('node')
    expect(a.version).toBe('20.0.1')
    const b = await reg.detectTool('node') // cached
    expect(versionCalls).toBe(1)
    expect(b.version).toBe(a.version)
    const c = await reg.detectTool('node', true) // force
    expect(versionCalls).toBe(2)
  })

  it('detectCategory returns only tools in that category', async () => {
    const reg = new SystemToolsRegistry({ spawn: okSpawn(), platform: 'darwin', initialPath: '/opt/bin' })
    const runtime = await reg.detectCategory('runtime')
    expect(runtime.length).toBeGreaterThan(0)
    expect(runtime.every((t) => t.category === 'runtime')).toBe(true)
  })

  it('getBestTool returns highest-priority available tool', async () => {
    const reg = new SystemToolsRegistry({ spawn: okSpawn(), platform: 'darwin', initialPath: '/opt/bin' })
    const best = await reg.getBestTool('package-manager')
    expect(best).not.toBeNull()
    expect(best!.category).toBe('package-manager')
    // pnpm priority 1 < npm priority 3
    expect(best!.toolId).toBe('pnpm')
  })

  it('getBestTool filters by capability', async () => {
    const reg = new SystemToolsRegistry({ spawn: okSpawn(), platform: 'darwin', initialPath: '/opt/bin' })
    const best = await reg.getBestTool('runtime', 'run-js')
    expect(best).not.toBeNull()
    expect(best!.capabilities).toContain('run-js')
  })

  it('exposes app-bundled ProjectPack as a context capability without PATH probing', async () => {
    let calls = 0
    const spawn: SpawnAdapter = {
      exec() {
        calls++
        return makeResult({ status: 127 })
      },
    }
    const reg = new SystemToolsRegistry({ spawn, platform: 'darwin', initialPath: '/x' })

    const projectPack = await reg.detectTool('fleet-project-pack')
    expect(projectPack).toMatchObject({
      toolId: 'fleet-project-pack',
      category: 'context',
      status: 'available',
      source: 'bundled',
      risk: 'read-only',
    })
    expect(projectPack.capabilities).toContain('repo-pack')
    expect(calls).toBe(0)

    const best = await reg.getBestTool('context', 'repo-pack')
    expect(best?.toolId).toBe('fleet-project-pack')

    const converter = await reg.getBestTool('context', 'doc-convert')
    expect(converter).toMatchObject({
      toolId: 'fleet-markitdown',
      status: 'available',
      source: 'bundled',
    })
  })

  it('getBestTool returns null when all missing', async () => {
    const reg = new SystemToolsRegistry({ spawn: missingSpawn(), platform: 'darwin', initialPath: '/x' })
    const best = await reg.getBestTool('runtime')
    expect(best).toBeNull()
  })

  it('listTools returns all registered toolIds with placeholder for missing', async () => {
    const reg = new SystemToolsRegistry({ spawn: missingSpawn(), platform: 'darwin', initialPath: '/x' })
    const tools = await reg.listTools()
    expect(tools.length).toBe(reg.listToolIds().length)
    expect(tools.every((t) =>
      t.toolId === 'fleet-project-pack' || t.toolId === 'fleet-markitdown'
        ? t.status === 'available'
        : t.status === 'missing' || t.status === 'unknown',
    )).toBe(true)
  })

  it('clearCache removes single entry', async () => {
    const reg = new SystemToolsRegistry({ spawn: okSpawn(), platform: 'darwin', initialPath: '/opt/bin' })
    await reg.detectTool('node')
    expect(reg.listCached().length).toBe(1)
    reg.clearCache('node')
    expect(reg.listCached().length).toBe(0)
  })

  it('clearCache() removes all', async () => {
    const reg = new SystemToolsRegistry({ spawn: okSpawn(), platform: 'darwin', initialPath: '/opt/bin' })
    await reg.detectAll()
    expect(reg.listCached().length).toBeGreaterThan(0)
    reg.clearCache()
    expect(reg.listCached().length).toBe(0)
  })

  it('throws on unknown toolId', async () => {
    const reg = new SystemToolsRegistry({ spawn: okSpawn(), platform: 'darwin', initialPath: '/opt/bin' })
    await expect(reg.detectTool('nope')).rejects.toThrow(/Unknown toolId/)
  })

  it('registerDetector adds a custom detector', async () => {
    const reg = new SystemToolsRegistry({ spawn: okSpawn(), platform: 'darwin', initialPath: '/opt/bin' })
    reg.registerDetector({
      toolId: 'my-tool',
      category: 'custom',
      displayName: 'My Tool',
      capabilities: [],
      risk: 'read-only',
      command: 'my-tool',
      versionArgs: ['--version'],
      versionRegex: /(\d+\.\d+\.\d+)/,
    })
    expect(reg.listToolIds()).toContain('my-tool')
    const cap = await reg.detectTool('my-tool')
    expect(cap.toolId).toBe('my-tool')
  })
})
