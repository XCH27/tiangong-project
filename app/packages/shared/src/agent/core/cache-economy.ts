/**
 * Cache economy — provider-aware prompt-cache accounting and prefix-stability
 * diagnostics. Token-economy layer L1 (docs/modules/suites/SYS-03-context-economy.md, Decision E12).
 *
 * Pure module: no I/O, no side effects, no new state authority. UsageTracker
 * and the backend event adapters remain the usage authorities; this module
 * supplies the economics they can consume:
 *
 *  1. PROVIDER_CACHE_PROFILES — how each provider's prompt cache actually
 *     behaves (explicit breakpoints vs implicit prefix match, alignment
 *     units, read/write cost multipliers, TTL), with per-field confidence.
 *     Pricing/mechanics are DATA with a verification date — update the data,
 *     never hard-code multipliers elsewhere.
 *  2. normalizeProviderUsage — folds the raw usage shapes Fleet actually
 *     receives (Anthropic SDK snake_case, Pi SDK camelCase, DeepSeek
 *     hit/miss, OpenAI prompt_tokens_details) into one honest record.
 *  3. estimateTurnEconomics / summarizeCacheEconomy — counterfactual "what
 *     would this input have cost with no cache", as a fraction always and in
 *     USD only when a real price is supplied (`unknown` stays unknown — E3).
 *  4. fingerprintZone / diagnoseCacheBreak — the three-zone prefix-stability
 *     rule made executable: detects stable-zone mutations and non-append log
 *     mutations, the two ways agent runtimes silently destroy cache hits.
 */

// ============================================================
// Provider cache profiles (data, not code)
// ============================================================

export type CacheKind = 'explicit' | 'implicit' | 'hybrid';

export type Confidence = 'verified' | 'estimated';

export interface ProviderCacheProfile {
  /** Stable profile id. */
  id: 'anthropic' | 'deepseek' | 'openai' | 'gemini';
  /** Explicit breakpoints (caller-controlled) vs implicit prefix matching. */
  kind: CacheKind;
  /** Minimum prefix length before anything can be cached (tokens). */
  minCacheablePrefixTokens: number;
  /**
   * Cache-unit granularity in tokens. A prefix only hits in whole units
   * (DeepSeek 64, OpenAI 128). 1 = no published unit granularity.
   */
  alignmentUnitTokens: number;
  /** Cached-read price as a multiple of the normal input price. */
  readCostMultiplier: number;
  /** Cache-write price as a multiple of the normal input price. */
  writeCostMultiplier: number;
  /** Human-readable TTL behavior. */
  ttl: string;
  /** Max explicit breakpoints per request, when kind is explicit. */
  maxBreakpoints?: number;
  /** Date the numbers below were last checked against provider docs. */
  verifiedAt: string;
  /** Confidence of the COST multipliers (mechanics are separately stable). */
  costConfidence: Confidence;
  /** Operational notes an adapter must respect. */
  notes: string;
}

/**
 * Verified 2026-07-18 against provider documentation. Multipliers marked
 * `estimated` vary by model line — an adapter may override per model, but the
 * override must carry its own verification date.
 */
export const PROVIDER_CACHE_PROFILES: Record<ProviderCacheProfile['id'], ProviderCacheProfile> = {
  anthropic: {
    id: 'anthropic',
    kind: 'explicit',
    minCacheablePrefixTokens: 1024, // 2048 on some small models — adapter may override
    alignmentUnitTokens: 1,
    readCostMultiplier: 0.1,
    writeCostMultiplier: 1.25, // 5-minute TTL writes; 1-hour TTL writes bill 2.0
    ttl: '5m default, refreshed on hit; 1h option at higher write cost',
    maxBreakpoints: 4,
    verifiedAt: '2026-07-18',
    costConfidence: 'verified',
    notes:
      'Caller places cache_control breakpoints; identical byte prefix required. ' +
      'Reads report cache_read_input_tokens, writes cache_creation_input_tokens. ' +
      'A write costs MORE than uncached input — caching a once-only prefix loses money.',
  },
  deepseek: {
    id: 'deepseek',
    kind: 'implicit',
    minCacheablePrefixTokens: 64,
    alignmentUnitTokens: 64,
    readCostMultiplier: 0.1, // legacy lines ~0.1x; 2026 V4 lines report as low as ~0.02x
    writeCostMultiplier: 1.0, // server-side disk cache, no write surcharge
    ttl: 'server-managed disk cache (hours+), no caller knobs',
    verifiedAt: '2026-07-18',
    costConfidence: 'estimated',
    notes:
      'Automatic prefix disk cache in 64-token units; a request hits only on ' +
      'whole matched units. Usage reports prompt_cache_hit_tokens / ' +
      'prompt_cache_miss_tokens. Free savings — but only if the prefix is ' +
      'byte-stable, so the three-zone rule matters most here.',
  },
  openai: {
    id: 'openai',
    kind: 'implicit',
    minCacheablePrefixTokens: 1024,
    alignmentUnitTokens: 128,
    readCostMultiplier: 0.5,
    writeCostMultiplier: 1.0,
    ttl: 'minutes-scale automatic eviction (roughly 5–10m, up to ~1h off-peak)',
    verifiedAt: '2026-07-18',
    costConfidence: 'estimated',
    notes:
      'Automatic prefix caching ≥1024 tokens in 128-token increments. Usage ' +
      'reports prompt_tokens_details.cached_tokens inside prompt_tokens.',
  },
  gemini: {
    id: 'gemini',
    kind: 'hybrid',
    minCacheablePrefixTokens: 1024,
    alignmentUnitTokens: 1,
    readCostMultiplier: 0.25,
    writeCostMultiplier: 1.0,
    ttl: 'implicit automatic; explicit cachedContent has caller TTL + per-hour storage billing',
    verifiedAt: '2026-07-18',
    costConfidence: 'estimated',
    notes:
      'Implicit caching is automatic on 2.5+ lines; explicit cachedContent adds ' +
      'storage-per-hour costs that this per-token model does NOT capture — ' +
      'treat explicit-cache storage as a separate ledger line.',
  },
};

/** Largest prefix length that can actually hit, given unit granularity. */
export function alignedPrefixTokens(profile: ProviderCacheProfile, prefixTokens: number): number {
  if (prefixTokens < profile.minCacheablePrefixTokens) return 0;
  const unit = Math.max(1, profile.alignmentUnitTokens);
  return Math.floor(prefixTokens / unit) * unit;
}

// ============================================================
// Usage normalization (the shapes Fleet actually receives)
// ============================================================

export interface NormalizedCacheUsage {
  /** Input tokens billed at the normal rate (not cached). */
  uncachedInputTokens: number;
  /** Input tokens served from cache. */
  cacheReadTokens: number;
  /** Input tokens written to cache this turn (explicit-cache providers). */
  cacheWriteTokens: number;
  /** Output tokens. */
  outputTokens: number;
  /** uncached + read + write. */
  totalInputTokens: number;
  /** cacheRead / totalInput; 0 when there was no input. */
  cacheHitRate: number;
}

/** Anthropic SDK message usage (claude event-adapter shape). */
interface AnthropicShapedUsage {
  input_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  output_tokens?: number;
}

/** Pi SDK usage (pi event-adapter shape). */
interface PiShapedUsage {
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
}

/** DeepSeek native usage. */
interface DeepSeekShapedUsage {
  prompt_cache_hit_tokens: number;
  prompt_cache_miss_tokens: number;
  completion_tokens?: number;
}

/** OpenAI native usage. */
interface OpenAiShapedUsage {
  prompt_tokens: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}

export type RawProviderUsage =
  | AnthropicShapedUsage
  | PiShapedUsage
  | DeepSeekShapedUsage
  | OpenAiShapedUsage;

function finalize(
  uncached: number,
  read: number,
  write: number,
  output: number,
): NormalizedCacheUsage {
  const total = uncached + read + write;
  return {
    uncachedInputTokens: uncached,
    cacheReadTokens: read,
    cacheWriteTokens: write,
    outputTokens: output,
    totalInputTokens: total,
    cacheHitRate: total > 0 ? read / total : 0,
  };
}

/**
 * Fold any raw provider usage shape into one normalized record.
 *
 * Anthropic semantics: input_tokens EXCLUDES cache tokens (uncached portion).
 * DeepSeek semantics: hit + miss partition the whole prompt; no write surcharge.
 * OpenAI semantics: cached_tokens is a SUBSET of prompt_tokens.
 * Pi semantics: `input` is the uncached portion, cacheRead/cacheWrite separate.
 */
export function normalizeProviderUsage(raw: RawProviderUsage): NormalizedCacheUsage {
  if ('prompt_cache_hit_tokens' in raw) {
    return finalize(
      raw.prompt_cache_miss_tokens,
      raw.prompt_cache_hit_tokens,
      0,
      raw.completion_tokens ?? 0,
    );
  }
  if ('prompt_tokens' in raw) {
    const cached = raw.prompt_tokens_details?.cached_tokens ?? 0;
    return finalize(
      Math.max(0, raw.prompt_tokens - cached),
      cached,
      0,
      raw.completion_tokens ?? 0,
    );
  }
  if ('input_tokens' in raw) {
    return finalize(
      raw.input_tokens,
      raw.cache_read_input_tokens ?? 0,
      raw.cache_creation_input_tokens ?? 0,
      raw.output_tokens ?? 0,
    );
  }
  return finalize(raw.input, raw.cacheRead ?? 0, raw.cacheWrite ?? 0, raw.output);
}

// ============================================================
// Economics (counterfactual: same input, no cache)
// ============================================================

export interface TurnEconomics {
  /** Fraction of the no-cache input cost that the cache saved (can be negative). */
  savedInputCostFraction: number;
  /** Input cost units actually incurred (tokens × multiplier). */
  actualInputCostUnits: number;
  /** Input cost units a cache-less request would have incurred. */
  baselineInputCostUnits: number;
  /** USD figures only when a real price was supplied — never guessed. */
  savedUsd?: number;
  actualInputUsd?: number;
  baselineInputUsd?: number;
  /** Confidence inherited from the profile's cost data. */
  confidence: Confidence;
}

export interface EconomicsOptions {
  /** Normal (uncached) input price in USD per million tokens, when known. */
  inputPricePerMTok?: number;
}

export function estimateTurnEconomics(
  profile: ProviderCacheProfile,
  usage: NormalizedCacheUsage,
  options: EconomicsOptions = {},
): TurnEconomics {
  const baseline = usage.totalInputTokens; // every token at 1.0x
  const actual =
    usage.uncachedInputTokens +
    usage.cacheReadTokens * profile.readCostMultiplier +
    usage.cacheWriteTokens * profile.writeCostMultiplier;

  const savedFraction = baseline > 0 ? (baseline - actual) / baseline : 0;

  const result: TurnEconomics = {
    savedInputCostFraction: savedFraction,
    actualInputCostUnits: actual,
    baselineInputCostUnits: baseline,
    confidence: profile.costConfidence,
  };

  const price = options.inputPricePerMTok;
  if (price !== undefined && price >= 0) {
    const perTok = price / 1_000_000;
    result.baselineInputUsd = baseline * perTok;
    result.actualInputUsd = actual * perTok;
    result.savedUsd = (baseline - actual) * perTok;
  }
  return result;
}

// ============================================================
// Prefix stability (the three-zone rule, executable)
// ============================================================

/**
 * A snapshot of the prompt zones before a request:
 *  - stableZone: system prompt + tool definitions + fixed instructions.
 *    MUST be byte-identical across turns of one session configuration.
 *  - logZone: conversation/tool history. MUST only be appended to.
 * The volatile scratch tail is deliberately not fingerprinted.
 */
export interface PromptPrefixSnapshot {
  stableZone: string[];
  logZone?: string[];
}

/** FNV-1a 64-bit over parts joined with an unlikely separator. */
export function fingerprintZone(parts: string[]): string {
  const FNV_OFFSET = 0xcbf29ce484222325n;
  const FNV_PRIME = 0x100000001b3n;
  const MASK = 0xffffffffffffffffn;
  let hash = FNV_OFFSET;
  const text = parts.join('');
  for (let i = 0; i < text.length; i++) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK;
  }
  return hash.toString(16).padStart(16, '0');
}

export interface CacheBreakDiagnosis {
  broken: boolean;
  zone: 'stable' | 'log' | 'none';
  reason: string;
}

/**
 * Diagnose whether the next request destroys the provider prefix cache
 * relative to the previous one. Catches the two silent killers:
 * stable-zone mutation and non-append history rewriting (compaction,
 * reordering, in-place edits).
 */
export function diagnoseCacheBreak(
  prev: PromptPrefixSnapshot,
  next: PromptPrefixSnapshot,
): CacheBreakDiagnosis {
  if (fingerprintZone(prev.stableZone) !== fingerprintZone(next.stableZone)) {
    return {
      broken: true,
      zone: 'stable',
      reason:
        'Stable zone changed (system prompt / tool definitions / fixed instructions). ' +
        'Every provider treats this as a brand-new prefix.',
    };
  }
  const prevLog = prev.logZone ?? [];
  const nextLog = next.logZone ?? [];
  if (nextLog.length < prevLog.length) {
    return {
      broken: true,
      zone: 'log',
      reason: 'Log zone shrank — history was rewritten or compacted in place.',
    };
  }
  for (let i = 0; i < prevLog.length; i++) {
    if (prevLog[i] !== nextLog[i]) {
      return {
        broken: true,
        zone: 'log',
        reason: `Log zone mutated at entry ${i} — history must be append-only within a cached span.`,
      };
    }
  }
  return { broken: false, zone: 'none', reason: 'Prefix preserved (stable zone intact, log append-only).' };
}

// ============================================================
// Session-level summary (fold, no state)
// ============================================================

export interface CacheEconomySummary {
  turns: number;
  totalUncachedInputTokens: number;
  totalCacheReadTokens: number;
  totalCacheWriteTokens: number;
  totalOutputTokens: number;
  totalInputTokens: number;
  cacheHitRate: number;
  savedInputCostFraction: number;
  savedUsd?: number;
  prefixBreaks: number;
  confidence: Confidence;
}

/**
 * Project NormalizedCacheUsage from already-folded complete-input ledger
 * fields (UsageTracker / SessionManager.tokenUsage). inputTokens already
 * includes cache read/write; this inverts that so we do not keep a second
 * ledger. Clamp at zero matches splitUsage() if a producer was exclusive.
 */
export function cacheUsageFromLedger(usage: {
  inputTokens: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}): NormalizedCacheUsage {
  const read = usage.cacheReadTokens ?? 0;
  const write = usage.cacheCreationTokens ?? 0;
  return finalize(
    Math.max(0, usage.inputTokens - read - write),
    read,
    write,
    usage.outputTokens ?? 0,
  );
}

/**
 * Session-level fold from the existing usage ledger. SessionManager stores
 * cumulative totals, not per-turn rows, so this is one combined turn.
 */
export function summarizeSessionCacheEconomy(
  profile: ProviderCacheProfile,
  usage: {
    inputTokens: number;
    outputTokens?: number;
    cacheReadTokens?: number;
    cacheCreationTokens?: number;
  },
  options: EconomicsOptions & { prefixSnapshots?: PromptPrefixSnapshot[] } = {},
): CacheEconomySummary {
  return summarizeCacheEconomy(profile, [cacheUsageFromLedger(usage)], options);
}

export function summarizeCacheEconomy(
  profile: ProviderCacheProfile,
  turns: NormalizedCacheUsage[],
  options: EconomicsOptions & { prefixSnapshots?: PromptPrefixSnapshot[] } = {},
): CacheEconomySummary {
  let uncached = 0;
  let read = 0;
  let write = 0;
  let output = 0;
  for (const t of turns) {
    uncached += t.uncachedInputTokens;
    read += t.cacheReadTokens;
    write += t.cacheWriteTokens;
    output += t.outputTokens;
  }
  const combined = finalize(uncached, read, write, output);
  const economics = estimateTurnEconomics(profile, combined, options);

  let prefixBreaks = 0;
  const snaps = options.prefixSnapshots ?? [];
  for (let i = 1; i < snaps.length; i++) {
    if (diagnoseCacheBreak(snaps[i - 1]!, snaps[i]!).broken) prefixBreaks++;
  }

  return {
    turns: turns.length,
    totalUncachedInputTokens: uncached,
    totalCacheReadTokens: read,
    totalCacheWriteTokens: write,
    totalOutputTokens: output,
    totalInputTokens: combined.totalInputTokens,
    cacheHitRate: combined.cacheHitRate,
    savedInputCostFraction: economics.savedInputCostFraction,
    savedUsd: economics.savedUsd,
    prefixBreaks,
    confidence: profile.costConfidence,
  };
}
