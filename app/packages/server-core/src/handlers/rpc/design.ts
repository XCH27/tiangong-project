/**
 * Fleet 工作台动作通道 RPC 处理器（承重墙 · docs/31 §1）。
 *
 * 把 `RPC_CHANNELS.design.*` 接到唯一的 `DesignEngineService`。引擎发出的
 * SessionEvent 经 `sessionManager.emitSessionEvent` 进同一条 timeline——
 * 没有第二套 store/timeline。人类 UI 和 AI 工具调用走的是同一组 channel。
 *
 * 当前为瘦桥 + 账本级 + 本地持久化：未注册 surface 适配器（applier），所以补丁记录
 * 动作意图、rollback 为账本级。各面原生引擎适配器（annotation / openpencil / opencut…）
 * 按 docs/31 S2→S7 分期注册进来，**不在这里塞 iframe DOM 死路**（docs/30 §8 已废）。
 */

import type { RpcServer } from '@craft-agent/server-core/transport'
import {
  RPC_CHANNELS,
  type SetSelectionInput,
  type ProposeActionInput,
  type CommitPatchInput,
  type RollbackPatchInput,
} from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import { DesignEngineService } from '../../services/design-engine'
import { FileDesignEnginePersistence } from '../../services/design-engine-persistence'

export function registerDesignHandlers(server: RpcServer, deps: HandlerDeps): void {
  const { sessionManager } = deps

  // 唯一引擎实例（进程内账本 + 本地持久化）。emit 经 SessionManager 进同一条 timeline。
  const engine = new DesignEngineService(
    (event) => sessionManager.emitSessionEvent(event),
    undefined,
    new FileDesignEnginePersistence(),
  )

  server.handle(RPC_CHANNELS.design.SET_SELECTION, async (_ctx, input: SetSelectionInput) => {
    await engine.setSelection(input)
  })

  server.handle(RPC_CHANNELS.design.GET_SELECTION, async (_ctx, sessionId: string) => {
    return engine.getSelection(sessionId)
  })

  server.handle(RPC_CHANNELS.design.PROPOSE_ACTION, async (_ctx, input: ProposeActionInput) => {
    return engine.proposeAction(input)
  })

  server.handle(RPC_CHANNELS.design.COMMIT_PATCH, async (_ctx, input: CommitPatchInput) => {
    return engine.commitPatch(input)
  })

  server.handle(RPC_CHANNELS.design.ROLLBACK_PATCH, async (_ctx, input: RollbackPatchInput) => {
    const result = await engine.rollbackPatch(input)
    sessionManager.recordPatchRolledBackPreference(input.sessionId)
    return result
  })
}
