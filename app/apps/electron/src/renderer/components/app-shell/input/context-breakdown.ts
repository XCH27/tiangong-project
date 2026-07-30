import type { Message } from '@craft-agent/core'

export type ContextBreakdownKey = 'user' | 'assistant' | 'tool' | 'other'

export interface ContextBreakdownSegment {
  key: ContextBreakdownKey
  tokens: number
  /** Visible messages contributing to this estimate (not available for other). */
  messageCount?: number
  /** Share of the provider-reported input, not the full context window. */
  inputSharePercent: number
}

export interface ContextWindowSegment extends ContextBreakdownSegment {
  /** Share of the model's full context window. */
  windowPercent: number
}

const estimateTokens = (characters: number): number => Math.ceil(characters / 4)

function messageCharacters(message: Message): number {
  if (message.hidden) return 0

  let characters = message.content?.length ?? 0
  if (message.role === 'tool') {
    if (message.toolResult) characters += message.toolResult.length
    if (message.toolInput)
      characters += JSON.stringify(message.toolInput).length
  }
  return characters
}

/**
 * Mirrors OpenCode's bounded context-composition estimate: visible message
 * content is approximated at four characters per token, then scaled to the
 * provider-reported input total. The residual remains "other" because the
 * renderer cannot truthfully split the provider/system prefix into rules,
 * skills, MCP schemas, and tool definitions.
 */
export function estimateContextBreakdown(
  messages: Message[] | undefined,
  inputTokens: number | undefined,
): ContextBreakdownSegment[] {
  const input = Math.max(0, inputTokens ?? 0)
  if (!input || !messages?.length) return []

  const estimated = messages.reduce(
    (totals, message) => {
      const tokens = estimateTokens(messageCharacters(message))
      if (message.hidden) return totals
      if (message.role === 'user') {
        totals.user.tokens += tokens
        totals.user.messages += 1
      }
      else if (message.role === 'assistant' || message.role === 'plan') {
        totals.assistant.tokens += tokens
        totals.assistant.messages += 1
      } else if (message.role === 'tool') {
        totals.tool.tokens += tokens
        totals.tool.messages += 1
      }
      return totals
    },
    {
      user: { tokens: 0, messages: 0 },
      assistant: { tokens: 0, messages: 0 },
      tool: { tokens: 0, messages: 0 },
    },
  )

  const estimatedTotal =
    estimated.user.tokens +
    estimated.assistant.tokens +
    estimated.tool.tokens
  const scale = estimatedTotal > input ? input / estimatedTotal : 1
  const scaled = {
    user: Math.floor(estimated.user.tokens * scale),
    assistant: Math.floor(estimated.assistant.tokens * scale),
    tool: Math.floor(estimated.tool.tokens * scale),
  }
  const known = scaled.user + scaled.assistant + scaled.tool
  const values: Array<{
    key: ContextBreakdownKey
    tokens: number
    messageCount?: number
  }> = [
    {
      key: 'user',
      tokens: scaled.user,
      messageCount: estimated.user.messages,
    },
    {
      key: 'assistant',
      tokens: scaled.assistant,
      messageCount: estimated.assistant.messages,
    },
    {
      key: 'tool',
      tokens: scaled.tool,
      messageCount: estimated.tool.messages,
    },
    { key: 'other', tokens: Math.max(0, input - known) },
  ]

  return values
    .filter((segment) => segment.tokens > 0)
    .map((segment) => ({
      ...segment,
      inputSharePercent: Math.round((segment.tokens / input) * 1000) / 10,
    }))
}

/**
 * Project an input composition onto the full context window.
 *
 * Keeping this conversion separate prevents an input-relative composition
 * (for example, 98% "other" inside a 22k prompt) from looking like 98% of a
 * 1M-token context window has been consumed.
 */
export function projectBreakdownToContextWindow(
  segments: ContextBreakdownSegment[],
  contextWindow: number,
): ContextWindowSegment[] {
  if (!Number.isFinite(contextWindow) || contextWindow <= 0) return []

  return segments.map((segment) => ({
    ...segment,
    windowPercent: Math.min(
      100,
      Math.round((segment.tokens / contextWindow) * 1000) / 10,
    ),
  }))
}
