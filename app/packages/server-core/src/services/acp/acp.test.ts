/**
 * ACP 协议层证明（docs/23）。用 mock transport 验证 JSON-RPC 客户端与一轮交互，
 * 不依赖真实 CLI/进程，普通 CI 可跑。
 */

import { describe, expect, it } from 'bun:test'
import type { CliRuntimeStreamEvent } from '@craft-agent/shared/protocol'
import { AcpConnection, type AcpTransport } from './acp-connection'
import { AcpRuntimeSession } from './acp-runtime-session'

interface SentMessage {
  jsonrpc: string
  id?: number
  method?: string
  params?: unknown
  result?: unknown
  error?: { code?: number; message?: string }
}

class MockTransport implements AcpTransport {
  sent: SentMessage[] = []
  onSend?: (message: SentMessage) => void
  private messageCb?: (chunk: string) => void
  private closeCb?: (err?: Error) => void
  private closed = false

  send(line: string): void {
    const message = JSON.parse(line.trim()) as SentMessage
    this.sent.push(message)
    this.onSend?.(message)
  }
  onMessage(cb: (chunk: string) => void): void { this.messageCb = cb }
  onClose(cb: (err?: Error) => void): void { this.closeCb = cb }
  close(): void { if (!this.closed) { this.closed = true; this.closeCb?.() } }

  /** 测试注入：模拟 agent 发来一条消息。 */
  push(message: unknown): void { this.messageCb?.(`${JSON.stringify(message)}\n`) }
  /** 测试注入：原始分片（验证 ndjson 重组）。 */
  pushRaw(chunk: string): void { this.messageCb?.(chunk) }
  lastId(): number | undefined { return [...this.sent].reverse().find(m => m.id !== undefined)?.id }
}

describe('AcpConnection (JSON-RPC over ndjson)', () => {
  it('request 关联响应：发出 request，收到同 id 响应后 resolve', async () => {
    const t = new MockTransport()
    const conn = new AcpConnection(t)
    t.onSend = msg => { if (msg.method === 'initialize') queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, result: { ok: true } })) }
    const result = await conn.request<{ ok: boolean }>('initialize', {})
    expect(result.ok).toBe(true)
    expect(t.sent[0]?.method).toBe('initialize')
  })

  it('error 响应 → reject', async () => {
    const t = new MockTransport()
    const conn = new AcpConnection(t)
    t.onSend = msg => queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, error: { code: -1, message: 'boom' } }))
    await expect(conn.request('x', {})).rejects.toThrow(/boom/)
  })

  it('notification 派发到 handler', () => {
    const t = new MockTransport()
    const conn = new AcpConnection(t)
    let got: unknown = null
    conn.onNotification('session/update', p => { got = p })
    t.push({ jsonrpc: '2.0', method: 'session/update', params: { hello: 1 } })
    expect(got).toEqual({ hello: 1 })
  })

  it('agent 反向 request → 调 handler 并写回 response', async () => {
    const t = new MockTransport()
    const conn = new AcpConnection(t)
    conn.onRequest('session/request_permission', () => ({ outcome: { outcome: 'cancelled' } }))
    t.push({ jsonrpc: '2.0', id: 42, method: 'session/request_permission', params: {} })
    await Promise.resolve()
    const response = t.sent.find(m => m.id === 42)
    expect(response?.result).toEqual({ outcome: { outcome: 'cancelled' } })
  })

  it('ndjson 重组：跨分片的两条消息都能解析', () => {
    const t = new MockTransport()
    const conn = new AcpConnection(t)
    const seen: unknown[] = []
    conn.onNotification('a', p => seen.push(p))
    conn.onNotification('b', p => seen.push(p))
    t.pushRaw('{"jsonrpc":"2.0","method":"a","params":1}\n{"jsonrpc":"2.0","me')
    t.pushRaw('thod":"b","params":2}\n')
    expect(seen).toEqual([1, 2])
  })

  it('非 JSON 行（CLI banner）被忽略，不崩', () => {
    const t = new MockTransport()
    const conn = new AcpConnection(t)
    let got = 0
    conn.onNotification('a', () => { got++ })
    t.pushRaw('Starting agent...\n')
    t.push({ jsonrpc: '2.0', method: 'a' })
    expect(got).toBe(1)
  })

  it('close 时 pending request 全部 reject', async () => {
    const t = new MockTransport()
    const conn = new AcpConnection(t)
    const p = conn.request('never', {})
    conn.close()
    await expect(p).rejects.toThrow()
  })
})

describe('AcpRuntimeSession（一轮交互）', () => {
  function scriptedAgent(t: MockTransport): void {
    t.onSend = msg => {
      if (msg.method === 'initialize') queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: 1, agentCapabilities: {} } }))
      if (msg.method === 'session/new') queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, result: { sessionId: 'acp-1' } }))
      if (msg.method === 'session/prompt') {
        queueMicrotask(() => {
          t.push({ jsonrpc: '2.0', method: 'session/update', params: { sessionId: 'acp-1', update: { sessionUpdate: 'agent_thought_chunk', content: { type: 'text', text: '想一下' } } } })
          t.push({ jsonrpc: '2.0', method: 'session/update', params: { sessionId: 'acp-1', update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'Hello' } } } })
          t.push({ jsonrpc: '2.0', method: 'session/update', params: { sessionId: 'acp-1', update: { sessionUpdate: 'tool_call', toolCallId: 'tc1', title: 'read file', status: 'pending' } } })
          t.push({ jsonrpc: '2.0', id: msg.id, result: { stopReason: 'end_turn' } })
        })
      }
    }
  }

  it('initialize → newSession → prompt：归一化事件按序，done=end_turn', async () => {
    const t = new MockTransport()
    const events: CliRuntimeStreamEvent[] = []
    const session = new AcpRuntimeSession({ transport: t, cwd: '/tmp', onEvent: e => events.push(e) })
    scriptedAgent(t)
    await session.initialize()
    const sid = await session.newSession()
    expect(sid).toBe('acp-1')
    const result = await session.prompt('hi')
    expect(result.stopReason).toBe('end_turn')
    expect(events.map(e => e.type)).toEqual(['models_changed', 'thought', 'text', 'tool_call', 'done'])
    expect(events.find(e => e.type === 'text')).toEqual({ type: 'text', text: 'Hello' })
    const tool = events.find(e => e.type === 'tool_call')
    expect(tool?.type === 'tool_call' ? tool.toolCallId : '').toBe('tc1')
  })

  it('session/request_permission：onPermission 决定 outcome（允许→selected allow option）', async () => {
    const t = new MockTransport()
    const session = new AcpRuntimeSession({
      transport: t,
      cwd: '/tmp',
      onEvent: () => {},
      onPermission: async () => true,
    })
    // 直接喂一个权限请求
    t.push({
      jsonrpc: '2.0', id: 7, method: 'session/request_permission',
      params: { sessionId: 'acp-1', toolCall: { toolCallId: 'tc1', title: 'write file' }, options: [
        { optionId: 'a', name: 'Allow', kind: 'allow_once' },
        { optionId: 'r', name: 'Reject', kind: 'reject_once' },
      ] },
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    const response = t.sent.find(m => m.id === 7)
    expect(response?.result).toEqual({ outcome: { outcome: 'selected', optionId: 'a' } })
    void session
  })

  it('prompt 前未 newSession → 抛错', async () => {
    const t = new MockTransport()
    const session = new AcpRuntimeSession({ transport: t, cwd: '/tmp', onEvent: () => {} })
    await expect(session.prompt('x')).rejects.toThrow(/newSession/)
  })

  it('从 model config option 发现模型并用 session/set_config_option 切换', async () => {
    const t = new MockTransport()
    const events: CliRuntimeStreamEvent[] = []
    t.onSend = msg => {
      if (msg.method === 'initialize') queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, result: { protocolVersion: 1 } }))
      if (msg.method === 'session/new') queueMicrotask(() => t.push({
        jsonrpc: '2.0', id: msg.id, result: {
          sessionId: 'acp-models',
          configOptions: [{
            id: 'model', category: 'model', currentValue: 'm1',
            options: [{ value: 'm1', name: 'Model One' }, { value: 'm2', name: 'Model Two' }],
          }],
        },
      }))
      if (msg.method === 'session/set_config_option') queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, result: {} }))
    }
    const session = new AcpRuntimeSession({ transport: t, cwd: '/tmp', onEvent: e => events.push(e) })
    await session.initialize()
    await session.newSession('detected:opencode')
    expect(events.at(-1)).toEqual({
      type: 'models_changed',
      state: {
        runtimeId: 'detected:opencode', source: 'config_option', currentModelId: 'm1',
        availableModels: [{ id: 'm1', name: 'Model One' }, { id: 'm2', name: 'Model Two' }],
        canSwitch: true, configOptionId: 'model',
      },
    })
    await session.setModel('m2')
    expect(t.sent.find(message => message.method === 'session/set_config_option')?.params).toEqual({
      sessionId: 'acp-models', configId: 'model', value: 'm2',
    })
    expect(session.getModelState()?.currentModelId).toBe('m2')
  })

  it('兼容 legacy models + session/set_model', async () => {
    const t = new MockTransport()
    t.onSend = msg => {
      if (msg.method === 'session/new') queueMicrotask(() => t.push({
        jsonrpc: '2.0', id: msg.id, result: {
          sessionId: 'legacy', models: {
            currentModelId: 'a',
            availableModels: [{ modelId: 'a', name: 'A' }, { modelId: 'b', name: 'B' }],
          },
        },
      }))
      if (msg.method === 'session/set_model') queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, result: {} }))
    }
    const session = new AcpRuntimeSession({ transport: t, cwd: '/tmp', onEvent: () => {} })
    await session.newSession('custom:legacy')
    await session.setModel('b')
    expect(t.sent.find(message => message.method === 'session/set_model')?.params).toEqual({ sessionId: 'legacy', modelId: 'b' })
  })

  it('runtime 未暴露模型时诚实标记为 CLI 自管', async () => {
    const t = new MockTransport()
    const events: CliRuntimeStreamEvent[] = []
    t.onSend = msg => {
      if (msg.method === 'session/new') queueMicrotask(() => t.push({ jsonrpc: '2.0', id: msg.id, result: { sessionId: 'opaque' } }))
    }
    const session = new AcpRuntimeSession({ transport: t, cwd: '/tmp', onEvent: e => events.push(e) })
    await session.newSession('detected:grok')
    expect(events.at(-1)).toEqual({
      type: 'models_changed',
      state: { runtimeId: 'detected:grok', source: 'runtime_managed', currentModelId: null, availableModels: [], canSwitch: false },
    })
  })
})
