import type { LlmConnection } from '@craft-agent/shared/config'
import { normalizeDeprecatedModelId } from '@craft-agent/shared/config/models'
import { providerTypeToAgentProvider, resolveModelForProvider } from '@craft-agent/shared/agent/backend'

/**
 * A workspace model override belongs to its effective connection. Keep it when
 * the existing runtime resolver can use it; otherwise let the new connection's
 * default model take over. This does not infer account entitlements from an
 * incomplete SDK catalog.
 */
export function reconcileWorkspaceModelOverride(
  model: string | undefined,
  connection: LlmConnection | null,
): string | undefined {
  if (!model || !connection) return model
  const resolved = resolveModelForProvider(
    providerTypeToAgentProvider(connection.providerType),
    model,
    connection,
  )
  return resolved === normalizeDeprecatedModelId(model) ? model : undefined
}

/** A workspace override is inherited only when the session uses that workspace's effective connection. */
export function inheritedWorkspaceModelOverride(
  model: string | undefined,
  sessionConnection: LlmConnection | null,
  workspaceConnection: LlmConnection | null,
): string | undefined {
  if (!model) return model
  return workspaceConnection?.slug === sessionConnection?.slug ? model : undefined
}

/** An explicit Session source must never fall through to another account. */
export function assertSessionConnectionSelection(
  slug: string | undefined,
  connection: Pick<LlmConnection, 'slug'> | null,
): void {
  if (slug && connection?.slug !== slug) throw new Error('CONNECTION_UNAVAILABLE')
}

/** Reject an explicit pick if the runtime would silently run another model. */
export function assertSessionModelSelection(model: string | null, resolvedModel: string): void {
  if (model !== null && normalizeDeprecatedModelId(model) !== resolvedModel) {
    throw new Error('MODEL_UNAVAILABLE_FOR_CONNECTION')
  }
}

/** Workspace settings use the same backend choice as a Session send. */
export function assertWorkspaceModelSelection(model: string, connection: LlmConnection | null): void {
  if (!connection) throw new Error('MODEL_UNAVAILABLE_FOR_CONNECTION')
  assertSessionModelSelection(model, resolveModelForProvider(
    providerTypeToAgentProvider(connection.providerType), model, connection,
  ))
}
