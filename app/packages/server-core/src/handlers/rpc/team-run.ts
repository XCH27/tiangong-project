/**
 * TeamRun RPC handlers（D19 P1 skeleton · docs/38-API-CLI §4-§5）
 *
 * 暴露 Fleet Bridge 工具集给 CLI lane 和前端 UI。
 * 当前只注册 channel + 调用 TeamRunCoordinator skeleton。
 * 不绕过 craft permission；L2+ 操作仍走 SessionManager。
 */

import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { getTeamRunCoordinator } from '../../services/team-run-coordinator'

export function registerTeamRunHandlers(server: RpcServer, _deps: HandlerDeps): void {
  const coordinator = getTeamRunCoordinator()

  server.handle(RPC_CHANNELS.teamRun.GET_TEAM, async () => {
    return coordinator.getTeam()
  })

  server.handle(
    RPC_CHANNELS.teamRun.PROPOSE_RUN,
    async (
      _ctx,
      params: {
        initiatorSeatId: string
        initiatorLaneId: string
        targetSeatId: string
        targetLaneId: string
        taskDescription: string
        taskId?: string
        idempotencyKey?: string
      },
    ) => {
      return coordinator.proposeRun(params)
    },
  )

  server.handle(
    RPC_CHANNELS.teamRun.START_RUN,
    async (_ctx, runId: string) => {
      return coordinator.startRun(runId)
    },
  )

  server.handle(RPC_CHANNELS.teamRun.GET_STATUS, async (_ctx, runId: string) => {
    return coordinator.getRunStatus(runId) ?? null
  })

  server.handle(RPC_CHANNELS.teamRun.GET_REPORT, async (_ctx, runId: string) => {
    return coordinator.getRunReport(runId) ?? null
  })

  server.handle(RPC_CHANNELS.teamRun.CANCEL_RUN, async (_ctx, runId: string, reason?: string) => {
    return coordinator.cancelRun(runId, reason) ?? null
  })

  // SEND_MESSAGE: delegates to existing team coordinator (docs/33 §5).
  // P1 skeleton — full wiring in P2.
  server.handle(
    RPC_CHANNELS.teamRun.SEND_MESSAGE,
    async (_ctx, _params: { targetSeatId: string; message: string }) => {
      // P2: delegate to TeamCoordinator.sendTeamMessage
      return { delivered: false, reason: 'not_implemented_p1' }
    },
  )

  // INVOKE_ACTION: only L0/L1 internal actions; L2+ must go through TeamRun.
  // P1 skeleton — full wiring in P2.
  server.handle(
    RPC_CHANNELS.teamRun.INVOKE_ACTION,
    async (_ctx, _params: { actionId: string; args?: Record<string, unknown> }) => {
      // P2: delegate to InternalActionRegistry with L0/L1 gate
      return { result: null, reason: 'not_implemented_p1' }
    },
  )
}
