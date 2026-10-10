/**
 * Capability declarations for CLI executor plugins.
 *
 * Codex and ACP are display-only. They are not a running peer. Electron and
 * SessionManager do not construct CliExecutorHost and do not spawn these
 * commands. A Locked surface is hidden. display-only is a label with no
 * launch claim. Claude stays on the native SDK channel and is not one of
 * these plugins.
 */

export type DeliveryStatus = 'usable' | 'wired' | 'display-only' | 'Locked'

export type SurfaceVisibility = 'show' | 'label-only' | 'hide'

export interface CliHookCapabilities {
  start: DeliveryStatus
  toolApproval: DeliveryStatus
  cancel: DeliveryStatus
  resume: DeliveryStatus
}

export interface CliEffectCapabilities {
  fileUpdate: DeliveryStatus
  fileDelete: DeliveryStatus
  fileMove: DeliveryStatus
  readOnlyTool: DeliveryStatus
  commandExecution: DeliveryStatus
  dynamicClientTool: DeliveryStatus
  pty: DeliveryStatus
}

export interface CliExecutorCapability {
  id: 'codex-app-server' | 'acp'
  label: string
  status: DeliveryStatus
  transport: 'stdio-jsonrpc'
  ptyFallback: false
  hooks: CliHookCapabilities
  effects: CliEffectCapabilities
}

export interface CliPeerPreset {
  id: 'codex' | 'gemini' | 'qwen' | 'kimi'
  command: string
  args: readonly string[]
  status: DeliveryStatus
}

export const CODEX_APP_SERVER_CAPABILITIES: CliExecutorCapability = {
  id: 'codex-app-server',
  label: 'Codex app-server',
  status: 'display-only',
  transport: 'stdio-jsonrpc',
  ptyFallback: false,
  hooks: {
    start: 'display-only',
    toolApproval: 'display-only',
    cancel: 'display-only',
    resume: 'display-only',
  },
  effects: {
    fileUpdate: 'display-only',
    fileDelete: 'display-only',
    fileMove: 'Locked',
    readOnlyTool: 'display-only',
    commandExecution: 'Locked',
    dynamicClientTool: 'Locked',
    pty: 'Locked',
  },
}

export const ACP_CAPABILITIES: CliExecutorCapability = {
  id: 'acp',
  label: 'ACP',
  status: 'display-only',
  transport: 'stdio-jsonrpc',
  ptyFallback: false,
  hooks: {
    start: 'display-only',
    toolApproval: 'display-only',
    cancel: 'display-only',
    resume: 'display-only',
  },
  effects: {
    fileUpdate: 'display-only',
    fileDelete: 'display-only',
    fileMove: 'display-only',
    readOnlyTool: 'display-only',
    commandExecution: 'Locked',
    dynamicClientTool: 'Locked',
    pty: 'Locked',
  },
}

export const CLI_PEER_PRESETS: readonly CliPeerPreset[] = [
  { id: 'codex', command: 'codex', args: ['app-server', '--stdio'], status: 'display-only' },
  { id: 'gemini', command: 'gemini', args: ['--acp'], status: 'display-only' },
  { id: 'qwen', command: 'qwen', args: ['--acp'], status: 'display-only' },
  { id: 'kimi', command: 'kimi', args: ['acp'], status: 'display-only' },
]

export function surfaceVisibility(status: DeliveryStatus): SurfaceVisibility {
  switch (status) {
    case 'usable':
    case 'wired':
      return 'show'
    case 'display-only':
      return 'label-only'
    case 'Locked':
      return 'hide'
    default: {
      const unexpected: never = status
      throw new Error(`Unhandled delivery status: ${String(unexpected)}`)
    }
  }
}

export function hiddenCliSurfaces(capability: CliExecutorCapability): string[] {
  const hidden: string[] = []
  const effects = capability.effects
  for (const key of Object.keys(effects) as Array<keyof CliEffectCapabilities>) {
    if (surfaceVisibility(effects[key]) === 'hide') hidden.push(key)
  }
  return hidden
}
