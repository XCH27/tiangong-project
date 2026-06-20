import type { FileAttachment } from '@craft-agent/shared/protocol'
import type { StoredAttachment } from '@craft-agent/core/types'
import {
  DETECTED_ACP_RUNTIME_MAP,
  getUnsupportedDetectedRuntimeMessage,
} from './cli-runtime-detected-acp-mappings'
import type { CliRuntimeEffort, CliRuntimeSendOptions, ResolvedCliRuntimeForSend } from './cli-runtime-types'

const VALID_EFFORTS = new Set<CliRuntimeEffort>(['low', 'medium', 'high', 'maximum'])

function normalizeModelId(modelId: string | undefined): string | undefined {
  const value = modelId?.trim()
  if (!value || value.toLowerCase() === 'auto') return undefined
  return value
}

function normalizeEffort(effort: string | undefined): CliRuntimeEffort | undefined {
  if (!effort) return undefined
  return VALID_EFFORTS.has(effort as CliRuntimeEffort) ? effort as CliRuntimeEffort : undefined
}

export function resolveCliRuntimeForSend(options: CliRuntimeSendOptions | undefined): ResolvedCliRuntimeForSend {
  const selected = options?.cliRuntime
  if (!selected?.runtimeId) return { kind: 'none' }

  const modelId = normalizeModelId(selected.modelId)
  const effort = normalizeEffort(selected.effort)

  if (selected.custom) {
    return {
      kind: 'custom',
      runtimeId: selected.runtimeId,
      command: selected.custom.command,
      args: selected.custom.args ?? [],
      env: selected.custom.env,
      ...(modelId ? { modelId } : {}),
      ...(effort ? { effort } : {}),
    }
  }

  const mapped = DETECTED_ACP_RUNTIME_MAP[selected.runtimeId as keyof typeof DETECTED_ACP_RUNTIME_MAP]
  if (mapped) {
    return {
      kind: 'detected',
      runtimeId: selected.runtimeId,
      displayName: mapped.displayName,
      command: mapped.command,
      args: mapped.args,
      ...(modelId ? { modelId } : {}),
      ...(effort ? { effort } : {}),
    }
  }

  return {
    kind: 'unsupported',
    runtimeId: selected.runtimeId,
    message: getUnsupportedDetectedRuntimeMessage(selected.runtimeId),
  }
}

export function getCliRuntimeAttachmentRejectionMessage(
  attachments: FileAttachment[] | undefined,
  storedAttachments: StoredAttachment[] | undefined,
): string | null {
  if (!attachments?.length && !storedAttachments?.length) return null
  return 'CLI Runtime 第一版暂不支持附件。请移除附件后重试，或切回 API 模型发送。'
}
