/**
 * A session-header callback may return the kernel result.
 * completed and reconciling mean the header write ran.
 * Any other status means the header was not changed.
 * A void callback is the older shape and is not a refusal.
 */
export function refusedSessionWrite(result: unknown): string | undefined {
  if (!result || typeof result !== 'object' || !('status' in result)) return undefined;
  const status = (result as { status: unknown }).status;
  if (status === 'completed' || status === 'reconciling') return undefined;
  if (typeof status !== 'string' || status.length === 0) return 'refused';
  const reason = (result as { reason?: unknown }).reason;
  return typeof reason === 'string' && reason.length > 0 ? reason : status;
}
