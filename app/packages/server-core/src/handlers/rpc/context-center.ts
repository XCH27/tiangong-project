/**
 * Context Center RPC handlers.
 *
 * v1 is read-only: it aggregates usage, environment, context tools, and an
 * optional existing ProjectPack summary. It never creates bundles and never
 * submits anything externally.
 */

import { RPC_CHANNELS, type ContextCenterOverviewInput } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { buildContextCenterOverview } from '../../services/context-center-service'
import { projectPackService } from '../../services/project-pack-service'
import { SystemToolsRegistry } from '../../services/system-tools-registry'
import { buildProjectEnvironmentProfile } from '../../services/system-tools-project'

export function registerContextCenterHandlers(server: RpcServer, deps: HandlerDeps): void {
  const registry = new SystemToolsRegistry()

  server.handle(RPC_CHANNELS.contextCenter.GET_OVERVIEW, async (_ctx, input: ContextCenterOverviewInput) => {
    const session = input.sessionId ? await deps.sessionManager.getSession(input.sessionId) : null
    const projectEnvironment = input.rootPath
      ? buildProjectEnvironmentProfile(input.rootPath, { workspaceId: input.workspaceId })
      : undefined
    const contextTools = await registry.detectCategory('context', input.forceToolDetection ?? false)
    const projectPackSummary = input.bundleId
      ? await projectPackService.getSummary(input.bundleId)
      : undefined
    const projectPackPlanPreview = input.projectPackPreviewRequest
      ? (await projectPackService.previewPlan(input.projectPackPreviewRequest)).summary
      : undefined

    return buildContextCenterOverview({
      input,
      session,
      contextTools,
      projectEnvironment,
      projectPackSummary,
      projectPackPlanPreview,
    })
  })
}
