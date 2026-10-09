/**
 * In-process native effect adapter for an admitted host turn.
 *
 * HostTurnKernel remains the permission authority. This adapter runs only
 * after admission and records a native commit after an atomic file replace,
 * the same write-to-temp-then-rename pattern as session.jsonl. It does not
 * import Pi and it does not grant permission.
 */

import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { UndoHandle } from './internal-action'
import type { NativeEffectSource, TurnExecutor, TurnRequest } from './turn-admission'

export interface NativeEffectRequest {
  actionId: string
  payload: Record<string, unknown>
  sessionId: string
  signal: AbortSignal
  commit: () => void
}

export interface NativeEffectResult {
  output?: unknown
  undoHandle?: UndoHandle
}

export type NativeEffect = (request: NativeEffectRequest) => Promise<NativeEffectResult>

export class NativeEffectRegistry implements NativeEffectSource {
  private readonly effects = new Map<string, NativeEffect>()

  register(actionId: string, effect: NativeEffect): void {
    this.effects.set(actionId, effect)
  }

  createExecutor(request: TurnRequest): TurnExecutor | undefined {
    const effect = this.effects.get(request.invocation.actionId)
    if (!effect) return undefined
    return async ({ signal, noteNativeCommit }) => {
      if (signal.aborted) throw abortError()
      let committed = false
      const result = await effect({
        actionId: request.invocation.actionId,
        payload: request.invocation.payload,
        sessionId: request.invocation.sessionId,
        signal,
        commit: () => {
          committed = true
          noteNativeCommit()
        },
      })
      if (signal.aborted && !committed) throw abortError()
      return {
        output: result.output,
        undoHandle: result.undoHandle,
        sideEffectCommitted: committed,
      }
    }
  }
}

export async function applyAtomicJsonEffect(input: {
  filePath: string
  next: unknown
  signal: AbortSignal
  commit: () => void
}): Promise<{ output: unknown; previous: unknown }> {
  if (input.signal.aborted) throw abortError()
  let previous: unknown = null
  try {
    previous = JSON.parse(readFileSync(input.filePath, 'utf8'))
  } catch {
    previous = null
  }
  if (input.signal.aborted) throw abortError()
  mkdirSync(dirname(input.filePath), { recursive: true })
  const tmpFile = `${input.filePath}.tmp`
  writeFileSync(tmpFile, `${JSON.stringify(input.next)}\n`)
  try {
    unlinkSync(input.filePath)
  } catch {
    // First write has no previous file.
  }
  renameSync(tmpFile, input.filePath)
  input.commit()
  return { output: input.next, previous }
}

function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}
