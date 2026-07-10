# Protocol Stubs — FROZEN v1.2.0

> **W0.1 notice (2026-07-09):** v1.2.0 is retained as the last recorded frozen baseline.
> It is not an authorization to start W1. The Lead must re-freeze canonical implementation
> parity and resolve ActionInvocation versioning, event payload rules, and AgentSeat/tag shape.

> **Composable-workspace notice (2026-07-09):** v1.2.0 cannot represent a workflow caller,
> idempotency/correlation, document base/committed revisions, ArtifactRef, capability ports,
> ExternalJob reconciliation, workflow definitions/runs, spatial entity bindings, or view/layout
> contributions. The non-frozen change proposal is
> `docs/contracts/composable-workspace-contracts.md`. Workers must not combine that proposal with
> this recorded baseline as if two contracts were active.

> **Lead-owned.** These type stubs define the shared vocabulary that all module Workers depend on.
> The canonical implementation lives in `app/packages/shared/src/protocol/`.

---

## SessionEvent

```ts
export type SessionEventKind =
  | 'action_invoked'
  | 'action_completed'
  | 'action_failed'
  | 'supervision_requested'
  | 'supervision_resolved'
  | 'conflict_superseded'
  | 'undo_applied'
  | 'timeline_note';

export type SessionEvent = {
  id: string; // uuid
  sessionId: string;
  teamRunId?: string;
  taskRunId?: string;
  kind: SessionEventKind;
  actionId?: string;
  actorRef: ActorRef;
  payload: Record<string, unknown>;
  undoHandle?: UndoHandle;
  evidenceRefs: string[];
  occurredAt: string; // ISO 8601
  seq: number;
};
```

---

## ActorRef

```ts
export type ActorKind = 'human' | 'agent' | 'system';

export type ActorRef = {
  kind: ActorKind;
  id: string; // user id, agent seat id, or 'system'
  displayName: string;
};
```

---

## ActionInvocation

```ts
export type ActionPermissionLevel =
  | 'L0_read_only'
  | 'L1_reversible'
  | 'L2_irreversible'
  | 'L3_destructive';

export type ActionSurface = 'human_ui' | 'agent' | 'both';

export type ActionInvocation = {
  invocationId: string; // uuid
  actionId: InternalActionId;
  payload: Record<string, unknown>;
  targets: ActionTargetRef[];
  callerKind: 'agent' | 'human_ui';
  sessionId: string;
  createdAt: string; // ISO 8601;
};

export type UndoHandle = {
  undoId: string;
  label: string;
  snapshot: unknown;
};
```

---

## WorkspaceFileLease

```ts
export type WorkspaceFileLease = {
  leaseId: string;
  workspaceId: string;
  filePath: string;
  heldBy: string; // ActorRef id
  acquiredAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  active: boolean;
};
```

---

## CanvasDocument (M07)

```ts
export type NodeType =
  | 'text_frame'
  | 'image_asset'
  | 'sticky'
  | 'code_block'
  | 'browser_embed'
  | 'video_frame'
  | 'aigc_placeholder'
  | 'connector'
  | 'group';

export type Viewport = { cx: number; cy: number; zoom: number };

export type CanvasNode = {
  id: string;
  type: NodeType;
  cx: number;
  cy: number;
  width: number;
  height: number;
  data: Record<string, unknown>;
  contentType?: 'static' | 'live';
  groupId?: string;
  seq: number;
};

export type CanvasEdge = {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
};

export type CanvasDocument = {
  id: string;
  workspaceId: string;
  sessionId?: string;
  nodes: Record<string, CanvasNode>;
  edges: Record<string, CanvasEdge>;
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
};
```

---

## AgentSeat & TeamRun (M04 / Spine Core)

```ts
export interface AgentSeat {
  seatId: string;
  role: 'lead' | 'worker' | 'reviewer';
  domainTags: ('media' | 'code' | 'ui' | 'data')[];
  trustLevel: 'internal' | 'host' | 'external';
}

export interface RuntimeLane {
  laneId: string;
  seatId: string;
  cwd: string;
  allowedCommandsPattern: string;
  status: 'idle' | 'running' | 'paused' | 'terminated';
}

export interface TeamRun {
  teamRunId: string;
  leaderSeatId: string;
  objective: string;
  status: 'pending' | 'active' | 'success' | 'failed';
  activeLanes: string[];
}

export interface RuntimeLaneEvent {
  type: 'lane_started' | 'lane_output' | 'lane_completed' | 'lane_error';
  laneId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface TeamContextSnapshot {
  teamRunId: string;
  snapshotId: string;
  laneStates: Record<string, string>;
  timelineSequence: number;
}

export interface LaneOutcome {
  laneId: string;
  exitCode: number;
  stdoutHash: string;
  generatedEvidenceRefs: string[];
}
```

---

## Required W0.1 Re-freeze Deltas

The Lead must either promote or explicitly reject each item in the composable-workspace proposal:

1. `callerKind: workflow_runtime` plus initiating/delegating ActorRefs;
2. contract/action versions, idempotency key, correlation/causation, workflow/node run IDs;
3. document `baseRevision` and outcome `committedRevision`;
4. orthogonal action policy rather than deriving undo from risk level;
5. typed generic SessionEvent payloads without module-specific event-kind forks;
6. ArtifactRef/Library handoff;
7. capability manifests and typed ports;
8. ExternalJob durable/reconciling states;
9. WorkflowDefinition/WorkflowRun/NodeRun;
10. SpatialDocument entity bindings and visual-only connectors;
11. discriminated view contributions and versioned layout snapshots.

No downstream implementation begins until its consumed items exist in one canonical frozen
version and implementation parity is recorded.
