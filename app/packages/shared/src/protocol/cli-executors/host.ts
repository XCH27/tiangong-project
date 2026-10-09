/**
 * CLI executor plugins behind HostTurnKernel.
 *
 * createExecutor runs only when the kernel calls it from run(), after admit
 * or approve. Claude remains the native SDK channel in claude-agent.ts.
 * These plugins do not wrap that channel and do not open a PTY.
 * Pi Agent Core is not the permission authority.
 */

import type { HostTurnKernel, NativeEffectSource, TurnExecutor, TurnRequest } from '../turn-admission'
import { acpExecutor } from './acp-client'
import { ACP_CAPABILITIES, CODEX_APP_SERVER_CAPABILITIES, type CliExecutorCapability } from './capabilities'
import { codexExecutor } from './codex-app-server'
import type { LineStream } from './line-stream'

export interface CliTransportMap {
  'codex-app-server'?: () => LineStream
  acp?: () => LineStream
}

export class CliExecutorHost implements NativeEffectSource {
  private kernel: HostTurnKernel | undefined

  constructor(private readonly transports: CliTransportMap) {}

  attach(kernel: HostTurnKernel): void {
    this.kernel = kernel
  }

  capabilities(): readonly CliExecutorCapability[] {
    return [CODEX_APP_SERVER_CAPABILITIES, ACP_CAPABILITIES]
  }

  createExecutor(request: TurnRequest): TurnExecutor | undefined {
    const id = executorId(request)
    if (id !== 'codex-app-server' && id !== 'acp') return undefined
    const openTransport = this.transports[id]
    return async (context) => {
      const kernel = this.kernel
      if (!kernel) throw new Error('cli_executor_unattached')
      if (!openTransport) throw new Error('transport_unavailable')
      switch (id) {
        case 'codex-app-server':
          return codexExecutor(openTransport, kernel, request)(context)
        case 'acp':
          return acpExecutor(openTransport, kernel, request)(context)
        default: {
          const unexpected: never = id
          throw new Error(`Unhandled CLI executor: ${String(unexpected)}`)
        }
      }
    }
  }
}

/** First source that returns an executor wins. A CLI host returns undefined unless payload.executorId selects a plugin. */
export function composeEffectSources(...sources: NativeEffectSource[]): NativeEffectSource {
  return {
    createExecutor(request: TurnRequest): TurnExecutor | undefined {
      for (const source of sources) {
        const executor = source.createExecutor(request)
        if (executor) return executor
      }
      return undefined
    },
  }
}

function executorId(request: TurnRequest): string | undefined {
  const value = request.invocation?.payload?.executorId
  return typeof value === 'string' ? value : undefined
}
