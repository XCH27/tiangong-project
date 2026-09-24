import { describe, expect, it } from 'bun:test';
import { parseXaiSubscriptionUsage } from './xai-usage.ts';

describe('Grok subscription usage', () => {
  it('keeps the provider window, percentage and prepaid balance distinct', () => {
    expect(parseXaiSubscriptionUsage({
      subscription_tier: 'SuperGrok',
      config: {
        currentPeriod: { type: 'WEEKLY', end: '2026-09-30T00:00:00Z' },
        creditUsagePercent: 42.5,
        prepaidBalance: { val: '1234' },
      },
    })).toEqual({
      plan: 'SuperGrok',
      window: { label: 'weekly', usedPercent: 42.5, resetAt: Date.parse('2026-09-30T00:00:00Z') },
      prepaidBalanceUsd: 12.34,
    });
  });

  it('does not manufacture a percentage from an empty or malformed response', () => {
    expect(() => parseXaiSubscriptionUsage({ config: {} })).toThrow('unavailable');
    expect(() => parseXaiSubscriptionUsage({})).toThrow('invalid');
  });
});
