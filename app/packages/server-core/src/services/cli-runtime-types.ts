export type CliRuntimeHealthStatus = 'available' | 'fail_cli' | 'fail_acp' | 'disabled'

export type CliRuntimeHealthStage =
  | 'resolve'
  | 'launch'
  | 'initialize'
  | 'session/new'
  | 'session/prompt'
  | 'disabled'

export type CliRuntimeEffort = 'low' | 'medium' | 'high' | 'maximum'

export interface CliRuntimeLaunch {
  runtimeId: string
  displayName: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export interface CliRuntimeHealthResult {
  status: CliRuntimeHealthStatus
  stage: CliRuntimeHealthStage
  message: string
  checkedAt: number
  stdoutTail?: string
  stderrTail?: string
}

export interface CliRuntimeCatalogItem {
  id: string
  displayName: string
  source: 'managed' | 'detected' | 'custom'
  supported: boolean
  enabled: boolean
  command?: string
  args?: string[]
  mapping?: {
    command: string
    args: string[]
  }
  unsupportedReason?: string
  lastHealth?: CliRuntimeHealthStatus
  lastCheckedAt?: number
}

export interface CliRuntimeSendSelection {
  runtimeId: string
  modelId?: string
  effort?: string
  custom?: {
    command: string
    args?: string[]
    env?: Record<string, string>
  }
}

export interface CliRuntimeSendOptions {
  cliRuntime?: CliRuntimeSendSelection
}

export type ResolvedCliRuntimeForSend =
  | { kind: 'none' }
  | {
      kind: 'detected'
      runtimeId: string
      displayName: string
      command: string
      args: string[]
      modelId?: string
      effort?: CliRuntimeEffort
    }
  | {
      kind: 'custom'
      runtimeId: string
      command: string
      args: string[]
      env?: Record<string, string>
      modelId?: string
      effort?: CliRuntimeEffort
    }
  | {
      kind: 'unsupported'
      runtimeId: string
      message: string
    }
