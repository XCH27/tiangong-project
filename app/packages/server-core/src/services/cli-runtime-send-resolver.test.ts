import { describe, expect, it } from 'bun:test'
import type { FileAttachment } from '@craft-agent/shared/protocol'
import type { StoredAttachment } from '@craft-agent/core/types'
import {
  getCliRuntimeAttachmentRejectionMessage,
  resolveCliRuntimeForSend,
} from './cli-runtime-send-resolver'

describe('resolveCliRuntimeForSend', () => {
  it('returns none when no CLI runtime is selected', () => {
    expect(resolveCliRuntimeForSend({})).toEqual({ kind: 'none' })
  })

  it('maps supported detected ACP runtimes', () => {
    expect(resolveCliRuntimeForSend({ cliRuntime: { runtimeId: 'grok', modelId: 'auto', effort: 'low' } })).toEqual({
      kind: 'detected',
      runtimeId: 'grok',
      displayName: 'Grok Build',
      command: 'grok',
      args: ['agent', 'stdio'],
      effort: 'low',
    })

    expect(resolveCliRuntimeForSend({ cliRuntime: { runtimeId: 'hermes', modelId: 'openai/gpt-4o', effort: 'maximum' } })).toEqual({
      kind: 'detected',
      runtimeId: 'hermes',
      displayName: 'Hermes',
      command: 'hermes',
      args: ['acp'],
      modelId: 'openai/gpt-4o',
      effort: 'maximum',
    })
  })

  it('returns a Chinese actionable error for unsupported detected runtimes', () => {
    expect(resolveCliRuntimeForSend({ cliRuntime: { runtimeId: 'claude' } })).toEqual({
      kind: 'unsupported',
      runtimeId: 'claude',
      message: 'Claude Code 暂未确认稳定的 ACP/stdio 入口，不能直接作为 CLI Runtime 执行。请改用 Custom ACP runtime，或等待该 runtime 完成适配。',
    })
  })

  it('passes custom launch config through', () => {
    expect(resolveCliRuntimeForSend({
      cliRuntime: {
        runtimeId: 'custom:local',
        custom: {
          command: '/usr/local/bin/acp',
          args: ['stdio'],
          env: { FOO: 'bar' },
        },
        modelId: 'my-model',
        effort: 'medium',
      },
    })).toEqual({
      kind: 'custom',
      runtimeId: 'custom:local',
      command: '/usr/local/bin/acp',
      args: ['stdio'],
      env: { FOO: 'bar' },
      modelId: 'my-model',
      effort: 'medium',
    })
  })

  it('drops invalid effort values and treats auto model as runtime default', () => {
    expect(resolveCliRuntimeForSend({
      cliRuntime: {
        runtimeId: 'opencode',
        modelId: 'Auto',
        effort: 'wild' as never,
      },
    })).toEqual({
      kind: 'detected',
      runtimeId: 'opencode',
      displayName: 'OpenCode',
      command: 'opencode',
      args: ['acp'],
    })
  })
})

describe('getCliRuntimeAttachmentRejectionMessage', () => {
  it('rejects live and stored attachments for the first CLI runtime version', () => {
    const live = [{ name: 'image.png' }] as FileAttachment[]
    const stored = [{ name: 'doc.md' }] as StoredAttachment[]

    expect(getCliRuntimeAttachmentRejectionMessage(live, undefined)).toContain('CLI Runtime 第一版暂不支持附件')
    expect(getCliRuntimeAttachmentRejectionMessage(undefined, stored)).toContain('CLI Runtime 第一版暂不支持附件')
    expect(getCliRuntimeAttachmentRejectionMessage(undefined, undefined)).toBeNull()
  })
})
