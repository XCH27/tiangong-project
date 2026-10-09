/**
 * Newline-delimited JSON-RPC peer.
 *
 * Codex app-server omits the jsonrpc header on the wire. ACP requires it.
 * Incoming messages are accepted either way. This peer does not spawn a process.
 */

import type { LineStream } from './line-stream'

export type JsonRpcId = number | string

export interface JsonRpcRequest {
  id: JsonRpcId
  method: string
  params: unknown
}

interface PendingCall {
  resolve: (result: unknown) => void
  reject: (error: Error) => void
}

export interface NdjsonRpcPeerOptions {
  emitJsonrpc: boolean
}

export class NdjsonRpcPeer {
  private nextId = 1
  private readonly pending = new Map<JsonRpcId, PendingCall>()
  private readonly notifications = new Set<(method: string, params: unknown) => void>()
  private readonly requests = new Set<(request: JsonRpcRequest) => void>()
  private closed = false

  constructor(
    private readonly stream: LineStream,
    private readonly options: NdjsonRpcPeerOptions,
  ) {
    this.stream.onLine((line) => this.receive(line))
  }

  request(method: string, params?: unknown): Promise<unknown> {
    if (this.closed) return Promise.reject(closedError())
    const id = this.nextId
    this.nextId += 1
    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
    this.write(this.envelope({ id, method, params: params ?? {} }))
    return promise
  }

  notify(method: string, params?: unknown): void {
    if (this.closed) return
    this.write(this.envelope({ method, params: params ?? {} }))
  }

  respond(id: JsonRpcId, result: unknown): void {
    if (this.closed) return
    this.write(this.envelope({ id, result }))
  }

  respondError(id: JsonRpcId, code: number, message: string): void {
    if (this.closed) return
    this.write(this.envelope({ id, error: { code, message } }))
  }

  onNotification(listener: (method: string, params: unknown) => void): () => void {
    this.notifications.add(listener)
    return () => this.notifications.delete(listener)
  }

  onRequest(listener: (request: JsonRpcRequest) => void): () => void {
    this.requests.add(listener)
    return () => this.requests.delete(listener)
  }

  close(): void {
    if (this.closed) return
    this.closed = true
    this.stream.close()
    for (const pending of this.pending.values()) pending.reject(closedError())
    this.pending.clear()
  }

  private receive(line: string): void {
    const message = parseMessage(line)
    if (!message) return
    switch (message.kind) {
      case 'response': {
        const pending = this.pending.get(message.id)
        if (!pending) return
        this.pending.delete(message.id)
        if (message.error) pending.reject(message.error)
        else pending.resolve(message.result)
        return
      }
      case 'notification':
        for (const listener of this.notifications) listener(message.method, message.params)
        return
      case 'request':
        for (const listener of this.requests) {
          listener({ id: message.id, method: message.method, params: message.params })
        }
        return
      default: {
        const unexpected: never = message
        throw new Error(`Unhandled JSON-RPC message: ${String(unexpected)}`)
      }
    }
  }

  private envelope(fields: Record<string, unknown>): Record<string, unknown> {
    if (!this.options.emitJsonrpc) return fields
    return { jsonrpc: '2.0', ...fields }
  }

  private write(value: Record<string, unknown>): void {
    this.stream.send(JSON.stringify(value))
  }
}

type ParsedMessage =
  | { kind: 'request'; id: JsonRpcId; method: string; params: unknown }
  | { kind: 'notification'; method: string; params: unknown }
  | { kind: 'response'; id: JsonRpcId; result?: unknown; error?: Error }

function parseMessage(line: string): ParsedMessage | undefined {
  const trimmed = line.trim()
  if (!trimmed) return undefined
  let value: unknown
  try {
    value = JSON.parse(trimmed)
  } catch {
    return undefined
  }
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const id = jsonRpcId(record.id)
  if (typeof record.method === 'string' && id !== undefined) {
    return { kind: 'request', id, method: record.method, params: record.params }
  }
  if (typeof record.method === 'string') {
    return { kind: 'notification', method: record.method, params: record.params }
  }
  if (id !== undefined && ('result' in record || 'error' in record)) {
    return {
      kind: 'response',
      id,
      result: record.result,
      error: rpcError(record.error),
    }
  }
  return undefined
}

function jsonRpcId(value: unknown): JsonRpcId | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.length > 0) return value
  return undefined
}

function rpcError(value: unknown): Error | undefined {
  if (!value || typeof value !== 'object') return undefined
  const message = (value as { message?: unknown }).message
  const error = new Error(typeof message === 'string' ? message : 'jsonrpc_error')
  error.name = 'JsonRpcError'
  return error
}

function closedError(): Error {
  const error = new Error('stdio_closed')
  error.name = 'StdioClosedError'
  return error
}
