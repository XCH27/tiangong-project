import type { SessionMeta } from '@/atoms/sessions'

/** True when a session has no user-visible content and is safe to replace or auto-delete. */
export function isEmptySessionMeta(
  meta: SessionMeta | undefined,
  getDraft?: (sessionId: string) => string | undefined,
): boolean {
  if (!meta) return false
  if (meta.isProcessing) return false
  if (meta.lastFinalMessageId || meta.name) return false
  if ((meta.messageCount ?? 0) > 0) return false
  if (meta.preview?.trim()) return false
  if (getDraft?.(meta.id)?.trim()) return false
  return true
}
