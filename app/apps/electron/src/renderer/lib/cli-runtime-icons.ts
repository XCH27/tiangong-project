import type { IconType } from '@lobehub/icons/es/types'
import AionLabsIcon from '@lobehub/icons/es/AionLabs/components/Color'
import AntigravityIcon from '@lobehub/icons/es/Antigravity/components/Color'
import ClaudeCodeIcon from '@lobehub/icons/es/ClaudeCode/components/Color'
import CodeBuddyIcon from '@lobehub/icons/es/CodeBuddy/components/Color'
import CodexIcon from '@lobehub/icons/es/Codex/components/Color'
import CursorIcon from '@lobehub/icons/es/Cursor/components/Mono'
import GithubCopilotIcon from '@lobehub/icons/es/GithubCopilot/components/Mono'
import GooseIcon from '@lobehub/icons/es/Goose/components/Mono'
import GrokIcon from '@lobehub/icons/es/Grok/components/Mono'
import HermesAgentIcon from '@lobehub/icons/es/HermesAgent/components/Mono'
import KimiIcon from '@lobehub/icons/es/Kimi/components/Color'
import MistralIcon from '@lobehub/icons/es/Mistral/components/Color'
import OpenClawIcon from '@lobehub/icons/es/OpenClaw/components/Color'
import OpenCodeIcon from '@lobehub/icons/es/OpenCode/components/Mono'
import QoderIcon from '@lobehub/icons/es/Qoder/components/Color'
import QwenIcon from '@lobehub/icons/es/Qwen/components/Color'

import type { CliRuntimeId } from '../../shared/types'

const CLI_RUNTIME_ICONS: Record<CliRuntimeId, IconType> = {
  aionrs: AionLabsIcon,
  claude: ClaudeCodeIcon,
  codex: CodexIcon,
  qwen: QwenIcon,
  opencode: OpenCodeIcon,
  cursor: CursorIcon,
  antigravity: AntigravityIcon,
  hermes: HermesAgentIcon,
  openclaw: OpenClawIcon,
  grok: GrokIcon,
  goose: GooseIcon,
  codebuddy: CodeBuddyIcon,
  kimi: KimiIcon,
  droid: AionLabsIcon,
  auggie: AionLabsIcon,
  copilot: GithubCopilotIcon,
  qoder: QoderIcon,
  vibe: MistralIcon,
  nanobot: AionLabsIcon,
  snow: AionLabsIcon,
}

export function getCliRuntimeIconComponent(id: CliRuntimeId): IconType {
  return CLI_RUNTIME_ICONS[id]
}
