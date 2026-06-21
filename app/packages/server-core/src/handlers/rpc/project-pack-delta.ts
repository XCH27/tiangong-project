/**
 * ProjectPack delta RPC handlers (LOCAL_ONLY).
 */

import type { RpcServer } from '@craft-agent/server-core/transport'
import {
  RPC_CHANNELS,
  type ProjectPackDeltaPlanRequest,
  type ProjectPackDeltaPlanResult,
} from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import { planProjectPackDelta } from '../../services/project-pack-delta-planner'

export function registerProjectPackDeltaHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(
    RPC_CHANNELS.projectPackDelta.PLAN,
    async (_ctx, request: ProjectPackDeltaPlanRequest): Promise<ProjectPackDeltaPlanResult> => {
      const workspacePath = request.workspacePath?.trim()
      if (!workspacePath) {
        throw new Error('projectPackDelta:plan workspacePath is required')
      }

      const plan = await planProjectPackDelta({
        rootPath: workspacePath,
        mode: request.mode,
        maxRelatedDepth: request.maxRelatedDepth,
        maxFiles: request.maxFiles,
        maxFileBytes: request.maxFileBytes,
      })

      return {
        workspacePath: plan.rootPath,
        mode: plan.mode,
        changedFiles: plan.gitChangedFiles,
        relatedFiles: plan.relatedFiles,
        included: plan.included,
        excluded: plan.excluded,
        estimatedTokens: plan.estimatedTokens,
        tokenEstimateKind: plan.tokenEstimateKind,
        generatedAt: plan.generatedAt,
      }
    },
  )
}
