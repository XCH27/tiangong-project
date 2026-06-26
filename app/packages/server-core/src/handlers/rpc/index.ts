import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'

import { registerAuthHandlers } from './auth'
import { registerAutomationsHandlers } from './automations'
import { registerDesignHandlers } from './design'
import { registerFilesHandlers } from './files'
import { registerInternalActionHandlers } from './internal-actions'
import { registerLabelsHandlers } from './labels'
import { registerLlmConnectionsHandlers } from './llm-connections'
import { registerOAuthHandlers } from './oauth'
import { registerResourcesHandlers } from './resources'
import { registerOnboardingHandlers } from './onboarding'
import { registerSessionsHandlers } from './sessions'
export { registerSessionsHandlers, cleanupSessionFileWatchForClient } from './sessions'
import { registerServerHandlers } from './server'
import type { ServerHandlerContext } from '../../bootstrap/headless-start'
export type { ServerHandlerContext } from '../../bootstrap/headless-start'
export { getHealthCheck } from './server'
import { registerSettingsHandlers } from './settings'
import { registerSkillsHandlers } from './skills'
import { registerSourcesHandlers } from './sources'
import { registerStatusesHandlers } from './statuses'
import { registerSystemCoreHandlers } from './system'
import { registerTransferHandlers } from './transfer'
import { registerTeamRulesHandlers } from './team-rules'
import { registerTeamHandlers } from './team'
import { registerCliRuntimeHandlers } from './cli-runtime'
import { registerManagerDecisionHandlers } from './manager-decision'
import { registerMemoryHandlers } from './memory'
import { registerUsageHandlers } from './usage'
import { registerExternalJobHandlers } from './external-job'
import { registerWorkspaceCoreHandlers } from './workspace'
import { registerMessagingHandlers } from './messaging'

export function registerCoreRpcHandlers(
  server: RpcServer,
  deps: HandlerDeps,
  serverCtx?: ServerHandlerContext,
): void {
  registerAuthHandlers(server, deps)
  registerAutomationsHandlers(server, deps)
  registerDesignHandlers(server, deps)
  registerFilesHandlers(server, deps)
  registerInternalActionHandlers(server, deps)
  registerLabelsHandlers(server, deps)
  registerLlmConnectionsHandlers(server, deps)
  registerCliRuntimeHandlers(server, deps)
  registerManagerDecisionHandlers(server, deps)
  registerMemoryHandlers(server, deps)
  registerUsageHandlers(server, deps)
  registerExternalJobHandlers(server, deps)
  registerOAuthHandlers(server, deps)
  registerOnboardingHandlers(server, deps)
  registerResourcesHandlers(server, deps)
  registerSessionsHandlers(server, deps)
  if (serverCtx) registerServerHandlers(server, deps, serverCtx)
  registerSettingsHandlers(server, deps)
  registerSkillsHandlers(server, deps)
  registerSourcesHandlers(server, deps)
  registerStatusesHandlers(server, deps)
  registerSystemCoreHandlers(server, deps)
  registerTransferHandlers(server)
  registerTeamRulesHandlers(server, deps)
  registerTeamHandlers(server, deps)
  registerWorkspaceCoreHandlers(server, deps)
  registerMessagingHandlers(server, deps)
}
