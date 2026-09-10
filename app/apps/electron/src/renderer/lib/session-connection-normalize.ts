/**
 * Process-scoped, deduplicated legacy connection slug remaps.
 *
 * Production path used by App (session load + connection refresh). ChatPage
 * must not write setSessionModel on mount — this module is the only writer.
 *
 * Concurrent callers (loadSessionsFromServer ∥ refreshLlmConnections) share
 * process-level in-flight promises so a session is never double-persisted.
 */

import {
  planSessionConnectionNormalization,
  resolveStoredSessionConnectionSlug,
} from '@craft-agent/shared/config/llm-connections'
import type { LlmConnectionWithStatus } from '@craft-agent/shared/config/llm-connections'

export interface SessionConnectionSnapshot {
  id: string
  model?: string
  llmConnection?: string
  workspaceId?: string
}

export type SetSessionModelFn = (
  sessionId: string,
  workspaceId: string,
  model: string,
  connection: string,
) => Promise<void>

export interface NormalizeSessionConnectionsArgs {
  sessions: SessionConnectionSnapshot[]
  connections: Pick<LlmConnectionWithStatus, 'slug' | 'models' | 'defaultModel'>[]
  /** Mutable process-lifetime set of sessions that finished normalization. */
  alreadyNormalized: Set<string>
  /**
   * Process-lifetime map of in-flight persist promises. Set synchronously before
   * the first await so concurrent normalize calls join instead of double-writing.
   * Entries are removed on settle (success or failure) so failures remain retryable.
   */
  inFlight: Map<string, Promise<void>>
  windowWorkspaceId: string | null | undefined
  setSessionModel: SetSessionModelFn
  /** Visible failure path (toast). Missing workspace is retryable and silent. */
  onFailure?: (message: string, sessionId: string) => void
}

export interface NormalizeSessionConnectionsResult {
  attempted: number
  persisted: number
  skippedDone: number
  /** Joined an in-flight write started by another concurrent caller. */
  joinedInFlight: number
  deferred: number
  failed: number
}

/**
 * Normalize legacy connection slugs once per session per process.
 *
 * Mark / in-flight rules:
 * - Mark only after a successful write, or when no write is needed (slug already valid).
 * - In-flight is claimed synchronously before await; concurrent callers await the same promise.
 * - In-flight is released on settle (success or failure) — failure is never permanent.
 * - Do not mark when workspaceId is missing, recovery is ambiguous, or the write fails.
 */
export async function normalizeSessionConnectionsOnce(
  args: NormalizeSessionConnectionsArgs,
): Promise<NormalizeSessionConnectionsResult> {
  const result: NormalizeSessionConnectionsResult = {
    attempted: 0,
    persisted: 0,
    skippedDone: 0,
    joinedInFlight: 0,
    deferred: 0,
    failed: 0,
  }

  if (args.connections.length === 0 || args.sessions.length === 0) {
    return result
  }

  for (const session of args.sessions) {
    if (args.alreadyNormalized.has(session.id)) {
      result.skippedDone += 1
      continue
    }

    // Join a concurrent persist for the same session (loadSessions ∥ refreshConnections).
    const existing = args.inFlight.get(session.id)
    if (existing) {
      result.joinedInFlight += 1
      try {
        await existing
      } catch {
        // Lead call reports failure; we just avoid double-write.
      }
      if (args.alreadyNormalized.has(session.id)) {
        result.skippedDone += 1
      }
      // If still not done, leave unmarked — a later pass may retry after release.
      continue
    }

    if (!session.model || !session.llmConnection) {
      result.deferred += 1
      continue
    }

    // Already valid under current catalog — done, no write.
    const liveMatch = args.connections.some((c) => c.slug === session.llmConnection)
    if (liveMatch) {
      args.alreadyNormalized.add(session.id)
      result.skippedDone += 1
      continue
    }

    const plan = planSessionConnectionNormalization({
      sessionId: session.id,
      model: session.model,
      llmConnection: session.llmConnection,
      connections: args.connections,
      alreadyNormalized: args.alreadyNormalized,
    })

    if (plan.action !== 'persist') {
      result.deferred += 1
      continue
    }

    const workspaceId = session.workspaceId ?? args.windowWorkspaceId ?? null
    if (!workspaceId) {
      result.deferred += 1
      continue
    }

    result.attempted += 1

    // Claim in-flight synchronously before the first await of setSessionModel.
    const writePromise = (async () => {
      try {
        await args.setSessionModel(
          plan.sessionId,
          workspaceId,
          plan.model,
          plan.connectionSlug,
        )
        args.alreadyNormalized.add(session.id)
      } finally {
        args.inFlight.delete(session.id)
      }
    })()
    args.inFlight.set(session.id, writePromise)

    try {
      await writePromise
      result.persisted += 1
    } catch (error) {
      result.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      args.onFailure?.(message, session.id)
      // Unmarked + in-flight released — retry later.
    }
  }

  return result
}

/** Test helper: resolve without side effects. */
export function wouldPersistSessionConnection(
  session: SessionConnectionSnapshot,
  connections: Pick<LlmConnectionWithStatus, 'slug' | 'models' | 'defaultModel'>[],
): string | undefined {
  if (!session.model || !session.llmConnection) return undefined
  if (connections.some((c) => c.slug === session.llmConnection)) return undefined
  return resolveStoredSessionConnectionSlug(
    session.llmConnection,
    session.model,
    connections,
  )
}
