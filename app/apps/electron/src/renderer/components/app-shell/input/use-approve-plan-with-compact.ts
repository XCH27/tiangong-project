import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { buildPlanApprovalMessage } from '../plan-approval-message'
import type { FileAttachment } from '../../../../shared/types'
import { createApprovePlanWithCompactCoordinator } from './approve-plan-with-compact-coordinator'
export type { PlanApprovalEventDetail } from './approve-plan-with-compact-coordinator'

// Escape hatch: if compaction never completes (crash, stuck session), the pending
// listener is discarded so it cannot fire against a later unrelated compaction.
const COMPACTION_LISTENER_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Listen for craft:approve-plan-with-compact events (Accept & Compact option).
 * Compacts the conversation first, then executes the plan.
 *
 * The coordinator keeps approval single-flight, registers completion before
 * submitting /compact, and marks execution dispatched before sending it.
 *
 * The pending state is persisted to survive page reloads (CMD+R); reload
 * recovery lives in FreeFormInput.
 */
export function useApprovePlanWithCompact({
  sessionId,
  onSubmit,
  consumeInputDraftSnapshot,
}: {
  sessionId: string | undefined
  onSubmit: (
    message: string,
    attachments?: FileAttachment[],
    skillSlugs?: string[],
  ) => void
  consumeInputDraftSnapshot: () => string
}) {
  const { t } = useTranslation()
  const onSubmitRef = React.useRef(onSubmit)
  const consumeInputDraftSnapshotRef = React.useRef(consumeInputDraftSnapshot)
  const translateRef = React.useRef(t)

  onSubmitRef.current = onSubmit
  consumeInputDraftSnapshotRef.current = consumeInputDraftSnapshot
  translateRef.current = t

  React.useEffect(() => {
    const coordinator = createApprovePlanWithCompactCoordinator({
      events: window,
      getSessionId: () => sessionId,
      consumeDraftInput: () => consumeInputDraftSnapshotRef.current(),
      setPending: async (pending) => {
        await window.electronAPI.sessionCommand(pending.sessionId, {
          type: 'setPendingPlanExecution',
          planPath: pending.planPath ?? '',
          draftInputSnapshot: pending.draftInput,
        })
      },
      markDispatched: async (pendingSessionId) => {
        await window.electronAPI.sessionCommand(pendingSessionId, {
          type: 'markPendingPlanExecutionDispatched',
        })
      },
      clearPending: async (pendingSessionId) => {
        await window.electronAPI.sessionCommand(pendingSessionId, {
          type: 'clearPendingPlanExecution',
        })
      },
      submit: (message) => onSubmitRef.current(message, undefined),
      buildExecutionMessage: ({ planPath, draftInput }) =>
        buildPlanApprovalMessage(
          { planPath, draftInput },
          translateRef.current,
        ),
      scheduleTimeout: (callback, timeoutMs) =>
        setTimeout(callback, timeoutMs),
      cancelTimeout: (timeoutId) =>
        clearTimeout(timeoutId as ReturnType<typeof setTimeout>),
      timeoutMs: COMPACTION_LISTENER_TIMEOUT_MS,
    })
    coordinator.start()
    return () => coordinator.dispose()
  }, [sessionId])
}
