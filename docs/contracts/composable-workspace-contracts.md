# Composable Workspace Contract Change Proposal

> **Status:** proposed v0.1; not frozen; Workers must not implement from this file  
> **Owner:** Lead  
> **Purpose:** one W0.1 change proposal to be merged into canonical protocol/action contracts,
> then archived; it is not a second runtime contract.

## 1. Contract Invariants

1. Human UI, Agent, and workflow callers invoke the same `actionId`, schema, executor, and
   permission path.
2. Risk, approval, undo, cancellation, retry, and evidence are orthogonal fields.
3. Audit sequence is not a document conflict algorithm. Mutable documents use explicit
   revisions and idempotency keys.
4. Artifact envelopes carry references and provenance, not duplicate content ownership.
5. Workflow, canvas, layout, job, and native-document state each have one authority.
6. New types below are proposals until promoted into the canonical TypeScript protocol and the
   frozen Markdown mirrors in the same Lead-owned change.

## 2. Shared References

```ts
export type SemVer = string
export type JsonSchemaRef = string

export type EntityRef = {
  entityKind: 'artifact' | 'capability' | 'workflow' | 'workflow_step' |
    'native_document' | 'job' | 'session_event'
  entityId: string
  version?: string
  ownerModuleId: string
}

export type ArtifactRef = {
  artifactId: string
  versionId: string
  kind: 'text' | 'image' | 'audio' | 'video' | 'web_project' |
    'presentation' | 'design_document' | 'media_project' | 'evidence' | 'file'
  mediaType: string
  ownerModuleId: string
  storageRef: string
  contentHash?: string
  nativeSchema?: string
  provenanceRef: string
  parentRefs: Array<{ artifactId: string; versionId: string }>
  licenseRef?: string
  sensitivity: 'public' | 'workspace' | 'restricted'
  previewRef?: string
}
```

`storageRef` is resolved by M05 or the native owner. It must not be exposed to an untrusted
caller as an unrestricted local path.

## 3. Capability Manifest

```ts
export type ExecutionMode =
  | 'inline_action'
  | 'runtime_lane'
  | 'local_job'
  | 'external_job'

export type PortDefinition = {
  portId: string
  direction: 'input' | 'output'
  schemaRef: JsonSchemaRef
  acceptedArtifactKinds?: ArtifactRef['kind'][]
  mediaTypes?: string[]
  cardinality: 'one' | 'optional' | 'many'
}

export type OperationPolicy = {
  riskTier: 'L0_read_only' | 'L1_local_mutation' | 'L2_high_impact' |
    'L3_destructive_or_privileged'
  approval: 'none' | 'policy_or_prompt' | 'always_prompt'
  undo: 'none' | 'inverse' | 'snapshot' | 'cancel_pending'
  cancellation: 'unsupported' | 'best_effort' | 'guaranteed_before_commit'
  retry: 'never' | 'idempotent_only' | 'policy_controlled'
  evidence: 'none' | 'aggregate' | 'required'
}

export type ActionOwner = {
  ownerKind: 'core_module' | 'plugin'
  ownerId: string
  namespace: string
}

export type ActionTargetRef = {
  targetKind: 'file' | 'artifact' | 'document' | 'workflow' | 'job' |
    'view' | 'session' | 'runtime'
  targetId: string
  version?: string
}

export type ActionDefinition = {
  schemaVersion: 1
  actionId: string
  version: SemVer
  owner: ActionOwner
  inputSchemaRef: JsonSchemaRef
  outputSchemaRef: JsonSchemaRef
  allowedCallers: Array<'human_ui' | 'agent' | 'workflow_runtime' | 'system'>
  sideEffectClass: 'none' | 'view_state' | 'local_state' | 'file_write' |
    'external_data' | 'external_publish' | 'destructive' | 'privileged'
  policy: OperationPolicy
  revisionPolicy: 'none' | 'optional' | 'required'
  executorKey: string
}

export type CapabilityOperation = {
  operationId: string
  version: SemVer
  actionRef: { actionId: string; version: SemVer }
  ports: PortDefinition[]
  composable: boolean
  executionMode: ExecutionMode
  concurrencyClass?: string
}

export type CapabilityManifest = {
  schemaVersion: 1
  capabilityId: string
  moduleId: string
  version: SemVer
  dependencies: Array<{ capabilityId: string; versionRange: string }>
  operations: CapabilityOperation[]
  viewContributionIds: string[]
  resourceProfile?: {
    localCpu: 'low' | 'medium' | 'high'
    localGpu: 'none' | 'optional' | 'required'
    memoryClass: 'small' | 'medium' | 'large'
  }
}
```

Manifests describe capability; they do not grant it. M12 resolves the effective manifest after
M00 identity and trust ceilings are applied.

## 4. Action Invocation Delta

The current frozen v1.2 stub cannot identify workflow callers or correlate a multi-step run.
W0.1 must amend it with equivalent fields:

```ts
export type CallerKind = 'human_ui' | 'agent' | 'workflow_runtime' | 'system'

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
  targets: ActionTargetRef[]
  baseRevision?: number
  createdAt: string
}

export type ActionOutcome = {
  invocationId: string
  status: 'completed' | 'failed' | 'denied' | 'conflict' | 'cancelled'
  output?: unknown
  committedRevision?: number
  undoHandle?: UndoHandle
  evidenceRefs: string[]
  error?: {
    category: 'validation' | 'permission' | 'conflict' | 'transient' |
      'provider' | 'resource' | 'business'
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
  documentRef?: EntityRef
  baseRevision?: number
  committedRevision?: number
  permissionDecisionRef: string
  outcomeStatus?: ActionOutcome['status']
  safeSummary?: string
  redactedFields: string[]
  evidenceRefs: string[]
  errorCode?: string
}
```

## 5. Workflow Definition

```ts
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

export type WorkflowBinding =
  | { kind: 'literal'; value: unknown }
  | { kind: 'workflow_input'; portId: string }
  | { kind: 'step_output'; nodeId: string; portId: string }
  | { kind: 'artifact'; ref: ArtifactRef }

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
```

v1 is a directed acyclic graph. Conditions use an explicit predicate operation whose output is
bound to downstream optional inputs; arbitrary cycles and embedded code are invalid.

## 6. Workflow Run

```ts
export type WorkflowRunStatus =
  | 'queued' | 'validating' | 'waiting_approval' | 'running' | 'paused'
  | 'succeeded' | 'partially_failed' | 'failed' | 'cancel_requested'
  | 'cancelled' | 'reconciling'

export type NodeRun = {
  nodeRunId: string
  nodeId: string
  status: 'blocked' | 'ready' | 'waiting_approval' | 'running' |
    'succeeded' | 'failed' | 'cancelled' | 'skipped' | 'reconciling'
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
```

WorkflowRun is a correlation record over M03 invocations, M04 tasks when used, and M08 jobs. It
must not introduce a second executor or permission database.

## 7. Spatial Document

```ts
export type SpatialNodeBinding = {
  nodeId: string
  entityRef: EntityRef
  frame: { x: number; y: number; width: number; height: number; z: number }
  rendererId: string
  presentation: Record<string, unknown>
}

export type SpatialConnector = {
  connectorId: string
  kind: 'visual_reference'
  sourceNodeId: string
  targetNodeId: string
  label?: string
}

export type SpatialDocument = {
  schemaVersion: 1
  documentId: string
  workspaceId: string
  revision: number
  nodes: SpatialNodeBinding[]
  connectors: SpatialConnector[]
  workflowLayouts: Array<{
    workflowId: string
    workflowVersion: number
    positions: Record<string, { x: number; y: number; width: number; height: number }>
  }>
  createdAt: string
  updatedAt: string
}
```

Executable edges remain in WorkflowDefinition. Removing a spatial binding does not delete the
underlying entity.

## 8. View Contributions and Layout

```ts
export type ViewContribution =
  | {
      kind: 'panel'
      contributionId: string
      defaultDock: 'left' | 'right' | 'bottom'
      routeSchemaRef: JsonSchemaRef
      lifecycle: 'view_only' | 'runtime_continues_when_hidden'
    }
  | {
      kind: 'surface'
      contributionId: string
      routeSchemaRef: JsonSchemaRef
      supportsSplit: boolean
    }
  | {
      kind: 'inspector'
      contributionId: string
      entityKinds: EntityRef['entityKind'][]
      routeSchemaRef: JsonSchemaRef
    }

export type ViewInstance = {
  instanceId: string
  contributionId: string
  ownerModuleId: string
  routeState: unknown
  routeStateVersion: number
}

export type LayoutNode =
  | {
      kind: 'split'
      direction: 'horizontal' | 'vertical'
      ratios: number[]
      children: LayoutNode[]
    }
  | {
      kind: 'stack'
      placement: 'main' | 'left' | 'right' | 'bottom'
      instanceIds: string[]
      activeInstanceId?: string
      collapsed?: boolean
      size?: number
    }

export type LayoutSnapshot = {
  schemaVersion: 1
  revision: number
  workspaceId: string
  tree: LayoutNode
  instances: ViewInstance[]
  savedAt: string
}
```

Each contribution owns validation and migration of its route state. Missing modules restore as
visible placeholders with remove/reinstall actions; they do not crash layout restoration.

## 9. Required Validation Rules

Before a workflow becomes `ready`, validation must confirm:

1. every capability and pinned version is available;
2. all required inputs are bound;
3. edge port schemas and artifact/media constraints are compatible;
4. the graph is acyclic;
5. every action is present in the initiator's effective manifest;
6. the budget is finite and compatible with provider estimates or explicitly unknown;
7. destructive/external side effects have a valid approval path;
8. output bindings resolve to declared ports;
9. no secret value is persisted in the definition or timeline payload.

## 10. State Machines

```text
Action:
received -> validated -> authorized -> waiting_approval? -> executing
-> committed -> evidence_recorded -> completed

Document:
loading -> migrating -> ready -> dirty -> saving -> ready
                                \-> conflict | recovery_required

Workflow definition:
draft -> validating -> ready | invalid

Workflow run:
queued -> validating -> waiting_approval? -> running
running -> paused | succeeded | partially_failed | failed | cancel_requested
cancel_requested -> cancelled | reconciling

View instance:
unmounted -> mounted -> visible | suspended -> unmounted
```

Approval wait must not hold a long-lived file lease. A commit must not be reported complete
until its evidence correlation is durable.

## 11. W0.1 Promotion Checklist

- Decide product namespace before freezing paths or plugin API keys.
- Merge accepted shared types into canonical protocol files.
- Reclassify the existing frozen action table using orthogonal policy fields.
- Add workflow, view, and canvas actions only after their payload schemas are frozen.
- Add generic typed payloads to SessionEvent; do not invent parallel event-name systems.
- Record canonical implementation version and parity evidence.
- Archive this proposal after the canonical contracts become authoritative.
