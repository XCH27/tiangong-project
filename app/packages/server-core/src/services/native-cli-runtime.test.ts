import { describe, expect, it } from 'bun:test'
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { CliRuntimeDefinition, CliRuntimeStreamEvent } from '@craft-agent/shared/protocol'
import { runNativeCliRuntimeTurn } from './native-cli-runtime'

describe('runNativeCliRuntimeTurn', () => {
  it('runs a supported one-shot runtime and emits normalized text/done events', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'native-cli-runtime-'))
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
        args: ['exec'],
        enabled: true,
        protocol: 'native',
        mappingId: 'codex',
        attachments: 'none',
      }

      const result = await runNativeCliRuntimeTurn({
        runtime,
        cwd: dir,
        prompt: 'hello',
        emitEvent: event => events.push(event),
        timeoutMs: 5000,
      })

      expect(result.stopReason).toBe('end_turn')
      expect(events.map(event => event.type)).toEqual(['text', 'done'])
      expect((events[0] as { text: string }).text).toContain('hello')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
