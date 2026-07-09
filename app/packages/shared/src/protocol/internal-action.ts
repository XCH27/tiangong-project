/**
 * Internal Action Protocol — FROZEN CONTRACT v1.0.0
 *
 * Lead-owned. No Worker may add, rename, or remove action ids without bumping
 * CONTRACT_VERSION and updating docs/contracts/action-ids.md in the same commit.
 *
 * Extension rule:
 *   - Adding a NEW action id to InternalActionId → minor bump (1.0.0 → 1.1.0)
 *   - Renaming or removing an existing id → major bump (1.x.x → 2.0.0)
 *   - Changing a required payload field shape → major bump
 *   - Adding an optional payload field → minor bump
 *
 * Workers that consume this file must import the VERSION constant and assert it
 * at startup so stale copies are caught early.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Contract version sentinel
// ---------------------------------------------------------------------------

export const CONTRACT_VERSION = '1.0.0' as const

// ---------------------------------------------------------------------------
// Action ID registry  (FROZEN — see extension rule above)
// ---------------------------------------------------------------------------

/**
 * All first-party internal action ids.
 *
 * Naming convention:  <domain>.<verb>[.<qualifier>]
 *   domain   — feature area (file, session, label, ...)
 *   verb     — imperative (create, update, delete, rename, ...)
 *   qualifier— optional disambiguation (e.g. .bulk)
 *
 * Every id here has a corresponding entry in docs/contracts/action-ids.md.
 */
export const InternalActionId = {
  // --- File domain ---
  FILE_CREATE:        'file.create',
  FILE_UPDATE:        'file.update',
  FILE_DELETE:        'file.delete',
  FILE_RENAME:        'file.rename',

  // --- Session domain ---
  SESSION_RENAME:     'session.rename',
  SESSION_FLAG:       'session.flag',
  SESSION_SET_STATUS: 'session.set_status',
  SESSION_SET_LABELS: 'session.set_labels',

  // --- Canvas domain ---
  CANVAS_NODE_UPDATE: 'canvas.node_update',

  // --- Workspace domain ---
  WORKSPACE_RENAME:   'workspace.rename',
} as const

export type InternalActionId = (typeof InternalActionId)[keyof typeof InternalActionId]

// ---------------------------------------------------------------------------
// Permission levels
// ---------------------------------------------------------------------------

/**
 * Execution permission tiers, checked by the PreInvoke Hook (M03 §9.1).
 * Callers CANNOT override the declared level at invocation time.
 */
export type ActionPermissionLevel =
  | 'L0_read_only'      // No side-effects; always allowed
  | 'L1_reversible'     // Undo handle required; allowed in 'ask' and 'allow-all' modes
  | 'L2_irreversible'   // Requires 'allow-all' mode or explicit user confirmation
  | 'L3_destructive'    // Always requires explicit user confirmation via SupervisionRequest

// ---------------------------------------------------------------------------
// Action surface vocabulary
// ---------------------------------------------------------------------------

/**
 * Which surfaces can invoke this action.
 * 'human_ui' — invoked by a user gesture in the renderer
 * 'agent'    — invoked via list_internal_actions / invoke_internal_action tool
 * 'both'     — dual surface (human UI and agent must produce identical outcomes)
 */
export type ActionSurface = 'human_ui' | 'agent' | 'both'

// ---------------------------------------------------------------------------
// Target reference
// ---------------------------------------------------------------------------

export const ActionTargetRefSchema = z.object({
  /** Discriminator for the target kind */
  kind: z.enum(['file', 'session', 'canvas_node', 'workspace', 'unknown']),
  /** Stable id of the target entity */
  id: z.string(),
  /** Human-readable label for audit log and permission display */
  label: z.string().optional(),
  /** Workspace that owns this target — used by the file-lease checker */
  workspaceId: z.string().optional(),
})

export type ActionTargetRef = z.infer<typeof ActionTargetRefSchema>

// ---------------------------------------------------------------------------
// Action definition (registry entry)
// ---------------------------------------------------------------------------

export interface InternalActionDefinition<
  TPayload extends z.ZodTypeAny = z.ZodTypeAny,
  TOutput extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /** Unique stable identifier — one of InternalActionId */
  id: InternalActionId
  /** Contract version at which this definition was introduced */
  sinceVersion: string
  /** Human-readable name for settings/debug surfaces */
  displayName: string
  /** Surfaces that may invoke this action */
  surface: ActionSurface
  /** Minimum permission level required to execute */
  permissionLevel: ActionPermissionLevel
  /**
   * When true, the PreInvoke Hook will emit a SupervisionRequest SessionEvent
   * and pause execution until the Captain resolves it.
   */
  destructiveHint: boolean
  /**
   * Whether this action supports undo.
   * 'supported'     — executor returns an UndoHandle; undo is wired up
   * 'not_supported' — no undo available; must be declared explicitly
   */
  undoSupport: 'supported' | 'not_supported'
  /**
   * Zod schema for the action's input payload.
   * Used by the executor for structural validation (Layer 1).
   */
  payloadSchema: TPayload
  /**
   * Zod schema for the action's output.
   * PostInvoke Hook strips undeclared fields before emitting to SessionEvent stream.
   */
  outputSchema: TOutput
  /** Free-text description for agent tool listing */
  description?: string
  /** Owning module — for audit and dependency tracking */
  owner: string
}

// ---------------------------------------------------------------------------
// Action invocation envelope
// ---------------------------------------------------------------------------

export const ActionInvocationSchema = z.object({
  /**
   * Correlation id — assigned by the caller.
   * Echoed in ActionBlockedEvent / ActionErrorEvent / timeline event.
   */
  invocationId: z.string().uuid(),
  /** Action to execute */
  actionId: z.string() as z.ZodType<InternalActionId>,
  /** Input payload — validated against the action's payloadSchema */
  payload: z.record(z.unknown()),
  /** Targets this invocation operates on (used by file-lease checker) */
  targets: z.array(ActionTargetRefSchema).default([]),
  /**
   * Identity of the caller.
   * 'agent' | sessionId string | 'human_ui'
   */
  callerKind: z.enum(['agent', 'human_ui']),
  /** Session id that scopes this invocation (required for timeline evidence) */
  sessionId: z.string(),
  /** ISO 8601 timestamp when the invocation was created */
  createdAt: z.string().datetime(),
})

export type ActionInvocation = z.infer<typeof ActionInvocationSchema>

// ---------------------------------------------------------------------------
// Undo handle
// ---------------------------------------------------------------------------

export interface UndoHandle {
  /** Stable id for this undo record */
  undoId: string
  /** Human-readable label for the undo UI entry */
  label: string
  /**
   * Serialisable snapshot needed to reverse the action.
   * Executor-defined shape — must be JSON-serialisable.
   */
  snapshot: unknown
}

// ---------------------------------------------------------------------------
// Hook output types (M03 §9)
// ---------------------------------------------------------------------------

/**
 * Emitted by the PreInvoke Hook when an invocation is rejected.
 * Recorded on the SessionEvent timeline as evidence of the blocked attempt.
 * NEVER thrown as an exception.
 */
export interface ActionBlockedEvent {
  type: 'action_blocked'
  invocationId: string
  actionId: InternalActionId
  sessionId: string
  reason:
    | 'permission_level_insufficient'
    | 'file_lease_conflict'
    | 'awaiting_supervision'
    | 'action_not_found'
  /** Human-readable explanation for display / logging */
  message: string
  timestamp: string // ISO 8601
}

/**
 * Emitted by the PostInvoke Hook when the executor returns an error.
 * Wraps raw executor errors into a structured envelope before timeline emission.
 */
export interface ActionErrorEvent {
  type: 'action_error'
  invocationId: string
  actionId: InternalActionId
  sessionId: string
  errorCategory: 'transient' | 'validation' | 'business' | 'permission'
  isRetryable: boolean
  message: string
  /** Original error code if available */
  code?: string
  timestamp: string // ISO 8601
}

/**
 * Emitted by the PreInvoke Hook when destructiveHint is true.
 * Execution is paused until the Captain resolves this event.
 * The Captain responds via an event; it does NOT poll.
 */
export interface SupervisionRequest {
  type: 'supervision_request'
  invocationId: string
  actionId: InternalActionId
  sessionId: string
  /** Human-readable description of what the action will do */
  actionSummary: string
  targets: ActionTargetRef[]
  timestamp: string // ISO 8601
}

export interface SupervisionResolution {
  type: 'supervision_resolution'
  invocationId: string
  sessionId: string
  decision: 'approve' | 'reject'
  decidedBy: string // actorId or 'captain'
  timestamp: string // ISO 8601
}

// ---------------------------------------------------------------------------
// WorkspaceFileLease  (M05 skeleton — prevents file lease checker from
// blocking on a missing type; M05 Worker owns the full implementation)
// ---------------------------------------------------------------------------

export interface WorkspaceFileLease {
  leaseId: string
  workspaceId: string
  filePath: string
  /** Actor holding the lease */
  heldBy: string
  /** ISO 8601 */
  acquiredAt: string
  /** ISO 8601 — lease expires at this time if not explicitly released */
  expiresAt: string
  /** True if the lease is currently active */
  active: boolean
}

// ---------------------------------------------------------------------------
// SessionEvent extensions for action pipeline
// ---------------------------------------------------------------------------
// These variants are appended to the SessionEvent union in dto.ts at
// integration time by the M03 Worker.  They are declared here so that M05
// and M10 Workers can import the shapes without a circular dependency.

export type ActionSessionEvent =
  | ActionBlockedEvent
  | ActionErrorEvent
  | SupervisionRequest
  | SupervisionResolution
  | {
      type: 'action_completed'
      invocationId: string
      actionId: InternalActionId
      sessionId: string
      /** Serialised output from the executor (stripped to outputSchema) */
      output: unknown
      undoHandle?: UndoHandle
      requiresReview?: boolean
      timestamp: string // ISO 8601
    }
