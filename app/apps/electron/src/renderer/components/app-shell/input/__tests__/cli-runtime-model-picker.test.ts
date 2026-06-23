import { describe, expect, it } from 'bun:test'
import { getCliRuntimeModelDisplay, getCliRuntimeSelectableModels } from '../cli-runtime-model-picker'

describe('CLI runtime model picker helpers', () => {
  it('shows the runtime and live current model', () => {
    expect(getCliRuntimeModelDisplay('OpenCode', {
      runtimeId: 'detected:opencode',
      source: 'models',
      currentModelId: 'gpt-5',
      availableModels: [{ id: 'gpt-5', name: 'GPT-5' }],
      canSwitch: true,
    })).toBe('OpenCode · GPT-5')
  })

  it('honestly labels runtimes that manage their own model', () => {
    expect(getCliRuntimeModelDisplay('Grok', {
      runtimeId: 'detected:grok',
      source: 'runtime_managed',
      currentModelId: null,
      availableModels: [],
      canSwitch: false,
    })).toBe('Grok · 模型由 CLI 管理')
  })

  it('returns selectable models only when the runtime supports switching', () => {
    expect(getCliRuntimeSelectableModels({
      runtimeId: 'x', source: 'models', currentModelId: 'a',
      availableModels: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }], canSwitch: true,
    })).toHaveLength(2)
    expect(getCliRuntimeSelectableModels({
      runtimeId: 'x', source: 'runtime_managed', currentModelId: null,
      availableModels: [{ id: 'fake', name: 'Fake' }], canSwitch: false,
    })).toEqual([])
  })
})
