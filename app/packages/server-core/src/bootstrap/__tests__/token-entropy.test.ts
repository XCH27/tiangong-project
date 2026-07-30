import { describe, it, expect } from 'bun:test'
import { generateServerToken, validateTokenEntropy } from '../headless-start'

describe('generateServerToken', () => {
  it('produces a 48-character hex string', () => {
    const token = generateServerToken()
    expect(token).toHaveLength(48)
    expect(token).toMatch(/^[0-9a-f]{48}$/)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateServerToken()))
    expect(tokens.size).toBe(100)
  })

  it('has high character diversity', () => {
    const token = generateServerToken()
    const uniqueChars = new Set(token).size
    // 48 hex chars should have good diversity (16 possible chars)
    expect(uniqueChars).toBeGreaterThan(8)
  })
})

describe('validateTokenEntropy', () => {
  it('rejects tokens shorter than 16 characters', () => {
    const result = validateTokenEntropy('short')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('too short')
  })

  it('rejects empty tokens', () => {
    const result = validateTokenEntropy('')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('too short')
  })

  it('rejects single-character repeats (zero entropy)', () => {
    const result = validateTokenEntropy('aaaaaaaaaaaaaaaa')
    expect(result.ok).toBe(false)
    expect(result.error).toContain('zero entropy')
  })

  it('warns on low-entropy tokens (fewer than 8 unique chars)', () => {
    // 16 chars but only 3 unique characters
    const result = validateTokenEntropy('abcabcabcabcabca')
    expect(result.ok).toBe(true)
    expect(result.warning).toBeDefined()
    expect(result.warning).toContain('low entropy')
  })

  it('accepts high-entropy tokens without warning', () => {
    const token = generateServerToken()
    const result = validateTokenEntropy(token)
    expect(result.ok).toBe(true)
    expect(result.warning).toBeUndefined()
  })

  it('accepts a 16-char token with sufficient unique characters', () => {
    // 16 chars, 10 unique — should pass without warning
    const result = validateTokenEntropy('a1b2c3d4e5f6g7h8')
    expect(result.ok).toBe(true)
    expect(result.warning).toBeUndefined()
  })
})
