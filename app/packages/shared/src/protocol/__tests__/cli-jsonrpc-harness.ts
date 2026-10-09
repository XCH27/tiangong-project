import type { LineStream } from '../cli-executors/line-stream'
import { NdjsonRpcPeer, type JsonRpcRequest } from '../cli-executors/ndjson-rpc'
import { InternalActionId, type ActionInvocation } from '../internal-action'
import type { ActorRef } from '../actor'
import type { TurnRequest } from '../turn-admission'

export const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
export const human: ActorRef = { kind: 'human', id: 'human-1', displayName: 'Owner' }

export function invocation(
  actionId: ActionInvocation['actionId'],
  invocationId: string,
  payload: Record<string, unknown> = {},
): ActionInvocation {
  return {
    invocationId,
    actionId,
    payload,
    targets: [],
    callerKind: 'agent',
    sessionId: 'session-1',
    createdAt: '2026-10-09T00:00:00.000Z',
  }
}

export function request(actionId: ActionInvocation['actionId'], invocationId: string, payload: Record<string, unknown>): TurnRequest {
  return { invocation: invocation(actionId, invocationId, payload), actor: agent }
}

export function flagRequest(invocationId: string, payload: Record<string, unknown>): TurnRequest {
  return request(InternalActionId.SESSION_FLAG, invocationId, payload)
}

export interface ScriptedPeer {
  peer: NdjsonRpcPeer
  requests: JsonRpcRequest[]
  notifications: Array<{ method: string; params: unknown }>
}

export function scriptPeer(stream: LineStream, emitJsonrpc: boolean): ScriptedPeer {
  const peer = new NdjsonRpcPeer(stream, { emitJsonrpc })
  const requests: JsonRpcRequest[] = []
  const notifications: Array<{ method: string; params: unknown }> = []
  peer.onRequest((entry) => {
    requests.push(entry)
  })
  peer.onNotification((method, params) => {
    notifications.push({ method, params })
  })
  return { peer, requests, notifications }
}

export async function waitFor(predicate: () => boolean): Promise<void> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (predicate()) return
    await new Promise((resolve) => {
      setTimeout(resolve, 10)
    })
  }
  throw new Error('timed out waiting for CLI executor')
}

export function methodsOf(requests: JsonRpcRequest[]): string[] {
  return requests.map((entry) => entry.method)
}
