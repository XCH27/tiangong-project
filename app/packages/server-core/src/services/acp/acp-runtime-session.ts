/**
 * AcpRuntimeSession —— ACP 一轮交互的高层封装。
 *
 * 流程：initialize → session/new → session/prompt → 流式 session/update → stopReason。
 * 把不同 runtime 的 `session/update` 归一成 `CliRuntimeStreamEvent`；agent 反向的
 * `session/request_permission` 经注入的 `onPermission`（走 craft permission）回 outcome。
 *
 * 纯协议层：进程/spawn 不在这里，由调用方注入 `AcpTransport`（真实 = stdio；测试 = mock）。
 */

import type {
  CliRuntimeStreamEvent,
  CliRuntimePromptResult,
  CliRuntimePermissionRequest,
  CliRuntimeStopReason,
  CliRuntimeToolStatus,
  CliRuntimeModel,
  CliRuntimeModelState,
} from '@craft-agent/shared/protocol'
import { AcpConnection, type AcpTransport } from './acp-connection'

const DEFAULT_PROTOCOL_VERSION = 1

export interface AcpRuntimeSessionOptions {
  transport: AcpTransport
  /** 工作目录（session/new 的 cwd）。 */
  cwd: string
  /** 归一化流事件回调（写 craft timeline）。 */
  onEvent: (event: CliRuntimeStreamEvent) => void
  /** 权限请求 → 走 craft permission，返回是否允许。省略时默认拒绝（安全默认）。 */
  onPermission?: (request: CliRuntimePermissionRequest) => Promise<boolean>
  protocolVersion?: number
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function textOf(content: unknown): string {
  const record = asRecord(content)
  return typeof record.text === 'string' ? record.text : ''
}

function mapStopReason(raw: unknown): CliRuntimeStopReason {
  switch (raw) {
    case 'end_turn': return 'end_turn'
    case 'max_tokens': return 'max_tokens'
    case 'cancelled': return 'cancelled'
    case 'refusal': return 'refusal'
    default: return 'end_turn'
  }
}

function mapToolStatus(raw: unknown): CliRuntimeToolStatus {
  switch (raw) {
    case 'in_progress': return 'in_progress'
    case 'completed': return 'completed'
    case 'failed': return 'failed'
    default: return 'pending'
  }
}

function normalizedToken(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s_-]+/g, '') : ''
}

function modelStateFromSessionResult(runtimeId: string, result: Record<string, unknown>): CliRuntimeModelState {
  const configOptions = Array.isArray(result.configOptions) ? result.configOptions : []
  for (const raw of configOptions) {
    const option = asRecord(raw)
    const configId = typeof option.id === 'string' ? option.id.trim() : ''
    const category = normalizedToken(option.category)
    const name = normalizedToken(option.name)
    const isModel = category === 'model' || normalizedToken(configId) === 'model' || (!category && name === 'model')
    if (!configId || !isModel || (option.type && option.type !== 'select')) continue
    const availableModels = (Array.isArray(option.options) ? option.options : []).flatMap<CliRuntimeModel>(rawValue => {
      const value = asRecord(rawValue)
      const id = typeof value.value === 'string' && value.value.trim()
        ? value.value.trim()
        : typeof value.id === 'string' ? value.id.trim() : ''
      if (!id) return []
      return [{
        id,
        name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : id,
        ...(typeof value.description === 'string' && value.description.trim() ? { description: value.description.trim() } : {}),
      }]
    })
    return {
      runtimeId,
      source: 'config_option',
      currentModelId: typeof option.currentValue === 'string' && option.currentValue.trim() ? option.currentValue.trim() : null,
      availableModels,
      canSwitch: availableModels.length > 0,
      configOptionId: configId,
    }
  }

  const models = asRecord(result.models)
  const availableModels = (Array.isArray(models.availableModels) ? models.availableModels : []).flatMap<CliRuntimeModel>(rawModel => {
    const model = asRecord(rawModel)
    const id = typeof model.modelId === 'string' && model.modelId.trim()
      ? model.modelId.trim()
      : typeof model.id === 'string' ? model.id.trim() : ''
    if (!id) return []
    return [{
      id,
      name: typeof model.name === 'string' && model.name.trim() ? model.name.trim() : id,
      ...(typeof model.description === 'string' && model.description.trim() ? { description: model.description.trim() } : {}),
    }]
  })
  if (availableModels.length > 0) {
    return {
      runtimeId,
      source: 'models',
      currentModelId: typeof models.currentModelId === 'string' && models.currentModelId.trim() ? models.currentModelId.trim() : null,
      availableModels,
      canSwitch: true,
    }
  }
  return { runtimeId, source: 'runtime_managed', currentModelId: null, availableModels: [], canSwitch: false }
}

export class AcpRuntimeSession {
  private readonly conn: AcpConnection
  private readonly onEvent: (event: CliRuntimeStreamEvent) => void
  private readonly onPermission?: (request: CliRuntimePermissionRequest) => Promise<boolean>
  private readonly cwd: string
  private readonly protocolVersion: number
  private sessionId: string | null = null
  private modelState: CliRuntimeModelState | null = null

  constructor(options: AcpRuntimeSessionOptions) {
    this.conn = new AcpConnection(options.transport)
    this.onEvent = options.onEvent
    this.onPermission = options.onPermission
    this.cwd = options.cwd
    this.protocolVersion = options.protocolVersion ?? DEFAULT_PROTOCOL_VERSION
    this.conn.onNotification('session/update', params => this.handleUpdate(params))
    this.conn.onRequest('session/request_permission', params => this.handlePermission(params))
  }

  /** ACP 握手。 */
  async initialize(): Promise<void> {
    await this.conn.request('initialize', {
      protocolVersion: this.protocolVersion,
      clientCapabilities: { fs: { readTextFile: false, writeTextFile: false } },
    })
  }

  /** 新建 ACP session，返回 sessionId。 */
  async newSession(runtimeId = 'unknown'): Promise<string> {
    const result = asRecord(await this.conn.request('session/new', { cwd: this.cwd, mcpServers: [] }))
    const sessionId = typeof result.sessionId === 'string' ? result.sessionId : null
    if (!sessionId) throw new Error('ACP session/new 未返回 sessionId')
    this.sessionId = sessionId
    this.modelState = modelStateFromSessionResult(runtimeId, result)
    this.onEvent({ type: 'models_changed', state: this.modelState })
    return sessionId
  }

  getModelState(): CliRuntimeModelState | null {
    return this.modelState
  }

  /** Switch the active ACP model using the capability reported by session/new. */
  async setModel(modelId: string): Promise<CliRuntimeModelState> {
    if (!this.sessionId || !this.modelState) throw new Error('必须先 newSession 再切换模型')
    if (!this.modelState.canSwitch) throw new Error('当前 CLI 未向 Fleet 暴露可切换模型，模型由 CLI 管理')
    if (this.modelState.availableModels.length > 0 && !this.modelState.availableModels.some(model => model.id === modelId)) {
      throw new Error(`当前 CLI 不支持模型：${modelId}`)
    }
    if (this.modelState.source === 'config_option' && this.modelState.configOptionId) {
      await this.conn.request('session/set_config_option', {
        sessionId: this.sessionId,
        configId: this.modelState.configOptionId,
        value: modelId,
      })
    } else {
      await this.conn.request('session/set_model', { sessionId: this.sessionId, modelId })
    }
    this.modelState = { ...this.modelState, currentModelId: modelId }
    this.onEvent({ type: 'models_changed', state: this.modelState })
    return this.modelState
  }

  /** 发一轮 prompt，流式回调 onEvent，最终返回 stopReason。 */
  async prompt(text: string): Promise<CliRuntimePromptResult> {
    if (!this.sessionId) throw new Error('必须先 newSession 再 prompt')
    let result: Record<string, unknown>
    try {
      result = asRecord(await this.conn.request('session/prompt', {
        sessionId: this.sessionId,
        prompt: [{ type: 'text', text }],
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.onEvent({ type: 'error', message })
      return { stopReason: 'error' }
    }
    const stopReason = mapStopReason(result.stopReason)
    this.onEvent({ type: 'done', stopReason })
    return { stopReason }
  }

  /** 取消当前轮（ACP notification）。 */
  cancel(): void {
    if (this.sessionId) this.conn.notify('session/cancel', { sessionId: this.sessionId })
  }

  /** 关闭连接（kill 进程）。 */
  dispose(): void {
    this.conn.close()
  }

  // -- internals ----------------------------------------------------------

  private handleUpdate(params: unknown): void {
    const update = asRecord(asRecord(params).update)
    const kind = update.sessionUpdate
    switch (kind) {
      case 'agent_message_chunk': {
        const text = textOf(update.content)
        if (text) this.onEvent({ type: 'text', text })
        break
      }
      case 'agent_thought_chunk': {
        const text = textOf(update.content)
        if (text) this.onEvent({ type: 'thought', text })
        break
      }
      case 'tool_call':
      case 'tool_call_update': {
        const toolCallId = typeof update.toolCallId === 'string' ? update.toolCallId : ''
        const title = typeof update.title === 'string' ? update.title : (typeof update.kind === 'string' ? update.kind : 'tool')
        this.onEvent({
          type: 'tool_call',
          toolCallId,
          title,
          status: mapToolStatus(update.status),
          rawInput: update.rawInput !== undefined ? safeStringify(update.rawInput) : undefined,
        })
        break
      }
      default:
        break // 其它 update 类型暂不投影
    }
  }

  private async handlePermission(params: unknown): Promise<unknown> {
    const record = asRecord(params)
    const toolCall = asRecord(record.toolCall)
    const optionsRaw = Array.isArray(record.options) ? record.options : []
    const request: CliRuntimePermissionRequest = {
      toolCallId: typeof toolCall.toolCallId === 'string' ? toolCall.toolCallId : '',
      title: typeof toolCall.title === 'string' ? toolCall.title : 'tool',
      options: optionsRaw.map(raw => {
        const option = asRecord(raw)
        return {
          optionId: typeof option.optionId === 'string' ? option.optionId : '',
          name: typeof option.name === 'string' ? option.name : '',
          kind: (option.kind === 'allow_always' || option.kind === 'reject_once' || option.kind === 'reject_always')
            ? option.kind
            : 'allow_once',
        }
      }),
    }
    const allowed = this.onPermission ? await this.onPermission(request) : false
    const pick = (wantAllow: boolean): string | undefined => {
      const match = request.options.find(option =>
        wantAllow ? option.kind.startsWith('allow') : option.kind.startsWith('reject'))
      return match?.optionId
    }
    const optionId = pick(allowed)
    if (!optionId) {
      return { outcome: { outcome: 'cancelled' } }
    }
    return { outcome: { outcome: 'selected', optionId } }
  }
}

function safeStringify(value: unknown): string {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value)
  } catch {
    return ''
  }
}
