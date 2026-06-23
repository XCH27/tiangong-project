/**
 * CliRuntimeHost 生命周期证明：spawn/复用/换 runtime 重建/dispose（mock transport，无真实进程）。
 */

import { describe, expect, it } from 'bun:test'
import type { CliRuntimeDefinition, CliRuntimeStreamEvent } from '@craft-agent/shared/protocol'
import type { AcpTransport } from './acp-connection'
import { CliRuntimeHost, type AcpTransportFactory } from './cli-runtime-host'

class ScriptedTransport implements AcpTransport {
  private messageCb?: (chunk: string) => void
  private closeCb?: (err?: Error) => void
  closed = false
  sent: Array<{ method?: string; params?: Record<string, unknown> }> = []
  send(line: string): void {
    const msg = JSON.parse(line.trim()) as { id?: number; method?: string; params?: Record<string, unknown> }
    this.sent.push(msg)
    if (msg.method === 'initialize') this.reply(msg.id, { protocolVersion: 1 })
    else if (msg.method === 'session/new') this.reply(msg.id, {
      sessionId: 'acp-1',
      models: { currentModelId: 'm1', availableModels: [{ modelId: 'm1', name: 'One' }, { modelId: 'm2', name: 'Two' }] },
    })
    else if (msg.method === 'session/set_model') this.reply(msg.id, {})
    else if (msg.method === 'session/prompt') {
      queueMicrotask(() => {
        this.push({ jsonrpc: '2.0', method: 'session/update', params: { update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'ok' } } } })
        this.reply(msg.id, { stopReason: 'end_turn' })
      })
    }
  }
  onMessage(cb: (chunk: string) => void): void { this.messageCb = cb }
  onClose(cb: (err?: Error) => void): void { this.closeCb = cb }
  close(): void { if (!this.closed) { this.closed = true; this.closeCb?.() } }
  private reply(id: number | undefined, result: unknown): void { queueMicrotask(() => this.push({ jsonrpc: '2.0', id, result })) }
  private push(message: unknown): void { this.messageCb?.(`${JSON.stringify(message)}\n`) }
}

function makeHost() {
  const transports: ScriptedTransport[] = []
  let disposeCount = 0
  const factory: AcpTransportFactory = () => {
    const transport = new ScriptedTransport()
    transports.push(transport)
    return { transport, dispose: () => { disposeCount++ } }
  }
  const events: Array<{ sessionId: string; event: CliRuntimeStreamEvent }> = []
  const host = new CliRuntimeHost({
    emitEvent: (sessionId, event) => events.push({ sessionId, event }),
    requestPermission: async () => true,
    resolveCwd: () => '/tmp',
  }, factory)
  return { host, transports, events, getDisposeCount: () => disposeCount }
}

const runtimeA: CliRuntimeDefinition = { id: 'detected:grok', kind: 'detected', displayName: 'Grok', command: 'grok', args: ['agent', 'stdio'], enabled: true, protocol: 'acp', attachments: 'none' }
const runtimeB: CliRuntimeDefinition = { id: 'custom:x', kind: 'custom', displayName: 'X', command: 'x', args: [], enabled: true, protocol: 'acp', attachments: 'none' }

describe('CliRuntimeHost', () => {
  it('runTurn：initialize→newSession→prompt，归一化事件落到对应 session', async () => {
    const { host, events } = makeHost()
    const result = await host.runTurn('craft-1', runtimeA, 'hello')
    expect(result.stopReason).toBe('end_turn')
    expect(events.some(e => e.sessionId === 'craft-1' && e.event.type === 'text')).toBe(true)
    expect(events.some(e => e.event.type === 'done')).toBe(true)
  })

  it('同 runtime 第二轮复用同一进程（只 spawn 一次）', async () => {
    const { host, transports } = makeHost()
    await host.runTurn('craft-1', runtimeA, 'a')
    await host.runTurn('craft-1', runtimeA, 'b')
    expect(transports.length).toBe(1)
  })

  it('prepare 启动 runtime 并返回模型清单，但不发送 prompt', async () => {
    const { host, transports } = makeHost()
    const state = await host.prepare('craft-1', runtimeA)
    expect(state.currentModelId).toBe('m1')
    expect(state.availableModels.map(model => model.id)).toEqual(['m1', 'm2'])
    expect(transports[0]?.sent.some(message => message.method === 'session/prompt')).toBe(false)
  })

  it('setModel 通过现有 ACP session 切换并返回最新状态', async () => {
    const { host, transports } = makeHost()
    const state = await host.setModel('craft-1', runtimeA, 'm2')
    expect(state.currentModelId).toBe('m2')
    expect(transports[0]?.sent.find(message => message.method === 'session/set_model')?.params).toEqual({ sessionId: 'acp-1', modelId: 'm2' })
  })

  it('runTurn 在 prompt 前应用会话请求的模型', async () => {
    const { host, transports } = makeHost()
    await host.runTurn('craft-1', runtimeA, 'hello', 'm2')
    expect(transports[0]?.sent.map(message => message.method)).toEqual([
      'initialize', 'session/new', 'session/set_model', 'session/prompt',
    ])
  })

  it('换 runtime：dispose 旧的、spawn 新的', async () => {
    const { host, transports, getDisposeCount } = makeHost()
    await host.runTurn('craft-1', runtimeA, 'a')
    await host.runTurn('craft-1', runtimeB, 'b')
    expect(transports.length).toBe(2)
    expect(getDisposeCount()).toBe(1)
  })

  it('dispose / disposeAll 清理进程', async () => {
    const { host, transports } = makeHost()
    await host.runTurn('craft-1', runtimeA, 'a')
    expect(host.has('craft-1')).toBe(true)
    host.disposeAll()
    expect(host.has('craft-1')).toBe(false)
    expect(transports[0]?.closed).toBe(true)
  })
})
