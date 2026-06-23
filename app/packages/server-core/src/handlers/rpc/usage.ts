/**
 * 用量 RPC（docs/16 §2.2）。返回会话的 Token 环弹层视图：上下文占用 + 套餐额度（诚实分级）。
 * LOCAL_ONLY。计算在 SessionManager.getSessionUsageView（读真实 token + 模型窗口）。
 */

import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'

export function registerUsageHandlers(server: RpcServer, deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.usage.GET_SESSION, async (_ctx, sessionId: string) => {
    return deps.sessionManager.getSessionUsageView(sessionId)
  })
}
