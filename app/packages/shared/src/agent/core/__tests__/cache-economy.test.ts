/**
 * Tests for cache-economy (token-economy layer L1).
 *
 * Fixtures use the REAL raw shapes Fleet receives:
 * - Anthropic SDK usage (claude event-adapter)
 * - Pi SDK usage (pi event-adapter)
 * - DeepSeek native hit/miss usage
 * - OpenAI prompt_tokens_details usage
 */
import { describe, it, expect } from 'bun:test';
import {
  PROVIDER_CACHE_PROFILES,
  alignedPrefixTokens,
  normalizeProviderUsage,
  estimateTurnEconomics,
  fingerprintZone,
  diagnoseCacheBreak,
  summarizeCacheEconomy,
} from '../cache-economy.ts';

describe('normalizeProviderUsage', () => {
  it('normalizes the Anthropic SDK shape (input_tokens excludes cache)', () => {
    const u = normalizeProviderUsage({
      input_tokens: 1000,
      cache_read_input_tokens: 8000,
      cache_creation_input_tokens: 2000,
      output_tokens: 500,
    });
    expect(u.uncachedInputTokens).toBe(1000);
    expect(u.cacheReadTokens).toBe(8000);
    expect(u.cacheWriteTokens).toBe(2000);
    expect(u.totalInputTokens).toBe(11000);
    expect(u.outputTokens).toBe(500);
    expect(u.cacheHitRate).toBeCloseTo(8000 / 11000, 10);
  });

  it('normalizes the Pi SDK shape', () => {
    const u = normalizeProviderUsage({ input: 300, output: 120, cacheRead: 700, cacheWrite: 0 });
    expect(u.uncachedInputTokens).toBe(300);
    expect(u.cacheReadTokens).toBe(700);
    expect(u.totalInputTokens).toBe(1000);
    expect(u.cacheHitRate).toBeCloseTo(0.7, 10);
  });

  it('normalizes the DeepSeek hit/miss shape (no write surcharge)', () => {
    const u = normalizeProviderUsage({
      prompt_cache_hit_tokens: 6400,
      prompt_cache_miss_tokens: 1600,
      completion_tokens: 200,
    });
    expect(u.uncachedInputTokens).toBe(1600);
    expect(u.cacheReadTokens).toBe(6400);
    expect(u.cacheWriteTokens).toBe(0);
    expect(u.totalInputTokens).toBe(8000);
    expect(u.cacheHitRate).toBeCloseTo(0.8, 10);
  });

  it('normalizes the OpenAI shape (cached_tokens is a subset of prompt_tokens)', () => {
    const u = normalizeProviderUsage({
      prompt_tokens: 2048,
      completion_tokens: 100,
      prompt_tokens_details: { cached_tokens: 1024 },
    });
    expect(u.uncachedInputTokens).toBe(1024);
    expect(u.cacheReadTokens).toBe(1024);
    expect(u.totalInputTokens).toBe(2048);
  });

  it('is honest at zero: no input means hit rate 0, never NaN', () => {
    const u = normalizeProviderUsage({ input: 0, output: 0 });
    expect(u.cacheHitRate).toBe(0);
    expect(u.totalInputTokens).toBe(0);
  });
});

describe('estimateTurnEconomics', () => {
  const anthropic = PROVIDER_CACHE_PROFILES.anthropic;

  it('computes the counterfactual saving for an Anthropic-style turn', () => {
    const u = normalizeProviderUsage({
      input_tokens: 1000,
      cache_read_input_tokens: 8000,
      cache_creation_input_tokens: 2000,
    });
    const e = estimateTurnEconomics(anthropic, u);
    // baseline 11000; actual = 1000 + 8000*0.1 + 2000*1.25 = 4300
    expect(e.baselineInputCostUnits).toBe(11000);
    expect(e.actualInputCostUnits).toBeCloseTo(4300, 10);
    expect(e.savedInputCostFraction).toBeCloseTo((11000 - 4300) / 11000, 10);
  });

  it('can LOSE money on a write-only turn (write multiplier > 1)', () => {
    const u = normalizeProviderUsage({
      input_tokens: 0,
      cache_creation_input_tokens: 4000,
    });
    const e = estimateTurnEconomics(anthropic, u);
    // baseline 4000; actual 5000 → negative saving. Honesty matters:
    expect(e.savedInputCostFraction).toBeLessThan(0);
  });

  it('emits USD only when a price is supplied — unknown stays unknown', () => {
    const u = normalizeProviderUsage({ input: 100, output: 10, cacheRead: 900 });
    const without = estimateTurnEconomics(PROVIDER_CACHE_PROFILES.deepseek, u);
    expect(without.savedUsd).toBeUndefined();

    const withPrice = estimateTurnEconomics(PROVIDER_CACHE_PROFILES.deepseek, u, {
      inputPricePerMTok: 1.0,
    });
    // baseline 1000 tok = $0.001; actual = 100 + 900*0.1 = 190 tok = $0.00019
    expect(withPrice.baselineInputUsd).toBeCloseTo(0.001, 10);
    expect(withPrice.savedUsd).toBeCloseTo(0.00081, 10);
    expect(withPrice.confidence).toBe('estimated');
  });
});

describe('alignedPrefixTokens', () => {
  it('floors to DeepSeek 64-token units and OpenAI 128-token units', () => {
    expect(alignedPrefixTokens(PROVIDER_CACHE_PROFILES.deepseek, 130)).toBe(128);
    expect(alignedPrefixTokens(PROVIDER_CACHE_PROFILES.openai, 1500)).toBe(1408);
  });

  it('returns 0 below the minimum cacheable prefix', () => {
    expect(alignedPrefixTokens(PROVIDER_CACHE_PROFILES.openai, 1000)).toBe(0);
    expect(alignedPrefixTokens(PROVIDER_CACHE_PROFILES.deepseek, 63)).toBe(0);
  });
});

describe('prefix stability (three-zone rule)', () => {
  const stable = ['system: you are Fleet', 'tools: [Read, Write]'];

  it('fingerprint is deterministic and order-sensitive', () => {
    expect(fingerprintZone(stable)).toBe(fingerprintZone([...stable]));
    expect(fingerprintZone(stable)).not.toBe(fingerprintZone([stable[1]!, stable[0]!]));
  });

  it('append-only log keeps the cache', () => {
    const d = diagnoseCacheBreak(
      { stableZone: stable, logZone: ['u1', 'a1'] },
      { stableZone: stable, logZone: ['u1', 'a1', 'u2'] },
    );
    expect(d.broken).toBe(false);
    expect(d.zone).toBe('none');
  });

  it('detects a stable-zone mutation (tool definition change)', () => {
    const d = diagnoseCacheBreak(
      { stableZone: stable, logZone: ['u1'] },
      { stableZone: ['system: you are Fleet', 'tools: [Read, Write, Edit]'], logZone: ['u1'] },
    );
    expect(d.broken).toBe(true);
    expect(d.zone).toBe('stable');
  });

  it('detects in-place history rewriting (compaction breaks cache)', () => {
    const d = diagnoseCacheBreak(
      { stableZone: stable, logZone: ['u1', 'a1', 'u2', 'a2'] },
      { stableZone: stable, logZone: ['summary-of-u1-a1', 'u2', 'a2'] },
    );
    expect(d.broken).toBe(true);
    expect(d.zone).toBe('log');
  });
});

describe('summarizeCacheEconomy', () => {
  it('folds turns and counts prefix breaks across snapshots', () => {
    const profile = PROVIDER_CACHE_PROFILES.anthropic;
    const turns = [
      normalizeProviderUsage({ input_tokens: 1000, cache_creation_input_tokens: 4000 }),
      normalizeProviderUsage({ input_tokens: 200, cache_read_input_tokens: 5000 }),
      normalizeProviderUsage({ input_tokens: 200, cache_read_input_tokens: 5000, output_tokens: 300 }),
    ];
    const stable = ['sys'];
    const summary = summarizeCacheEconomy(profile, turns, {
      inputPricePerMTok: 3.0,
      prefixSnapshots: [
        { stableZone: stable, logZone: ['u1'] },
        { stableZone: stable, logZone: ['u1', 'a1'] }, // append: fine
        { stableZone: ['sys-CHANGED'], logZone: ['u1', 'a1'] }, // break
      ],
    });
    expect(summary.turns).toBe(3);
    expect(summary.totalInputTokens).toBe(1000 + 4000 + 200 + 5000 + 200 + 5000);
    expect(summary.totalCacheReadTokens).toBe(10000);
    expect(summary.totalCacheWriteTokens).toBe(4000);
    expect(summary.prefixBreaks).toBe(1);
    expect(summary.savedUsd).toBeDefined();
    // Turn 1 loses (write 1.25x), turns 2-3 win big (0.1x reads) → net positive
    expect(summary.savedInputCostFraction).toBeGreaterThan(0);
  });
});
