/**
 * W0.1 text freeze — ActionInvocation VNext + outcome/event payload
 * Source: docs/contracts/composable-workspace-contracts.md §4
 * Lead-owned. Replaces limited v1.2 callerKind union when ported.
 */

import type { ActorRef } from './actor'
import type { SemVer } from './artifact-ref'

export type { ActorRef }

export type CallerKind = 'human_ui' | 'agent' | 'workflow_runtime' | 'system'

/** VNext target shape (broader than v1.2 ActionTargetRef) */
export type ActionTargetRefVNext = {
  targetKind:
    | 'file'
    | 'artifact'
    | 'document'
    | 'workflow'
    | 'job'
    | 'view'
    | 'session'
    | 'runtime'
  targetId: string
  version?: string
}

export type InvocationContext = {
  actorRef: ActorRef
  delegatedBy?: ActorRef
  workspaceId: string
  projectId?: string
  sessionId: string
  workflowRunId?: string
  nodeRunId?: string
  surfaceInstanceId?: string
  correlationId: string
  causationId?: string
}

export type ActionInvocationVNext = {
  contractVersion: string
  invocationId: string
  idempotencyKey: string
  actionId: string
  callerKind: CallerKind
  context: InvocationContext
  input: unknown
  targets: ActionTargetRefVNext[]
  baseRevision?: number
  createdAt: string
}

export type ActionOutcome = {
  invocationId: string
  status: 'completed' | 'failed' | 'denied' | 'conflict' | 'cancelled'
  output?: unknown
  committedRevision?: number
  undoHandle?: { undoId: string; label: string; snapshot: unknown }
  evidenceRefs: string[]
  error?: {
    category:
      | 'validation'
      | 'permission'
      | 'conflict'
      | 'transient'
      | 'provider'
      | 'resource'
      | 'business'
    code: string
    message: string
    retryable: boolean
  }
}

export type ActionEventPayloadVNext = {
  schemaVersion: 1
  invocationId: string
  actionVersion: SemVer
  correlationId: string
  causationId?: string
  workflowRunId?: string
  nodeRunId?: string
  externalJobId?: string
  baseRevision?: number
  committedRevision?: number
  permissionDecisionRef: string
  outcomeStatus?: ActionOutcome['status']
  safeSummary?: string
  redactedFields: string[]
  evidenceRefs: string[]
  errorCode?: string
}

export const ACTION_INVOCATION_VNEXT_VERSION = 'w0.1-invocation-1' as const
