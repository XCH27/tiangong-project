/**
 * Host admission gate for a CLI reverse request.
 *
 * The adapter asks HostTurnKernel to admit a frozen action. It never calls
 * approve or reject. A missing frozen action stays Locked and is declined.
 */

import { InternalActionId, type ActionInvocation } from '../internal-action'
import type { HostTurnKernel, TurnOutcome, TurnPhase, TurnRequest } from '../turn-admission'

export type CliDecision = 'accept' | 'decline' | 'cancel'

export type CliEffectKind =
  | 'file-update'
  | 'file-delete'
  | 'file-move'
  | 'read-only'
  | 'locked'

export interface CliEffectRequest {
  requestId: string
  kind: CliEffectKind
  paths: string[]
}

export function cliEffectInvocationId(parentInvocationId: string, requestId: string): string {
  return `${parentInvocationId}:cli:${requestId}`
}

export function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}

export async function decideCliEffect(
  kernel: HostTurnKernel,
  parent: TurnRequest,
  effect: CliEffectRequest,
  signal: AbortSignal,
): Promise<CliDecision> {
  if (signal.aborted) return 'cancel'
  const actionId = actionForEffect(effect.kind)
  if (!actionId) return effect.kind === 'read-only' ? 'accept' : 'decline'

  const invocationId = cliEffectInvocationId(parent.invocation.invocationId, effect.requestId)
  const invocation: ActionInvocation = {
    invocationId,
    actionId,
    payload: {
      cliEffect: effect.kind,
      paths: effect.paths,
    },
    targets: effect.paths.map((path) => ({ kind: 'file' as const, id: path })),
    callerKind: parent.invocation.callerKind,
    sessionId: parent.invocation.sessionId,
    createdAt: new Date().toISOString(),
  }
  const admitted = kernel.admit({ invocation, actor: parent.actor })
  const settled = await waitForDecision(kernel, invocationId, admitted, signal)
  if (signal.aborted) return 'cancel'
  return decisionFromPhase(settled)
}

function actionForEffect(kind: CliEffectKind): InternalActionId | undefined {
  switch (kind) {
    case 'file-update':
      return InternalActionId.FILE_UPDATE
    case 'file-delete':
      return InternalActionId.FILE_DELETE
    case 'file-move':
      return InternalActionId.FILE_MOVE
    case 'read-only':
    case 'locked':
      return undefined
    default: {
      const unexpected: never = kind
      throw new Error(`Unhandled CLI effect: ${String(unexpected)}`)
    }
  }
}

async function waitForDecision(
  kernel: HostTurnKernel,
  invocationId: string,
  first: TurnOutcome,
  signal: AbortSignal,
): Promise<TurnOutcome> {
  if (first.status !== 'approval_required') return first
  for (;;) {
    if (signal.aborted) return { status: 'interrupted', invocationId, reason: 'interrupted' }
    const turn = kernel.snapshot().turns.find((item) => item.request.invocation.invocationId === invocationId)
    if (!turn || turn.phase !== 'awaiting_approval') {
      return outcomeFromSnapshot(invocationId, turn?.phase, turn?.reason)
    }
    await delay(5)
  }
}

function outcomeFromSnapshot(invocationId: string, phase: TurnPhase | undefined, reason?: string): TurnOutcome {
  switch (phase) {
    case 'admitted':
    case 'running':
      return { status: 'admitted', invocationId }
    case 'completed':
      return { status: 'completed', invocationId }
    case 'denied':
      return { status: 'denied', invocationId, reason }
    case 'failed':
      return { status: 'failed', invocationId, reason }
    case 'interrupted':
      return { status: 'interrupted', invocationId, reason }
    case 'reconciling':
      return { status: 'reconciling', invocationId, reason }
    case 'awaiting_approval':
      return { status: 'approval_required', invocationId, reason }
    case undefined:
      return { status: 'failed', invocationId, reason: 'unknown_invocation' }
    default: {
      const unexpected: never = phase
      throw new Error(`Unhandled turn phase: ${String(unexpected)}`)
    }
  }
}

function decisionFromPhase(outcome: TurnOutcome): CliDecision {
  switch (outcome.status) {
    case 'admitted':
    case 'completed':
      return 'accept'
    case 'interrupted':
      return 'cancel'
    case 'approval_required':
    case 'denied':
    case 'failed':
    case 'reconciling':
      return 'decline'
    default: {
      const unexpected: never = outcome.status
      throw new Error(`Unhandled turn status: ${String(unexpected)}`)
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function raceAbort<T>(signal: AbortSignal, work: Promise<T>): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError())
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort)
    work.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        if (signal.aborted) reject(abortError())
        else resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error instanceof Error ? error : new Error('cli_request_failed'))
      },
    )
  })
}

export function stringPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const paths: string[] = []
  for (const entry of value) {
    if (typeof entry === 'string') {
      paths.push(entry)
      continue
    }
    if (!entry || typeof entry !== 'object') continue
    const record = entry as Record<string, unknown>
    const path = record.path ?? record.filename ?? record.file
    if (typeof path === 'string') paths.push(path)
  }
  return paths
}

export function changeDeletes(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  return value.some((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const record = entry as Record<string, unknown>
    const kind = record.kind ?? record.type
    return kind === 'delete'
  })
}
