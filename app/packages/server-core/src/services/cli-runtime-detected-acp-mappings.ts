import type { CliRuntimeLaunch } from './cli-runtime-types'

export const DETECTED_ACP_RUNTIME_MAP = {
  grok: {
    runtimeId: 'grok',
    displayName: 'Grok Build',
    command: 'grok',
    args: ['agent', 'stdio'],
  },
  hermes: {
    runtimeId: 'hermes',
    displayName: 'Hermes',
    command: 'hermes',
    args: ['acp'],
  },
  opencode: {
    runtimeId: 'opencode',
    displayName: 'OpenCode',
    command: 'opencode',
    args: ['acp'],
  },
} satisfies Record<string, CliRuntimeLaunch>

export const DETECTED_UNSUPPORTED_RUNTIME_NAMES: Record<string, string> = {
  claude: 'Claude Code',
  codex: 'Codex',
  qwen: 'Qwen Code',
  gemini: 'Gemini CLI',
}

export function getUnsupportedDetectedRuntimeMessage(runtimeId: string): string {
  const name = DETECTED_UNSUPPORTED_RUNTIME_NAMES[runtimeId] ?? runtimeId
  return `${name} 暂未确认稳定的 ACP/stdio 入口，不能直接作为 CLI Runtime 执行。请改用 Custom ACP runtime，或等待该 runtime 完成适配。`
}
