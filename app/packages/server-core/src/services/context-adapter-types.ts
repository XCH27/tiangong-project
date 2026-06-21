/**
 * Context adapter shared types — compression savings and sidecar resolution.
 * Token counts are estimates unless noted; real provider usage stays in Usage Ledger.
 */

export type ContextAdapterToolKind = 'codegraph' | 'rtk'

export type ContextAdapterAvailability =
  | { available: true; toolId: string; path: string; resolvedPathEnv?: string; version?: string }
  | { available: false; toolId: string; reason: string; diagnostics?: string[] }

export interface ContextCompressionStats {
  beforeChars: number
  afterChars: number
  savedChars: number
  savedCharPercent: number
  beforeTokens: number
  afterTokens: number
  savedTokens: number
  savedTokenPercent: number
  tokenEstimateKind: 'estimate'
}

export interface ContextAdapterCompressionResult {
  toolKind: ContextAdapterToolKind
  availability: ContextAdapterAvailability
  input: string
  output: string
  stats: ContextCompressionStats
  applied: boolean
  note?: string
}

export interface CodegraphQueryRequest {
  rootPath: string
  query: string
  /** Optional relative file scope. */
  relativePath?: string
}

export interface CodegraphQueryResult {
  availability: ContextAdapterAvailability
  query: string
  /** Structured snippet returned instead of whole-file reads. */
  structuredOutput: string
  stats: ContextCompressionStats
  applied: boolean
  note?: string
}
