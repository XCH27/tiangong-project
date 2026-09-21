import type { Assistant } from './types'
import { narrowPermissionMode, type PermissionMode } from '../agent/mode-types'

/** Fail closed until each requested capability has a real runtime resolver. */
export function resolveAssistantPermission(assistant: Assistant, current: PermissionMode = 'safe'): PermissionMode {
  const unsupported = (['model', 'skills', 'mcpServerIds', 'pluginIds'] as const)
    .filter(field => assistant.loadout[field].mode === 'fixed')
  if (unsupported.length) {
    throw new Error(`Assistant loadout cannot be applied yet: ${unsupported.join(', ')} resolver not implemented`)
  }
  const requested = assistant.loadout.permissionMode
  if (requested.mode === 'inherit') return current
  if (requested.value !== 'safe' && requested.value !== 'ask' && requested.value !== 'allow-all') {
    throw new Error('Assistant permission request is invalid')
  }
  return narrowPermissionMode(current, requested.value) ?? 'safe'
}
