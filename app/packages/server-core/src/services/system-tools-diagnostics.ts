/**
 * System Tools 冲突诊断（T-SYSTOOLS · `docs/28` §6）。
 *
 * 把 PATH 不一致 / 多版本 / lockfile 冲突 / Python 环境冲突 / shim 依赖缺失 /
 * 权限缺失 / 网络代理状态做成结构化 `ToolDiagnostic`，给 Agent 可读结果，
 * 避免反复试错浪费 token（`docs/28` §6 末段）。
 *
 * 只诊断、给修复建议；不自动 chmod / 改 PATH / 装依赖（rule 28 / docs/28 §11）。
 */

import { existsSync, statSync, accessSync, constants } from 'node:fs'
import { join, basename } from 'node:path'
import type { ToolCapability, ToolDiagnostic } from '@craft-agent/shared/protocol'

/** lockfile → 推荐包管理器（`docs/28` §6 lockfile 冲突）。 */
export const LOCKFILE_TO_PM: Record<string, 'npm' | 'pnpm' | 'yarn' | 'bun'> = {
  'package-lock.json': 'npm',
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'bun.lock': 'bun',
  'bun.lockb': 'bun',
}

/** 已知的 lockfile 文件名。 */
export const KNOWN_LOCKFILES = Object.keys(LOCKFILE_TO_PM)

/** 已知 Python 环境标志（`docs/28` §6 Python 环境冲突）。 */
export const PYTHON_ENV_MARKERS = ['.venv', 'venv', '.python-virtualenv']
export const PYTHON_PROJECT_MARKERS = ['pyproject.toml', 'uv.lock', 'requirements.txt', 'Pipfile']

/**
 * 诊断项目目录里的 lockfile 冲突：多个 lockfile 共存 = 混用包管理器风险。
 */
export function diagnoseLockfiles(rootDir: string): { found: string[]; diagnostics: ToolDiagnostic[] } {
  const found: string[] = []
  for (const name of KNOWN_LOCKFILES) {
    if (existsSync(join(rootDir, name))) found.push(name)
  }
  const diagnostics: ToolDiagnostic[] = []
  if (found.length === 0) {
    return { found, diagnostics }
  }
  if (found.length > 1) {
    diagnostics.push({
      level: 'warning',
      code: 'lockfile-conflict',
      message: `发现多个 lockfile：${found.join('、')}。混用包管理器可能导致依赖不一致。`,
      repairSuggestion: `保留一个与团队约定一致的 lockfile（推荐 ${LOCKFILE_TO_PM[found[0]!]}），删除其余。Fleet 不会自动删除。`,
    })
  }
  return { found, diagnostics }
}

/**
 * 诊断 Python 环境冲突：系统 python vs 项目 venv/uv。
 * 只看文件存在性，不读内容、不读 secret。
 */
export function diagnosePythonEnv(rootDir: string): { envs: string[]; diagnostics: ToolDiagnostic[] } {
  const envs: string[] = []
  for (const marker of PYTHON_ENV_MARKERS) {
    if (existsSync(join(rootDir, marker))) envs.push(marker)
  }
  const hasProjectMarker = PYTHON_PROJECT_MARKERS.some((m) => existsSync(join(rootDir, m)))
  const diagnostics: ToolDiagnostic[] = []

  if (envs.length > 0 && hasProjectMarker) {
    diagnostics.push({
      level: 'info',
      code: 'python-project-env',
      message: `项目含 Python 环境标记（${envs.join('、')}）且存在 pyproject/requirements。`,
      repairSuggestion: '优先使用项目本地 venv/uv，不要直接用系统 python。',
    })
  }
  if (envs.length > 1) {
    diagnostics.push({
      level: 'warning',
      code: 'python-multi-env',
      message: `发现多个 Python 虚拟环境：${envs.join('、')}。`,
      repairSuggestion: '确认使用哪一个，删除废弃环境。Fleet 不会自动删除。',
    })
  }
  return { envs, diagnostics }
}

/**
 * 诊断工具能力里的多版本 / broken 状态，聚合成诊断列表。
 * 用于在 UI 详情抽屉里展示"哪些工具出了什么问题"。
 */
export function collectToolDiagnostics(tools: ToolCapability[]): ToolDiagnostic[] {
  const out: ToolDiagnostic[] = []
  for (const t of tools) {
    for (const d of t.diagnostics) {
      out.push({ ...d, message: `[${t.displayName}] ${d.message}` })
    }
  }
  return out
}

/**
 * 诊断可执行位缺失（`docs/28` §6 权限缺失）。
 * 只读 stat，不 chmod。
 */
export function diagnoseExecutableBit(absPath: string): ToolDiagnostic | null {
  try {
    const st = statSync(absPath)
    if (st.isDirectory()) {
      return {
        level: 'error',
        code: 'not-executable',
        message: `路径是目录而非可执行文件：${absPath}`,
        repairSuggestion: '检查路径是否指向正确的可执行文件。',
      }
    }
    // 检查可执行位（unix）
    if (process.platform !== 'win32') {
      try {
        accessSync(absPath, constants.X_OK)
      } catch {
        return {
          level: 'error',
          code: 'permission-missing',
          message: `文件存在但无可执行权限：${absPath}`,
          repairSuggestion: `运行 chmod +x "${absPath}"（需用户确认，Fleet 不会自动执行）。`,
        }
      }
    }
    return null
  } catch {
    return {
      level: 'error',
      code: 'path-not-found',
      message: `路径不存在：${absPath}`,
      repairSuggestion: '确认工具已安装或路径正确。',
    }
  }
}

/**
 * 诊断 App PATH 与终端 PATH 不一致（`docs/28` §6 / §2）。
 * 比较 process.env.PATH 与登录 shell PATH，给出提示。
 */
export function diagnosePathMismatch(
  appPath: string,
  loginShellPath: string | null,
): ToolDiagnostic | null {
  if (!loginShellPath) return null
  const appSet = new Set(appPath.split(process.platform === 'win32' ? ';' : ':').filter(Boolean))
  const shellDirs = loginShellPath.split(process.platform === 'win32' ? ';' : ':').filter(Boolean)
  const missing = shellDirs.filter((d) => !appSet.has(d))
  if (missing.length === 0) return null
  return {
    level: 'warning',
    code: 'path-mismatch',
    message: `App PATH 比登录 shell PATH 少 ${missing.length} 个目录：${missing.slice(0, 3).join('、')}${missing.length > 3 ? '…' : ''}。可能导致桌面启动时找不到某些工具。`,
    repairSuggestion: 'Fleet 探测时会自动 fallback 登录 shell PATH 并记录 resolvedPathEnv；运行工具时携带该 PATH。',
  }
}

/** lockfile → 包管理器名（UI 展示用）。 */
export function lockfileToPackageManager(lockfile: string): 'npm' | 'pnpm' | 'yarn' | 'bun' | undefined {
  return LOCKFILE_TO_PM[basename(lockfile)]
}
