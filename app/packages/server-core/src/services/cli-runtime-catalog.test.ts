import { afterEach, describe, expect, it } from 'bun:test'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { buildCliRuntimeCatalog, performCliRuntimeHealthTest } from './cli-runtime-catalog'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function makeExecutable(name: string, source: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-cli-runtime-'))
  tempDirs.push(dir)
  const file = join(dir, name)
  writeFileSync(file, source)
  chmodSync(file, 0o755)
  return file
}

describe('buildCliRuntimeCatalog', () => {
  it('marks supported and unsupported detected runtimes without pretending all are executable', () => {
    const catalog = buildCliRuntimeCatalog({ resolveCommand: () => null })
    const grok = catalog.find(item => item.id === 'grok')
    const claude = catalog.find(item => item.id === 'claude')

    expect(grok?.mapping).toEqual({ command: 'grok', args: ['agent', 'stdio'] })
    expect(grok?.supported).toBe(true)
    expect(claude?.supported).toBe(false)
    expect(claude?.unsupportedReason).toContain('暂未确认稳定的 ACP/stdio 入口')
  })
})

describe('performCliRuntimeHealthTest', () => {
  it('returns fail_cli when the command cannot be resolved', async () => {
    const result = await performCliRuntimeHealthTest({
      runtimeId: 'missing',
      command: 'definitely-not-installed-fleet-test',
      args: [],
      resolveCommand: () => null,
    })

    expect(result.status).toBe('fail_cli')
    expect(result.stage).toBe('resolve')
    expect(result.message).toContain('CLI 启动失败')
  })

  it('returns fail_acp when a command launches but does not speak ACP', async () => {
    const script = makeExecutable('not-acp.sh', '#!/bin/sh\necho nope\n')

    const result = await performCliRuntimeHealthTest({
      runtimeId: 'not-acp',
      command: script,
      args: [],
      acpMode: true,
      timeoutMs: 800,
      resolveCommand: command => command,
    })

    expect(result.status).toBe('fail_acp')
    expect(result.stage).toBe('initialize')
    expect(result.message).toContain('ACP 握手失败')
  })

  it('returns available when initialize and session/new succeed', async () => {
    const script = makeExecutable('fake-acp.js', `#!/usr/bin/env node
const readline = require('node:readline')
const rl = readline.createInterface({ input: process.stdin })
rl.on('line', line => {
  const msg = JSON.parse(line)
  if (msg.method === 'initialize') {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: 1 } }) + '\\n')
  } else if (msg.method === 'session/new') {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { sessionId: 's1' } }) + '\\n')
  } else if (msg.method === 'session/prompt') {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result: { stopReason: 'end_turn' } }) + '\\n')
  }
})
`)

    const result = await performCliRuntimeHealthTest({
      runtimeId: 'fake',
      command: script,
      args: [],
      acpMode: true,
      timeoutMs: 1200,
      resolveCommand: command => command,
    })

    expect(result.status).toBe('available')
    expect(result.stage).toBe('session/new')
  })
})
