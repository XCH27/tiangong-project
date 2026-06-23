/**
 * CLI Runtime 目录与健康测试 RPC（docs/23）。
 *
 * 只管 runtime 定义（detected/custom）+ 健康测试；不是第二套 session store。
 * 选择 runtime 发消息、进程生命周期走 SessionManager + adapter（后续 sub-batch）。
 * 配置落 ~/.craft-agent（机器级，跨 workspace），用 CONFIG_DIR。
 */

import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { getDefaultCliRuntimeCatalog, type CustomRuntimeInput, type CustomRuntimePatch } from '../../services/cli-runtime-catalog'
import { probeCliRuntimeHealth } from '../../services/cli-runtime-health'

const getCatalog = getDefaultCliRuntimeCatalog

export function registerCliRuntimeHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.cliRuntimes.LIST, async () => {
    return getCatalog().list()
  })

  server.handle(RPC_CHANNELS.cliRuntimes.GET, async (_ctx, runtimeId: string) => {
    return getCatalog().get(runtimeId)
  })

  server.handle(RPC_CHANNELS.cliRuntimes.ADD_CUSTOM, async (_ctx, input: CustomRuntimeInput) => {
    return getCatalog().addCustom(input)
  })

  server.handle(RPC_CHANNELS.cliRuntimes.UPDATE_CUSTOM, async (_ctx, runtimeId: string, patch: CustomRuntimePatch) => {
    return getCatalog().updateCustom(runtimeId, patch)
  })

  server.handle(RPC_CHANNELS.cliRuntimes.SET_ENABLED, async (_ctx, runtimeId: string, enabled: boolean) => {
    getCatalog().setEnabled(runtimeId, enabled)
  })

  server.handle(RPC_CHANNELS.cliRuntimes.DELETE, async (_ctx, runtimeId: string) => {
    getCatalog().delete(runtimeId)
  })

  // 健康测试：spawn 探测（依赖本机已装 CLI）。未找到的 runtime 直接 fail_cli 文案。
  server.handle(RPC_CHANNELS.cliRuntimes.TEST, async (_ctx, runtimeId: string) => {
    const runtime = getCatalog().get(runtimeId)
    if (!runtime) {
      return {
        runtimeId,
        health: 'fail_cli' as const,
        stage: 'spawn' as const,
        reason: `未找到 runtime: ${runtimeId}`,
        checkedAt: Date.now(),
      }
    }
    if (!runtime.enabled) {
      return { runtimeId, health: 'disabled' as const, checkedAt: Date.now() }
    }
    return probeCliRuntimeHealth(runtime)
  })
}
