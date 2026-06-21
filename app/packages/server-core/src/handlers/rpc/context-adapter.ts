/**
 * Context adapter RPC handlers (LOCAL_ONLY).
 */

import type { RpcServer } from '@craft-agent/server-core/transport'
import {
  RPC_CHANNELS,
  type ContextAdapterCodegraphRequest,
  type ContextAdapterCodegraphResult,
  type ContextAdapterRtkRequest,
  type ContextAdapterRtkResult,
  type ContextCompressionStatsDto,
} from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import { SystemToolsRegistry } from '../../services/system-tools-registry'
import { queryWithCodegraphAdapter } from '../../services/context-adapter-codegraph'
import { compressWithRtkAdapter } from '../../services/context-adapter-rtk'
import type { ContextCompressionStats } from '../../services/context-adapter-types'

function requireNonEmpty(value: string, field: string): string {
  const trimmed = value?.trim()
  if (!trimmed) throw new Error(`${field} is required`)
  return trimmed
}

function toStatsDto(stats: ContextCompressionStats): ContextCompressionStatsDto {
  return {
    ...stats,
    tokenEstimateKind: 'estimate',
  }
}

export function registerContextAdapterHandlers(server: RpcServer, _deps: HandlerDeps): void {
  const registry = new SystemToolsRegistry()

  server.handle(
    RPC_CHANNELS.contextAdapter.QUERY_CODEGRAPH,
    async (_ctx, request: ContextAdapterCodegraphRequest): Promise<ContextAdapterCodegraphResult> => {
      const rootPath = requireNonEmpty(request.rootPath, 'rootPath')
      const query = requireNonEmpty(request.query, 'query')
      const result = await queryWithCodegraphAdapter(
        { registry },
        { rootPath, query, relativePath: request.relativePath },
        request.forceRedetect ?? false,
      )
      return {
        availability: result.availability,
        query: result.query,
        structuredOutput: result.structuredOutput,
        stats: toStatsDto(result.stats),
        applied: result.applied,
        note: result.note,
      }
    },
  )

  server.handle(
    RPC_CHANNELS.contextAdapter.COMPRESS_RTK,
    async (_ctx, request: ContextAdapterRtkRequest): Promise<ContextAdapterRtkResult> => {
      if (typeof request.input !== 'string') {
        throw new Error('input must be a string')
      }
      const result = await compressWithRtkAdapter(
        { registry },
        { input: request.input, forceRedetect: request.forceRedetect },
      )
      return {
        availability: result.availability,
        input: result.input,
        output: result.output,
        stats: toStatsDto(result.stats),
        applied: result.applied,
        note: result.note,
      }
    },
  )
}
