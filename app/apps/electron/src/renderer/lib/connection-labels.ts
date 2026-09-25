import { getPiAuthProviderName, type LlmConnection } from '@config/llm-connections'

export function getConnectionProviderLabel(connection: LlmConnection): string {
  if (connection.providerType === 'anthropic') return 'Anthropic'
  if (connection.providerType === 'pi') {
    return getPiAuthProviderName(connection.piAuthProvider) || connection.piAuthProvider || connection.name
  }
  return connection.name
}

/** Correct inherited plan/runtime labels; never rewrite a custom connection name. */
export function getConnectionDisplayName(connection: LlmConnection, connections: LlmConnection[]): string {
  const subscriptionTemplate = /^(Claude Max|ChatGPT Plus|Grok \(Subscription\))(?: (\d+))?$/.exec(connection.name)
  if (subscriptionTemplate) {
    const label = subscriptionTemplate[1] === 'Claude Max' ? 'Claude'
      : subscriptionTemplate[1] === 'ChatGPT Plus' ? 'ChatGPT' : 'Grok'
    return subscriptionTemplate[2] ? `${label} ${subscriptionTemplate[2]}` : label
  }
  if (!/^Craft Agents Backend \([^)]+\)(?: \d+)?$/.test(connection.name)) return connection.name
  const providerName = getConnectionProviderLabel(connection)
  if (providerName === connection.name) return connection.name
  const siblings = connections.filter(candidate => candidate.providerType === connection.providerType
    && candidate.authType === connection.authType && candidate.piAuthProvider === connection.piAuthProvider)
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.slug.localeCompare(b.slug))
  const number = siblings.findIndex(candidate => candidate.slug === connection.slug) + 1
  return number > 1 ? `${providerName} ${number}` : providerName
}
