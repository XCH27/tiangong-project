import { describe, expect, it } from 'bun:test'
import { formatCliRuntimePromptResult } from './cli-runtime-result'

describe('formatCliRuntimePromptResult', () => {
  it('returns string results unchanged', () => {
    expect(formatCliRuntimePromptResult('hello')).toBe('hello')
  })

  it('extracts common ACP text fields', () => {
    expect(formatCliRuntimePromptResult({ text: 'from text' })).toBe('from text')
    expect(formatCliRuntimePromptResult({ message: 'from message' })).toBe('from message')
  })

  it('extracts text parts from content arrays', () => {
    expect(formatCliRuntimePromptResult({
      content: [
        { type: 'text', text: 'first' },
        { type: 'text', text: 'second' },
      ],
    })).toBe('first\nsecond')
  })

  it('falls back to readable JSON for structured responses', () => {
    expect(formatCliRuntimePromptResult({ ok: true })).toContain('"ok": true')
  })

  it('uses an honest completion message for empty responses', () => {
    expect(formatCliRuntimePromptResult(null)).toBe('CLI Runtime 已完成。')
  })
})
