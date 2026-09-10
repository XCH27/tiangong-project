import { useCallback, useEffect, useRef } from "react";

/**
 * useKeyedAutoClearTimers — schedules keyed timeouts that are always cleared
 * on unmount, and replaced when re-scheduled under the same key.
 *
 * Replaces bare setTimeout calls for transient UI state (e.g. validation
 * success/error badges) so an unmounted page never calls setState and a
 * re-validated row's old timer cannot clear the new result.
 */
export function useKeyedAutoClearTimers() {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers.values()) clearTimeout(id);
      timers.clear();
    };
  }, []);

  return useCallback((key: string, fn: () => void, delayMs: number) => {
    const existing = timersRef.current.get(key);
    if (existing) clearTimeout(existing);
    const id = setTimeout(() => {
      timersRef.current.delete(key);
      fn();
    }, delayMs);
    timersRef.current.set(key, id);
  }, []);
}
