# Protocol Stubs — FROZEN v1.2.0

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
