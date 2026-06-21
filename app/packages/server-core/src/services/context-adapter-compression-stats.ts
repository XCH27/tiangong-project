/**
 * Before/after compression savings for context adapters.
 */

import { estimateTokensFromText } from './project-pack-ignore'
import type { ContextCompressionStats } from './context-adapter-types'

export function buildCompressionStats(before: string, after: string): ContextCompressionStats {
  const beforeChars = before.length
  const afterChars = after.length
  const savedChars = Math.max(0, beforeChars - afterChars)
  const beforeTokens = estimateTokensFromText(before)
  const afterTokens = estimateTokensFromText(after)
  const savedTokens = Math.max(0, beforeTokens - afterTokens)

  return {
    beforeChars,
    afterChars,
    savedChars,
    savedCharPercent: beforeChars > 0 ? Math.round((savedChars / beforeChars) * 100) : 0,
    beforeTokens,
    afterTokens,
    savedTokens,
    savedTokenPercent: beforeTokens > 0 ? Math.round((savedTokens / beforeTokens) * 100) : 0,
    tokenEstimateKind: 'estimate',
  }
}
