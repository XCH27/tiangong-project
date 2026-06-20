/**
 * Fleet 系统工具 / 项目环境 RPC 处理器（T-SYSTOOLS · `docs/28`）。
 *
 * 把 `RPC_CHANNELS.systemTools.*` 接到唯一的 `SystemToolsRegistry`。全部只读：
 * `listTools` / `detectAll` / `detectTool` / `detectCategory` / `getBestTool` /
 * `clearCache` / `diagnoseProject` / `getProjectProfile`。探测可自动执行（rule 28）。
 *
 * **没有 `runRepair` 通道**——v1 不自动执行安装/改 PATH/写配置/修复命令；那需要
 * permission + timeline，是后续切片。UI 里修复按钮标注"未接入"。
 *
 * 全部通道标 LOCAL_ONLY（rule 14：探测本机 OS 能力）。不引入第二套 session/timeline。
 */

import type { RpcServer } from '@craft-agent/server-core/transport'
import {
  RPC_CHANNELS,
  type DetectOptions,
  type DetectToolInput,
  type DetectCategoryInput,
  type GetBestToolInput,
  type ProjectEnvInput,
  type ProjectDiagnosisResult,
  type ClearCacheResult,
} from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import { SystemToolsRegistry } from '../../services/system-tools-registry'
import { buildProjectEnvironmentProfile } from '../../services/system-tools-project'
import { collectToolDiagnostics } from '../../services/system-tools-diagnostics'

export function registerSystemToolsHandlers(server: RpcServer, _deps: HandlerDeps): void {
  // 唯一 registry 实例（进程内缓存）。探测自动；安装/修复不在此处。
  const registry = new SystemToolsRegistry()

  server.handle(RPC_CHANNELS.systemTools.LIST_TOOLS, async (_ctx, opts?: DetectOptions) => {
    return registry.listTools(opts?.force ?? false)
  })

  server.handle(RPC_CHANNELS.systemTools.DETECT_ALL, async (_ctx, opts?: DetectOptions) => {
    return registry.detectAll(opts?.force ?? false)
  })

  server.handle(RPC_CHANNELS.systemTools.DETECT_TOOL, async (_ctx, input: DetectToolInput) => {
    return registry.detectTool(input.toolId, input.force ?? false)
  })

  server.handle(RPC_CHANNELS.systemTools.DETECT_CATEGORY, async (_ctx, input: DetectCategoryInput) => {
    return registry.detectCategory(input.category, input.force ?? false)
  })

  server.handle(RPC_CHANNELS.systemTools.GET_BEST_TOOL, async (_ctx, input: GetBestToolInput) => {
    return registry.getBestTool(input.category, input.capability)
  })

  server.handle(RPC_CHANNELS.systemTools.CLEAR_CACHE, async (_ctx, toolId?: string): Promise<ClearCacheResult> => {
    registry.clearCache(toolId)
    return { cleared: true }
  })

  server.handle(RPC_CHANNELS.systemTools.DIAGNOSE_PROJECT, async (_ctx, input: ProjectEnvInput): Promise<ProjectDiagnosisResult> => {
    const profile = buildProjectEnvironmentProfile(input.rootDir, { workspaceId: input.workspaceId })
    const tools = registry.listCached()
    return {
      profile,
      toolDiagnostics: collectToolDiagnostics(tools),
    }
  })

  server.handle(RPC_CHANNELS.systemTools.GET_PROJECT_PROFILE, async (_ctx, input: ProjectEnvInput) => {
    return buildProjectEnvironmentProfile(input.rootDir, { workspaceId: input.workspaceId })
  })
}
