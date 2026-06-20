import { describe, expect, it } from 'bun:test'
import { resolveAdapterLaunch } from './cli-runtime-adapter-registry'

describe('resolveAdapterLaunch', () => {
  it('returns launch commands for supported detected runtimes', () => {
    expect(resolveAdapterLaunch({ kind: 'detected', runtimeId: 'grok' })).toEqual({
      ok: true,
      launch: {
        runtimeId: 'grok',
        displayName: 'Grok Build',
        command: 'grok',
        args: ['agent', 'stdio'],
      },
    })

    expect(resolveAdapterLaunch({ kind: 'detected', runtimeId: 'hermes' })).toEqual({
      ok: true,
      launch: {
        runtimeId: 'hermes',
        displayName: 'Hermes',
        command: 'hermes',
        args: ['acp'],
      },
    })
  })

  it('rejects unsupported detected runtimes instead of fake executing them', () => {
    expect(resolveAdapterLaunch({ kind: 'detected', runtimeId: 'codex' })).toEqual({
      ok: false,
      reason: 'Codex 暂未确认稳定的 ACP/stdio 入口，不能直接作为 CLI Runtime 执行。请改用 Custom ACP runtime，或等待该 runtime 完成适配。',
    })
  })

  it('normalizes custom runtime launch config', () => {
    expect(resolveAdapterLaunch({
      kind: 'custom',
      runtimeId: 'custom:one',
      command: 'my-acp',
      args: ['stdio'],
      env: { A: 'B' },
      displayName: 'Local ACP',
    })).toEqual({
      ok: true,
      launch: {
        runtimeId: 'custom:one',
        displayName: 'Local ACP',
        command: 'my-acp',
        args: ['stdio'],
        env: { A: 'B' },
      },
    })
  })
})
