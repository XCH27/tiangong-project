/**
 * 分层记忆 RPC（D2 / docs/05）。可查可删，按分区+scopeId 隔离（隔离在 MemoryStore 执行）。
 * 落 `<workspace>/.fleet/memory.json`，LOCAL_ONLY。管理 Agent 拥有，项目 Agent 按需读。
 */

import { RPC_CHANNELS, type AddMemoryInput, type MemoryQuery } from '@craft-agent/shared/protocol'
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { MemoryStore, type UpdateMemoryInput } from '../../services/memory-store'

export function registerMemoryHandlers(server: RpcServer, _deps: HandlerDeps): void {
  const resolve = (workspaceId: string): MemoryStore => {
    const workspace = getWorkspaceByNameOrId(workspaceId)
    if (!workspace) throw new Error(`Workspace not found: ${workspaceId}`)
    return new MemoryStore(workspace.rootPath)
  }

  server.handle(RPC_CHANNELS.memory.LIST, async (_ctx, workspaceId: string, query?: MemoryQuery) => {
    return resolve(workspaceId).list(query ?? {})
  })

  server.handle(RPC_CHANNELS.memory.ADD, async (_ctx, workspaceId: string, input: AddMemoryInput) => {
    return resolve(workspaceId).add(input)
  })

  server.handle(RPC_CHANNELS.memory.GET, async (_ctx, workspaceId: string, id: string) => {
    return resolve(workspaceId).get(id)
  })

  server.handle(RPC_CHANNELS.memory.UPDATE, async (_ctx, workspaceId: string, id: string, patch: UpdateMemoryInput) => {
    return resolve(workspaceId).update(id, patch)
  })

  server.handle(RPC_CHANNELS.memory.DELETE, async (_ctx, workspaceId: string, id: string) => {
    return resolve(workspaceId).delete(id)
  })
}
