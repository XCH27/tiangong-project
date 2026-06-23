/**
 * 管理 Agent 分级自动决策设置 RPC（D12 / docs/17 §4）。
 *
 * 只读/改设置（开关 + L2 规则）。判定逻辑在 `decideAuto`，落地在 `SessionManager.requestWorkflowPermission`
 * 与 `TeamCoordinator.enforcePermission`。设置落 `<workspace>/.fleet/manager-decision.json`，LOCAL_ONLY。
 */

import { RPC_CHANNELS, type AutoDecisionSettings } from '@craft-agent/shared/protocol'
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { ManagerDecisionService } from '../../services/manager-decision-service'

export function registerManagerDecisionHandlers(server: RpcServer, _deps: HandlerDeps): void {
  const resolve = (workspaceId: string): ManagerDecisionService => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`)
    return new ManagerDecisionService(workspace.rootPath)
  }

  server.handle(RPC_CHANNELS.managerDecision.GET_SETTINGS, async (_ctx, workspaceId: string) => {
    return resolve(workspaceId).getSettings()
  })

  server.handle(RPC_CHANNELS.managerDecision.UPDATE_SETTINGS, async (_ctx, workspaceId: string, patch: Partial<AutoDecisionSettings>) => {
    return resolve(workspaceId).updateSettings(patch)
  })
}
