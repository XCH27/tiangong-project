/**
 * Fleet 工作台动作通道 RPC 处理器（T-ENGINE）。
 *
 * 把 `RPC_CHANNELS.design.*` 接到唯一的 `DesignEngineService`。引擎发出的
 * SessionEvent 经 `sessionManager.emitSessionEvent` 进同一条 timeline——
 * 没有第二套 store/timeline。人类 UI 和 AI 工具调用走的是同一组 channel。
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
import { DesignAnnotationApplier } from '../../services/design-annotation-applier'
import { BrowserPaneDesignDomWriter, type BrowserPaneEvaluator } from '../../services/design-browser-dom-writer'
import { DesignDomPatchApplier } from '../../services/design-dom-applier'
import { DesignEngineService } from '../../services/design-engine'
import { FileDesignEnginePersistence } from '../../services/design-engine-persistence'
import { DesignSurfaceDomPatchWriter } from '../../services/design-surface-dom-writer'
import { DesignWorkbenchApplier } from '../../services/design-workbench-applier'

export function registerDesignHandlers(server: RpcServer, deps: HandlerDeps): void {
  const { sessionManager } = deps

  // 唯一引擎实例（进程内账本）。emit 经 SessionManager 进同一条 timeline。
  const engine = new DesignEngineService(
    (event) => sessionManager.emitSessionEvent(event),
    new DesignWorkbenchApplier(
      new DesignAnnotationApplier(sessionManager),
      new DesignDomPatchApplier(
        new DesignSurfaceDomPatchWriter({
          browser: new BrowserPaneDesignDomWriter({
            resolveBrowserPaneManager: (sessionId) => resolveBrowserPaneManager(deps, sessionId),
          }),
        }),
      ),
    ),
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
    return engine.rollbackPatch(input)
  })
}

function resolveBrowserPaneManager(deps: HandlerDeps, sessionId: string): BrowserPaneEvaluator | null {
  const sessionScoped = deps.sessionManager as typeof deps.sessionManager & {
    getBrowserPaneManagerForSession?: (sid: string) => BrowserPaneEvaluator | null
  }
  return sessionScoped.getBrowserPaneManagerForSession?.(sessionId) ?? deps.browserPaneManager ?? null
}
