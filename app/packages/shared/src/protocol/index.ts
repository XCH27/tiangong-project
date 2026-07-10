/**
 * Shared protocol surface.
 * Freeze id: w0.1-doc-freeze-2026-07-09
 * Clean Craft v0.11.0 base + Fleet adapt/staging ports (L00).
 * canvas.ts deferred (ADR-0033 / M07 spike).
 */
export * from './types'
export * from './channels'
export * from './dto'
export * from './events'
export * from './routing'
export * from './actor'
export * from './session-event'
export * from './lease'
export * from './agent-session'
export * from './internal-action'
export * from './artifact-ref'
export * from './m11a-usage-cost'
export * from './action-invocation-vnext'
export * from './external-job'
export * from './workflow'
export * from './view-contribution'

export const FLEET_PROTOCOL_FREEZE_ID = 'w0.1-doc-freeze-2026-07-09' as const
