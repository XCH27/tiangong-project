/**
 * Memory RPC handlers (LOCAL_ONLY).
 * Partitions: user/app/project/agent/task/design/review.
 * High-risk deletes require explicit confirmation.
 */

import {
  RPC_CHANNELS,
  type MemoryAddInput,
  type MemoryGetInput,
  type MemoryListInput,
  type MemorySearchInput,
  type MemoryDeleteInput,
  type MemoryListResult,
  type MemorySearchResult,
  type MemoryDeleteResult,
} from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { memoryService } from '../../services/memory-service'

function requirePartition(p: string) {
  if (!p || typeof p !== 'string') throw new Error('partition is required')
  return p
}

export function registerMemoryHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.memory.ADD, async (_ctx, input: MemoryAddInput) => {
    if (!input || typeof input !== 'object') throw new Error('input required')
    const rec = await memoryService.create({
      partition: requirePartition(input.partition) as any,
      projectId: input.projectId,
      agentId: input.agentId,
      key: input.key,
      value: input.value,
      meta: input.meta,
    })
    // annotate risk
    if (input.risk) (rec as any).risk = input.risk
    return rec
  })

  server.handle(RPC_CHANNELS.memory.GET, async (_ctx, input: MemoryGetInput) => {
    if (!input || !input.id) throw new Error('id is required')
    return memoryService.get(input.id)
  })

  server.handle(RPC_CHANNELS.memory.LIST, async (_ctx, input?: MemoryListInput): Promise<MemoryListResult> => {
    const res = await memoryService.query({
      partition: input?.partition as any,
      projectId: input?.projectId,
      agentId: input?.agentId,
      limit: input?.limit,
    })
    return { records: res }
  })

  server.handle(RPC_CHANNELS.memory.SEARCH, async (_ctx, input: MemorySearchInput): Promise<MemorySearchResult> => {
    if (!input || typeof input.keyword !== 'string' || !input.keyword.trim()) throw new Error('keyword is required')
    const res = await memoryService.query({
      partition: input.partition as any,
      projectId: input.projectId,
      agentId: input.agentId,
      keyword: input.keyword,
      limit: input.limit,
    })
    return { records: res }
  })

  server.handle(RPC_CHANNELS.memory.DELETE, async (_ctx, input: MemoryDeleteInput): Promise<MemoryDeleteResult> => {
    if (!input || !input.id) throw new Error('id is required')
    const rec = await memoryService.get(input.id)
    const risk = (rec as any)?.risk ?? 'low'
    if ((risk === 'high' || risk === 'medium') && !input.confirmed) {
      throw new Error('delete requires explicit confirmation for medium/high risk memory')
    }
    const ok = await memoryService.delete(input.id)
    return { deleted: ok, id: input.id, risk }
  })
}
