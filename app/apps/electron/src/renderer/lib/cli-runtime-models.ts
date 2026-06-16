import type { CliRuntimeId, CliRuntimeProbeResult } from '../../shared/types'

export interface CliRuntimeModelOption {
  id: string
  label: string
}

const AUTO_MODEL: readonly CliRuntimeModelOption[] = [
  { id: 'auto', label: 'Auto' },
] as const

export function getCliRuntimeModelOptions(runtimeId: CliRuntimeId): readonly CliRuntimeModelOption[] {
  void runtimeId
  return AUTO_MODEL
}

export function getDefaultCliRuntimeModel(runtimeId: CliRuntimeId): string {
  return getCliRuntimeModelOptions(runtimeId)[0]?.id ?? 'auto'
}

export function getCliRuntimeModelLabel(runtimeId: CliRuntimeId, modelId: string): string {
  return getCliRuntimeModelOptions(runtimeId).find(model => model.id === modelId)?.label ?? modelId
}

export function getCliRuntimeShortLabel(runtime: CliRuntimeProbeResult): string {
  switch (runtime.id) {
    case 'claude':
      return 'Claude'
    case 'codex':
      return 'Codex'
    case 'cursor':
      return 'Cursor'
    case 'grok':
      return 'Grok'
    case 'copilot':
      return 'Copilot'
    case 'hermes':
      return 'Hermes'
    default:
      return runtime.displayName
        .replace(/\s+CLI$/i, '')
        .replace(/\s+Agent$/i, '')
        .replace(/\s+Build$/i, '')
  }
}
