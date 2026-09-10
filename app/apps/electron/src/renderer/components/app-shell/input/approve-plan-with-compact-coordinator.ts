type CoordinatorEvent<TDetail> = { detail?: TDetail }
type CoordinatorListener<TDetail = Record<string, unknown>> = (
  event: CoordinatorEvent<TDetail>,
) => void

export interface PlanApprovalEventPort {
  addEventListener(type: string, listener: CoordinatorListener): void
  removeEventListener(type: string, listener: CoordinatorListener): void
}

export type PlanApprovalEventDetail = {
  sessionId?: string
  planPath?: string
  includeDraftInput?: boolean
  source?: string
}

type PendingPlan = {
  sessionId: string
  planPath?: string
  draftInput: string
}

type ActiveCompaction = PendingPlan & {
  completionListener: CoordinatorListener<{ sessionId?: string }>
  timeoutId: unknown
  completionStarted: boolean
}

export function createApprovePlanWithCompactCoordinator({
  events,
  getSessionId,
  consumeDraftInput,
  setPending,
  markDispatched,
  clearPending,
  submit,
  buildExecutionMessage,
  scheduleTimeout,
  cancelTimeout,
  timeoutMs,
  onError = (message, error) => console.error(message, error),
  onTimeout = (message) => console.warn(message),
}: {
  events: PlanApprovalEventPort
  getSessionId: () => string | undefined
  consumeDraftInput: () => string
  setPending: (pending: PendingPlan) => Promise<void>
  markDispatched: (sessionId: string) => Promise<void>
  clearPending: (sessionId: string) => Promise<void>
  submit: (message: string) => void
  buildExecutionMessage: (pending: {
    planPath?: string
    draftInput: string
  }) => string
  scheduleTimeout: (callback: () => void, timeoutMs: number) => unknown
  cancelTimeout: (timeoutId: unknown) => void
  timeoutMs: number
  onError?: (message: string, error: unknown) => void
  onTimeout?: (message: string) => void
}) {
  let started = false
  let disposed = false
  let approvalInFlight = false
  let active: ActiveCompaction | null = null

  const detachCompletionListener = (pending: ActiveCompaction) => {
    events.removeEventListener(
      'craft:compaction-complete',
      pending.completionListener as CoordinatorListener,
    )
    cancelTimeout(pending.timeoutId)
  }

  const finishActive = (pending: ActiveCompaction) => {
    if (active !== pending) return
    active = null
    approvalInFlight = false
  }

  const handleCompactionComplete = async (
    event: CoordinatorEvent<{ sessionId?: string }>,
  ) => {
    const pending = active
    if (
      !pending ||
      pending.completionStarted ||
      event.detail?.sessionId !== pending.sessionId
    ) {
      return
    }

    pending.completionStarted = true
    detachCompletionListener(pending)

    try {
      // Persist the dispatch claim before sending. FreeFormInput's reload
      // recovery listener observes this flag and must not send the same plan.
      await markDispatched(pending.sessionId)
      submit(
        buildExecutionMessage({
          planPath: pending.planPath,
          draftInput: pending.draftInput,
        }),
      )
      await clearPending(pending.sessionId)
    } catch (error) {
      onError(
        '[useApprovePlanWithCompact] Failed to execute a compacted plan:',
        error,
      )
    } finally {
      finishActive(pending)
    }
  }

  const handleApproval = async (
    event: CoordinatorEvent<PlanApprovalEventDetail>,
  ) => {
    const sessionId = getSessionId()
    if (
      disposed ||
      !sessionId ||
      approvalInFlight ||
      (event.detail?.sessionId && event.detail.sessionId !== sessionId)
    ) {
      return
    }

    // Claim synchronously, before the first await, so a double click cannot
    // persist a second plan or queue a second /compact command.
    approvalInFlight = true
    const planPath = event.detail?.planPath
    const draftInput =
      event.detail?.includeDraftInput === false ? '' : consumeDraftInput()
    const pending: PendingPlan = { sessionId, planPath, draftInput }

    try {
      await setPending(pending)
      if (disposed || getSessionId() !== sessionId) {
        await clearPending(sessionId)
        approvalInFlight = false
        return
      }

      const completionListener: CoordinatorListener<{ sessionId?: string }> =
        (completionEvent) => {
          void handleCompactionComplete(completionEvent)
        }
      const timeoutId = scheduleTimeout(() => {
        const timedOut = active
        if (!timedOut) return
        detachCompletionListener(timedOut)
        onTimeout(
          '[useApprovePlanWithCompact] Timed out waiting for craft:compaction-complete; clearing stale pending plan execution',
        )
        void clearPending(timedOut.sessionId)
          .catch((error) =>
            onError(
              '[useApprovePlanWithCompact] Failed to clear a timed-out pending plan:',
              error,
            ),
          )
          .finally(() => finishActive(timedOut))
      }, timeoutMs)

      active = {
        ...pending,
        completionListener,
        timeoutId,
        completionStarted: false,
      }
      events.addEventListener(
        'craft:compaction-complete',
        completionListener as CoordinatorListener,
      )

      // The listener must exist before /compact is submitted: fast or mocked
      // backends can complete synchronously.
      submit('/compact')
    } catch (error) {
      const pendingCompaction = active
      if (pendingCompaction) detachCompletionListener(pendingCompaction)
      active = null
      approvalInFlight = false
      onError(
        '[useApprovePlanWithCompact] Failed to start compacted plan execution:',
        error,
      )
    }
  }

  const approvalListener: CoordinatorListener<PlanApprovalEventDetail> = (
    event,
  ) => {
    void handleApproval(event)
  }

  return {
    start() {
      if (started) return
      started = true
      events.addEventListener(
        'craft:approve-plan-with-compact',
        approvalListener as CoordinatorListener,
      )
    },
    dispose() {
      if (disposed) return
      disposed = true
      events.removeEventListener(
        'craft:approve-plan-with-compact',
        approvalListener as CoordinatorListener,
      )
      if (active) detachCompletionListener(active)
      active = null
      approvalInFlight = false
    },
  }
}
