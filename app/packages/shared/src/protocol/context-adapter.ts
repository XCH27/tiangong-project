/**
 * Context adapter RPC types — codegraph query and rtk compression (LOCAL_ONLY).
 * Adapter token counts are estimates; real provider usage stays in session Usage Ledger.
 */

export type ContextMetricKind = 'estimate' | 'real'

export type ContextAdapterAvailabilityDto =
  | { available: true; toolId: string; path: string; resolvedPathEnv?: string; version?: string }
  | { available: false; toolId: string; reason: string; diagnostics?: string[] }

export interface ContextCompressionStatsDto {
  beforeChars: number
  afterChars: number
  savedChars: number
  savedCharPercent: number
  beforeTokens: number
  afterTokens: number
  savedTokens: number
  savedTokenPercent: number
  /** Adapter savings are always estimate unless wired to provider usage. */
  tokenEstimateKind: ContextMetricKind
}

export interface ContextAdapterCodegraphRequest {
  rootPath: string
  query: string
  relativePath?: string
  forceRedetect?: boolean
}

export interface ContextAdapterCodegraphResult {
  availability: ContextAdapterAvailabilityDto
  query: string
  structuredOutput: string
  stats: ContextCompressionStatsDto
  applied: boolean
  note?: string
}

export interface ContextAdapterRtkRequest {
  input: string
  forceRedetect?: boolean
}

export interface ContextAdapterRtkResult {
  availability: ContextAdapterAvailabilityDto
  input: string
  output: string
  stats: ContextCompressionStatsDto
  applied: boolean
  note?: string
}
