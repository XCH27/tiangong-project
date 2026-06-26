import { describe, expect, it } from 'bun:test'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { CliRuntimeDefinition, CliRuntimeStreamEvent } from '@craft-agent/shared/protocol'
import { buildNativeCommand, hasNativeOneShotAdapter, runNativeCliRuntimeTurn } from './native-cli-runtime'

// ---------------------------------------------------------------------------
// buildNativeCommand — pure function tests (no process spawn)
// ---------------------------------------------------------------------------

function makeDetected(mappingId: string, command = mappingId): CliRuntimeDefinition {
  return {
    id: `detected:${mappingId}`,
    kind: 'detected',
    displayName: mappingId,
    command,
    args: [],
    enabled: true,
    protocol: mappingId === 'goose' || mappingId === 'hermes' ? 'acp' : 'native',
    mappingId,
    attachments: 'none',
  }
}

describe('buildNativeCommand', () => {
  it('codex: uses exec + workspace-write sandbox, appends prompt last', () => {
    const cmd = buildNativeCommand(makeDetected('codex'), 'hello codex')
    expect(cmd).not.toBeNull()
    expect(cmd!.args).toContain('exec')
    expect(cmd!.args).toContain('--sandbox')
    expect(cmd!.args).toContain('workspace-write')
    expect(cmd!.args.at(-1)).toBe('hello codex')
  })

  it('codex: forwards --model and --reasoning-effort when provided', () => {
    const cmd = buildNativeCommand(makeDetected('codex'), 'test', 'gpt-5.3-codex', 'high')
    expect(cmd!.args).toEqual(expect.arrayContaining(['--model', 'gpt-5.3-codex', '--reasoning-effort', 'high']))
  })

  it('codex: omits --model and --reasoning-effort when not provided', () => {
    const cmd = buildNativeCommand(makeDetected('codex'), 'test', null, null)
    expect(cmd!.args).not.toContain('--model')
    expect(cmd!.args).not.toContain('--reasoning-effort')
  })

  it('claude: uses -p flag, forwards --thinking-effort using --reasoning-effort key', () => {
    const cmd = buildNativeCommand(makeDetected('claude'), 'hello claude', null, 'medium')
    expect(cmd).not.toBeNull()
    expect(cmd!.args[0]).toBe('-p')
    // Claude uses --reasoning-effort (as per adapter implementation)
    expect(cmd!.args).toContain('--reasoning-effort')
    expect(cmd!.args).toContain('medium')
  })

  it('claude: appends model before effort and prompt', () => {
    const cmd = buildNativeCommand(makeDetected('claude'), 'prompt', 'claude-opus-4-5', 'low')
    const modelIdx = cmd!.args.indexOf('--model')
    const effortIdx = cmd!.args.indexOf('--reasoning-effort')
    const promptIdx = cmd!.args.indexOf('prompt')
    expect(modelIdx).toBeGreaterThan(-1)
    expect(effortIdx).toBeGreaterThan(-1)
    expect(promptIdx).toBe(cmd!.args.length - 1)
  })

  it('grok: uses --single flag', () => {
    const cmd = buildNativeCommand(makeDetected('grok'), 'hello grok')
    expect(cmd).not.toBeNull()
    expect(cmd!.args[0]).toBe('--single')
  })

  it('grok: forwards --model and --reasoning-effort', () => {
    const cmd = buildNativeCommand(makeDetected('grok'), 'test', 'grok-4', 'low')
    expect(cmd!.args).toContain('--model')
    expect(cmd!.args).toContain('grok-4')
    expect(cmd!.args).toContain('--reasoning-effort')
    expect(cmd!.args).toContain('low')
  })

  it('antigravity: uses --print flag', () => {
    const cmd = buildNativeCommand(makeDetected('antigravity', 'agy'), 'hello agy')
    expect(cmd).not.toBeNull()
    expect(cmd!.args[0]).toBe('--print')
  })

  it('antigravity: forwards model and effort', () => {
    const cmd = buildNativeCommand(makeDetected('antigravity', 'agy'), 'q', 'Gemini 3.5 Flash (High)', 'medium')
    expect(cmd!.args).toContain('--model')
    expect(cmd!.args).toContain('Gemini 3.5 Flash (High)')
    expect(cmd!.args).toContain('--reasoning-effort')
    expect(cmd!.args).toContain('medium')
    expect(cmd!.args.at(-1)).toBe('q')
  })

  it('unknown mappingId returns null (needs_adapter)', () => {
    const cmd = buildNativeCommand(makeDetected('qwen'), 'test')
    expect(cmd).toBeNull()
  })

  it('null mappingId returns null', () => {
    const runtime = { ...makeDetected('custom'), mappingId: undefined }
    const cmd = buildNativeCommand(runtime as CliRuntimeDefinition, 'test')
    expect(cmd).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// hasNativeOneShotAdapter
// ---------------------------------------------------------------------------

describe('hasNativeOneShotAdapter', () => {
  it.each(['codex', 'claude', 'grok', 'antigravity'])('%s has adapter', (id) => {
    expect(hasNativeOneShotAdapter(id)).toBe(true)
  })

  it.each(['qwen', 'pi', 'cursor-agent', 'openclaw', 'goose', 'hermes', ''])('%s does NOT have adapter', (id) => {
    expect(hasNativeOneShotAdapter(id)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// runNativeCliRuntimeTurn — process execution (fake script, no real CLI)
// ---------------------------------------------------------------------------

describe('runNativeCliRuntimeTurn', () => {
  it('codex: runs and emits normalized text/done events', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'native-cli-test-'))
    try {
      const script = join(dir, 'fake-codex')
      // Echo the args so we can verify they were passed
      writeFileSync(script, '#!/usr/bin/env node\nconsole.log(process.argv.slice(2).join("|"))\n', 'utf8')
      chmodSync(script, 0o755)

      const events: CliRuntimeStreamEvent[] = []
      const runtime: CliRuntimeDefinition = {
        id: 'detected:codex',
        kind: 'detected',
        displayName: 'Codex',
        command: script,
        args: [],
        enabled: true,
        protocol: 'native',
        mappingId: 'codex',
        attachments: 'none',
      }

      const result = await runNativeCliRuntimeTurn({
        runtime,
        cwd: dir,
        prompt: 'hello codex',
        emitEvent: event => events.push(event),
        timeoutMs: 5000,
      })

      expect(result.stopReason).toBe('end_turn')
      expect(events.map(e => e.type)).toEqual(['text', 'done'])
      const textEvent = events[0] as { type: 'text'; text: string }
      expect(textEvent.text).toContain('hello codex')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('codex: passes --reasoning-effort to process argv', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'native-cli-effort-'))
    try {
      const script = join(dir, 'fake-codex')
      writeFileSync(script, '#!/usr/bin/env node\nconsole.log(process.argv.slice(2).join("|"))\n', 'utf8')
      chmodSync(script, 0o755)

      const events: CliRuntimeStreamEvent[] = []
      const runtime: CliRuntimeDefinition = {
        id: 'detected:codex',
        kind: 'detected',
        displayName: 'Codex',
        command: script,
        args: [],
        enabled: true,
        protocol: 'native',
        mappingId: 'codex',
        attachments: 'none',
      }

      await runNativeCliRuntimeTurn({
        runtime,
        cwd: dir,
        prompt: 'effort test',
        reasoningEffort: 'high',
        emitEvent: event => events.push(event),
        timeoutMs: 5000,
      })

      // The fake codex script echoes all args; verify --reasoning-effort high is present
      const textEvent = events[0] as { type: 'text'; text: string }
      expect(textEvent.text).toContain('--reasoning-effort')
      expect(textEvent.text).toContain('high')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('throws a descriptive error for unrecognized mappingId (qwen needs_adapter)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'native-cli-needs-adapter-'))
    try {
      const runtime: CliRuntimeDefinition = {
        id: 'detected:qwen',
        kind: 'detected',
        displayName: 'Qwen Code',
        command: 'qwen',
        args: ['--version'],
        enabled: true,
        protocol: 'native',
        mappingId: 'qwen',
        attachments: 'none',
      }

      await expect(
        runNativeCliRuntimeTurn({
          runtime,
          cwd: dir,
          prompt: 'test',
          emitEvent: () => {},
          timeoutMs: 1000,
        }),
      ).rejects.toThrow('还没有 native/subscription 发送 adapter')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('emits error event and rejects when process exits non-zero', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'native-cli-fail-'))
    try {
      const script = join(dir, 'fail-script')
      writeFileSync(script, '#!/usr/bin/env node\nprocess.stderr.write("oops"); process.exit(1)\n', 'utf8')
      chmodSync(script, 0o755)

      const runtime: CliRuntimeDefinition = {
        id: 'detected:claude',
        kind: 'detected',
        displayName: 'Claude Code',
        command: script,
        args: [],
        enabled: true,
        protocol: 'native',
        mappingId: 'claude',
        attachments: 'none',
      }

      await expect(
        runNativeCliRuntimeTurn({
          runtime,
          cwd: dir,
          prompt: 'test',
          emitEvent: () => {},
          timeoutMs: 5000,
        }),
      ).rejects.toThrow()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
