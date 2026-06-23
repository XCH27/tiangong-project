import { describe, expect, test } from 'bun:test'
import { computeContextUsage, unavailablePlanUsage, describeContextPercent } from '../usage'

describe('usage 计算（docs/16 诚实分级）', () => {
  test('有窗口：percent 真实计算、window source=real', () => {
    const c = computeContextUsage({ usedTokens: 180_000, contextWindow: 200_000 })
    expect(c.percentFull).toBeCloseTo(0.9, 5)
    expect(c.windowSource).toBe('real')
    expect(c.usedSource).toBe('real')
    expect(describeContextPercent(c)).toBe('90% 满')
  })

  test('窗口未知（CLI 管理）：window=null、percent=null、source=unknown，文案诚实', () => {
    const c = computeContextUsage({ usedTokens: 1234, contextWindow: null })
    expect(c.contextWindow).toBeNull()
    expect(c.percentFull).toBeNull()
    expect(c.windowSource).toBe('unknown')
    expect(describeContextPercent(c)).toContain('CLI 管理')
  })

  test('percent 夹在 0–1（超窗不超过 100%）', () => {
    expect(computeContextUsage({ usedTokens: 999_999, contextWindow: 200_000 }).percentFull).toBe(1)
    expect(computeContextUsage({ usedTokens: -5, contextWindow: 200_000 }).percentFull).toBe(0)
  })

  test('分段透传 + 估算标记', () => {
    const c = computeContextUsage({ usedTokens: 100, contextWindow: 1000, segments: [{ id: 'conversation', label: '对话', tokens: 80, source: 'real' }, { id: 'tools', label: '工具定义', tokens: 20, source: 'estimated' }] })
    expect(c.segments.length).toBe(2)
    expect(c.segments.find(s => s.id === 'tools')?.source).toBe('estimated')
  })

  test('额度默认不可用：不编造数字', () => {
    const p = unavailablePlanUsage('该 provider 未暴露订阅额度')
    expect(p.available).toBe(false)
    expect(p.windows).toEqual([])
    expect(p.source).toBe('unknown')
    expect(p.unavailableReason).toContain('未暴露')
  })
})
