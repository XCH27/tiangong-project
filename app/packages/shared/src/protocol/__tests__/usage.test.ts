import { describe, expect, test } from 'bun:test'
import { computeContextUsage, unavailablePlanUsage, describeContextPercent, estimateContextSegments } from '../usage'

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

  test('分段估算：归一到真实总数、各段标 estimated、含 other 余量', () => {
    const segs = estimateContextSegments({ total: 1000, systemTokens: 300, conversationTokens: 200 })
    expect(segs.reduce((sum, s) => sum + s.tokens, 0)).toBe(1000) // 和 = 真实总数
    expect(segs.every(s => s.source === 'estimated')).toBe(true)
    expect(segs.find(s => s.id === 'other')?.tokens).toBe(500) // 余量进 other
  })

  test('分段估算：拆出规则、Skills、MCP、子代理，不再折进 other', () => {
    const segs = estimateContextSegments({
      total: 1000,
      systemTokens: 100,
      rulesTokens: 50,
      toolTokens: 80,
      skillTokens: 70,
      mcpTokens: 60,
      subagentTokens: 40,
      conversationTokens: 200,
    })
    expect(segs.map(s => s.id)).toEqual(['system', 'tools', 'rules', 'skills', 'mcp', 'subagents', 'conversation', 'other'])
    expect(segs.find(s => s.id === 'rules')?.tokens).toBe(50)
    expect(segs.find(s => s.id === 'skills')?.tokens).toBe(70)
    expect(segs.find(s => s.id === 'mcp')?.tokens).toBe(60)
    expect(segs.find(s => s.id === 'subagents')?.tokens).toBe(40)
    expect(segs.find(s => s.id === 'other')?.tokens).toBe(400)
  })

  test('分段估算：估算偏高时按比例缩回，不超过真实总数', () => {
    const segs = estimateContextSegments({ total: 100, systemTokens: 300, conversationTokens: 300 })
    const sum = segs.reduce((acc, s) => acc + s.tokens, 0)
    expect(sum).toBeLessThanOrEqual(100)
    expect(segs.some(s => s.id === 'other')).toBe(false) // 没余量
  })

  test('分段估算：total=0 返回空（不画分段）', () => {
    expect(estimateContextSegments({ total: 0, systemTokens: 10, conversationTokens: 10 })).toEqual([])
  })

  test('额度默认不可用：不编造数字', () => {
    const p = unavailablePlanUsage('该 provider 未暴露订阅额度')
    expect(p.available).toBe(false)
    expect(p.windows).toEqual([])
    expect(p.source).toBe('unknown')
    expect(p.unavailableReason).toContain('未暴露')
  })
})
