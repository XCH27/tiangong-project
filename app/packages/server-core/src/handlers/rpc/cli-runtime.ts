import { access, lstat, stat } from 'fs/promises'
import { constants as fsConstants } from 'fs'
import { delimiter, join } from 'path'
import { spawn } from 'child_process'
import { homedir } from 'os'
import {
  RPC_CHANNELS,
  type CliRuntimeDetectResult,
  type CliRuntimeId,
  type CliRuntimeProbeResult,
  type CliRuntimeFailureReason,
} from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'

const DEFAULT_TIMEOUT_MS = 5_000
const DEFAULT_OUTPUT_LIMIT = 16_384

interface CliRuntimeToolDef {
  id: CliRuntimeId
  command: string
  commands?: readonly string[]
  displayName: string
  versionArgs: string[]
  configDirs: (homeDir: string) => string[]
}

export const CLI_RUNTIME_TOOLS: readonly CliRuntimeToolDef[] = [
  {
    id: 'aionrs',
    command: 'aionrs',
    commands: ['aionrs', 'aion'],
    displayName: 'Aion CLI',
    versionArgs: ['--version'],
    configDirs: home => [
      join(home, '.aionui'),
      join(home, '.config', 'aionui'),
      join(home, 'Library', 'Application Support', 'AionUi'),
    ],
  },
  {
    id: 'claude',
    command: 'claude',
    displayName: 'Claude Code',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.claude')],
  },
  {
    id: 'codex',
    command: 'codex',
    displayName: 'Codex CLI',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.codex')],
  },
  {
    id: 'qwen',
    command: 'qwen',
    displayName: 'Qwen CLI',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.qwen')],
  },
  {
    id: 'opencode',
    command: 'opencode',
    displayName: 'OpenCode',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.opencode'), join(home, '.config', 'opencode')],
  },
  {
    id: 'cursor',
    command: 'cursor',
    displayName: 'Cursor CLI',
    versionArgs: ['agent', '--version'],
    configDirs: home => [
      join(home, '.cursor'),
      join(home, '.config', 'Cursor'),
      join(home, 'Library', 'Application Support', 'Cursor'),
    ],
  },
  {
    id: 'antigravity',
    command: 'agy',
    displayName: 'Antigravity',
    versionArgs: ['--version'],
    configDirs: home => [
      join(home, '.antigravity'),
      join(home, '.config', 'antigravity'),
      join(home, 'Library', 'Application Support', 'Antigravity'),
    ],
  },
  {
    id: 'hermes',
    command: 'hermes',
    displayName: 'Hermes Agent',
    versionArgs: ['--version'],
    configDirs: home => [
      join(home, '.hermes'),
      join(home, '.config', 'hermes'),
      join(home, 'Library', 'Application Support', 'Hermes'),
    ],
  },
  {
    id: 'openclaw',
    command: 'openclaw',
    displayName: 'OpenClaw',
    versionArgs: ['--version'],
    configDirs: home => [
      join(home, '.openclaw'),
      join(home, '.config', 'openclaw'),
      join(home, 'Library', 'Application Support', 'OpenClaw'),
    ],
  },
  {
    id: 'grok',
    command: 'grok',
    displayName: 'Grok Build',
    versionArgs: ['--version'],
    configDirs: home => [
      join(home, '.grok'),
      join(home, '.config', 'grok'),
      join(home, 'Library', 'Application Support', 'Grok'),
    ],
  },
  {
    id: 'goose',
    command: 'goose',
    displayName: 'Goose AI',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.config', 'goose'), join(home, '.goose')],
  },
  {
    id: 'codebuddy',
    command: 'codebuddy',
    displayName: 'CodeBuddy',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.codebuddy'), join(home, '.config', 'codebuddy')],
  },
  {
    id: 'kimi',
    command: 'kimi',
    displayName: 'Kimi CLI',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.kimi'), join(home, '.config', 'kimi')],
  },
  {
    id: 'droid',
    command: 'droid',
    displayName: 'Factory Droid',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.droid'), join(home, '.factory'), join(home, '.config', 'droid')],
  },
  {
    id: 'auggie',
    command: 'auggie',
    displayName: 'Augment Code',
    versionArgs: ['--version'],
    configDirs: home => [
      join(home, '.auggie'),
      join(home, '.augment'),
      join(home, '.config', 'augment'),
      join(home, 'Library', 'Application Support', 'Augment'),
    ],
  },
  {
    id: 'copilot',
    command: 'copilot',
    displayName: 'GitHub Copilot',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.copilot'), join(home, '.config', 'github-copilot')],
  },
  {
    id: 'qoder',
    command: 'qoder',
    displayName: 'Qoder CLI',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.qoder'), join(home, '.config', 'qoder')],
  },
  {
    id: 'vibe',
    command: 'vibe',
    displayName: 'Mistral Vibe',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.vibe'), join(home, '.mistral'), join(home, '.config', 'vibe')],
  },
  {
    id: 'nanobot',
    command: 'nanobot',
    displayName: 'Nanobot',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.nanobot'), join(home, '.config', 'nanobot')],
  },
  {
    id: 'snow',
    command: 'snow',
    displayName: 'Snow CLI',
    versionArgs: ['--version'],
    configDirs: home => [join(home, '.snow'), join(home, '.config', 'snow')],
  },
] as const

export interface DetectCliRuntimesOptions {
  env?: NodeJS.ProcessEnv
  homeDir?: string
  platform?: NodeJS.Platform
  timeoutMs?: number
  outputLimit?: number
  now?: () => number
  tools?: readonly CliRuntimeToolDef[]
}

interface ProbeVersionResult {
  exitCode: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  durationMs: number
}

interface ResolveCommandPathOptions {
  homeDir?: string
  includeFallbackDirs?: boolean
}

function appendLimited(current: string, chunk: Buffer, limit: number): string {
  if (current.length >= limit) return current
  const next = current + chunk.toString('utf8')
  return next.length > limit ? next.slice(0, limit) : next
}

function commandCandidates(command: string, platform: NodeJS.Platform, env: NodeJS.ProcessEnv): string[] {
  if (platform !== 'win32') return [command]
  if (/\.[^\\/]+$/.test(command)) return [command]
  const pathext = env.PATHEXT || '.COM;.EXE;.BAT;.CMD'
  return pathext
    .split(';')
    .filter(Boolean)
    .map(ext => `${command}${ext.toLowerCase()}`)
}

async function isExecutable(path: string, platform: NodeJS.Platform): Promise<boolean> {
  try {
    const mode = platform === 'win32' ? fsConstants.F_OK : fsConstants.X_OK
    await access(path, mode)
    return true
  } catch {
    return false
  }
}

function fallbackPathDirs(homeDir: string, platform: NodeJS.Platform): string[] {
  const homeDirs = [
    join(homeDir, '.local', 'bin'),
    join(homeDir, '.bun', 'bin'),
    join(homeDir, '.cargo', 'bin'),
    join(homeDir, '.npm-global', 'bin'),
    join(homeDir, '.yarn', 'bin'),
    join(homeDir, '.opencode', 'bin'),
    join(homeDir, '.antigravity-ide', 'antigravity-ide', 'bin'),
    join(homeDir, '.grok', 'bin'),
    join(homeDir, '.aionui', 'bin'),
    join(homeDir, '.aion', 'bin'),
    join(homeDir, '.goose', 'bin'),
    join(homeDir, '.codebuddy', 'bin'),
    join(homeDir, '.kimi', 'bin'),
    join(homeDir, '.droid', 'bin'),
    join(homeDir, '.augment', 'bin'),
    join(homeDir, '.qoder', 'bin'),
    join(homeDir, '.vibe', 'bin'),
    join(homeDir, '.nanobot', 'bin'),
    join(homeDir, '.snow', 'bin'),
  ]

  if (platform === 'win32') return homeDirs

  return [
    ...homeDirs,
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ]
}

function uniquePathDirs(dirs: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const dir of dirs) {
    if (!dir || seen.has(dir)) continue
    seen.add(dir)
    unique.push(dir)
  }
  return unique
}

function getSearchPathDirs(
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  options: ResolveCommandPathOptions = {},
): string[] {
  const pathValue = env.PATH || env.Path || env.path || ''
  const dirs = pathValue.split(delimiter).filter(Boolean)

  if (options.includeFallbackDirs && options.homeDir) {
    dirs.push(...fallbackPathDirs(options.homeDir, platform))
  }

  return uniquePathDirs(dirs)
}

async function isBrokenSymlink(path: string): Promise<boolean> {
  try {
    const info = await lstat(path)
    if (!info.isSymbolicLink()) return false
  } catch {
    return false
  }

  try {
    await stat(path)
    return false
  } catch {
    return true
  }
}

async function findBrokenCommandLink(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  options: ResolveCommandPathOptions = {},
): Promise<string | null> {
  const dirs = getSearchPathDirs(env, platform, options)
  const candidates = commandCandidates(command, platform, env)

  for (const dir of dirs) {
    for (const candidate of candidates) {
      const fullPath = join(dir, candidate)
      if (await isBrokenSymlink(fullPath)) return fullPath
    }
  }

  return null
}

export async function resolveCommandPath(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
  options: ResolveCommandPathOptions = {},
): Promise<string | null> {
  const dirs = getSearchPathDirs(env, platform, options)
  const candidates = commandCandidates(command, platform, env)

  for (const dir of dirs) {
    for (const candidate of candidates) {
      const fullPath = join(dir, candidate)
      if (await isExecutable(fullPath, platform)) return fullPath
    }
  }

  return null
}

async function probeVersion(
  commandPath: string,
  args: string[],
  options: Required<Pick<DetectCliRuntimesOptions, 'env' | 'homeDir' | 'timeoutMs' | 'outputLimit'>>,
): Promise<ProbeVersionResult> {
  const startedAt = Date.now()
  const probeEnv = {
    ...options.env,
    CI: options.env.CI ?? '1',
    NO_COLOR: options.env.NO_COLOR ?? '1',
    HERMES_NO_UPDATE_CHECK: options.env.HERMES_NO_UPDATE_CHECK ?? '1',
  }

  return await new Promise<ProbeVersionResult>((resolve) => {
    let stdout = ''
    let stderr = ''
    let settled = false

    const child = spawn(commandPath, args, {
      cwd: options.homeDir,
      env: probeEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    })

    const finish = (result: Omit<ProbeVersionResult, 'durationMs'>) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve({ ...result, durationMs: Date.now() - startedAt })
    }

    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      finish({ exitCode: null, stdout, stderr, timedOut: true })
    }, options.timeoutMs)

    child.stdout?.on('data', chunk => {
      stdout = appendLimited(stdout, chunk, options.outputLimit)
    })

    child.stderr?.on('data', chunk => {
      stderr = appendLimited(stderr, chunk, options.outputLimit)
    })

    child.on('error', error => {
      stderr = appendLimited(stderr, Buffer.from(error.message), options.outputLimit)
      finish({ exitCode: null, stdout, stderr, timedOut: false })
    })

    child.on('close', code => {
      finish({ exitCode: code, stdout, stderr, timedOut: false })
    })
  })
}

async function getConfigDirStatuses(paths: string[]): Promise<CliRuntimeProbeResult['configDirs']> {
  return await Promise.all(paths.map(async path => {
    try {
      const info = await stat(path)
      return { path, exists: info.isDirectory() }
    } catch {
      return { path, exists: false }
    }
  }))
}

function candidateToolCommands(tool: CliRuntimeToolDef): readonly string[] {
  if (!tool.commands?.length) return [tool.command]
  return uniquePathDirs([tool.command, ...tool.commands])
}

async function resolveToolCommand(
  tool: CliRuntimeToolDef,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform,
  options: ResolveCommandPathOptions,
): Promise<{ command: string; resolvedPath: string } | { command: string; brokenLinkPath?: string }> {
  const commands = candidateToolCommands(tool)
  const brokenLinks: Array<{ command: string; path: string }> = []

  for (const command of commands) {
    const resolvedPath = await resolveCommandPath(command, env, platform, options)
    if (resolvedPath) return { command, resolvedPath }

    const brokenLinkPath = await findBrokenCommandLink(command, env, platform, options)
    if (brokenLinkPath) brokenLinks.push({ command, path: brokenLinkPath })
  }

  const broken = brokenLinks[0]
  return broken ? { command: broken.command, brokenLinkPath: broken.path } : { command: tool.command }
}

function normalizeVersion(stdout: string, stderr: string): string | undefined {
  const text = `${stdout}\n${stderr}`
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean)
  return text || undefined
}

function failureReasonFromProbe(probe: ProbeVersionResult): CliRuntimeFailureReason {
  if (probe.timedOut) return 'timeout'
  if (probe.exitCode !== 0) return 'version_failed'
  return 'unknown'
}

export async function detectCliRuntimes(options: DetectCliRuntimesOptions = {}): Promise<CliRuntimeDetectResult> {
  const env = options.env ?? process.env
  const homeDir = options.homeDir ?? homedir()
  const platform = options.platform ?? process.platform
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const outputLimit = options.outputLimit ?? DEFAULT_OUTPUT_LIMIT
  const now = options.now ?? Date.now
  const tools = options.tools ?? CLI_RUNTIME_TOOLS
  const checkedAt = now()

  const results = await Promise.all(tools.map(async tool => {
    const configDirs = await getConfigDirStatuses(tool.configDirs(homeDir))
    const resolveOptions = { homeDir, includeFallbackDirs: true }
    const commandResolution = await resolveToolCommand(tool, env, platform, resolveOptions)

    if (!('resolvedPath' in commandResolution)) {
      return {
        id: tool.id,
        command: commandResolution.command,
        displayName: tool.displayName,
        available: false,
        resolvedPath: commandResolution.brokenLinkPath ?? undefined,
        configDirs,
        failureReason: commandResolution.brokenLinkPath ? 'broken_link' : 'not_found',
        checkedAt,
      } satisfies CliRuntimeProbeResult
    }

    const probe = await probeVersion(commandResolution.resolvedPath, tool.versionArgs, {
      env,
      homeDir,
      timeoutMs,
      outputLimit,
    })

    const probeSucceeded = probe.exitCode === 0 && !probe.timedOut
    const version = probeSucceeded ? normalizeVersion(probe.stdout, probe.stderr) : undefined

    return {
      id: tool.id,
      command: commandResolution.command,
      displayName: tool.displayName,
      available: true,
      resolvedPath: commandResolution.resolvedPath,
      version,
      configDirs,
      failureReason: probeSucceeded ? undefined : failureReasonFromProbe(probe),
      stderr: probe.stderr.trim() || undefined,
      durationMs: probe.durationMs,
      checkedAt,
    } satisfies CliRuntimeProbeResult
  }))

  return { checkedAt, tools: results }
}

export const CLI_RUNTIME_HANDLED_CHANNELS = [
  RPC_CHANNELS.cliRuntime.DETECT,
] as const

export function registerCliRuntimeHandlers(server: RpcServer): void {
  server.handle(RPC_CHANNELS.cliRuntime.DETECT, async () => {
    return await detectCliRuntimes()
  })
}
