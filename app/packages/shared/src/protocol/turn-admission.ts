/**
 * Fleet host turn admission.
 *
 * Pi Agent Core is not this host. After a turn is admitted, a caller may ask
 * Pi Agent Core to sequence one default model turn. This module does not
 * import Pi, does not execute native tools, and does not open a database.
 * The journal port is the M00 timeline seam; MemoryTurnJournal is process-local
 * only and must not become a second session store.
 */

import type { ActorRef } from './actor'
import type { ActionInvocation, UndoHandle } from './internal-action'
import type { AuditSessionEvent } from './session-event'
import { isInternalActionId, policyForAction, type FrozenActionPolicy, type UndoContract } from './action-policy'
import { containsCredentialMaterial } from './credential-boundary'
import { sealHostRecord } from './provider-usage'
import { attributeTurnUsage, type TurnUsageInput, type UsageAttribution } from './usage-attribution'

export const HOST_EXECUTION_ROLE = 'fleet_host_turn_admission' as const
export const PI_EXECUTION_ROLE = 'default_turn_sequencer_only' as const
export const KERNEL_SNAPSHOT_VERSION = 1 as const

export const EXECUTION_BOUNDARY = {
  host: HOST_EXECUTION_ROLE,
  piRole: PI_EXECUTION_ROLE,
} as const

export interface TurnJournal {
  append(event: AuditSessionEvent): void
  read(sessionId: string): AuditSessionEvent[]
}

export class MemoryTurnJournal implements TurnJournal {
  private events: AuditSessionEvent[] = []

  append(event: AuditSessionEvent): void {
    this.events.push(event)
  }

  read(sessionId: string): AuditSessionEvent[] {
    return this.events.filter((event) => event.sessionId === sessionId)
  }

  all(): AuditSessionEvent[] {
    return [...this.events]
  }

  replace(events: AuditSessionEvent[]): void {
    this.events = [...events]
  }
}

export interface TurnRequest {
  invocation: ActionInvocation
  actor: ActorRef
  preAuthorizedBy?: ActorRef
  /**
   * Wait for a human even when the frozen row would auto-admit.
   * Third-party plugin enable sets this. It does not add an action id.
   */
  requireHumanApproval?: boolean
}

export type TurnPhase =
  | 'denied'
  | 'awaiting_approval'
  | 'admitted'
  | 'running'
  | 'interrupted'
  | 'reconciling'
  | 'completed'
  | 'failed'

export type TurnStatus =
  | 'admitted'
  | 'approval_required'
  | 'denied'
  | 'completed'
  | 'failed'
  | 'interrupted'
  | 'reconciling'

export interface TurnOutcome {
  status: TurnStatus
  invocationId: string
  reason?: string
  output?: unknown
  usage?: UsageAttribution
}

export interface TurnExecutorContext {
  signal: AbortSignal
  noteNativeCommit: () => void
}

export type TurnExecutor = (context: TurnExecutorContext) => Promise<TurnExecutorResult>

export interface TurnExecutorResult {
  output?: unknown
  sideEffectCommitted?: boolean
  undoHandle?: UndoHandle
  usage?: TurnUsageInput
}

interface TurnRecord {
  request: TurnRequest
  phase: TurnPhase
  nativeCommitted: boolean
  output?: unknown
  undoHandle?: UndoHandle
  usage?: UsageAttribution
  reason?: string
  stopRequested: boolean
}

export interface KernelSnapshot {
  version: typeof KERNEL_SNAPSHOT_VERSION
  events: AuditSessionEvent[]
  turns: TurnRecord[]
  nextEventNumber: number
}

export interface NativeEffectSource {
  createExecutor(request: TurnRequest): TurnExecutor | undefined
}

export interface HostTurnKernelOptions {
  now?: () => string
  createId?: () => string
  nativeEffects?: NativeEffectSource
}

function isHuman(actor: ActorRef | undefined): boolean {
  return actor?.kind === 'human' && actor.id.trim().length > 0
}

function actorValid(actor: ActorRef | undefined): actor is ActorRef {
  return !!actor && (actor.kind === 'human' || actor.kind === 'agent' || actor.kind === 'system')
    && actor.id.trim().length > 0
    && actor.displayName.trim().length > 0
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError'
}

export class HostTurnKernel {
  private readonly journal: TurnJournal
  private readonly now: () => string
  private readonly createId: () => string
  private readonly turns = new Map<string, TurnRecord>()
  private readonly seqBySession = new Map<string, number>()
  private readonly controllers = new Map<string, AbortController>()
  private readonly nativeEffects: NativeEffectSource | undefined
  private eventNumber: number
  private admissionObserver: ((outcome: TurnOutcome) => void) | undefined

  constructor(journal: TurnJournal = new MemoryTurnJournal(), options: HostTurnKernelOptions = {}) {
    this.journal = journal
    this.nativeEffects = options.nativeEffects
    this.now = options.now ?? (() => new Date().toISOString())
    this.eventNumber = 0
    this.createId = options.createId ?? (() => {
      this.eventNumber += 1
      return `evt-${this.eventNumber}`
    })
  }

  /**
   * SessionManager installs this so an awaiting admit publishes the existing
   * permission card. approve() and reject() do not call it.
   */
  setAdmissionObserver(observer: ((outcome: TurnOutcome) => void) | undefined): void {
    this.admissionObserver = observer
  }

  admit(request: TurnRequest): TurnOutcome {
    const outcome = this.evaluateAdmission(request)
    if (outcome.status === 'approval_required') {
      this.admissionObserver?.(outcome)
    }
    return outcome
  }

  private evaluateAdmission(request: TurnRequest): TurnOutcome {
    const invocationId = request.invocation?.invocationId ?? ''
    const existing = invocationId ? this.turns.get(invocationId) : undefined
    if (existing) return this.outcomeOf(existing)

    const safeRequest = this.redactedRequest(request)
    const credentialRejected = request.invocation?.payload !== undefined
      && containsCredentialMaterial(request.invocation.payload)
    if (credentialRejected) {
      return this.deny(safeRequest, invocationId || 'missing', 'credential_material_rejected')
    }

    const malformed = this.malformedReason(safeRequest)
    if (malformed) {
      return this.deny(safeRequest, invocationId || 'missing', malformed)
    }

    if (!isInternalActionId(safeRequest.invocation.actionId)) {
      return this.deny(safeRequest, invocationId, 'unknown_action')
    }

    const policy = policyForAction(safeRequest.invocation.actionId)
    if (safeRequest.actor.kind === 'system' && policy.permissionLevel !== 'L0_read_only') {
      return this.deny(safeRequest, invocationId, 'actor_not_permitted')
    }

    const gate = this.gateFor(policy, safeRequest)
    if (gate === 'approval') {
      const reason = policy.permissionLevel === 'L1_reversible' && policy.undoSupport === 'not_supported'
        ? 'undo_contract_missing'
        : 'human_approval_required'
      const record: TurnRecord = {
        request: safeRequest,
        phase: 'awaiting_approval',
        nativeCommitted: false,
        reason,
        stopRequested: false,
      }
      this.turns.set(invocationId, record)
      this.append(record, 'supervision_requested', request.actor, { reason })
      return { status: 'approval_required', invocationId, reason }
    }

    const record: TurnRecord = {
      request: safeRequest,
      phase: 'admitted',
      nativeCommitted: false,
      stopRequested: false,
    }
    this.turns.set(invocationId, record)
    return { status: 'admitted', invocationId }
  }

  approve(invocationId: string, approver: ActorRef): TurnOutcome {
    const turn = this.turns.get(invocationId)
    if (!turn) return { status: 'failed', invocationId, reason: 'unknown_invocation' }
    if (turn.phase !== 'awaiting_approval') return this.outcomeOf(turn)
    if (!isHuman(approver)) {
      return { status: 'approval_required', invocationId, reason: 'human_approval_required' }
    }
    turn.phase = 'admitted'
    turn.reason = undefined
    this.append(turn, 'supervision_resolved', approver, { decision: 'approve' })
    return { status: 'admitted', invocationId }
  }

  reject(invocationId: string, approver: ActorRef): TurnOutcome {
    const turn = this.turns.get(invocationId)
    if (!turn) return { status: 'failed', invocationId, reason: 'unknown_invocation' }
    if (turn.phase !== 'awaiting_approval') return this.outcomeOf(turn)
    if (!isHuman(approver)) {
      return { status: 'approval_required', invocationId, reason: 'human_approval_required' }
    }
    turn.phase = 'denied'
    turn.reason = 'approval_rejected'
    this.append(turn, 'supervision_resolved', approver, { decision: 'reject' })
    this.append(turn, 'action_failed', approver, { reason: 'approval_rejected' })
    return { status: 'denied', invocationId, reason: 'approval_rejected' }
  }

  async run(invocationId: string, executor?: TurnExecutor): Promise<TurnOutcome> {
    const turn = this.turns.get(invocationId)
    if (!turn) return { status: 'failed', invocationId, reason: 'unknown_invocation' }
    if (turn.phase === 'completed' || turn.phase === 'failed' || turn.phase === 'denied' || turn.phase === 'reconciling') {
      return this.outcomeOf(turn)
    }
    if (turn.phase === 'awaiting_approval') {
      return { status: 'approval_required', invocationId, reason: turn.reason }
    }
    if (turn.phase === 'interrupted' && turn.nativeCommitted) {
      turn.phase = 'reconciling'
      return { status: 'reconciling', invocationId, reason: 'native_commit_pending_evidence' }
    }
    if (turn.phase !== 'admitted' && turn.phase !== 'interrupted') {
      return this.outcomeOf(turn)
    }

    const selected = executor ?? this.nativeEffects?.createExecutor(turn.request)
    if (!selected) {
      turn.phase = 'failed'
      turn.reason = 'no_executor'
      this.append(turn, 'action_failed', turn.request.actor, { reason: 'no_executor' })
      return { status: 'failed', invocationId, reason: 'no_executor' }
    }

    turn.phase = 'running'
    turn.stopRequested = false
    const controller = new AbortController()
    this.controllers.set(invocationId, controller)
    this.append(turn, 'action_invoked', turn.request.actor, { executionBoundary: EXECUTION_BOUNDARY })

    try {
      const result = await selected({
        signal: controller.signal,
        noteNativeCommit: () => {
          turn.nativeCommitted = true
        },
      })
      if (result.sideEffectCommitted) turn.nativeCommitted = true
      return this.settleExecutorResult(turn, result)
    } catch (error) {
      if (turn.nativeCommitted) {
        turn.phase = 'reconciling'
        turn.reason = 'native_commit_pending_evidence'
        this.append(turn, 'timeline_note', turn.request.actor, { reason: turn.reason })
        return { status: 'reconciling', invocationId, reason: turn.reason }
      }
      if (isAbort(error) || turn.stopRequested || controller.signal.aborted) {
        turn.phase = 'interrupted'
        turn.reason = 'interrupted'
        this.append(turn, 'timeline_note', turn.request.actor, { reason: 'interrupted' })
        return { status: 'interrupted', invocationId, reason: 'interrupted' }
      }
      turn.phase = 'failed'
      turn.reason = 'executor_failed'
      this.append(turn, 'action_failed', turn.request.actor, { reason: 'executor_failed' })
      return { status: 'failed', invocationId, reason: 'executor_failed' }
    } finally {
      this.controllers.delete(invocationId)
    }
  }

  stop(invocationId: string): TurnOutcome {
    const turn = this.turns.get(invocationId)
    if (!turn) return { status: 'failed', invocationId, reason: 'unknown_invocation' }
    if (turn.phase === 'running') {
      turn.stopRequested = true
      this.controllers.get(invocationId)?.abort()
      return { status: 'interrupted', invocationId, reason: 'stop_requested' }
    }
    if (turn.phase === 'admitted' || turn.phase === 'awaiting_approval') {
      turn.phase = 'interrupted'
      turn.reason = 'interrupted'
      this.append(turn, 'timeline_note', turn.request.actor, { reason: 'interrupted_before_execution' })
      return { status: 'interrupted', invocationId, reason: 'interrupted_before_execution' }
    }
    return this.outcomeOf(turn)
  }

  resolveReconciliation(
    invocationId: string,
    resolution: { status: 'completed' | 'failed'; output?: unknown; undoHandle?: UndoHandle; usage?: TurnUsageInput },
  ): TurnOutcome {
    const turn = this.turns.get(invocationId)
    if (!turn) return { status: 'failed', invocationId, reason: 'unknown_invocation' }
    if (turn.phase === 'completed' || turn.phase === 'failed') return this.outcomeOf(turn)
    if (turn.phase !== 'reconciling') {
      return { status: this.outcomeOf(turn).status, invocationId, reason: 'not_reconciling' }
    }
    if (resolution.status === 'failed') {
      turn.phase = 'failed'
      turn.reason = 'reconciliation_failed'
      turn.usage = attributeTurnUsage(resolution.usage)
      this.append(turn, 'action_failed', turn.request.actor, {
        reason: 'reconciliation_failed',
        usage: turn.usage,
        executionBoundary: EXECUTION_BOUNDARY,
      })
      return { status: 'failed', invocationId, reason: 'reconciliation_failed', usage: turn.usage }
    }
    if (this.undoRequired(turn) && !resolution.undoHandle && !turn.undoHandle) {
      return { status: 'reconciling', invocationId, reason: 'undo_handle_required' }
    }
    turn.phase = 'completed'
    turn.output = resolution.output
    turn.undoHandle = resolution.undoHandle ?? turn.undoHandle
    turn.usage = attributeTurnUsage(resolution.usage)
    this.append(turn, 'action_completed', turn.request.actor, {
      output: turn.output ?? null,
      usage: turn.usage,
      executionBoundary: EXECUTION_BOUNDARY,
    }, turn.undoHandle)
    return { status: 'completed', invocationId, output: turn.output, usage: turn.usage }
  }

  snapshot(): KernelSnapshot {
    return sealHostRecord({
      version: KERNEL_SNAPSHOT_VERSION,
      events: this.readAllEvents(),
      turns: [...this.turns.values()].map((turn) => ({
        request: turn.request,
        phase: turn.phase,
        nativeCommitted: turn.nativeCommitted,
        output: turn.output,
        undoHandle: turn.undoHandle,
        usage: turn.usage,
        reason: turn.reason,
        stopRequested: turn.stopRequested,
      })),
      nextEventNumber: this.eventNumber,
    })
  }

  static restore(snapshot: KernelSnapshot, journal?: TurnJournal, options?: HostTurnKernelOptions): HostTurnKernel {
    if (snapshot.version !== KERNEL_SNAPSHOT_VERSION) {
      throw new Error('unsupported_snapshot_version')
    }
    const memory = journal ?? new MemoryTurnJournal()
    if (memory instanceof MemoryTurnJournal) {
      memory.replace(snapshot.events)
    }
    const kernel = new HostTurnKernel(memory, options)
    kernel.eventNumber = snapshot.nextEventNumber
    for (const event of snapshot.events) {
      const current = kernel.seqBySession.get(event.sessionId) ?? 0
      if (event.seq > current) kernel.seqBySession.set(event.sessionId, event.seq)
    }
    for (const turn of snapshot.turns) {
      kernel.turns.set(turn.request.invocation.invocationId, { ...turn })
    }
    kernel.recoverRestoredTurns()
    return kernel
  }

  events(sessionId: string): AuditSessionEvent[] {
    return this.journal.read(sessionId)
  }

  private recoverRestoredTurns(): void {
    for (const turn of this.turns.values()) {
      if (turn.phase !== 'running') continue
      if (turn.nativeCommitted) {
        turn.phase = 'reconciling'
        turn.reason = 'native_commit_pending_evidence'
        this.append(turn, 'timeline_note', turn.request.actor, { reason: 'recovered_reconciling' })
      } else {
        turn.phase = 'interrupted'
        turn.reason = 'interrupted'
        this.append(turn, 'timeline_note', turn.request.actor, { reason: 'recovered_interrupted' })
      }
    }
  }

  private settleExecutorResult(turn: TurnRecord, result: TurnExecutorResult): TurnOutcome {
    const invocationId = turn.request.invocation.invocationId
    if (turn.stopRequested && !turn.nativeCommitted) {
      turn.phase = 'interrupted'
      turn.reason = 'interrupted'
      this.append(turn, 'timeline_note', turn.request.actor, { reason: 'interrupted' })
      return { status: 'interrupted', invocationId, reason: 'interrupted' }
    }
    if (this.undoRequired(turn) && !result.undoHandle) {
      if (turn.nativeCommitted) {
        turn.phase = 'reconciling'
        turn.output = result.output
        turn.usage = attributeTurnUsage(result.usage)
        turn.reason = 'undo_handle_required'
        this.append(turn, 'timeline_note', turn.request.actor, {
          reason: 'undo_missing_after_commit',
          usage: turn.usage,
        })
        return { status: 'reconciling', invocationId, reason: 'undo_handle_required', usage: turn.usage }
      }
      turn.phase = 'failed'
      turn.reason = 'undo_handle_required'
      this.append(turn, 'action_failed', turn.request.actor, { reason: 'undo_handle_required' })
      return { status: 'failed', invocationId, reason: 'undo_handle_required' }
    }

    turn.phase = 'completed'
    turn.output = result.output
    turn.undoHandle = result.undoHandle
    turn.usage = attributeTurnUsage(result.usage)
    this.append(turn, 'action_completed', turn.request.actor, {
      output: turn.output ?? null,
      usage: turn.usage,
      executionBoundary: EXECUTION_BOUNDARY,
      ...(turn.stopRequested ? { cancellation: 'after_commit' } : {}),
    }, turn.undoHandle)
    return { status: 'completed', invocationId, output: turn.output, usage: turn.usage }
  }

  private undoRequired(turn: TurnRecord): boolean {
    if (!isInternalActionId(turn.request.invocation.actionId)) return false
    const policy = policyForAction(turn.request.invocation.actionId)
    return this.requiresUndoHandle(policy)
  }

  private requiresUndoHandle(policy: FrozenActionPolicy): boolean {
    const undo: UndoContract = policy.undoSupport
    switch (policy.permissionLevel) {
      case 'L0_read_only':
        return false
      case 'L1_reversible':
      case 'L2_irreversible':
        return undo === 'supported'
      case 'L3_destructive':
        return false
      default: {
        const unexpected: never = policy.permissionLevel
        throw new Error(`Unhandled permission level: ${String(unexpected)}`)
      }
    }
  }

  private redactedRequest(request: TurnRequest): TurnRequest {
    if (!request.invocation?.payload || !containsCredentialMaterial(request.invocation.payload)) return request
    return {
      ...request,
      invocation: {
        ...request.invocation,
        payload: {},
      },
    }
  }

  private gateFor(policy: FrozenActionPolicy, request: TurnRequest): 'allow' | 'approval' {
    if (request.requireHumanApproval === true) return 'approval'
    switch (policy.permissionLevel) {
      case 'L0_read_only':
        return 'allow'
      case 'L1_reversible':
        return policy.undoSupport === 'supported' ? 'allow' : 'approval'
      case 'L2_irreversible':
        return isHuman(request.preAuthorizedBy) ? 'allow' : 'approval'
      case 'L3_destructive':
        return 'approval'
      default: {
        const unexpected: never = policy.permissionLevel
        throw new Error(`Unhandled permission level: ${String(unexpected)}`)
      }
    }
  }

  private malformedReason(request: TurnRequest): string | undefined {
    if (!actorValid(request.actor)) return 'malformed_actor'
    const invocation = request.invocation
    if (!invocation || invocation.invocationId.trim().length === 0 || invocation.sessionId.trim().length === 0) {
      return 'malformed_invocation'
    }
    if (invocation.callerKind !== 'agent' && invocation.callerKind !== 'human_ui') return 'malformed_invocation'
    if (request.actor.kind === 'human' && invocation.callerKind !== 'human_ui') return 'caller_actor_mismatch'
    if (request.actor.kind === 'agent' && invocation.callerKind !== 'agent') return 'caller_actor_mismatch'
    if (request.actor.kind === 'system' && invocation.callerKind !== 'agent') return 'caller_actor_mismatch'
    if (!Array.isArray(invocation.targets)) return 'malformed_invocation'
    return undefined
  }

  private deny(request: TurnRequest, invocationId: string, reason: string): TurnOutcome {
    const record: TurnRecord = {
      request,
      phase: 'denied',
      nativeCommitted: false,
      reason,
      stopRequested: false,
    }
    if (invocationId !== 'missing') this.turns.set(invocationId, record)
    if (request.invocation?.sessionId) {
      this.append(record, 'action_failed', actorValid(request.actor) ? request.actor : {
        kind: 'system',
        id: 'system',
        displayName: 'system',
      }, { reason })
    }
    return { status: 'denied', invocationId, reason }
  }

  private outcomeOf(turn: TurnRecord): TurnOutcome {
    const invocationId = turn.request.invocation.invocationId
    switch (turn.phase) {
      case 'denied':
        return { status: 'denied', invocationId, reason: turn.reason }
      case 'awaiting_approval':
        return { status: 'approval_required', invocationId, reason: turn.reason }
      case 'admitted':
        return { status: 'admitted', invocationId }
      case 'running':
        return { status: 'admitted', invocationId, reason: 'running' }
      case 'interrupted':
        return { status: 'interrupted', invocationId, reason: turn.reason }
      case 'reconciling':
        return { status: 'reconciling', invocationId, reason: turn.reason, usage: turn.usage }
      case 'completed':
        return { status: 'completed', invocationId, output: turn.output, usage: turn.usage }
      case 'failed':
        return { status: 'failed', invocationId, reason: turn.reason, usage: turn.usage }
      default: {
        const unexpected: never = turn.phase
        throw new Error(`Unhandled turn phase: ${String(unexpected)}`)
      }
    }
  }

  private append(
    turn: TurnRecord,
    kind: AuditSessionEvent['kind'],
    actor: ActorRef,
    payload: Record<string, unknown>,
    undoHandle?: UndoHandle,
  ): void {
    const sessionId = turn.request.invocation.sessionId
    if (!sessionId) return
    const seq = (this.seqBySession.get(sessionId) ?? 0) + 1
    this.seqBySession.set(sessionId, seq)
    const event: AuditSessionEvent = {
      id: this.createId(),
      sessionId,
      kind,
      actionId: turn.request.invocation.actionId,
      actorRef: actor,
      payload,
      undoHandle,
      evidenceRefs: [],
      occurredAt: this.now(),
      seq,
    }
    this.journal.append(event)
  }

  private readAllEvents(): AuditSessionEvent[] {
    if (this.journal instanceof MemoryTurnJournal) return this.journal.all()
    const sessions = new Set<string>()
    for (const turn of this.turns.values()) sessions.add(turn.request.invocation.sessionId)
    return [...sessions].flatMap((sessionId) => this.journal.read(sessionId))
  }
}
