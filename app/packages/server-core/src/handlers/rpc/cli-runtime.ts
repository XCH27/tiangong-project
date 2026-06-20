import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import {
  buildCliRuntimeCatalog,
  defaultResolveCommand,
  performCliRuntimeHealthTest,
} from '../../services/cli-runtime-catalog'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.cliRuntime.GET_CATALOG,
  RPC_CHANNELS.cliRuntime.TEST,
] as const

export function registerCliRuntimeHandlers(
  server: RpcServer,
  deps: HandlerDeps,
  opts: {
    resolveCommand?: (command: string) => string | null
  } = {},
): void {
  const resolveCommand = opts.resolveCommand ?? defaultResolveCommand

  server.handle(RPC_CHANNELS.cliRuntime.GET_CATALOG, async () => {
    return buildCliRuntimeCatalog({ resolveCommand })
  })

  server.handle(RPC_CHANNELS.cliRuntime.TEST, async (_ctx, input: {
    runtimeId: string
    command: string
    args?: string[]
    env?: Record<string, string>
    acpMode?: boolean
  }) => {
    deps.platform.logger?.info(`CLI_RUNTIME_TEST: ${input.runtimeId}`)
    return performCliRuntimeHealthTest({
      ...input,
      resolveCommand,
    })
  })
}
