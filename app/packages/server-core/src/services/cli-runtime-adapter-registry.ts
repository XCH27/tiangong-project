import {
  DETECTED_ACP_RUNTIME_MAP,
  getUnsupportedDetectedRuntimeMessage,
} from './cli-runtime-detected-acp-mappings'
import type { CliRuntimeLaunch } from './cli-runtime-types'

type ResolveAdapterLaunchInput =
  | { kind: 'detected'; runtimeId: string }
  | {
      kind: 'custom'
      runtimeId: string
      displayName?: string
      command: string
      args?: string[]
      env?: Record<string, string>
    }

export type ResolveAdapterLaunchResult =
  | { ok: true; launch: CliRuntimeLaunch }
  | { ok: false; reason: string }

export function resolveAdapterLaunch(input: ResolveAdapterLaunchInput): ResolveAdapterLaunchResult {
  if (input.kind === 'custom') {
    const command = input.command.trim()
    if (!command) {
      return { ok: false, reason: 'Custom CLI Runtime 的 command 不能为空。' }
    }

    return {
      ok: true,
      launch: {
        runtimeId: input.runtimeId,
        displayName: input.displayName?.trim() || 'Custom ACP Runtime',
        command,
        args: input.args ?? [],
        env: input.env,
      },
    }
  }

  const mapped = DETECTED_ACP_RUNTIME_MAP[input.runtimeId as keyof typeof DETECTED_ACP_RUNTIME_MAP]
  if (!mapped) {
    return { ok: false, reason: getUnsupportedDetectedRuntimeMessage(input.runtimeId) }
  }

  return { ok: true, launch: { ...mapped } }
}
