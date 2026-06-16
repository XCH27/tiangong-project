import { describe, expect, it } from 'bun:test'
import { chmod, mkdir, mkdtemp, symlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { HandlerFn, RpcServer } from '@craft-agent/server-core/transport'
import {
  CLI_RUNTIME_TOOLS,
  detectCliRuntimes,
  registerCliRuntimeHandlers,
  resolveCommandPath,
} from './cli-runtime'

async function makeExecutable(dir: string, name: string, source: string): Promise<string> {
  const path = join(dir, name)
  await writeFile(path, `#!/bin/sh\n${source}\n`, 'utf8')
  await chmod(path, 0o755)
  return path
}

async function makeTempHome(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'craft-cli-runtime-home-'))
}

async function makeTempBin(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'craft-cli-runtime-bin-'))
}

describe('resolveCommandPath', () => {
  it('resolves executable commands from PATH', async () => {
    const binDir = await makeTempBin()
    const executable = await makeExecutable(binDir, 'codex', "echo 'codex 1.2.3'")

    await expect(resolveCommandPath('codex', { PATH: binDir }, 'darwin')).resolves.toBe(executable)
  })

  it('returns null when command is not on PATH', async () => {
    const binDir = await makeTempBin()

    await expect(resolveCommandPath('codex', { PATH: binDir }, 'darwin')).resolves.toBeNull()
  })

  it('can resolve commands from common user bin fallback directories', async () => {
    const homeDir = await makeTempHome()
    const userBin = join(homeDir, '.local', 'bin')
    await mkdir(userBin, { recursive: true })
    const executable = await makeExecutable(userBin, 'hermes', "echo 'hermes 1.2.3'")

    await expect(resolveCommandPath('hermes', { PATH: '' }, 'darwin', {
      homeDir,
      includeFallbackDirs: true,
    })).resolves.toBe(executable)
  })
})

describe('CLI_RUNTIME_TOOLS', () => {
  it('includes the supported default agent CLIs', () => {
    const toolIds = CLI_RUNTIME_TOOLS.map(tool => tool.id)

    expect(toolIds).toEqual([
      'aionrs',
      'claude',
      'codex',
      'qwen',
      'opencode',
      'cursor',
      'antigravity',
      'hermes',
      'openclaw',
      'grok',
      'goose',
      'codebuddy',
      'kimi',
      'droid',
      'auggie',
      'copilot',
      'qoder',
      'vibe',
      'nanobot',
      'snow',
    ])
    expect(CLI_RUNTIME_TOOLS.find(tool => tool.id === 'antigravity')?.command).toBe('agy')
    expect(CLI_RUNTIME_TOOLS.find(tool => tool.id === 'grok')?.command).toBe('grok')
    expect(toolIds as readonly string[]).not.toContain('gemini')
  })
})

describe('detectCliRuntimes', () => {
  it('reports available tools with version, path, and config directory status', async () => {
    const homeDir = await makeTempHome()
    const binDir = await makeTempBin()
    const executable = await makeExecutable(binDir, 'codex', "echo 'codex 1.2.3'")
    await mkdir(join(homeDir, '.codex'))

    const result = await detectCliRuntimes({
      env: { PATH: binDir },
      homeDir,
      platform: 'darwin',
      now: () => 123,
      tools: [{
        id: 'codex',
        command: 'codex',
        displayName: 'Codex CLI',
        versionArgs: ['--version'],
        configDirs: home => [join(home, '.codex')],
      }],
    })

    expect(result.checkedAt).toBe(123)
    expect(result.tools).toEqual([{
      id: 'codex',
      command: 'codex',
      displayName: 'Codex CLI',
      available: true,
      resolvedPath: executable,
      version: 'codex 1.2.3',
      configDirs: [{ path: join(homeDir, '.codex'), exists: true }],
      failureReason: undefined,
      stderr: undefined,
      durationMs: expect.any(Number),
      checkedAt: 123,
    }])
  })

  it('classifies missing tools as not_found without running arbitrary commands', async () => {
    const homeDir = await makeTempHome()
    const binDir = await makeTempBin()

    const result = await detectCliRuntimes({
      env: { PATH: binDir },
      homeDir,
      platform: 'darwin',
      now: () => 456,
      tools: [{
        id: 'claude',
        command: 'claude',
        displayName: 'Claude Code',
        versionArgs: ['--version'],
        configDirs: home => [join(home, '.claude')],
      }],
    })

    expect(result.tools[0]).toEqual({
      id: 'claude',
      command: 'claude',
      displayName: 'Claude Code',
      available: false,
      configDirs: [{ path: join(homeDir, '.claude'), exists: false }],
      failureReason: 'not_found',
      checkedAt: 456,
    })
  })

  it('keeps resolved tools available when version probes exceed timeout', async () => {
    const homeDir = await makeTempHome()
    const binDir = await makeTempBin()
    await makeExecutable(binDir, 'hermes', 'sleep 5')

    const result = await detectCliRuntimes({
      env: { PATH: binDir },
      homeDir,
      platform: 'darwin',
      timeoutMs: 20,
      now: () => 789,
      tools: [{
        id: 'hermes',
        command: 'hermes',
        displayName: 'Hermes Agent',
        versionArgs: ['--version'],
        configDirs: home => [join(home, '.hermes')],
      }],
    })

    expect(result.tools[0]?.available).toBe(true)
    expect(result.tools[0]?.failureReason).toBe('timeout')
    expect(result.tools[0]?.resolvedPath).toBe(join(binDir, 'hermes'))
    expect(result.tools[0]?.version).toBeUndefined()
  })

  it('keeps resolved tools available when version probes exit non-zero', async () => {
    const homeDir = await makeTempHome()
    const binDir = await makeTempBin()
    await makeExecutable(binDir, 'qwen', "echo 'broken qwen' >&2\nexit 7")

    const result = await detectCliRuntimes({
      env: { PATH: binDir },
      homeDir,
      platform: 'darwin',
      now: () => 111,
      tools: [{
        id: 'qwen',
        command: 'qwen',
        displayName: 'Qwen CLI',
        versionArgs: ['--version'],
        configDirs: home => [join(home, '.qwen')],
      }],
    })

    expect(result.tools[0]?.available).toBe(true)
    expect(result.tools[0]?.failureReason).toBe('version_failed')
    expect(result.tools[0]?.stderr).toContain('broken qwen')
    expect(result.tools[0]?.version).toBeUndefined()
  })

  it('uses tool-specific version arguments such as cursor agent --version', async () => {
    const homeDir = await makeTempHome()
    const binDir = await makeTempBin()
    const executable = await makeExecutable(binDir, 'cursor', [
      'if [ "$1" = "agent" ] && [ "$2" = "--version" ]; then',
      "  echo '2026.06.04-5fd875e'",
      '  exit 0',
      'fi',
      "echo 'Use cursor agent' >&2",
      'exit 1',
    ].join('\n'))

    const result = await detectCliRuntimes({
      env: { PATH: binDir },
      homeDir,
      platform: 'darwin',
      now: () => 222,
      tools: [{
        id: 'cursor',
        command: 'cursor',
        displayName: 'Cursor CLI',
        versionArgs: ['agent', '--version'],
        configDirs: home => [join(home, '.cursor')],
      }],
    })

    expect(result.tools[0]?.available).toBe(true)
    expect(result.tools[0]?.resolvedPath).toBe(executable)
    expect(result.tools[0]?.version).toBe('2026.06.04-5fd875e')
  })

  it('detects a runtime through secondary command aliases such as Aion CLI aionrs', async () => {
    const homeDir = await makeTempHome()
    const binDir = await makeTempBin()
    const executable = await makeExecutable(binDir, 'aionrs', "echo 'aionrs 0.1.29'")

    const result = await detectCliRuntimes({
      homeDir,
      env: { PATH: binDir },
      platform: 'darwin',
      now: () => 1900,
      tools: [
        {
          id: 'aionrs',
          command: 'aion',
          commands: ['aion', 'aionrs'],
          displayName: 'Aion CLI',
          versionArgs: ['--version'],
          configDirs: home => [join(home, '.aionui')],
        },
      ],
    })

    expect(result.tools[0]).toMatchObject({
      id: 'aionrs',
      command: 'aionrs',
      available: true,
      resolvedPath: executable,
      version: 'aionrs 0.1.29',
    })
  })

  it('classifies broken command symlinks separately from missing tools', async () => {
    const homeDir = await makeTempHome()
    const binDir = await makeTempBin()
    await symlink('/definitely/missing/qwen', join(binDir, 'qwen'))

    const result = await detectCliRuntimes({
      env: { PATH: binDir },
      homeDir,
      platform: 'darwin',
      now: () => 333,
      tools: [{
        id: 'qwen',
        command: 'qwen',
        displayName: 'Qwen CLI',
        versionArgs: ['--version'],
        configDirs: home => [join(home, '.qwen')],
      }],
    })

    expect(result.tools[0]?.available).toBe(false)
    expect(result.tools[0]?.resolvedPath).toBe(join(binDir, 'qwen'))
    expect(result.tools[0]?.failureReason).toBe('broken_link')
  })

  it('finds Grok Build in official user install directories when GUI PATH is minimal', async () => {
    const homeDir = await makeTempHome()
    const grokBin = join(homeDir, '.grok', 'bin')
    await mkdir(grokBin, { recursive: true })
    const executable = await makeExecutable(grokBin, 'grok', "echo 'grok 0.2.54 (fee15ff8ea0)'")

    const result = await detectCliRuntimes({
      env: { PATH: '/usr/bin:/bin:/usr/sbin:/sbin' },
      homeDir,
      platform: 'darwin',
      now: () => 444,
      tools: [{
        id: 'grok',
        command: 'grok',
        displayName: 'Grok Build',
        versionArgs: ['--version'],
        configDirs: home => [join(home, '.grok')],
      }],
    })

    expect(result.tools[0]?.available).toBe(true)
    expect(result.tools[0]?.resolvedPath).toBe(executable)
    expect(result.tools[0]?.version).toBe('grok 0.2.54 (fee15ff8ea0)')
  })
})

describe('registerCliRuntimeHandlers', () => {
  it('registers cliRuntime:detect', () => {
    const handlers = new Map<string, HandlerFn>()
    const server: RpcServer = {
      handle(channel, handler) {
        handlers.set(channel, handler)
      },
      push() {},
      async invokeClient() { return undefined },
      hasClientCapability() { return false },
      findClientsWithCapability() { return [] },
    }

    registerCliRuntimeHandlers(server)

    expect(handlers.has(RPC_CHANNELS.cliRuntime.DETECT)).toBe(true)
  })
})
