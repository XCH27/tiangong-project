/**
 * Generic ACP client for Gemini, Qwen, Kimi, and other ACP agents.
 *
 * JSON-RPC over pipe stdio. Tool permission is a reverse request answered
 * only after HostTurnKernel admits a frozen action. Resume uses session/load
 * or session/resume when the peer advertises it, and stays Locked otherwise.
 * Client terminal capability is off. There is no PTY fallback.
 * Pi Agent Core is not the permission authority.
 */

import type { TurnExecutor, TurnExecutorResult, TurnRequest } from '../turn-admission'
import type { HostTurnKernel } from '../turn-admission'
import { abortError, decideCliEffect, raceAbort, stringPaths, type CliDecision, type CliEffectKind } from './effect-gate'
import type { LineStream } from './line-stream'
import { NdjsonRpcPeer, type JsonRpcRequest } from './ndjson-rpc'

interface AcpPeerInfo {
  protocolVersion: number
  loadSession: boolean
}

export interface AcpTurnInput {
  prompt: string
  cwd?: string
  resumeSessionId?: string
}

export async function runAcpTurn(
  stream: LineStream,
  kernel: HostTurnKernel,
  parent: TurnRequest,
  input: AcpTurnInput,
  signal: AbortSignal,
): Promise<TurnExecutorResult> {
  const peer = new NdjsonRpcPeer(stream, { emitJsonrpc: true })
  let sessionId = ''
  let text = ''
  let idle = false
  const onAbort = () => {
    if (!sessionId) return
    peer.notify('session/cancel', { sessionId })
  }
  signal.addEventListener('abort', onAbort)
  peer.onNotification((method, params) => {
    if (method !== 'session/update') return
    text += acpUpdateText(params)
    if (isIdle(params, sessionId)) idle = true
  })
  peer.onRequest((request) => {
    void answerAcpRequest(peer, kernel, parent, request, signal)
  })

  try {
    throwIfAborted(signal)
    const initialized = await raceAbort(signal, peer.request('initialize', {
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: false, writeTextFile: false },
        terminal: false,
      },
      clientInfo: { name: 'fleet-host', version: '0.1.0' },
    }))
    const peerInfo = readPeerInfo(initialized)
    throwIfAborted(signal)

    if (input.resumeSessionId) {
      sessionId = input.resumeSessionId
      await resumeAcpSession(peer, peerInfo, input.resumeSessionId, input.cwd, signal)
    } else {
      const created = await raceAbort(signal, peer.request('session/new', { cwd: input.cwd ?? '', mcpServers: [] }).then((value) => {
        sessionId = requiredString(recordField(value, 'sessionId'), 'acp_session_missing')
        return value
      }))
      sessionId = requiredString(recordField(created, 'sessionId'), 'acp_session_missing')
    }
    throwIfAborted(signal)

    const prompted = await raceAbort(signal, peer.request('session/prompt', {
      sessionId,
      prompt: [{ type: 'text', text: input.prompt }],
    }))
    throwIfAborted(signal)
    if (!stopReason(prompted) && !idle) await waitForIdle(peer, sessionId, signal)
    throwIfAborted(signal)
    return { output: { sessionId, text, protocolVersion: peerInfo.protocolVersion } }
  } finally {
    signal.removeEventListener('abort', onAbort)
    peer.close()
  }
}

export function acpExecutor(
  openTransport: () => LineStream,
  kernel: HostTurnKernel,
  parent: TurnRequest,
): TurnExecutor {
  return async ({ signal }) => {
    const prompt = parent.invocation.payload.prompt
    if (typeof prompt !== 'string' || prompt.length === 0) throw new Error('acp_prompt_missing')
    const cwd = typeof parent.invocation.payload.cwd === 'string' ? parent.invocation.payload.cwd : undefined
    const resumeSessionId = typeof parent.invocation.payload.resumeSessionId === 'string'
      ? parent.invocation.payload.resumeSessionId
      : undefined
    return runAcpTurn(openTransport(), kernel, parent, { prompt, cwd, resumeSessionId }, signal)
  }
}

async function resumeAcpSession(
  peer: NdjsonRpcPeer,
  info: AcpPeerInfo,
  sessionId: string,
  cwd: string | undefined,
  signal: AbortSignal,
): Promise<void> {
  if (info.protocolVersion >= 2) {
    await raceAbort(signal, peer.request('session/resume', {
      sessionId,
      cwd: cwd ?? '',
      replayFrom: { type: 'start' },
    }))
    return
  }
  if (info.loadSession) {
    await raceAbort(signal, peer.request('session/load', { sessionId, cwd: cwd ?? '', mcpServers: [] }))
    return
  }
  throw new Error('peer_resume_unsupported')
}

async function answerAcpRequest(
  peer: NdjsonRpcPeer,
  kernel: HostTurnKernel,
  parent: TurnRequest,
  request: JsonRpcRequest,
  signal: AbortSignal,
): Promise<void> {
  try {
    if (request.method !== 'session/request_permission') {
      peer.respondError(request.id, -32601, 'acp_client_method_locked')
      return
    }
    const decision = await decideCliEffect(kernel, parent, {
      requestId: String(request.id),
      kind: acpEffectKind(request.params),
      paths: acpPaths(request.params),
    }, signal)
    peer.respond(request.id, acpPermissionResult(decision, request.params))
  } catch (error) {
    peer.respondError(request.id, -32000, error instanceof Error ? error.message : 'acp_permission_failed')
  }
}

function acpEffectKind(params: unknown): CliEffectKind {
  const kind = toolKind(params)
  switch (kind) {
    case 'read':
    case 'search':
    case 'think':
      return 'read-only'
    case 'edit':
    case 'write':
      return 'file-update'
    case 'delete':
      return 'file-delete'
    case 'move':
      return 'file-move'
    case 'execute':
    case 'fetch':
    case 'other':
    case undefined:
      return 'locked'
    default: {
      const unexpected: never = kind
      throw new Error(`Unhandled ACP tool kind: ${String(unexpected)}`)
    }
  }
}

type AcpToolKind =
  | 'read'
  | 'search'
  | 'think'
  | 'fetch'
  | 'edit'
  | 'write'
  | 'other'
  | 'delete'
  | 'move'
  | 'execute'

function toolKind(params: unknown): AcpToolKind | undefined {
  const toolCall = recordField(params, 'toolCall') ?? recordField(params, 'toolCallUpdate') ?? recordField(params, 'subject')
  const raw = recordField(toolCall, 'kind') ?? recordField(params, 'kind')
  if (typeof raw !== 'string') return undefined
  if (isAcpToolKind(raw)) return raw
  return undefined
}

function isAcpToolKind(value: string): value is AcpToolKind {
  switch (value) {
    case 'read':
    case 'search':
    case 'think':
    case 'fetch':
    case 'edit':
    case 'write':
    case 'other':
    case 'delete':
    case 'move':
    case 'execute':
      return true
    default:
      return false
  }
}

function acpPermissionResult(decision: CliDecision, params: unknown): unknown {
  if (decision === 'cancel') return { outcome: { outcome: 'cancelled' } }
  const options = recordField(params, 'options')
  const wanted = decision === 'accept' ? 'allow_once' : 'reject_once'
  const optionId = optionIdFor(options, wanted)
  if (!optionId) return { outcome: { outcome: 'cancelled' } }
  return { outcome: { outcome: 'selected', optionId } }
}

function optionIdFor(options: unknown, kind: 'allow_once' | 'reject_once'): string | undefined {
  if (!Array.isArray(options)) return undefined
  for (const option of options) {
    if (!option || typeof option !== 'object') continue
    const record = option as Record<string, unknown>
    if (record.kind === kind && typeof record.optionId === 'string') return record.optionId
  }
  return undefined
}

function acpPaths(params: unknown): string[] {
  const toolCall = recordField(params, 'toolCall') ?? recordField(params, 'subject')
  return stringPaths(recordField(toolCall, 'locations'))
}

function waitForIdle(peer: NdjsonRpcPeer, sessionId: string, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const off = peer.onNotification((method, params) => {
      if (method !== 'session/update') return
      if (!isIdle(params, sessionId)) return
      off()
      signal.removeEventListener('abort', onAbort)
      resolve()
    })
    const onAbort = () => {
      off()
      reject(abortError())
    }
    if (signal.aborted) {
      onAbort()
      return
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function isIdle(params: unknown, sessionId: string): boolean {
  const update = recordField(params, 'update')
  const state = recordField(update, 'state')
  const session = recordField(params, 'sessionId')
  return state === 'idle' && (session === undefined || session === sessionId)
}

function stopReason(value: unknown): string {
  const reason = recordField(value, 'stopReason')
  return typeof reason === 'string' ? reason : ''
}

function acpUpdateText(params: unknown): string {
  const update = recordField(params, 'update')
  const content = recordField(update, 'content')
  const text = recordField(content, 'text')
  if (typeof text === 'string') return text
  const nested = recordField(recordField(content, 'content'), 'text')
  return typeof nested === 'string' ? nested : ''
}

function readPeerInfo(value: unknown): AcpPeerInfo {
  const version = recordField(value, 'protocolVersion')
  const capabilities = recordField(value, 'agentCapabilities')
  const loadSession = recordField(capabilities, 'loadSession') === true
  return {
    protocolVersion: typeof version === 'number' ? version : 1,
    loadSession,
  }
}

function recordField(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)[key]
}

function requiredString(value: unknown, code: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new Error(code)
  return value
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw abortError()
}
