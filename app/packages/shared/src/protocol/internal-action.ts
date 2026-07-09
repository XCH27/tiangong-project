/**
 * Internal Action Protocol — FROZEN CONTRACT v1.2.0
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

export const CONTRACT_VERSION = '1.2.0' as const

// ---------------------------------------------------------------------------
// Action ID registry  (FROZEN — see extension rule above)
// ---------------------------------------------------------------------------

/**
 * All first-party internal action ids.
 * Every id here has a corresponding entry in docs/contracts/action-ids.md.
 */
export const InternalActionId = {
  // --- File domain ---
  FILE_CREATE:        'file.create',
  FILE_UPDATE:        'file.update',
  FILE_DELETE:        'file.delete',
  FILE_RENAME:        'file.rename',
  FILE_MOVE:          'file.move',

  // --- Session domain ---
  SESSION_RENAME:     'session.rename',
  SESSION_FLAG:       'session.flag',
  SESSION_SET_STATUS: 'session.set_status',
  SESSION_SET_LABELS: 'session.set_labels',

  // --- Canvas domain ---
  CANVAS_NODE_CREATE: 'canvas.node_create',
  CANVAS_NODE_UPDATE: 'canvas.node_update',
  CANVAS_NODE_DELETE: 'canvas.node_delete',
  CANVAS_NODE_SELECT: 'canvas.node_select',
  CANVAS_GROUP_CREATE: 'canvas.group_create',
  CANVAS_GROUP_UNGROUP: 'canvas.group_ungroup',
  CANVAS_EDGE_CREATE: 'canvas.edge_create',
  CANVAS_EXPORT_SELECTION: 'canvas.export_selection',
  CANVAS_VIEWPORT_SET: 'canvas.viewport_set',
  CANVAS_ZOOM_TO_NODE: 'canvas.zoom_to_node',

  // --- AIGC domain ---
  AIGC_JOB_SUBMIT:    'aigc.job_submit',

  // --- Workspace domain ---
  WORKSPACE_RENAME:   'workspace.rename',
} as const

export type InternalActionId = (typeof InternalActionId)[keyof typeof InternalActionId]

// ---------------------------------------------------------------------------
// Permission levels
// ---------------------------------------------------------------------------

/**
 * Execution permission tiers, checked by the PreInvoke Hook (M03 §9.1).
 */
export type ActionPermissionLevel =
  | 'L0_read_only'      // No side-effects; always allowed
  | 'L1_reversible'     // Undo handle required
  | 'L2_irreversible'   // Requires allow-all or explicit user confirmation
  | 'L3_destructive'    // Always requires explicit user confirmation via SupervisionRequest

// ---------------------------------------------------------------------------
// Action surface vocabulary
// ---------------------------------------------------------------------------

export type ActionSurface = 'human_ui' | 'agent' | 'both'

// ---------------------------------------------------------------------------
// Target reference
// ---------------------------------------------------------------------------

export const ActionTargetRefSchema = z.object({
  kind: z.enum(['file', 'session', 'canvas_node', 'workspace', 'unknown']),
  id: z.string(),
  label: z.string().optional(),
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
  id: InternalActionId
  sinceVersion: string
  displayName: string
  surface: ActionSurface
  permissionLevel: ActionPermissionLevel
  destructiveHint: boolean
  undoSupport: 'supported' | 'not_supported'
  payloadSchema: TPayload
  outputSchema: TOutput
  description?: string
  owner: string
}

// ---------------------------------------------------------------------------
// Action invocation envelope
// ---------------------------------------------------------------------------

export const ActionInvocationSchema = z.object({
  invocationId: z.string().uuid(),
  actionId: z.string() as z.ZodType<InternalActionId>,
  payload: z.record(z.string(), z.unknown()),
  targets: z.array(ActionTargetRefSchema).default([]),
  callerKind: z.enum(['agent', 'human_ui']),
  sessionId: z.string(),
  createdAt: z.string().datetime(),
})

export type ActionInvocation = z.infer<typeof ActionInvocationSchema>

// ---------------------------------------------------------------------------
// Undo handle
// ---------------------------------------------------------------------------

export interface UndoHandle {
  undoId: string;
  label: string;
  snapshot: unknown;
}

// ---------------------------------------------------------------------------
// Hook output types (M03 §9)
// ---------------------------------------------------------------------------

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
  message: string
  timestamp: string // ISO 8601
}

export interface ActionErrorEvent {
  type: 'action_error'
  invocationId: string
  actionId: InternalActionId
  sessionId: string
  errorCategory: 'transient' | 'validation' | 'business' | 'permission'
  isRetryable: boolean
  message: string
  code?: string
  timestamp: string // ISO 8601
}

export interface SupervisionRequest {
  type: 'supervision_request'
  invocationId: string
  actionId: InternalActionId
  sessionId: string
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
// WorkspaceFileLease
// ---------------------------------------------------------------------------

export interface WorkspaceFileLease {
  leaseId: string
  workspaceId: string
  filePath: string
  heldBy: string
  acquiredAt: string
  expiresAt: string
  active: boolean
}

// ---------------------------------------------------------------------------
// SessionEvent extensions for action pipeline
// ---------------------------------------------------------------------------

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
      output: unknown
      undoHandle?: UndoHandle
      requiresReview?: boolean
      timestamp: string // ISO 8601
    }
