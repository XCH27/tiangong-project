/**
 * External Job RPC（docs/31 §5 · D9 · docs/16 外部审查）。
 *
 * 消费 Lead 冻结的 `RPC_CHANNELS.externalJob.*` 通道。LOCAL_ONLY；证据链与成本分级在 ExternalJobService。
 */

import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import { RPC_CHANNELS, type ExternalJobTimelinePayload } from '@craft-agent/shared/protocol'
import type { SessionEvent } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import {
  ExternalJobService,
  type ConfirmExternalJobPermissionInput,
  type CreateExternalJobInput,
} from '../../services/external-job-service'

export const EXTERNAL_JOB_HANDLED_CHANNELS = Object.values(RPC_CHANNELS.externalJob)

export function externalJobPayloadToSessionEvent(payload: ExternalJobTimelinePayload): SessionEvent {
  const base = {
    sessionId: payload.sessionId,
    jobId: payload.jobId,
    jobType: payload.jobType,
    status: payload.status,
    message: payload.message,
    timestamp: payload.timestamp,
  }
  if (payload.status === 'completed' || payload.status === 'failed' || payload.status === 'cancelled') {
    return { type: 'external_job_completed', ...base }
  }
  if (payload.status === 'pending_permission' || payload.status === 'draft') {
    return { type: 'external_job_created', ...base }
  }
  return { type: 'external_job_updated', ...base }
}

export function registerExternalJobHandlers(server: RpcServer, deps: HandlerDeps): void {
  const resolve = (workspaceId: string): ExternalJobService => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`)
    return new ExternalJobService(workspace.rootPath, payload => {
      deps.sessionManager.emitSessionEvent(externalJobPayloadToSessionEvent(payload))
    })
  }

  server.handle(RPC_CHANNELS.externalJob.CREATE, async (_ctx, workspaceId: string, input: CreateExternalJobInput) => {
    return resolve(workspaceId).create(input)
  })

  server.handle(RPC_CHANNELS.externalJob.GET, async (_ctx, workspaceId: string, jobId: string) => {
    const job = resolve(workspaceId).get(jobId)
    if (!job) throw new Error(`External job not found: ${jobId}`)
    return job
  })

  server.handle(RPC_CHANNELS.externalJob.LIST, async (_ctx, workspaceId: string, sessionId?: string) => {
    return resolve(workspaceId).list(sessionId)
  })

  server.handle(
    RPC_CHANNELS.externalJob.CONFIRM_PERMISSION,
    async (_ctx, workspaceId: string, input: ConfirmExternalJobPermissionInput) => {
      return resolve(workspaceId).confirmPermission(input)
    },
  )

  server.handle(
    RPC_CHANNELS.externalJob.RUN,
    async (_ctx, workspaceId: string, jobId: string, tokensAfter?: number) => {
      return resolve(workspaceId).run(jobId, tokensAfter)
    },
  )

  server.handle(RPC_CHANNELS.externalJob.POLL, async (_ctx, workspaceId: string, jobId: string) => {
    return resolve(workspaceId).poll(jobId)
  })

  server.handle(RPC_CHANNELS.externalJob.CANCEL, async (_ctx, workspaceId: string, jobId: string) => {
    return resolve(workspaceId).cancel(jobId)
  })
}
