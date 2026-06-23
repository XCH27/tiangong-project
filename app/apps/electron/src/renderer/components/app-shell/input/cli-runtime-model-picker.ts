import type { CliRuntimeModel, CliRuntimeModelState } from '@craft-agent/shared/protocol'

export function getCliRuntimeSelectableModels(state?: CliRuntimeModelState): CliRuntimeModel[] {
  return state?.canSwitch ? state.availableModels : []
}

export function getCliRuntimeModelDisplay(runtimeName: string, state?: CliRuntimeModelState): string {
  if (!state || state.source === 'runtime_managed') return `${runtimeName} · 模型由 CLI 管理`
  const current = state.availableModels.find(model => model.id === state.currentModelId)
  return `${runtimeName} · ${current?.name ?? state.currentModelId ?? '选择模型'}`
}
