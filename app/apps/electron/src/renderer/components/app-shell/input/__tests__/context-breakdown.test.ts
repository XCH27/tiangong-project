import { describe, expect, it } from 'bun:test'
import type { Message } from '@craft-agent/core'
import {
  estimateContextBreakdown,
  projectBreakdownToContextWindow,
} from '../context-breakdown'

const message = (role: Message['role'], content: string, extra: Partial<Message> = {}): Message => ({
  id: `${role}-${content}`,
  role,
  content,
  timestamp: 1,
  ...extra,
})

describe('estimateContextBreakdown', () => {
  it('keeps the provider total authoritative and assigns the residual to other context', () => {
    const result = estimateContextBreakdown([
      message('user', '12345678'),
      message('assistant', '1234'),
      message('tool', '', { toolResult: '12345678' }),
    ], 10)

    expect(result).toEqual([
      { key: 'user', tokens: 2, messageCount: 1, inputSharePercent: 20 },
      { key: 'assistant', tokens: 1, messageCount: 1, inputSharePercent: 10 },
      { key: 'tool', tokens: 2, messageCount: 1, inputSharePercent: 20 },
      { key: 'other', tokens: 5, inputSharePercent: 50 },
    ])
  })

  it('scales estimates down instead of exceeding the provider input total', () => {
    const result = estimateContextBreakdown([
      message('user', 'x'.repeat(80)),
      message('assistant', 'x'.repeat(80)),
    ], 10)

    expect(result.reduce((sum, segment) => sum + segment.tokens, 0)).toBe(10)
    expect(result.find((segment) => segment.key === 'other')).toBeUndefined()
  })

  it('does not present an input-relative residual as full context-window usage', () => {
    const projected = projectBreakdownToContextWindow([
      { key: 'user', tokens: 57, inputSharePercent: 0.3 },
      { key: 'assistant', tokens: 91, inputSharePercent: 0.4 },
      { key: 'tool', tokens: 295, inputSharePercent: 1.3 },
      { key: 'other', tokens: 21_557, inputSharePercent: 98 },
    ], 1_000_000)

    expect(projected.find((segment) => segment.key === 'other')?.windowPercent).toBe(2.2)
    expect(projected.reduce((sum, segment) => sum + segment.windowPercent, 0)).toBe(2.2)
  })
})
