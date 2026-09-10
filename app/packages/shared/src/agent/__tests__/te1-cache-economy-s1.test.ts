/**
 * TE1-C1: a completed session yields one CacheEconomySummary from real
 * adapter events. Numbers come from normalizeProviderUsage — not invented
 * at the session fold. No second ledger: UsageTracker / session tokenUsage
 * are the same complete-input fields the adapters already emit.
 */
import { describe, it, expect } from 'bun:test';
import { ClaudeEventAdapter, type ClaudeAdapterCallbacks } from '../backend/claude/event-adapter.ts';
import { PiEventAdapter } from '../backend/pi/event-adapter.ts';
import { UsageTracker } from '../core/usage-tracker.ts';
import {
  PROVIDER_CACHE_PROFILES,
  normalizeProviderUsage,
  summarizeCacheEconomy,
  summarizeSessionCacheEconomy,
  type NormalizedCacheUsage,
} from '../core/cache-economy.ts';

function attachedCacheUsage(usage: unknown): NormalizedCacheUsage {
  const cacheUsage = (usage as { cacheUsage?: NormalizedCacheUsage } | undefined)?.cacheUsage;
  expect(cacheUsage).toBeDefined();
  return cacheUsage!;
}

function recordComplete(tracker: UsageTracker, usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number; cacheCreationTokens?: number } | undefined): void {
  expect(usage).toBeDefined();
  tracker.recordTurnComplete({
    inputTokens: usage!.inputTokens,
    outputTokens: usage!.outputTokens,
    cacheReadTokens: usage!.cacheReadTokens,
    cacheCreationTokens: usage!.cacheCreationTokens,
    cacheUsage: attachedCacheUsage(usage),
  });
}

function claudeCallbacks(): ClaudeAdapterCallbacks {
  return {
    mapSDKError: async (errorCode) => ({
      type: 'typed_error',
      error: {
        code: 'unknown_error',
        title: 'Test Error',
        message: `Mock error for ${errorCode}`,
        details: [],
        actions: [],
        canRetry: false,
      },
    }),
  };
}

describe('TE1-C1 cache economy feed', () => {
  it('Claude adapter events fold to one summary matching the cache-economy authority', async () => {
    const adapter = new ClaudeEventAdapter(claudeCallbacks());
    adapter.startTurn();

    const turn1Raw = {
      input_tokens: 1000,
      output_tokens: 80,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 4000,
    };
    const turn2Raw = {
      input_tokens: 200,
      output_tokens: 300,
      cache_read_input_tokens: 5000,
      cache_creation_input_tokens: 0,
    };

    await adapter.adapt({
      type: 'assistant',
      message: { content: [], usage: turn1Raw },
      parent_tool_use_id: null,
      session_id: 'sess-1',
      isReplay: false,
    } as any);
    const turn1Events = await adapter.adapt({
      type: 'result',
      subtype: 'success',
      usage: turn1Raw,
      total_cost_usd: 0.02,
      modelUsage: { 'claude-opus': { contextWindow: 200000 } },
      session_id: 'sess-1',
    } as any);

    adapter.startTurn();
    await adapter.adapt({
      type: 'assistant',
      message: { content: [], usage: turn2Raw },
      parent_tool_use_id: null,
      session_id: 'sess-1',
      isReplay: false,
    } as any);
    const turn2Events = await adapter.adapt({
      type: 'result',
      subtype: 'success',
      usage: turn2Raw,
      total_cost_usd: 0.01,
      modelUsage: { 'claude-opus': { contextWindow: 200000 } },
      session_id: 'sess-1',
    } as any);

    const complete1 = turn1Events.find((e) => e.type === 'complete');
    const complete2 = turn2Events.find((e) => e.type === 'complete');
    expect(complete1?.type).toBe('complete');
    expect(complete2?.type).toBe('complete');
    const usage1 = complete1 && complete1.type === 'complete' ? complete1.usage : undefined;
    const usage2 = complete2 && complete2.type === 'complete' ? complete2.usage : undefined;
    expect(usage1).toBeDefined();
    expect(usage2).toBeDefined();

    const expectedTurn1 = normalizeProviderUsage(turn1Raw);
    const expectedTurn2 = normalizeProviderUsage(turn2Raw);
    const expectedTurns: NormalizedCacheUsage[] = [expectedTurn1, expectedTurn2];
    expect(attachedCacheUsage(usage1)).toEqual(expectedTurn1);
    expect(attachedCacheUsage(usage2)).toEqual(expectedTurn2);

    const tracker = new UsageTracker();
    recordComplete(tracker, usage1);
    recordComplete(tracker, usage2);

    const profile = PROVIDER_CACHE_PROFILES.anthropic;
    const summary = tracker.getCacheEconomySummary(profile);
    expect(summary).toEqual(summarizeCacheEconomy(profile, expectedTurns));
    expect(summary.turns).toBe(2);
    expect(summary.totalInputTokens).toBe(1000 + 4000 + 200 + 5000);
    expect(summary.totalCacheReadTokens).toBe(5000);
    expect(summary.totalCacheWriteTokens).toBe(4000);
    expect(summary.totalUncachedInputTokens).toBe(1200);

    // SessionManager projection uses the same ledger totals (one combined turn).
    const sessionUsage = tracker.getSessionUsage();
    const projected = summarizeSessionCacheEconomy(profile, {
      inputTokens: sessionUsage.totalInputTokens,
      outputTokens: sessionUsage.totalOutputTokens,
      cacheReadTokens: sessionUsage.totalCacheReadTokens,
      cacheCreationTokens: sessionUsage.totalCacheCreationTokens,
    });
    expect(projected.totalInputTokens).toBe(summary.totalInputTokens);
    expect(projected.totalCacheReadTokens).toBe(summary.totalCacheReadTokens);
    expect(projected.totalCacheWriteTokens).toBe(summary.totalCacheWriteTokens);
    expect(projected.cacheHitRate).toBeCloseTo(summary.cacheHitRate, 10);
    expect(projected.savedInputCostFraction).toBeCloseTo(summary.savedInputCostFraction, 10);
  });

  it('Pi adapter events fold to one summary without double-counting cache tokens', () => {
    const adapter = new PiEventAdapter();
    adapter.setContextWindow(200000);
    adapter.startTurn();

    const turn1Raw = {
      input: 1000,
      output: 80,
      cacheRead: 0,
      cacheWrite: 4000,
      totalTokens: 5080,
      cost: { total: 0.02 },
    };
    const turn2Raw = {
      input: 200,
      output: 300,
      cacheRead: 5000,
      cacheWrite: 0,
      totalTokens: 5500,
      cost: { total: 0.01 },
    };

    const collect = (gen: Generator<any>) => [...gen];

    collect(adapter.adaptEvent({
      type: 'message_end',
      message: { role: 'assistant', stopReason: 'stop', content: 't1', usage: turn1Raw },
    } as any));
    const complete1 = collect(adapter.adaptEvent({ type: 'agent_end' } as any))[0];

    adapter.startTurn();
    collect(adapter.adaptEvent({
      type: 'message_end',
      message: { role: 'assistant', stopReason: 'stop', content: 't2', usage: turn2Raw },
    } as any));
    const complete2 = collect(adapter.adaptEvent({ type: 'agent_end' } as any))[0];

    const expectedTurn1 = normalizeProviderUsage({
      input: turn1Raw.input,
      output: turn1Raw.output,
      cacheRead: turn1Raw.cacheRead,
      cacheWrite: turn1Raw.cacheWrite,
    });
    const expectedTurn2 = normalizeProviderUsage({
      input: turn2Raw.input,
      output: turn2Raw.output,
      cacheRead: turn2Raw.cacheRead,
      cacheWrite: turn2Raw.cacheWrite,
    });
    const expectedTurns: NormalizedCacheUsage[] = [expectedTurn1, expectedTurn2];
    expect(attachedCacheUsage(complete1.usage)).toEqual(expectedTurn1);
    expect(attachedCacheUsage(complete2.usage)).toEqual(expectedTurn2);
    // TE1-C2 lock: complete-input is uncached + read + write, counted once.
    expect(complete1.usage.inputTokens).toBe(5000);
    expect(complete2.usage.inputTokens).toBe(5200);

    const tracker = new UsageTracker();
    recordComplete(tracker, complete1.usage);
    recordComplete(tracker, complete2.usage);

    const profile = PROVIDER_CACHE_PROFILES.anthropic;
    const summary = tracker.getCacheEconomySummary(profile);
    expect(summary).toEqual(summarizeCacheEconomy(profile, expectedTurns));
    expect(summary.turns).toBe(2);
    expect(tracker.getSessionUsage().totalInputTokens).toBe(5000 + 5200);
    expect(tracker.getSessionUsage().totalCacheReadTokens).toBe(5000);
  });
});
