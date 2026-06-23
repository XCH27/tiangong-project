/**
 * AcpConnection —— ACP（Agent Client Protocol）的 JSON-RPC 2.0 over stdio 客户端。
 *
 * ACP 用 ndjson：每条消息是一行 JSON。Fleet 作为 client，spawn CLI 作为 agent：
 * - request：`{jsonrpc,id,method,params}` → 等 `{jsonrpc,id,result|error}`
 * - notification：`{jsonrpc,method,params}`（无 id）
 * - agent 也会反向发 request（如 `session/request_permission`），我们注册 handler 回 response。
 *
 * 传输用注入的 `AcpTransport`，便于单测（mock transport，无需真实进程）。
 * 非 JSON 行（CLI 启动 banner）被忽略，不破坏协议。
 */

export interface AcpTransport {
  /** 写一行（含换行）到 agent stdin。 */
  send(line: string): void
  /** agent stdout 每来数据回调（可能是任意分片；本类内部按 \n 重组）。 */
  onMessage(cb: (chunk: string) => void): void
  /** 进程/管道关闭回调。 */
  onClose(cb: (err?: Error) => void): void
  /** 关闭传输（kill 进程）。 */
  close(): void
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

export type AcpNotificationHandler = (params: unknown) => void
export type AcpRequestHandler = (params: unknown) => Promise<unknown> | unknown

interface JsonRpcMessage {
  jsonrpc?: string
  id?: number | string
  method?: string
  params?: unknown
  result?: unknown
  error?: { code?: number; message?: string }
}

export class AcpConnection {
  private nextId = 1
  private readonly pending = new Map<number, PendingRequest>()
  private readonly notificationHandlers = new Map<string, AcpNotificationHandler>()
  private readonly requestHandlers = new Map<string, AcpRequestHandler>()
  private buffer = ''
  private closed = false
  private closeError: Error | null = null

  constructor(private readonly transport: AcpTransport) {
    transport.onMessage(chunk => this.handleChunk(chunk))
    transport.onClose(err => this.handleClose(err))
  }

  /** 发一个 request 并等响应。 */
  request<T = unknown>(method: string, params?: unknown): Promise<T> {
    if (this.closed) {
      return Promise.reject(this.closeError ?? new Error('ACP connection is closed'))
    }
    const id = this.nextId++
    const promise = new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
    this.write({ jsonrpc: '2.0', id, method, params })
    return promise as Promise<T>
  }

  /** 发一个 notification（无响应）。 */
  notify(method: string, params?: unknown): void {
    if (this.closed) return
    this.write({ jsonrpc: '2.0', method, params })
  }

  /** 注册对 agent 通知（如 session/update）的处理。 */
  onNotification(method: string, handler: AcpNotificationHandler): void {
    this.notificationHandlers.set(method, handler)
  }

  /** 注册对 agent 反向 request（如 session/request_permission）的处理，返回值即 response.result。 */
  onRequest(method: string, handler: AcpRequestHandler): void {
    this.requestHandlers.set(method, handler)
  }

  close(): void {
    if (this.closed) return
    this.handleClose(undefined)
    this.transport.close()
  }

  get isClosed(): boolean {
    return this.closed
  }

  // -- internals ----------------------------------------------------------

  private write(message: JsonRpcMessage): void {
    this.transport.send(`${JSON.stringify(message)}\n`)
  }

  private handleChunk(chunk: string): void {
    this.buffer += chunk
    let newlineIdx = this.buffer.indexOf('\n')
    while (newlineIdx >= 0) {
      const raw = this.buffer.slice(0, newlineIdx).trim()
      this.buffer = this.buffer.slice(newlineIdx + 1)
      if (raw) this.dispatch(raw)
      newlineIdx = this.buffer.indexOf('\n')
    }
  }

  private dispatch(raw: string): void {
    let message: JsonRpcMessage
    try {
      message = JSON.parse(raw) as JsonRpcMessage
    } catch {
      return // 非 JSON（启动 banner 等），忽略
    }
    const hasId = message.id !== undefined && (typeof message.id === 'number' || typeof message.id === 'string')
    if (hasId && message.method !== undefined) {
      void this.handleIncomingRequest(message)
    } else if (hasId) {
      this.handleResponse(message)
    } else if (message.method !== undefined) {
      this.notificationHandlers.get(message.method)?.(message.params)
    }
  }

  private handleResponse(message: JsonRpcMessage): void {
    const id = typeof message.id === 'number' ? message.id : Number(message.id)
    const pending = this.pending.get(id)
    if (!pending) return
    this.pending.delete(id)
    if (message.error) {
      pending.reject(new Error(message.error.message ?? `ACP error ${message.error.code ?? ''}`.trim()))
    } else {
      pending.resolve(message.result)
    }
  }

  private async handleIncomingRequest(message: JsonRpcMessage): Promise<void> {
    const handler = message.method ? this.requestHandlers.get(message.method) : undefined
    if (!handler) {
      this.write({ jsonrpc: '2.0', id: message.id, error: { code: -32601, message: `Method not found: ${message.method}` } })
      return
    }
    try {
      const result = await handler(message.params)
      this.write({ jsonrpc: '2.0', id: message.id, result })
    } catch (error) {
      this.write({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error instanceof Error ? error.message : String(error) } })
    }
  }

  private handleClose(err?: Error): void {
    if (this.closed) return
    this.closed = true
    this.closeError = err ?? new Error('ACP connection closed')
    for (const pending of this.pending.values()) pending.reject(this.closeError)
    this.pending.clear()
  }
}
