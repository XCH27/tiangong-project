import { describe, expect, it } from 'bun:test'
import zhHans from '../locales/zh-Hans.json'

describe('Simplified Chinese workspace translations', () => {
  it('does not leave Workspace untranslated in user-visible values', () => {
    expect(Object.values(zhHans).filter((value) => value.includes('Workspace'))).toEqual([])
  })
})
