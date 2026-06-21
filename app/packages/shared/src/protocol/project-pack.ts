/**
 * ProjectPack v1 — 本地项目打包协议（T-PROJECTPACK）。
 *
 * 把 repo / git diff / 指定目录打包成 AI-friendly Markdown。
 * token 数为估算值；外发前必须 secret scan + 用户确认（服务端不自动外发）。
 */

export type ProjectPackScope = 'repo' | 'diff' | 'directory'

export type ProjectPackExcludeReason =
  | 'gitignore'
  | 'default_ignore'
  | 'binary'
  | 'too_large'
  | 'max_files'
  | 'env_file'

export type SecretSeverity = 'high' | 'medium' | 'low'

export interface ProjectPackRequest {
  /** 项目根目录（绝对路径） */
  rootPath: string
  scope: ProjectPackScope
  /** scope=directory 时相对于 rootPath 的子目录 */
  relativePath?: string
  /** 单文件上限（字节），默认 512 KiB */
  maxFileBytes?: number
  /** 最多打包文件数，默认 500 */
  maxFiles?: number
}

export interface SecretFinding {
  relativePath: string
  line: number
  ruleId: string
  severity: SecretSeverity
  message: string
  /** 已打码的片段，仅供 UI 展示 */
  snippet: string
}

export interface ProjectPackExcludedEntry {
  relativePath: string
  reason: ProjectPackExcludeReason
}

export interface ProjectPackFileEntry {
  relativePath: string
  bytes: number
  sha256: string
}

export interface ProjectPackSecretScanResult {
  scannedFileCount: number
  findingCount: number
  findings: SecretFinding[]
  hasHighSeverity: boolean
}

export interface ProjectPackSummary {
  bundleId: string
  bundleHash: string
  bundlePath: string
  scope: ProjectPackScope
  rootPath: string
  gitCommit: string | null
  gitBranch: string | null
  gitDirty: boolean
  fileCount: number
  totalBytes: number
  /** 估算 token（chars/4 启发式），非真实计费 */
  estimatedTokens: number
  tokenEstimateKind: 'estimate'
  excluded: ProjectPackExcludedEntry[]
  files: ProjectPackFileEntry[]
  secretScan: ProjectPackSecretScanResult
  createdAt: number
  markdownBytes: number
  /** 存在高危 secret 时为 false；外发仍需用户显式确认 */
  externalExportAllowed: boolean
}

export interface ProjectPackPlanPreviewSummary {
  scope: ProjectPackScope
  rootPath: string
  gitCommit: string | null
  gitBranch: string | null
  gitDirty: boolean
  fileCount: number
  totalBytes: number
  /** 估算 token（chars/4 启发式），非真实计费 */
  estimatedTokens: number
  tokenEstimateKind: 'estimate'
  excluded: ProjectPackExcludedEntry[]
  files: ProjectPackFileEntry[]
  secretScan: ProjectPackSecretScanResult
  /** 存在高危 secret 时为 false；外发仍需用户显式确认 */
  externalExportAllowed: boolean
}

export interface ProjectPackResult {
  summary: ProjectPackSummary
  /** Markdown 前若干行，供 UI 预览 */
  markdownPreview: string
}

export interface ProjectPackPlanPreviewResult {
  summary: ProjectPackPlanPreviewSummary
}

export type ProjectPackReviewPromptStatus = 'ready' | 'blocked'

export interface ProjectPackReviewPromptCostMetadata {
  status: 'unknown'
  label: 'external-platform-cost-unknown'
  note: string
}

export interface ProjectPackReviewPromptMetadata {
  bundleId: string
  bundleHash: string
  fileCount: number
  estimatedTokens: number
  tokenEstimateKind: 'estimate'
  secretScan: {
    scannedFileCount: number
    findingCount: number
    hasHighSeverity: boolean
    status: 'passed' | 'blocked'
  }
  externalExportAllowed: boolean
  externalPlatformCost: ProjectPackReviewPromptCostMetadata
}

export interface ProjectPackReviewPromptResult {
  status: ProjectPackReviewPromptStatus
  metadata: ProjectPackReviewPromptMetadata
  reasons: string[]
  /** 可复制到外部审查平台的提示词；blocked 时必须为 null。 */
  reviewPrompt: string | null
}
