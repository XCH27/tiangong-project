/**
 * Project Environment Profile（T-SYSTOOLS · `docs/28` §7 / §10 ENV-4）。
 *
 * 进入项目时只读扫描 lockfile / venv / package scripts / git root，给出推荐命令
 * 和冲突提示。不写进第三方项目源码，不读 `.env` secret 内容（`docs/28` §7/§11）。
 *
 * Agent 启动任务前读它：知道当前项目该用什么命令、哪里会冲突、哪里缺工具。
 */

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, dirname, normalize } from 'node:path'
import type { ProjectEnvironmentProfile, ToolDiagnostic } from '@craft-agent/shared/protocol'
import {
  diagnoseLockfiles,
  diagnosePythonEnv,
  KNOWN_LOCKFILES,
  LOCKFILE_TO_PM,
  PYTHON_ENV_MARKERS,
  PYTHON_PROJECT_MARKERS,
  lockfileToPackageManager,
} from './system-tools-diagnostics'

/** package.json 的最小结构（只取 scripts 名，不读 secret）。 */
interface MinimalPackageJson {
  scripts?: Record<string, string>
}

/** env file 候选名（只记路径，不读内容）。 */
const ENV_FILE_CANDIDATES = ['.env', '.env.local', '.env.development', '.env.production']

/**
 * 向上查找 git root（含 .git 的最近祖先目录）。
 * 不调 git 二进制——纯文件系统判断，避免 git 缺失时炸掉。
 */
export function findGitRoot(startDir: string): string | undefined {
  let cur = normalize(startDir)
  for (let i = 0; i < 20; i++) {
    if (existsSync(join(cur, '.git'))) return cur
    const parent = dirname(cur)
    if (parent === cur) break
    cur = parent
  }
  return undefined
}

/** 安全读 package.json——解析失败返回 undefined，不抛。 */
function safeReadPackageJson(rootDir: string): MinimalPackageJson | undefined {
  const p = join(rootDir, 'package.json')
  if (!existsSync(p)) return undefined
  try {
    const raw = readFileSync(p, 'utf-8')
    const parsed = JSON.parse(raw) as MinimalPackageJson
    return parsed
  } catch {
    return undefined
  }
}

/** 列出项目根下的 env file 候选（只记路径）。 */
function listEnvFileCandidates(rootDir: string): string[] {
  return ENV_FILE_CANDIDATES.filter((name) => existsSync(join(rootDir, name)))
}

/** 列出项目根下的 lockfile（KNOWN_LOCKFILES ∩ rootDir）。 */
function listLockfiles(rootDir: string): string[] {
  return KNOWN_LOCKFILES.filter((name) => existsSync(join(rootDir, name)))
}

/** 列出 Python 环境标记。 */
function listPythonEnvs(rootDir: string): string[] {
  return PYTHON_ENV_MARKERS.filter((name) => existsSync(join(rootDir, name)))
}

/**
 * 构建项目环境 Profile（`docs/28` §7）。
 * 纯只读文件系统扫描；不执行任何命令、不读 secret 内容。
 */
export function buildProjectEnvironmentProfile(
  rootDir: string,
  opts: { workspaceId?: string } = {},
): ProjectEnvironmentProfile {
  const diagnostics: ToolDiagnostic[] = []
  const invalidProfile = (code: string, message: string): ProjectEnvironmentProfile => ({
    rootDir,
    workspaceId: opts.workspaceId,
    lockfiles: [],
    pythonEnvs: [],
    packageScripts: [],
    envFileCandidates: [],
    diagnostics: [{ level: 'error', code, message }],
    lastCheckedAt: Date.now(),
  })

  if (!existsSync(rootDir)) {
    return invalidProfile('project-root-not-found', `项目路径不存在：${rootDir}`)
  }
  try {
    if (!statSync(rootDir).isDirectory()) {
      return invalidProfile('project-root-not-directory', `项目路径不是目录：${rootDir}`)
    }
  } catch {
    return invalidProfile('project-root-unreadable', `无法读取项目路径：${rootDir}`)
  }

  const lockfiles = listLockfiles(rootDir)
  const pythonEnvs = listPythonEnvs(rootDir)

  // lockfile 冲突诊断
  const lockDiag = diagnoseLockfiles(rootDir)
  diagnostics.push(...lockDiag.diagnostics)

  // Python 环境诊断
  const pyDiag = diagnosePythonEnv(rootDir)
  diagnostics.push(...pyDiag.diagnostics)

  // 推荐 package manager：单 lockfile → 对应 PM；多 lockfile → 取第一个并加 warning
  let recommendedPackageManager: ProjectEnvironmentProfile['recommendedPackageManager']
  if (lockfiles.length === 1) {
    recommendedPackageManager = LOCKFILE_TO_PM[lockfiles[0]!]
  } else if (lockfiles.length > 1) {
    recommendedPackageManager = LOCKFILE_TO_PM[lockfiles[0]!]
  }

  // package.json scripts（只取名，不读命令体里的 secret）
  const pkg = safeReadPackageJson(rootDir)
  const packageScripts = pkg?.scripts ? Object.keys(pkg.scripts) : []

  // git root
  const gitRoot = findGitRoot(rootDir)
  if (!gitRoot) {
    diagnostics.push({
      level: 'info',
      code: 'not-a-git-repo',
      message: `${rootDir} 不是 git 仓库（未找到 .git）。`,
    })
  }

  // env file 候选（只记路径 + 存在性，不读内容）
  const envFileCandidates = listEnvFileCandidates(rootDir)
  if (envFileCandidates.length > 0) {
    diagnostics.push({
      level: 'info',
      code: 'env-files-present',
      message: `发现 env file 候选：${envFileCandidates.join('、')}。Fleet 只记录路径，不读取 secret 内容。`,
    })
  }

  // 无 lockfile 且有 package.json → 提示
  if (lockfiles.length === 0 && pkg) {
    diagnostics.push({
      level: 'info',
      code: 'no-lockfile',
      message: '有 package.json 但无 lockfile。建议运行包管理器生成 lockfile 以锁定依赖版本。',
    })
  }

  return {
    rootDir,
    gitRoot,
    workspaceId: opts.workspaceId,
    recommendedPackageManager,
    lockfiles,
    pythonEnvs,
    packageScripts,
    envFileCandidates,
    diagnostics,
    lastCheckedAt: Date.now(),
  }
}

/**
 * 给 Agent 的推荐命令提示（基于 profile，纯文本，不执行）。
 * 用于 UI 详情与 Agent 上下文。
 */
export function recommendCommands(profile: ProjectEnvironmentProfile): string[] {
  const out: string[] = []
  const pm = profile.recommendedPackageManager
  if (pm) {
    out.push(`${pm} install`)
    if (profile.packageScripts.includes('build')) out.push(`${pm} run build`)
    if (profile.packageScripts.includes('test')) out.push(`${pm} run test`)
    if (profile.packageScripts.includes('typecheck')) out.push(`${pm} run typecheck`)
    if (profile.packageScripts.includes('lint')) out.push(`${pm} run lint`)
  }
  if (profile.pythonEnvs.length > 0) {
    const venv = profile.pythonEnvs[0]!
    out.push(`激活 Python 环境：source ${venv}/bin/activate（需用户确认执行）`)
  }
  return out
}

/** 重导出便于 handler/UI 用。 */
export { lockfileToPackageManager, LOCKFILE_TO_PM, KNOWN_LOCKFILES, PYTHON_ENV_MARKERS, PYTHON_PROJECT_MARKERS }
