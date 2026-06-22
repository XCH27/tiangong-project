/**
 * Team orchestration read API（承重墙 · LOCAL_ONLY）。
 *
 * 只读派生：团队投影 / 待审队列 / 收件箱。写动作不在这里——它们走
 * `sessions:command` → TeamCoordinator（过 permission + timeline），见 `rpc/sessions.ts`。
 */

import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { createSessionManagerTeamRuntime, getTeamCoordinator } from '../../services/team-coordinator'

export function registerTeamHandlers(server: RpcServer, deps: HandlerDeps): void {
  const { sessionManager } = deps

  const resolveCoordinator = (workspaceId: string) => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`)
    const runtime = createSessionManagerTeamRuntime(sessionManager, workspaceId)
    return getTeamCoordinator({ workspaceRootPath: workspace.rootPath, runtime })
  }

  server.handle(RPC_CHANNELS.team.GET, async (_ctx, workspaceId: string) => {
    return resolveCoordinator(workspaceId).getProjection()
  })

  server.handle(RPC_CHANNELS.team.GET_REVIEW_QUEUE, async (_ctx, workspaceId: string) => {
    return resolveCoordinator(workspaceId).getReviewQueue()
  })

  server.handle(RPC_CHANNELS.team.GET_INBOX, async (_ctx, workspaceId: string, sessionId: string) => {
    return resolveCoordinator(workspaceId).getInbox(sessionId)
  })
}
