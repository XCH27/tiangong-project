# Protocol Stubs — FROZEN v1.0.0

> **Lead-owned.** These type stubs define the shared vocabulary that all module Workers depend on.
> Workers **read** these stubs to know what types exist. They do **not** implement the types here —
> the canonical implementation lives in `app/packages/shared/src/protocol/`.
>
> When a stub is promoted to a real implementation, the Lead updates this file to say
> `STATUS: implemented` and links to the source file.

---

## SessionEvent

**STATUS: stub** — canonical implementation pending (Lead creates in W1)

```ts
// app/packages/shared/src/protocol/session-event.ts (to be created by Lead)

export type SessionEventKind =
  | 'action_invoked'
  | 'action_completed'
  | 'action_failed'
  | 'supervision_requested'
  | 'supervision_resolved'
  | 'conflict_superseded'
  | 'undo_applied'
  | 'timeline_note';            // human annotation

export type SessionEvent = {
  id: string;                   // uuid
  sessionId: string;
  teamRunId?: string;           // present if event occurred inside a TeamRun
  taskRunId?: string;
  kind: SessionEventKind;
  actionId?: string;            // InternalActionId if kind is action_*
  actorRef: ActorRef;           // who caused the event
  payload: Record<string, unknown>;
  undoHandle?: UndoHandle;      // present when undo is supported
  evidenceRefs: string[];       // paths to artefact evidence (files, screenshots)
  occurredAt: string;           // ISO 8601
  seq: number;                  // monotonically increasing within the session
};
```

---

## ActorRef

**STATUS: stub** — canonical implementation pending (Lead creates in W1)

```ts
// app/packages/shared/src/protocol/actor.ts (to be created by Lead)

export type ActorKind = 'human' | 'agent' | 'system';

export type ActorRef = {
  kind: ActorKind;
  id: string;                   // user id, agent seat id, or 'system'
  displayName: string;
};
```

---

## ActionInvocation

**STATUS: stub** — canonical implementation pending (Lead creates in W1)

```ts
// app/packages/shared/src/protocol/internal-action.ts (partial — CONTRACT_VERSION field exists)
// Full shape below is the target once the Lead promotes the stub.

export type ActionPermissionLevel =
  | 'L0_read_only'
  | 'L1_reversible'
  | 'L2_irreversible';

export type ActionSurface = 'human_ui' | 'agent' | 'both';

export type ActionInvocation = {
  id: string;                   // uuid for this specific invocation
  actionId: InternalActionId;   // from the frozen action-ids table
  surface: ActionSurface;
  actorRef: ActorRef;
  sessionId: string;
  teamRunId?: string;
  taskRunId?: string;
  payload: Record<string, unknown>;
  seq: number;                  // assigned by Action Registry, monotonically increasing
  invokedAt: string;            // ISO 8601
};

export type UndoHandle = {
  actionId: InternalActionId;
  invocationId: string;
  inversePayload: Record<string, unknown>;
};
```

---

## WorkspaceFileLease

**STATUS: stub** — canonical implementation pending (Lead creates in W2 alongside M05)

```ts
// app/packages/shared/src/protocol/lease.ts (to be created by Lead)

export type LeaseMode = 'read' | 'write' | 'exclusive_write';

export type WorkspaceFileLease = {
  id: string;                   // uuid
  workspacePath: string;        // absolute path
  mode: LeaseMode;
  holderRef: ActorRef;
  sessionId: string;
  teamRunId?: string;
  taskRunId?: string;
  acquiredAt: string;           // ISO 8601
  expiresAt?: string;           // ISO 8601; absent = held until explicit release
  releasedAt?: string;          // ISO 8601; set when released
};
```

---

## CanvasDocument (M07)

**STATUS: stub** — canonical implementation pending (Lead creates in W0 before W3 begins)

```ts
// app/packages/shared/src/protocol/canvas.ts (to be created by Lead)

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

## Promotion Checklist

When the Lead promotes a stub to a real implementation:

1. Create the file at the path shown in the stub comment.
2. Copy the type definitions and extend as needed.
3. Update `STATUS` in this file to `implemented` and add the source file path.
4. Export the types from `app/packages/shared/src/protocol/index.ts`.
5. Bump the relevant `CONTRACT_VERSION` in `internal-action.ts`.
6. Notify Workers via a board card update.
