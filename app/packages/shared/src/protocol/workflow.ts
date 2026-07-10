/**
 * W0.1 text freeze — Workflow definition/run (correlation only)
 * Source: docs/contracts/composable-workspace-contracts.md §5–6
 */

import type { ArtifactRef } from './artifact-ref'
import type { ActorRef, ActionOutcome } from './action-invocation-vnext'

export type PortDefinition = {
  portId: string
  direction: 'input' | 'output'
  schemaRef: string
  acceptedArtifactKinds?: ArtifactRef['kind'][]
  mediaTypes?: string[]
  cardinality: 'one' | 'optional' | 'many'
}

export type WorkflowBinding =
  | { kind: 'literal'; value: unknown }
  | { kind: 'workflow_input'; portId: string }
  | { kind: 'step_output'; nodeId: string; portId: string }
  | { kind: 'artifact'; ref: ArtifactRef }

export type WorkflowNode = {
  nodeId: string
  capabilityId: string
  capabilityVersion: string
  operationId: string
  inputBindings: Record<string, WorkflowBinding>
  configuration: Record<string, unknown>
  retryPolicy: { maxAttempts: number; backoffMs: number }
  timeoutMs?: number
  humanGate: 'inherit_operation' | 'always_before_step'
  concurrencyKey?: string
}

export type WorkflowEdge = {
  edgeId: string
  from: { nodeId: string; portId: string }
  to: { nodeId: string; portId: string }
}

export type WorkflowDefinition = {
  schemaVersion: 1
  workflowId: string
  version: number
  title: string
  objective?: string
  authorRef: ActorRef
  inputs: PortDefinition[]
  outputs: Array<{ portId: string; binding: WorkflowBinding }>
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  policyRef: string
  resourceBudget: {
    cost:
      | { mode: 'bounded'; maxAmount: number; currency: string }
      | { mode: 'unknown_requires_approval' }
    maxConcurrentSteps: number
    maxDurationMs: number
    maxLocalCpuJobs: number
    maxLocalGpuJobs: number
  }
  definitionHash: string
  createdAt: string
}

export type WorkflowRunStatus =
  | 'queued'
  | 'validating'
  | 'waiting_approval'
  | 'running'
  | 'paused'
  | 'succeeded'
  | 'partially_failed'
  | 'failed'
  | 'cancel_requested'
  | 'cancelled'
  | 'reconciling'

export type NodeRun = {
  nodeRunId: string
  nodeId: string
  status:
    | 'blocked'
    | 'ready'
    | 'waiting_approval'
    | 'running'
    | 'succeeded'
    | 'failed'
    | 'cancelled'
    | 'skipped'
    | 'reconciling'
  invocationId?: string
  externalJobId?: string
  attempts: number
  inputRefs: ArtifactRef[]
  outputRefs: ArtifactRef[]
  evidenceRefs: string[]
  error?: ActionOutcome['error']
  startedAt?: string
  finishedAt?: string
}

export type WorkflowRun = {
  runId: string
  workflowId: string
  workflowVersion: number
  definitionHash: string
  initiator: ActorRef
  supervisingAgentRef?: ActorRef
  status: WorkflowRunStatus
  policySnapshotRef: string
  budget: WorkflowDefinition['resourceBudget']
  nodeRuns: NodeRun[]
  outputRefs: ArtifactRef[]
  evidenceRefs: string[]
  createdAt: string
  updatedAt: string
}

export const WORKFLOW_CONTRACT_VERSION = 'w0.1-workflow-1' as const
