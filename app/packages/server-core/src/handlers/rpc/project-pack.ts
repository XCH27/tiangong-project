/**
 * ProjectPack RPC handlers（T-PROJECTPACK · LOCAL_ONLY）。
 */

import type { RpcServer } from '@craft-agent/server-core/transport'
import { RPC_CHANNELS, type ProjectPackRequest } from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import { projectPackService } from '../../services/project-pack-service'

export function registerProjectPackHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.projectPack.PREVIEW_PLAN, async (_ctx, request: ProjectPackRequest) => {
    return projectPackService.previewPlan(request)
  })

  server.handle(RPC_CHANNELS.projectPack.PACK, async (_ctx, request: ProjectPackRequest) => {
    return projectPackService.pack(request)
  })

  server.handle(RPC_CHANNELS.projectPack.GET_SUMMARY, async (_ctx, bundleId: string) => {
    return projectPackService.getSummary(bundleId)
  })
}
