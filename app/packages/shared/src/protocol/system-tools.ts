/**
 * System Tools / Project Environment 契约类型（T-SYSTOOLS · `docs/28`）。
 *
 * 这是 Fleet 的本机能力地图契约。所有本机 CLI / runtime / sidecar / 浏览器 helper /
 * 项目环境探测都统一落回 `ToolCapability`，避免各模块私自探测 PATH（rule 28）。
 *
 * 边界（诚实）：
 * - 本文件只定义**只读**检测/诊断的请求与响应类型。**不包含** `runRepair` 通道——
 *   v1 不自动执行安装/改 PATH/写配置/修复命令；那需要 permission + timeline，是后续切片。
 *   UI 里修复按钮标注"未接入"。
 * - 不碰 `SessionEvent` / `design.ts` / `design-service.ts`；本契约独立。
 * - 检测到工具**不等于**允许 Agent 使用工具；使用仍要走 craft permission、timeline、风险分级。
 */

/** 工具分类（`docs/28` §4 `category`）。 */
export type ToolCategory =
  | 'runtime'
  | 'package-manager'
  | 'cli-agent'
  | 'search'
  | 'browser'
  | 'context'
  | 'design'
  | 'video'
  | 'app-bundled'
  | 'custom'

/** 工具状态。 */
export type ToolStatus =
  | 'available' // 检测到且验证通过
  | 'missing' // PATH 中找不到
  | 'broken' // 找到但 --version 验证失败 / 启动报错
  | 'conflict' // 可用但有冲突（多版本 / 非推荐 / shim 依赖缺失）
  | 'disabled' // 用户手动禁用
  | 'unknown' // 未检测 / 当前平台不适用

/** 工具来源（`docs/28` §4 `source`）。 */
export type ToolSource =
  | 'bundled' // App 自带
  | 'system-path' // process.env.PATH 命中
  | 'login-shell-path' // 登录 shell PATH fallback 命中（桌面 App PATH 比终端短）
  | 'project-local' // 项目本地（如 node_modules/.bin、.venv）
  | 'well-known-path' // well-known 安装位置（如 macOS app bundle）
  | 'custom' // 用户手动指定

/** 工具作用域。 */
export type ToolScope = 'global' | 'project' | 'workspace' | 'runtime'

/** 风险分级（使用工具时走 permission 的分级依据）。 */
export type ToolRisk = 'read-only' | 'local-exec' | 'network' | 'file-write' | 'external-upload'

/** 能力标签——Agent 据此知道工具能做什么。 */
export type ToolCapabilityTag =
  | 'run-js'
  | 'run-python'
  | 'package-install'
  | 'acp-stdio'
  | 'repo-pack'
  | 'doc-convert'
  | 'graph-query'
  | 'browser-control'
  | 'search-files'
  | 'search-content'
  | 'version-control'

/** 单条诊断信息（失败原因 / 冲突 / 修复建议）。 */
export interface ToolDiagnostic {
  /** `info` | `warning` | `error` */
  level: 'info' | 'warning' | 'error'
  /** 机器可读的诊断码，例如 `path-mismatch` / `multi-version` / `lockfile-conflict`。 */
  code: string
  /** 人类可读说明（i18n key 或直串，UI 直接展示）。 */
  message: string
  /** 可选修复建议（不自动执行，只展示给用户/Agent）。 */
  repairSuggestion?: string
}

/** 用户手动 override 记录。 */
export interface ToolUserOverride {
  path?: string
  args?: string[]
  env?: Record<string, string>
  /** 设置时间戳。 */
  setAt?: number
}

/**
 * 单个工具的能力记录（`docs/28` §4 完整字段）。
 * 这是 registry 对外暴露的统一形状，UI 和 Agent 都读它。
 */
export interface ToolCapability {
  toolId: string
  category: ToolCategory
  displayName: string
  status: ToolStatus
  /** 检测到的版本；没有就为空。 */
  version?: string
  /** 最终执行路径。 */
  path?: string
  /**
   * 如果靠 login shell PATH 找到，记录当时 PATH；后续 spawn 必须带上，
   * 否则桌面 App 启动环境会再次找不到（`docs/28` §6 PATH 不一致）。
   */
  resolvedPathEnv?: string
  source: ToolSource
  scope: ToolScope
  /** 同类工具优先级（数字越小越优先）。 */
  priority?: number
  capabilities: ToolCapabilityTag[]
  risk: ToolRisk
  /** 最后检测时间（epoch ms）。 */
  lastCheckedAt?: number
  diagnostics: ToolDiagnostic[]
  userOverride?: ToolUserOverride
  /** 该工具被哪些 Fleet 功能依赖（用于详情抽屉展示）。 */
  usedBy?: string[]
}

/** 项目环境 Profile（`docs/28` §7）。不写进第三方项目源码，存 Fleet 本地状态。 */
export interface ProjectEnvironmentProfile {
  /** 项目根目录（绝对路径）。 */
  rootDir: string
  /** git root（可能是 rootDir 或其祖先）。 */
  gitRoot?: string
  /** workspace id（如果来自某个 workspace）。 */
  workspaceId?: string
  /** 推荐的 package manager（基于 lockfile）。 */
  recommendedPackageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun'
  /** 检测到的 lockfile 文件名（相对 rootDir）。 */
  lockfiles: string[]
  /** Python 环境候选（相对/绝对路径，不读 secret）。 */
  pythonEnvs: string[]
  /** package.json scripts 名（不读内容外的 secret）。 */
  packageScripts: string[]
  /** env file 候选路径（只记路径，不读内容）。 */
  envFileCandidates: string[]
  /** 诊断（冲突 / 缺失项 / 修复建议）。 */
  diagnostics: ToolDiagnostic[]
  /** 最近一次检测时间。 */
  lastCheckedAt?: number
}

// ---------------------------------------------------------------------------
// 检测请求 / 响应（RPC 载荷）
// ---------------------------------------------------------------------------

/** `systemTools.listTools` 响应：全部工具能力。 */
export type ListToolsResult = ToolCapability[]

/** `systemTools.detectAll` / `detectTool` / `detectCategory` 请求选项。 */
export interface DetectOptions {
  /** 强制重新检测（忽略缓存）。 */
  force?: boolean
}

/** `systemTools.detectTool` 请求。 */
export interface DetectToolInput extends DetectOptions {
  toolId: string
}

/** `systemTools.detectCategory` 请求。 */
export interface DetectCategoryInput extends DetectOptions {
  category: ToolCategory
}

/** `systemTools.getBestTool` 请求。 */
export interface GetBestToolInput {
  category: ToolCategory
  /** 仅返回具备该能力标签的工具。 */
  capability?: ToolCapabilityTag
}

/** `systemTools.diagnoseProject` / `getProjectProfile` 请求。 */
export interface ProjectEnvInput {
  rootDir: string
  workspaceId?: string
}

/** `systemTools.diagnoseProject` 响应：项目 profile + 聚合的工具诊断。 */
export interface ProjectDiagnosisResult {
  profile: ProjectEnvironmentProfile
  /** 当前缓存工具的诊断聚合（便于 UI 一次展示）。 */
  toolDiagnostics: ToolDiagnostic[]
}

/** `systemTools.clearCache` 响应。 */
export interface ClearCacheResult {
  cleared: boolean
}
