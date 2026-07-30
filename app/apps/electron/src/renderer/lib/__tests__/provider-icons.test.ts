import { describe, expect, test } from 'bun:test'
import { resolveProviderBrandIconId } from '../provider-icons'

describe('resolveProviderBrandIconId', () => {
  test('uses the upstream provider carried by a Pi connection', () => {
    expect(resolveProviderBrandIconId('pi', undefined, 'deepseek')).toBe('deepseek')
  })

  test('maps Fleet catalog ids to the matching OpenCode sprite symbols', () => {
    expect(resolveProviderBrandIconId('siliconflow')).toBe('siliconflow-cn')
    expect(resolveProviderBrandIconId('moonshot-cn')).toBe('moonshotai-cn')
  })

  test('detects known brands from compatible endpoint URLs', () => {
    expect(
      resolveProviderBrandIconId('pi_compat', 'https://api.moonshot.cn/v1'),
    ).toBe('moonshotai-cn')
  })

  test('falls back to the neutral upstream symbol', () => {
    expect(resolveProviderBrandIconId('unknown-provider')).toBe('synthetic')
  })
})
