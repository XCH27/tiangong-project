/**
 * System Tools 探测器（T-SYSTOOLS · `docs/28` §5）。
 *
 * 统一探测本机 CLI / runtime / sidecar / 浏览器 helper，避免各模块私自探测 PATH
 * （rule 28）。探测策略：
 *
 * 1. **system-path**：先在 `process.env.PATH` 里用 `which`/`where` 找。
 * 2. **login-shell-path fallback**：桌面 App 从 Finder 启动时 PATH 比终端短，
 *    `which codex` 找不到但终端里能跑（`docs/28` §1）。此时跑用户登录 shell 拿
 *    完整 PATH，合并后重试，并记录 `resolvedPathEnv` 供后续 spawn 携带。
 * 3. **well-known-path**：某些 CLI 装在 app bundle 内置位置不在 PATH（`docs/28` §2）。
 * 4. **version 验证**：不只看命令存在，跑 `--version`（或 `--help` 关键字）验证身份，
 *    避免撞名 shim（`docs/28` §2/§5.3）。
 * 5. **多版本**：`which -a` / `where` 拿多路径，诊断多版本冲突（`docs/28` §6）。
 *
 * 安全边界（rule 16/22）：
 * - `shell: false`、无 stdin、超时；探测可自动执行，不接 permission。
 * - 不读 token/密钥/登录态文件；不查额度；不启动交互式会话。
 * - 安装/改 PATH/写配置/修复命令**不在此处**——那需要 permission + timeline。
 *
 * 可测试性：spawn 经 `SpawnAdapter` 注入；测试用 mock，不真跑系统命令。
 */

import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import type {
  ToolCapability,
  ToolCategory,
  ToolDiagnostic,
  ToolRisk,
  ToolSource,
  ToolCapabilityTag,
} from '@craft-agent/shared/protocol'

/** 平台归一化。 */
export type DetectPlatform = 'win32' | 'darwin' | 'linux'

export function detectPlatform(): DetectPlatform {
  return process.platform as DetectPlatform
}

/**
 * spawn 适配器——把 `child_process.spawnSync` 抽象出来便于注入 mock。
 * 单个命令同步执行（探测本身是短命令，同步足够；避免并发探测把机器跑满）。
 */
export interface SpawnAdapter {
  /**
   * @param command  可执行文件名或绝对路径
   * @param args     参数
   * @param options  env / cwd / timeout（ms）
   */
  exec(
    command: string,
    args: string[],
    options: { env?: Record<string, string | undefined>; cwd?: string; timeout: number },
  ): SpawnSyncReturns<string>
}

/** 默认实现：真跑系统命令，`shell: false`，无 stdin，stdout/stderr 捕获为 utf-8。 */
export const defaultSpawnAdapter: SpawnAdapter = {
  exec(command, args, options) {
    return spawnSync(command, args, {
      shell: false,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeout,
      env: options.env,
      cwd: options.cwd,
      maxBuffer: 1024 * 64,
    })
  },
}

/** `which`/`where` 的归一化结果。 */
interface WhichResult {
  /** 全部命中路径（`which -a` / `where` 多行）。 */
  paths: string[]
  /** 当时生效的 PATH（用于 resolvedPathEnv）。 */
  pathEnv: string
  /** 失败原因（命令本身没装 / which 报错）。 */
  error?: string
}

/** Windows 可执行扩展名（`docs/28` §2：避免误选不可执行 shim）。 */
const WIN_EXTS = ['.exe', '.cmd', '.bat', '']

/**
 * 在给定 PATH 下查找命令的全部路径。
 * 用 `which -a`（unix）/ `where`（win32）。`shell: false` 时直接调 which/where 二进制。
 */
export function whichAll(
  command: string,
  platform: DetectPlatform,
  pathEnv: string,
  spawn: SpawnAdapter,
  timeout = 4000,
): WhichResult {
  const env = { ...process.env, PATH: pathEnv }
  if (platform === 'win32') {
    const res = spawn.exec('where', [command], { env, timeout })
    if (res.error || res.status !== 0) {
      return { paths: [], pathEnv, error: String(res.error?.message ?? res.stderr ?? 'not found') }
    }
    const paths = (res.stdout ?? '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)
    return { paths, pathEnv }
  }
  // unix: `which -a` 列出全部命中
  const res = spawn.exec('which', ['-a', command], { env, timeout })
  if (res.error || res.status !== 0) {
    return { paths: [], pathEnv, error: String(res.error?.message ?? res.stderr ?? 'not found') }
  }
  const paths = (res.stdout ?? '')
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  return { paths, pathEnv }
}

/**
 * 拿登录 shell 的完整 PATH（`docs/28` §2/§6）。
 * macOS/Linux：`zsh -l -c 'echo $PATH'` / `bash -l -c 'echo $PATH'`。
 * Windows：无登录 shell 概念，返回 null。
 */
export function getLoginShellPath(
  platform: DetectPlatform,
  spawn: SpawnAdapter,
  timeout = 4000,
  shellOverride?: string,
): string | null {
  if (platform === 'win32') return null
  const shell = shellOverride ?? process.env.SHELL ?? (platform === 'darwin' ? '/bin/zsh' : '/bin/bash')
  const res = spawn.exec(shell, ['-l', '-c', 'printf %s "$PATH"'], { timeout })
  if (res.error || res.status !== 0) return null
  const p = (res.stdout ?? '').trim()
  return p ? p : null
}

/** 合并两个 PATH，去重保留顺序。 */
export function mergePath(primary: string, fallback: string | null): string {
  if (!fallback) return primary
  const seen = new Set<string>()
  const out: string[] = []
  for (const dir of primary.split(platformPathSep()).filter(Boolean)) {
    if (!seen.has(dir)) {
      seen.add(dir)
      out.push(dir)
    }
  }
  for (const dir of fallback.split(platformPathSep()).filter(Boolean)) {
    if (!seen.has(dir)) {
      seen.add(dir)
      out.push(dir)
    }
  }
  return out.join(platformPathSep())
}

function platformPathSep(): string {
  return process.platform === 'win32' ? ';' : ':'
}

/** 版本探测结果。 */
interface VersionResult {
  version?: string
  /** stderr 末尾若干行，用于 diagnostics。 */
  stderrTail?: string
  /** 验证是否通过（跑通了且匹配到版本或 help 关键字）。 */
  ok: boolean
  /** 失败原因。 */
  error?: string
}

/**
 * 跑 `command --version`（或备用 args）解析版本。
 * 若主 args 没匹配到版本，尝试 helpArgs 跑 `--help` 并在输出里找 identityKeyword。
 */
export function detectVersion(
  command: string,
  spawn: SpawnAdapter,
  opts: {
    versionArgs?: string[]
    versionRegex?: RegExp
    helpArgs?: string[]
    identityKeyword?: string
    env?: Record<string, string | undefined>
    timeout?: number
  } = {},
): VersionResult {
  const timeout = opts.timeout ?? 5000
  const env = opts.env ?? process.env
  const tryParse = (stdout: string, stderr: string): string | undefined => {
    const text = `${stdout}\n${stderr}`
    if (opts.versionRegex) {
      const m = text.match(opts.versionRegex)
      if (m) return m[1] ?? m[0]
    }
    return undefined
  }

  if (opts.versionArgs && opts.versionArgs.length > 0) {
    const res = spawn.exec(command, opts.versionArgs, { env, timeout })
    if (res.error) {
      return { ok: false, error: String(res.error.message) }
    }
    const stdout = res.stdout ?? ''
    const stderr = res.stderr ?? ''
    const version = tryParse(stdout, stderr)
    if (version) return { version, ok: true, stderrTail: tail(stderr) }
    // 版本命令跑通但没匹配到——可能是不标准输出，继续试 help
    if (res.status === 0 && !opts.identityKeyword) {
      return { ok: true, stderrTail: tail(stderr) }
    }
  }

  if (opts.helpArgs && opts.helpArgs.length > 0 && opts.identityKeyword) {
    const res = spawn.exec(command, opts.helpArgs, { env, timeout })
    if (res.error) {
      return { ok: false, error: String(res.error.message) }
    }
    const text = `${res.stdout ?? ''}\n${res.stderr ?? ''}`
    if (text.toLowerCase().includes(opts.identityKeyword.toLowerCase())) {
      return { ok: true, stderrTail: tail(res.stderr ?? '') }
    }
    return { ok: false, error: `identity keyword "${opts.identityKeyword}" not found in --help output` }
  }

  return { ok: false, error: 'no version args and no help fallback' }
}

function tail(s: string, maxLines = 4, maxLen = 400): string {
  const lines = s.split(/\r?\n/).filter(Boolean).slice(-maxLines)
  const joined = lines.join('\n')
  return joined.length > maxLen ? joined.slice(-maxLen) : joined
}

/** 单个工具的探测器定义。 */
export interface ToolDetectorDef {
  toolId: string
  category: ToolCategory
  displayName: string
  capabilities: ToolCapabilityTag[]
  risk: ToolRisk
  /** 命令名（which 查找用）。 */
  command: string
  /** 优先级（同类越小越优先）。 */
  priority?: number
  /** `--version` 参数。 */
  versionArgs?: string[]
  /** 版本正则（第一个捕获组为版本号）。 */
  versionRegex?: RegExp
  /** `--help` 兜底验证。 */
  helpArgs?: string[]
  identityKeyword?: string
  /** well-known 安装路径（绝对路径，不依赖 PATH）。 */
  wellKnownPaths?: string[]
  /** 该工具被哪些 Fleet 功能依赖。 */
  usedBy?: string[]
  /** 仅在这些平台适用；不列 = 全平台。 */
  platforms?: DetectPlatform[]
}

/**
 * v1 内置探测器集合（`docs/28` §5.2/§5.3/§5.4）。
 * 顺序仅作可读性；registry 按 category/priority 组织。
 */
export const BUILTIN_DETECTORS: ToolDetectorDef[] = [
  // ── 基础运行时（§5.2）─────────────────────────────────────────────
  {
    toolId: 'node',
    category: 'runtime',
    displayName: 'Node.js',
    capabilities: ['run-js'],
    risk: 'local-exec',
    command: 'node',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /v?(\d+\.\d+\.\d+)/,
    usedBy: ['sidecar 启动', 'electron 开发'],
  },
  {
    toolId: 'npm',
    category: 'package-manager',
    displayName: 'npm',
    capabilities: ['package-install'],
    risk: 'network',
    command: 'npm',
    priority: 3,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    usedBy: ['依赖安装'],
  },
  {
    toolId: 'pnpm',
    category: 'package-manager',
    displayName: 'pnpm',
    capabilities: ['package-install'],
    risk: 'network',
    command: 'pnpm',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    usedBy: ['依赖安装', 'app 构建'],
  },
  {
    toolId: 'bun',
    category: 'runtime',
    displayName: 'Bun',
    capabilities: ['run-js', 'package-install'],
    risk: 'local-exec',
    command: 'bun',
    priority: 2,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    usedBy: ['app 构建', 'sidecar'],
  },
  {
    toolId: 'python',
    category: 'runtime',
    displayName: 'Python',
    capabilities: ['run-python'],
    risk: 'local-exec',
    command: 'python3',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /Python\s+(\d+\.\d+\.\d+)/,
    usedBy: ['markitdown', 'doc 转换'],
    // python3 优先；某些 win32 只有 python
  },
  {
    toolId: 'python-launcher',
    category: 'runtime',
    displayName: 'Python (python)',
    capabilities: ['run-python'],
    risk: 'local-exec',
    command: 'python',
    priority: 2,
    versionArgs: ['--version'],
    versionRegex: /Python\s+(\d+\.\d+\.\d+)/,
    usedBy: ['markitdown', 'doc 转换'],
    platforms: ['win32'],
  },
  {
    toolId: 'uv',
    category: 'package-manager',
    displayName: 'uv',
    capabilities: ['package-install'],
    risk: 'network',
    command: 'uv',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /uv\s+(\d+\.\d+\.\d+)/,
    usedBy: ['python 环境管理'],
  },
  {
    toolId: 'pip',
    category: 'package-manager',
    displayName: 'pip',
    capabilities: ['package-install'],
    risk: 'network',
    command: 'pip3',
    priority: 2,
    versionArgs: ['--version'],
    versionRegex: /pip\s+(\d+\.\d+\.\d+)/,
    usedBy: ['python 依赖'],
  },
  {
    toolId: 'git',
    category: 'runtime',
    displayName: 'Git',
    capabilities: ['version-control'],
    risk: 'local-exec',
    command: 'git',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /git version\s+(\d+\.\d+\.\d+)/,
    usedBy: ['版本控制', '项目环境'],
  },

  // ── 搜索与代码理解（§5.4）─────────────────────────────────────────
  {
    toolId: 'rg',
    category: 'search',
    displayName: 'ripgrep',
    capabilities: ['search-content'],
    risk: 'read-only',
    command: 'rg',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /ripgrep\s+(\d+\.\d+\.\d+)/,
    usedBy: ['代码搜索', '上下文压缩'],
  },
  {
    toolId: 'fd',
    category: 'search',
    displayName: 'fd',
    capabilities: ['search-files'],
    risk: 'read-only',
    command: 'fd',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /fd\s+(\d+\.\d+\.\d+)/,
    usedBy: ['文件搜索'],
  },

  // ── CLI Agent / ACP Runtime（§5.3）───────────────────────────────
  // 只检测二进制存在 + 身份验证；不读 token/不查额度/不启动交互会话。
  {
    toolId: 'grok-cli',
    category: 'cli-agent',
    displayName: 'Grok CLI',
    capabilities: ['acp-stdio'],
    risk: 'network',
    command: 'grok',
    priority: 1,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    helpArgs: ['--help'],
    identityKeyword: 'grok',
    usedBy: ['CLI Runtime'],
  },
  {
    toolId: 'hermes-cli',
    category: 'cli-agent',
    displayName: 'Hermes CLI',
    capabilities: ['acp-stdio'],
    risk: 'network',
    command: 'hermes',
    priority: 2,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    helpArgs: ['--help'],
    identityKeyword: 'hermes',
    usedBy: ['CLI Runtime'],
  },
  {
    toolId: 'opencode-cli',
    category: 'cli-agent',
    displayName: 'OpenCode CLI',
    capabilities: ['acp-stdio'],
    risk: 'network',
    command: 'opencode',
    priority: 3,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    helpArgs: ['--help'],
    identityKeyword: 'opencode',
    usedBy: ['CLI Runtime'],
  },
  {
    toolId: 'gemini-cli',
    category: 'cli-agent',
    displayName: 'Gemini CLI',
    capabilities: ['acp-stdio'],
    risk: 'network',
    command: 'gemini',
    priority: 4,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    helpArgs: ['--help'],
    identityKeyword: 'gemini',
    usedBy: ['CLI Runtime'],
  },
  {
    toolId: 'codex-cli',
    category: 'cli-agent',
    displayName: 'Codex CLI',
    capabilities: ['acp-stdio'],
    risk: 'network',
    command: 'codex',
    priority: 5,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    helpArgs: ['--help'],
    identityKeyword: 'codex',
    usedBy: ['CLI Runtime'],
  },
  {
    toolId: 'claude-cli',
    category: 'cli-agent',
    displayName: 'Claude CLI',
    capabilities: ['acp-stdio'],
    risk: 'network',
    command: 'claude',
    priority: 6,
    versionArgs: ['--version'],
    versionRegex: /(\d+\.\d+\.\d+)/,
    helpArgs: ['--help'],
    identityKeyword: 'claude',
    usedBy: ['CLI Runtime'],
  },
]

/**
 * 运行单个探测器，产出 `ToolCapability`。
 * 这是探测的唯一入口——所有工具都经此走 PATH → login-shell fallback → well-known → version 验证。
 */
export function runDetector(
  def: ToolDetectorDef,
  opts: {
    platform?: DetectPlatform
    spawn?: SpawnAdapter
    /** 覆盖 process.env.PATH 起点。 */
    initialPath?: string
    /** 已缓存的 login shell PATH，避免每次重跑。 */
    loginShellPath?: string | null
  } = {},
): ToolCapability {
  const platform = opts.platform ?? detectPlatform()
  const spawn = opts.spawn ?? defaultSpawnAdapter
  const initialPath = opts.initialPath ?? process.env.PATH ?? ''
  const now = Date.now()

  // 平台不适用 → unknown
  if (def.platforms && !def.platforms.includes(platform)) {
    return {
      toolId: def.toolId,
      category: def.category,
      displayName: def.displayName,
      status: 'unknown',
      source: 'system-path',
      scope: 'global',
      capabilities: def.capabilities,
      risk: def.risk,
      priority: def.priority,
      lastCheckedAt: now,
      diagnostics: [
        { level: 'info', code: 'platform-not-applicable', message: `Not applicable on ${platform}` },
      ],
      usedBy: def.usedBy,
    }
  }

  const diagnostics: ToolDiagnostic[] = []

  // 1) system-path
  const primary = whichAll(def.command, platform, initialPath, spawn)
  let paths = primary.paths
  let resolvedPathEnv: string | undefined
  let source: ToolSource = 'system-path'

  // 2) login-shell-path fallback
  if (paths.length === 0) {
    const loginPath = opts.loginShellPath !== undefined ? opts.loginShellPath : getLoginShellPath(platform, spawn)
    if (loginPath) {
      const merged = mergePath(initialPath, loginPath)
      const again = whichAll(def.command, platform, merged, spawn)
      if (again.paths.length > 0) {
        paths = again.paths
        resolvedPathEnv = merged
        source = 'login-shell-path'
        diagnostics.push({
          level: 'warning',
          code: 'path-mismatch',
          message:
            'App PATH 与终端 PATH 不一致；已从登录 shell PATH 找到，运行时将携带该 PATH。',
          repairSuggestion:
            '可把工具路径加入 App 启动 PATH，或通过 Fleet 设置手动指定路径（未接入）。',
        })
      }
    }
  }

  // 3) well-known-path fallback
  if (paths.length === 0 && def.wellKnownPaths && def.wellKnownPaths.length > 0) {
    for (const candidate of def.wellKnownPaths) {
      // 用 version 命令验证 well-known 路径是否真能跑
      const v = detectVersion(candidate, spawn, {
        versionArgs: def.versionArgs,
        versionRegex: def.versionRegex,
        helpArgs: def.helpArgs,
        identityKeyword: def.identityKeyword,
        timeout: 5000,
      })
      if (v.ok) {
        paths = [candidate]
        source = 'well-known-path'
        resolvedPathEnv = undefined
        const cap: ToolCapability = {
          toolId: def.toolId,
          category: def.category,
          displayName: def.displayName,
          status: v.version ? 'available' : 'available',
          version: v.version,
          path: candidate,
          source,
          scope: 'global',
          capabilities: def.capabilities,
          risk: def.risk,
          priority: def.priority,
          lastCheckedAt: now,
          diagnostics,
          usedBy: def.usedBy,
        }
        return cap
      }
    }
  }

  // 4) 没找到 → missing
  if (paths.length === 0) {
    diagnostics.push({
      level: 'error',
      code: 'not-on-path',
      message: `未在 PATH（含登录 shell fallback）中找到 ${def.command}。`,
      repairSuggestion: `安装 ${def.displayName} 或把它加入 PATH。Fleet 不会自动安装。`,
    })
    return {
      toolId: def.toolId,
      category: def.category,
      displayName: def.displayName,
      status: 'missing',
      source,
      scope: 'global',
      capabilities: def.capabilities,
      risk: def.risk,
      priority: def.priority,
      lastCheckedAt: now,
      diagnostics,
      usedBy: def.usedBy,
    }
  }

  // 5) version 验证（用第一个命中路径）
  const execPath = paths[0]!
  const versionEnv = resolvedPathEnv ? { ...process.env, PATH: resolvedPathEnv } : process.env
  const v = detectVersion(execPath, spawn, {
    versionArgs: def.versionArgs,
    versionRegex: def.versionRegex,
    helpArgs: def.helpArgs,
    identityKeyword: def.identityKeyword,
    env: versionEnv,
    timeout: 5000,
  })

  // 6) 多版本冲突诊断
  if (paths.length > 1) {
    diagnostics.push({
      level: 'warning',
      code: 'multi-version',
      message: `发现 ${paths.length} 个 ${def.command}：${paths.join(' | ')}。当前使用 ${execPath}。`,
      repairSuggestion: '若项目要求特定版本，请在项目环境 Profile 中指定（未接入）。',
    })
  }

  if (!v.ok) {
    diagnostics.push({
      level: 'error',
      code: 'version-verify-failed',
      message: `命令存在但身份验证失败：${v.error ?? '未知'}${v.stderrTail ? `；stderr: ${v.stderrTail}` : ''}`,
      repairSuggestion: '可能是撞名 shim 或依赖缺失（如 env node not found）。请检查该路径是否可执行。',
    })
    return {
      toolId: def.toolId,
      category: def.category,
      displayName: def.displayName,
      status: 'broken',
      path: execPath,
      version: v.version,
      resolvedPathEnv,
      source,
      scope: 'global',
      capabilities: def.capabilities,
      risk: def.risk,
      priority: def.priority,
      lastCheckedAt: now,
      diagnostics,
      usedBy: def.usedBy,
    }
  }

  // 7) available（可能带 multi-version warning → 视为 conflict）
  const status = paths.length > 1 ? 'conflict' : 'available'
  return {
    toolId: def.toolId,
    category: def.category,
    displayName: def.displayName,
    status,
    path: execPath,
    version: v.version,
    resolvedPathEnv,
    source,
    scope: 'global',
    capabilities: def.capabilities,
    risk: def.risk,
    priority: def.priority,
    lastCheckedAt: now,
    diagnostics,
    usedBy: def.usedBy,
  }
}
