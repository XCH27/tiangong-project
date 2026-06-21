import { describe, expect, it } from 'bun:test'
import {
  DETECTED_UNSUPPORTED_RUNTIME_NAMES,
  getUnsupportedDetectedRuntimeMessage,
} from './cli-runtime-detected-acp-mappings'

describe('cli-runtime-detected-acp-mappings', () => {
  describe('getUnsupportedDetectedRuntimeMessage', () => {
    it('returns a formatted message for known unsupported runtimes', () => {
      const message = getUnsupportedDetectedRuntimeMessage('claude')
      expect(message).toContain('Claude Code')
      expect(message).toContain('暂未确认稳定的 ACP/stdio 入口')
      expect(message).toContain('不能直接作为 CLI Runtime 执行')
    })

    it('falls back to the runtimeId for unknown runtimes', () => {
      const message = getUnsupportedDetectedRuntimeMessage('unknown-runtime')
      expect(message).toContain('unknown-runtime')
      expect(message).toContain('暂未确认稳定的 ACP/stdio 入口')
    })

    it('has all expected unsupported runtimes in DETECTED_UNSUPPORTED_RUNTIME_NAMES', () => {
      expect(Object.keys(DETECTED_UNSUPPORTED_RUNTIME_NAMES)).toEqual([
        'claude',
        'codex',
        'qwen',
        'gemini',
      ])
    })
  })
})
