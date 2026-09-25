import {
  isModelVisibleInPicker,
  canSwitchConnectionDuringSession,
  type LlmConnectionWithStatus,
} from '@config/llm-connections'

/**
 * Format token count for display (e.g., 1500 -> "1.5k", 200000 -> "200k").
 * Shared by the desktop model dropdown and the compact (drawer) model picker.
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(tokens >= 10000 ? 0 : 1)}k`
  }
  return tokens.toString()
}

/**
 * Strip the "pi/" prefix from model IDs/display names so the user sees a
 * provider-agnostic label in the picker (e.g., "pi/claude-opus" → "claude-opus").
 */
export function stripPiPrefixForDisplay(value: string): string {
  return value.startsWith('pi/') ? value.slice(3) : value
}

/** Cindy groups by source identity, never by the underlying agent runtime. */
export function getModelPickerGroups(
  connections: readonly LlmConnectionWithStatus[],
  currentConnection: string | undefined,
  isEmptySession: boolean,
) {
  const current = connections.find(connection => connection.slug === currentConnection)
  return connections
    .filter(connection => isEmptySession || canSwitchConnectionDuringSession(current, connection))
    .map(connection => ({
      connection,
      models: (connection.models ?? []).filter(model => isModelVisibleInPicker(
        connection, typeof model === 'string' ? model : model.id,
      )),
    }))
}
