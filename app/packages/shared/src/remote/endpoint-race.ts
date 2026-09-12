/**
 * Trying the candidate addresses without making the user wait for each one in turn.
 *
 * P9-rev publishes every usable address and the client tries them "in order". Doing
 * that strictly serially means one TCP timeout per dead candidate: five interfaces is
 * half a minute of a spinner before the first honest answer. And order still matters —
 * a LAN address that works is better than an overlay hop that also works.
 *
 * So: start the candidates in order but overlapping, with a short stagger, and take
 * the first success; if an earlier-ranked candidate succeeds within a small grace
 * window, prefer it. Every attempt's failure is kept, so the surface can say what
 * actually went wrong instead of "connect-failed".
 */

export interface RaceAttempt {
  endpoint: string;
  ok: boolean;
  error?: string;
  /** Milliseconds from the start of the race. */
  elapsedMs: number;
}

export interface RaceResult<T> {
  /** The endpoint that won, or null when every candidate failed. */
  endpoint: string | null;
  value?: T;
  attempts: RaceAttempt[];
  /** First error from the highest-ranked candidate that produced one. */
  error?: string;
}

export interface RaceOptions {
  /** Delay before starting each next candidate. Keeps rank meaningful. */
  staggerMs?: number;
  /** After a win, how long to keep waiting for a better-ranked candidate. */
  preferenceGraceMs?: number;
  /** Give up on a single candidate after this long. */
  attemptTimeoutMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULTS = {
  staggerMs: 250,
  preferenceGraceMs: 400,
  attemptTimeoutMs: 8_000,
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * `connect` must resolve on success and reject on failure. It is called at most once
 * per endpoint. Cancellation is advisory: a late success is simply discarded, so
 * `connect` should clean up after itself when it loses.
 */
export async function raceEndpoints<T>(
  endpoints: readonly string[],
  connect: (endpoint: string) => Promise<T>,
  options: RaceOptions = {},
): Promise<RaceResult<T>> {
  const staggerMs = options.staggerMs ?? DEFAULTS.staggerMs;
  const graceMs = options.preferenceGraceMs ?? DEFAULTS.preferenceGraceMs;
  const timeoutMs = options.attemptTimeoutMs ?? DEFAULTS.attemptTimeoutMs;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? defaultSleep;

  if (endpoints.length === 0) return { endpoint: null, attempts: [] };

  const started = now();
  const attempts: RaceAttempt[] = [];
  const wins = new Map<number, T>();
  let settledCount = 0;

  const runOne = async (endpoint: string, rank: number): Promise<void> => {
    if (rank > 0) await sleep(staggerMs * rank);
    try {
      const value = await withTimeout(connect(endpoint), timeoutMs, sleep);
      attempts.push({ endpoint, ok: true, elapsedMs: now() - started });
      wins.set(rank, value);
    } catch (error) {
      attempts.push({
        endpoint,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        elapsedMs: now() - started,
      });
    } finally {
      settledCount += 1;
    }
  };

  const running = endpoints.map((endpoint, rank) => runOne(endpoint, rank));

  // Wait for a first win, then give better-ranked candidates a short grace period.
  await Promise.race([
    Promise.all(running),
    (async () => {
      while (wins.size === 0 && settledCount < endpoints.length) {
        await sleep(25);
      }
      if (wins.size === 0) return;
      const best = Math.min(...wins.keys());
      if (best === 0) return;
      const deadline = now() + graceMs;
      while (now() < deadline && settledCount < endpoints.length) {
        if (wins.has(0)) return;
        await sleep(25);
      }
    })(),
  ]);

  if (wins.size === 0) {
    // Surface the failure from the highest-ranked candidate — that is the one the
    // user's network is most likely to be about.
    const ranked = endpoints
      .map((endpoint) => attempts.find((attempt) => attempt.endpoint === endpoint))
      .filter((attempt): attempt is RaceAttempt => attempt !== undefined);
    return { endpoint: null, attempts, error: ranked.find((a) => !a.ok)?.error };
  }

  const winner = Math.min(...wins.keys());
  return { endpoint: endpoints[winner]!, value: wins.get(winner), attempts };
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  sleep: (ms: number) => Promise<void>,
): Promise<T> {
  let timedOut = false;
  const timeout = sleep(ms).then(() => {
    timedOut = true;
    throw new Error('ENDPOINT_TIMEOUT');
  });
  const result = await Promise.race([promise, timeout]);
  if (timedOut) throw new Error('ENDPOINT_TIMEOUT');
  return result as T;
}

/**
 * Put the endpoint that last worked first, keeping the rest in their published order.
 * A machine that moves between networks then re-finds its usual address immediately.
 */
export function preferLastGood(
  endpoints: readonly string[],
  lastGood: string | undefined,
): string[] {
  if (!lastGood) return [...endpoints];
  const rest = endpoints.filter((endpoint) => endpoint !== lastGood);
  return endpoints.includes(lastGood) ? [lastGood, ...rest] : [...endpoints];
}
