/**
 * ProjectPack delta planning — incremental scope from git changes + related files.
 */

export type ProjectPackDeltaMode = 'diff' | 'staged' | 'untracked'

export type ProjectPackDeltaExclusionReason =
  | 'env_file'
  | 'binary'
  | 'default_ignore'
  | 'too_large'
  | 'max_files'
  | 'unrelated'
  | 'not_found'

export interface ProjectPackDeltaExcludedEntry {
  relativePath: string
  reason: ProjectPackDeltaExclusionReason
  detail?: string
}

export interface ProjectPackDeltaIncludedEntry {
  relativePath: string
  source: 'git_changed' | 'related'
  bytes?: number
  estimatedTokens?: number
}

export interface ProjectPackDeltaPlanRequest {
  /** Absolute workspace / repo root path. */
  workspacePath: string
  mode?: ProjectPackDeltaMode
  maxRelatedDepth?: number
  maxFiles?: number
  maxFileBytes?: number
}

export interface ProjectPackDeltaPlanResult {
  workspacePath: string
  mode: ProjectPackDeltaMode
  changedFiles: string[]
  relatedFiles: string[]
  included: ProjectPackDeltaIncludedEntry[]
  excluded: ProjectPackDeltaExcludedEntry[]
  estimatedTokens: number
  tokenEstimateKind: 'estimate'
  generatedAt: number
}
