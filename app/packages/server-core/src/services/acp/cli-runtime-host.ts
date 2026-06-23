/**
 * CliRuntimeHost —— 把「craft session 选了某个 CLI runtime」变成一轮真实 ACP 执行。
 *
 * 每个 craft session 复用一个 ACP 进程 + session（跨轮保持上下文）；换 runtime 或结束时 dispose。
 * 归一化事件经 deps.emitEvent 写进 craft timeline；权限经 deps.requestPermission 走 craft permission。
 * 进程生命周期：spawn、initialize、session/new、prompt、cancel、dispose —— 任何错误/停止/结束都清理。
 *
 * transportFactory 可注入，便于单测（mock transport，不 spawn 真实进程）。
 */

import type {
  CliRuntimeDefinition,
  CliRuntimeStreamEvent,
  CliRuntimePromptResult,
  CliRuntimePermissionRequest,
  CliRuntimeModelState,
} from '@craft-agent/shared/protocol'
import type { AcpTransport } from './acp-connection'
import { AcpRuntimeSession } from './acp-runtime-session'
import { createAcpStdioTransport } from './acp-stdio-transport'

export interface CliRuntimeHostDeps {
  /** 把一轮的归一化事件写进对应 craft session 的 timeline。 */
  emitEvent(craftSessionId: string, event: CliRuntimeStreamEvent): void
  /** runtime 权限请求 → 走 craft permission，返回是否允许。 */
  requestPermission(craftSessionId: string, request: CliRuntimePermissionRequest): Promise<boolean>
  /** 该 craft session 的工作目录（ACP cwd）。 */
  resolveCwd(craftSessionId: string): string
}

/** 注入式传输工厂（真实 = spawn stdio；测试 = mock）。 */
export type AcpTransportFactory = (runtime: CliRuntimeDefinition, cwd: string) => { transport: AcpTransport; dispose: () => void }

interface ActiveSession {
  session: AcpRuntimeSession
  runtimeId: string
  dispose: () => void
}

const defaultTransportFactory: AcpTransportFactory = (runtime, cwd) => {
  const { transport, child } = createAcpStdioTransport({
    command: runtime.command,
    args: runtime.args,
    env: runtime.env,
    cwd,
  })
  return {
    transport,
    dispose: () => { try { child.kill('SIGKILL') } catch { /* gone */ } },
  }
}

export class CliRuntimeHost {
  private readonly active = new Map<string, ActiveSession>()

  constructor(
    private readonly deps: CliRuntimeHostDeps,
    private readonly transportFactory: AcpTransportFactory = defaultTransportFactory,
  ) {}

  /** 启动/复用 ACP session 并读取它实际暴露的模型能力。 */
  async prepare(craftSessionId: string, runtime: CliRuntimeDefinition): Promise<CliRuntimeModelState> {
    let entry = this.active.get(craftSessionId)
    if (entry && entry.runtimeId !== runtime.id) {
      this.dispose(craftSessionId)
      entry = undefined
    }
    if (!entry) {
      const cwd = this.deps.resolveCwd(craftSessionId)
      const { transport, dispose } = this.transportFactory(runtime, cwd)
      const session = new AcpRuntimeSession({
        transport,
        cwd,
        onEvent: event => this.deps.emitEvent(craftSessionId, event),
        onPermission: request => this.deps.requestPermission(craftSessionId, request),
      })
      try {
        await session.initialize()
        await session.newSession(runtime.id)
      } catch (error) {
        session.dispose()
        dispose()
        const message = error instanceof Error ? error.message : String(error)
        this.deps.emitEvent(craftSessionId, { type: 'error', message: `ACP 启动失败：${message}` })
        throw new Error(`ACP 启动失败：${message}`)
      }
      entry = { session, runtimeId: runtime.id, dispose: () => { session.dispose(); dispose() } }
      this.active.set(craftSessionId, entry)
    }
    return entry.session.getModelState()
      ?? { runtimeId: runtime.id, source: 'runtime_managed', currentModelId: null, availableModels: [], canSwitch: false }
  }

  /** 在当前 ACP session 内切换模型；没有活跃进程时先准备 runtime。 */
  async setModel(craftSessionId: string, runtime: CliRuntimeDefinition, modelId: string): Promise<CliRuntimeModelState> {
    await this.prepare(craftSessionId, runtime)
    const entry = this.active.get(craftSessionId)
    if (!entry) throw new Error('CLI Runtime 尚未启动')
    return entry.session.setModel(modelId)
  }

  /** 在某 craft session 上用某 runtime 跑一轮 prompt。复用进程；换 runtime 自动重建。 */
  async runTurn(
    craftSessionId: string,
    runtime: CliRuntimeDefinition,
    prompt: string,
    requestedModelId?: string | null,
  ): Promise<CliRuntimePromptResult> {
    const state = await this.prepare(craftSessionId, runtime)
    if (requestedModelId && state.currentModelId !== requestedModelId) {
      await this.setModel(craftSessionId, runtime, requestedModelId)
    }
    const entry = this.active.get(craftSessionId)
    if (!entry) return { stopReason: 'error' }
    return entry.session.prompt(prompt)
  }

  /** 取消当前轮（不关进程）。 */
  cancel(craftSessionId: string): void {
    this.active.get(craftSessionId)?.session.cancel()
  }

  /** 结束并清理某 craft session 的进程。 */
  dispose(craftSessionId: string): void {
    const entry = this.active.get(craftSessionId)
    if (!entry) return
    this.active.delete(craftSessionId)
    entry.dispose()
  }

  /** 清理全部（窗口关闭/退出时）。 */
  disposeAll(): void {
    for (const id of [...this.active.keys()]) this.dispose(id)
  }

  has(craftSessionId: string): boolean {
    return this.active.has(craftSessionId)
  }
}
