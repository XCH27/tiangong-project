import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import { RPC_CHANNELS, type TeamRulesV1 } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { TeamRulesService } from '../../services/team-rules-service'

export function registerTeamRulesHandlers(server: RpcServer, _deps: HandlerDeps): void {
  const services = new Map<string, TeamRulesService>()

  const resolveService = (workspaceId: string): TeamRulesService => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`)
    let service = services.get(workspace.rootPath)
    if (!service) {
      service = new TeamRulesService(workspace.rootPath)
      services.set(workspace.rootPath, service)
    }
    return service
  }

  server.handle(RPC_CHANNELS.teamRules.GET, async (_ctx, workspaceId: string) => {
    return resolveService(workspaceId).load()
  })

  server.handle(RPC_CHANNELS.teamRules.VALIDATE, async (_ctx, workspaceId: string, rules: TeamRulesV1) => {
    return resolveService(workspaceId).validate(rules)
  })
}
