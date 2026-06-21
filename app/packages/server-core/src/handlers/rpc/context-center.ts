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

const PROJECT_PACK_SCOPES = new Set(['repo', 'diff', 'directory'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function assertOptionalString(input: Record<string, unknown>, field: keyof ContextCenterOverviewInput): void {
  if (input[field] !== undefined && typeof input[field] !== 'string') {
    throw new Error(`contextCenter:getOverview ${field} must be a string`)
  }
}

function parseContextCenterOverviewInput(input: unknown): ContextCenterOverviewInput {
  if (!isRecord(input)) {
    throw new Error('contextCenter:getOverview input must be an object')
  }

  assertOptionalString(input, 'sessionId')
  assertOptionalString(input, 'rootPath')
  assertOptionalString(input, 'workspaceId')
  assertOptionalString(input, 'bundleId')

  if (input.forceToolDetection !== undefined && typeof input.forceToolDetection !== 'boolean') {
    throw new Error('contextCenter:getOverview forceToolDetection must be a boolean')
  }

  if (input.projectPackPreviewRequest !== undefined) {
    if (!isRecord(input.projectPackPreviewRequest)) {
      throw new Error('contextCenter:getOverview projectPackPreviewRequest must be an object')
    }

    const request = input.projectPackPreviewRequest
    if (typeof request.rootPath !== 'string' || !request.rootPath.trim()) {
      throw new Error('contextCenter:getOverview projectPackPreviewRequest.rootPath must be a string')
    }
    if (typeof request.scope !== 'string' || !PROJECT_PACK_SCOPES.has(request.scope)) {
      throw new Error('contextCenter:getOverview projectPackPreviewRequest.scope must be one of repo, diff, directory')
    }
    if (request.relativePath !== undefined && typeof request.relativePath !== 'string') {
      throw new Error('contextCenter:getOverview projectPackPreviewRequest.relativePath must be a string')
    }
    if (request.maxFileBytes !== undefined && (typeof request.maxFileBytes !== 'number' || !Number.isFinite(request.maxFileBytes))) {
      throw new Error('contextCenter:getOverview projectPackPreviewRequest.maxFileBytes must be a number')
    }
    if (request.maxFiles !== undefined && (typeof request.maxFiles !== 'number' || !Number.isFinite(request.maxFiles))) {
      throw new Error('contextCenter:getOverview projectPackPreviewRequest.maxFiles must be a number')
    }
  }

  return input as ContextCenterOverviewInput
}

export function registerContextCenterHandlers(server: RpcServer, deps: HandlerDeps): void {
  const registry = new SystemToolsRegistry()

  server.handle(RPC_CHANNELS.contextCenter.GET_OVERVIEW, async (_ctx, rawInput: ContextCenterOverviewInput) => {
    const input = parseContextCenterOverviewInput(rawInput)
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
