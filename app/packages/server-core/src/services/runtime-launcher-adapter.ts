/**
 * RuntimeLauncherAdapter（D19 P1 skeleton · docs/38-API-CLI §8）
 * =====================================================================
 *
 * 每种外部 CLI 的启动方式、Bridge/MCP 注入、清理策略都不一样。
 * Core 必须有 RuntimeLauncherAdapter 来统一管理。
 *
 * 当前是 P1 skeleton：
 * - 只定义接口和 registry
 * - 不启动真实 CLI 进程
 * - 不注入 Bridge MCP
 *
 * P2 会实现真实 adapter（ACP stdio / one-shot / PTY）。
 */

import type { BridgeStatus } from '@craft-agent/shared/protocol/team-run'

// ---------------------------------------------------------------------------
// Adapter 契约
// ---------------------------------------------------------------------------

export interface RuntimeLauncherAdapter {
  /** CLI runtime id，如 `goose` / `codex` / `claude-code` / `agy` / custom */
  runtimeId: string
  /** 启动模式 */
  launchMode: LaunchMode
  /** Bridge 注入方式 */
  bridgeInjection: BridgeInjection
  /** 配置写入范围 */
  configWriteScope: ConfigWriteScope
  /** 诊断信息 */
  diagnostics(): Promise<AdapterDiagnostics>
  /** 启动 CLI 并注入 Bridge（P2 实现） */
  launch(params: LaunchParams): Promise<LaunchResult>
  /** 清理（P2 实现） */
  cleanup(sessionId: string): Promise<void>
}

export type LaunchMode = 'stdio-acp' | 'one-shot' | 'pty' | 'unsupported'

export type BridgeInjection = 'mcp-config' | 'env' | 'args' | 'not-supported'

export type ConfigWriteScope =
  | 'temp-session'
  | 'workspace-local'
  | 'user-global-requires-permission'

export interface AdapterDiagnostics {
  runtimeId: string
  binaryPath?: string
  version?: string
  loginState?: string
  launchMode: LaunchMode
  bridgeInjection: BridgeInjection
  bridgeStatus: BridgeStatus
  stderrTail?: string
  configConflicts?: string[]
}

export interface LaunchParams {
  sessionId: string
  workspaceRootPath: string
  cliRuntimeId: string
  cliRuntimeModelId?: string | null
  /** Bridge MCP loopback port + short-lived token */
  bridgeEndpoint?: string
  bridgeToken?: string
}

export interface LaunchResult {
  pid: number
  bridgeStatus: BridgeStatus
  stderrTail?: string
  startedAt: number
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class RuntimeLauncherRegistry {
  private readonly adapters = new Map<string, RuntimeLauncherAdapter>()

  register(adapter: RuntimeLauncherAdapter): void {
    this.adapters.set(adapter.runtimeId, adapter)
  }

  get(runtimeId: string): RuntimeLauncherAdapter | undefined {
    return this.adapters.get(runtimeId)
  }

  list(): RuntimeLauncherAdapter[] {
    return Array.from(this.adapters.values())
  }

  /** Return adapter + bridge status for UI diagnostics. */
  async diagnoseAll(): Promise<AdapterDiagnostics[]> {
    const results = await Promise.allSettled(
      this.list().map(a => a.diagnostics()),
    )
    return results
      .filter((r): r is PromiseFulfilledResult<AdapterDiagnostics> => r.status === 'fulfilled')
      .map(r => r.value)
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let registryInstance: RuntimeLauncherRegistry | null = null

export function getRuntimeLauncherRegistry(): RuntimeLauncherRegistry {
  if (!registryInstance) {
    registryInstance = new RuntimeLauncherRegistry()
  }
  return registryInstance
}
