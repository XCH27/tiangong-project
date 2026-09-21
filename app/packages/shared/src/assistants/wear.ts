/**
 * Who wears an assistant.
 *
 * AionUi welds an assistant to a CLI engine. Fleet does not. The record is a
 * loadout; the wearer is a separate choice:
 *
 * - `session`  — this conversation wears it
 * - `delegate` — a child run wears it (the default when the job is a different specialty)
 * - `cli`      — optionally wrap a CLI; never required, never inferred
 *
 * Casual self-swap is the failure mode. Implementing, then needing research, is
 * a delegate. Changing who *this* conversation is requires an explicit confirm.
 */

export type AssistantWearer = 'session' | 'delegate' | 'cli'

export type WearAsk = 'apply' | 'specialist' | 'cli'

export type WearRequest = {
  currentAssistantId: string | null
  requestedAssistantId: string
  asked: WearAsk
}

export type WearDecision = {
  wearer: AssistantWearer
  /** False when there is nothing to do, or the request is illegal. */
  applied: boolean
  /** True only for an explicit session identity change. */
  needsConfirmation: boolean
  reason: string
}

function isId(value: string | null): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Decide who should wear the requested identity.
 *
 * `asked: 'apply'` on a conversation that already has a *different* identity is
 * rewritten to `delegate`. To actually change this conversation, call
 * `confirmSessionSwitch` after the person has confirmed the job changed.
 */
export function proposeWear(request: WearRequest): WearDecision {
  if (!['apply', 'specialist', 'cli'].includes(request.asked)) {
    return { wearer: 'session', applied: false, needsConfirmation: false, reason: 'unknown assistant action' }
  }
  if (!isId(request.requestedAssistantId)) {
    return {
      wearer: 'session',
      applied: false,
      needsConfirmation: false,
      reason: 'requested assistant id is empty',
    }
  }

  if (request.asked === 'cli') {
    return {
      wearer: 'cli',
      applied: true,
      needsConfirmation: false,
      reason: 'CLI wrapping is opt-in and stays opt-in',
    }
  }

  if (request.currentAssistantId === request.requestedAssistantId && request.asked !== 'specialist') {
    return {
      wearer: 'session',
      applied: false,
      needsConfirmation: false,
      reason: 'this conversation already wears that identity',
    }
  }

  if (request.asked === 'specialist') {
    return {
      wearer: 'delegate',
      applied: true,
      needsConfirmation: false,
      reason: 'a different specialty is a delegate, shown inline',
    }
  }

  if (isId(request.currentAssistantId)) {
    return {
      wearer: 'delegate',
      applied: true,
      needsConfirmation: false,
      reason:
        'this conversation already has an identity; a different specialty is delegated, not worn',
    }
  }

  return {
    wearer: 'session',
    applied: true,
    needsConfirmation: false,
    reason: 'this conversation has no identity yet',
  }
}

/**
 * The person confirmed that *this* conversation's job changed.
 * That is the only path that swaps the session's own identity.
 */
export function confirmSessionSwitch(request: Omit<WearRequest, 'asked'>): WearDecision {
  if (!isId(request.requestedAssistantId)) {
    return {
      wearer: 'session',
      applied: false,
      needsConfirmation: false,
      reason: 'requested assistant id is empty',
    }
  }
  if (request.currentAssistantId === request.requestedAssistantId) {
    return {
      wearer: 'session',
      applied: false,
      needsConfirmation: false,
      reason: 'this conversation already wears that identity',
    }
  }
  return {
    wearer: 'session',
    applied: true,
    needsConfirmation: false,
    reason: 'the person confirmed this conversation changed job',
  }
}
