/**
 * Codex app-server client.
 *
 * Speaks `codex app-server --stdio` JSON-RPC. Reverse approvals are answered
 * only after HostTurnKernel admits the frozen action. Command execution and
 * dynamic client tools stay Locked. There is no PTY fallback.
 * Pi Agent Core is not the permission authority.
 */

import type { TurnExecutor, TurnExecutorResult, TurnRequest } from '../turn-admission'
import type { HostTurnKernel } from '../turn-admission'
import type { TurnUsageInput } from '../usage-attribution'
import { abortError, changeDeletes, decideCliEffect, raceAbort, stringPaths, type CliDecision, type CliEffectKind } from './effect-gate'
import type { LineStream } from './line-stream'
import { NdjsonRpcPeer, type JsonRpcRequest } from './ndjson-rpc'

export interface CodexTurnInput {
  prompt: string
  cwd?: string
  resumeThreadId?: string
}

export async function runCodexAppServerTurn(
  stream: LineStream,
  kernel: HostTurnKernel,
  parent: TurnRequest,
  input: CodexTurnInput,
  signal: AbortSignal,
): Promise<TurnExecutorResult> {
  const peer = new NdjsonRpcPeer(stream, { emitJsonrpc: false })
  let threadId = ''
  let turnId = ''
  let text = ''
  const onAbort = () => {
    if (!threadId || !turnId) return
    void peer.request('turn/interrupt', { threadId, turnId }).catch(() => undefined)
  }
  signal.addEventListener('abort', onAbort)
  peer.onNotification((method, params) => {
    if (method === 'item/agentMessage/delta') text += deltaText(params)
  })
  peer.onRequest((request) => {
    void answerCodexRequest(peer, kernel, parent, request, signal)
  })

  try {
    throwIfAborted(signal)
    await raceAbort(signal, peer.request('initialize', {
      clientInfo: { name: 'fleet-host', title: 'Fleet Host', version: '0.1.0' },
    }))
    peer.notify('initialized')
    throwIfAborted(signal)

    const thread = input.resumeThreadId
      ? await raceAbort(signal, peer.request('thread/resume', threadParams(input.cwd, input.resumeThreadId)))
      : await raceAbort(signal, peer.request('thread/start', threadParams(input.cwd)))
    threadId = requiredString(recordField(recordField(thread, 'thread'), 'id'), 'codex_thread_missing')
    throwIfAborted(signal)

    const started = await raceAbort(signal, peer.request('turn/start', {
      threadId,
      input: [{ type: 'text', text: input.prompt }],
    }).then((value) => {
      turnId = turnIdFrom(value)
      return value
    }))
    throwIfAborted(signal)

    const completed = await waitForTurn(peer, turnId, signal)
    throwIfAborted(signal)
    const status = turnStatus(completed)
    if (status === 'interrupted' || status === 'failed') {
      throw new Error(`codex_turn_${status}`)
    }
    return {
      output: { threadId, turnId, text, status: status || 'completed' },
      usage: usageFromCodex(completed),
    }
  } finally {
    signal.removeEventListener('abort', onAbort)
    peer.close()
  }
}

export function codexExecutor(
  openTransport: () => LineStream,
  kernel: HostTurnKernel,
  parent: TurnRequest,
): TurnExecutor {
  return async ({ signal }): Promise<TurnExecutorResult> => {
    const prompt = parent.invocation.payload.prompt
    if (typeof prompt !== 'string' || prompt.length === 0) throw new Error('codex_prompt_missing')
    const cwd = typeof parent.invocation.payload.cwd === 'string' ? parent.invocation.payload.cwd : undefined
    const resumeThreadId = typeof parent.invocation.payload.resumeThreadId === 'string'
      ? parent.invocation.payload.resumeThreadId
      : undefined
    return runCodexAppServerTurn(openTransport(), kernel, parent, { prompt, cwd, resumeThreadId }, signal)
  }
}

async function answerCodexRequest(
  peer: NdjsonRpcPeer,
  kernel: HostTurnKernel,
  parent: TurnRequest,
  request: JsonRpcRequest,
  signal: AbortSignal,
): Promise<void> {
  try {
    const result = await codexApprovalResult(kernel, parent, request, signal)
    peer.respond(request.id, result)
  } catch (error) {
    peer.respondError(request.id, -32000, error instanceof Error ? error.message : 'codex_approval_failed')
  }
}

async function codexApprovalResult(
  kernel: HostTurnKernel,
  parent: TurnRequest,
  request: JsonRpcRequest,
  signal: AbortSignal,
): Promise<unknown> {
  const kind = codexEffectKind(request.method, request.params)
  if (kind === 'locked') return lockedCodexResult(request.method)
  const decision = await decideCliEffect(kernel, parent, {
    requestId: String(request.id),
    kind,
    paths: pathsForCodex(request.params),
  }, signal)
  if (request.method === 'item/permissions/requestApproval') {
    return permissionResult(decision, request.params)
  }
  return { decision: codexDecision(decision) }
}

function codexEffectKind(method: string, params: unknown): CliEffectKind {
  if (method === 'item/commandExecution/requestApproval') return 'locked'
  if (method === 'item/tool/call' || method === 'mcpServer/elicitation/request') return 'locked'
  if (method === 'item/fileChange/requestApproval') {
    return changeDeletes(recordField(params, 'changes')) ? 'file-delete' : 'file-update'
  }
  if (method === 'item/permissions/requestApproval') {
    const write = recordField(recordField(recordField(params, 'permissions'), 'fileSystem'), 'write')
    return Array.isArray(write) && write.length > 0 ? 'file-update' : 'locked'
  }
  return 'locked'
}

function lockedCodexResult(method: string): unknown {
  if (method === 'item/commandExecution/requestApproval' || method === 'item/fileChange/requestApproval') {
    return { decision: 'decline' }
  }
  if (method === 'mcpServer/elicitation/request') return { action: 'decline', content: null }
  if (method === 'item/permissions/requestApproval') return { scope: 'turn', permissions: {} }
  return { success: false, contentItems: [] }
}

function permissionResult(decision: CliDecision, params: unknown): unknown {
  if (decision !== 'accept') return { scope: 'turn', permissions: {} }
  const write = recordField(recordField(recordField(params, 'permissions'), 'fileSystem'), 'write')
  return {
    scope: 'turn',
    permissions: { fileSystem: { write: Array.isArray(write) ? write : [] } },
  }
}

function codexDecision(decision: CliDecision): 'accept' | 'decline' | 'cancel' {
  switch (decision) {
    case 'accept':
      return 'accept'
    case 'decline':
      return 'decline'
    case 'cancel':
      return 'cancel'
    default: {
      const unexpected: never = decision
      throw new Error(`Unhandled CLI decision: ${String(unexpected)}`)
    }
  }
}

function threadParams(cwd: string | undefined, threadId?: string): Record<string, unknown> {
  return {
    ...(threadId ? { threadId } : {}),
    ...(cwd ? { cwd } : {}),
    approvalPolicy: 'on-request',
    sandbox: 'workspaceWrite',
  }
}

function pathsForCodex(params: unknown): string[] {
  const fileSystem = recordField(recordField(params, 'permissions'), 'fileSystem')
  return [
    ...stringPaths(recordField(params, 'changes')),
    ...stringPaths(recordField(fileSystem, 'write')),
  ]
}

function waitForTurn(peer: NdjsonRpcPeer, turnId: string, signal: AbortSignal): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const off = peer.onNotification((method, params) => {
      if (method !== 'turn/completed') return
      const id = turnIdFrom(params)
      if (id && id !== turnId) return
      off()
      signal.removeEventListener('abort', onAbort)
      resolve(params)
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

function turnIdFrom(value: unknown): string {
  const direct = recordField(value, 'turnId')
  if (typeof direct === 'string') return direct
  const nested = recordField(recordField(value, 'turn'), 'id')
  return typeof nested === 'string' ? nested : ''
}

function turnStatus(value: unknown): string {
  const direct = recordField(value, 'status')
  if (typeof direct === 'string') return direct
  const nested = recordField(recordField(value, 'turn'), 'status')
  return typeof nested === 'string' ? nested : ''
}

function deltaText(params: unknown): string {
  const delta = recordField(params, 'delta')
  return typeof delta === 'string' ? delta : ''
}

function usageFromCodex(params: unknown): TurnUsageInput | undefined {
  const usage = recordField(params, 'usage') ?? recordField(recordField(params, 'turn'), 'usage')
  if (!usage || typeof usage !== 'object') return undefined
  const record = usage as Record<string, unknown>
  const inputTokens = numeric(record.inputTokens ?? record.input_tokens ?? record.input)
  const outputTokens = numeric(record.outputTokens ?? record.output_tokens ?? record.output)
  if (inputTokens === undefined && outputTokens === undefined) return undefined
  const cache = numeric(record.cachedInputTokens ?? record.cacheRead ?? record.cache_read_input_tokens)
  return {
    source: 'provider_response',
    providerId: 'openai',
    inputTokens,
    outputTokens,
    cacheFieldPresent: cache !== undefined,
    ...(cache !== undefined ? { cachedInputTokens: cache } : {}),
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

function numeric(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) throw abortError()
}
