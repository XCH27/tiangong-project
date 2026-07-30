import { describe, expect, test } from 'bun:test'
import {
  parseClaudeSubscriptionQuota,
  parseCodexSubscriptionQuota,
} from './subscription-quota'

describe('subscription quota parsing', () => {
  test('keeps only provider-reported Claude windows', () => {
    expect(
      parseClaudeSubscriptionQuota({
        five_hour: { utilization: 25, resets_at: 2_000_000_000 },
        seven_day: { utilization: 60, resets_at: 2_000_100_000 },
      }),
    ).toEqual([
      {
        id: 'five_hour',
        period: 'short',
        usedPercent: 25,
        resetAt: 2_000_000_000_000,
      },
      {
        id: 'seven_day',
        period: 'weekly',
        usedPercent: 60,
        resetAt: 2_000_100_000_000,
      },
    ])
  })

  test('classifies Codex secondary windows by their real duration', () => {
    const windows = parseCodexSubscriptionQuota({
      rate_limit: {
        primary_window: {
          used_percent: 10,
          limit_window_seconds: 18_000,
        },
        secondary_window: {
          used_percent: 35,
          limit_window_seconds: 2_592_000,
        },
      },
    })
    expect(windows.map((window) => [window.period, window.usedPercent])).toEqual(
      [
        ['short', 10],
        ['monthly', 35],
      ],
    )
  })

  test('does not invent a zero-percent window when a payload is incomplete', () => {
    expect(parseClaudeSubscriptionQuota({ seven_day: {} })).toEqual([])
    expect(
      parseCodexSubscriptionQuota({
        rate_limit: { primary_window: { reset_after_seconds: 60 } },
      }),
    ).toEqual([])
  })
})
