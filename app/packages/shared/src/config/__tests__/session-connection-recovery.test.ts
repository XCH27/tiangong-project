import { describe, expect, it } from 'bun:test'
import { resolveStoredSessionConnectionSlug } from '../llm-connections'

describe('stored session connection recovery', () => {
  const deepSeek = {
    slug: 'deepseek',
    defaultModel: 'pi/deepseek-v4-pro',
    models: ['pi/deepseek-v4-pro', 'pi/deepseek-v4-flash'],
  }

  it('keeps an existing connection slug unchanged', () => {
    expect(resolveStoredSessionConnectionSlug(
      'deepseek',
      'pi/deepseek-v4-pro',
      [deepSeek],
    )).toBe('deepseek')
  })

  it('recovers a removed generic API slug through one matching provider model', () => {
    expect(resolveStoredSessionConnectionSlug(
      'pi-api-key',
      'pi/deepseek-v4-pro',
      [deepSeek],
    )).toBe('deepseek')
  })

  it('matches provider-facing model ids without exposing the runtime prefix', () => {
    expect(resolveStoredSessionConnectionSlug(
      'pi-api-key',
      'deepseek-v4-flash',
      [deepSeek],
    )).toBe('deepseek')
  })

  it('does not silently choose between two accounts with the same model', () => {
    expect(resolveStoredSessionConnectionSlug(
      'pi-api-key',
      'pi/deepseek-v4-pro',
      [deepSeek, { ...deepSeek, slug: 'deepseek-2' }],
    )).toBeUndefined()
  })
})
