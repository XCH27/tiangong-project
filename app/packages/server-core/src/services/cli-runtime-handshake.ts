import { execFile, spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type {
  CliRuntimeHandshake,
  CliRuntimeModelCapability,
} from '@craft-agent/shared/protocol'

const execFileAsync = promisify(execFile)
const TIMEOUT_MS = 12_000

/**
 * Resolve a command before running it.
 *
 * Every probe below used to call `execFile('claude', …)` with a bare name. A
 * desktop app launched from Finder or the Dock does not inherit the shell PATH,
 * so anyone who installed through nvm, fnm, mise, asdf, volta or Homebrew-on-ARM
 * was told the tool is not installed while it sat in their terminal. This is the
 * single most common false negative on this page (Decision H8).
 *
 * Order is deliberate: the inherited PATH first because it is free, then the
 * login shell because it reflects the version manager's current selection, then
 * well-known locations, which may be a shim for a version the user removed.
 */
const resolvedCommands = new Map<string, string | null>()

async function resolveCommand(command: string): Promise<string | null> {
  const cached = resolvedCommands.get(command)
  if (cached !== undefined) return cached

  const resolved = await findCommand(command)
  resolvedCommands.set(command, resolved)
  return resolved
}

async function findCommand(command: string): Promise<string | null> {
  const which = process.platform === 'win32' ? 'where' : 'which'
  try {
    const result = await execFileAsync(which, [command], { encoding: 'utf8', timeout: 3_000 })
    const first = result.stdout.split(/\r?\n/).find((line) => line.trim())
    if (first) return first.trim()
  } catch {
    // Not on the inherited PATH; that is the common case, not an error.
  }

  if (process.platform !== 'win32') {
    // A login shell sources the user's profile, which is where a version manager
    // puts its shims.
    const shell = process.env.SHELL || '/bin/zsh'
    try {
      const result = await execFileAsync(shell, ['-l', '-c', `command -v ${command}`], {
        encoding: 'utf8',
        timeout: 5_000,
      })
      const found = result.stdout.trim()
      if (found) return found
    } catch {
      // Fall through to the guessed locations.
    }
  }

  const home = homedir()
  for (const candidate of [
    join(home, '.local/bin', command),
    join(home, '.bun/bin', command),
    join(home, '.volta/bin', command),
    join(home, '.cargo/bin', command),
    `/opt/homebrew/bin/${command}`,
    `/usr/local/bin/${command}`,
    join(home, '.npm-global/bin', command),
  ]) {
    try {
      await execFileAsync(candidate, ['--version'], { encoding: 'utf8', timeout: 3_000 })
      return candidate
    } catch {
      // Keep looking.
    }
  }

  return null
}

function cleanVersion(output: string): string | undefined {
  const value = output.trim()
  return value || undefined
}

async function versionOf(command: string): Promise<string | undefined> {
  const resolved = await resolveCommand(command)
  if (!resolved) throw new Error(`${command} not found`)
  const result = await execFileAsync(resolved, ['--version'], {
    encoding: 'utf8',
    timeout: 5_000,
    maxBuffer: 64_000,
  })
  return cleanVersion(`${result.stdout}${result.stderr}`)
}

export function parseOpenCodeVerboseModels(
  output: string,
): CliRuntimeModelCapability[] {
  const lines = output.split(/\r?\n/)
  const models: CliRuntimeModelCapability[] = []
  for (let index = 0; index < lines.length; index += 1) {
    const qualifiedId = lines[index]?.trim()
    if (!qualifiedId || qualifiedId.startsWith('{')) continue
    if (lines[index + 1]?.trim() !== '{') continue

    let depth = 0
    const jsonLines: string[] = []
    for (index += 1; index < lines.length; index += 1) {
      const line = lines[index] ?? ''
      jsonLines.push(line)
      for (const character of line) {
        if (character === '{') depth += 1
        if (character === '}') depth -= 1
      }
      if (depth === 0) break
    }

    try {
      const parsed = JSON.parse(jsonLines.join('\n')) as {
        name?: string
        limit?: { context?: number }
        capabilities?: {
          reasoning?: boolean
          input?: Record<string, boolean>
        }
        variants?: Record<string, unknown>
      }
      const input = parsed.capabilities?.input ?? {}
      const modalities = Object.entries(input)
        .filter(([, supported]) => supported)
        .map(([name]) => name)
        .filter(
          (name): name is CliRuntimeModelCapability['inputModalities'][number] =>
            ['text', 'image', 'audio', 'video', 'pdf'].includes(name),
        )
      models.push({
        id: qualifiedId,
        name: parsed.name ?? qualifiedId,
        contextWindow: parsed.limit?.context,
        supportedReasoningEfforts: parsed.capabilities?.reasoning
          ? Object.keys(parsed.variants ?? {})
          : [],
        inputModalities: modalities.length > 0 ? modalities : ['text'],
      })
    } catch {
      // One malformed plugin model must not discard the remaining catalog.
    }
  }
  return models
}

async function probeOpenCode(): Promise<CliRuntimeHandshake> {
  const version = await versionOf('opencode')
  const resolved = await resolveCommand('opencode')
  if (!resolved) throw new Error('opencode not found')
  const result = await execFileAsync(resolved, ['models', '--verbose'], {
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    maxBuffer: 8_000_000,
  })
  const models = parseOpenCodeVerboseModels(result.stdout)
  return {
    id: 'opencode',
    name: 'OpenCode',
    version,
    status: models.length > 0 ? 'ready' : 'partial',
    models,
    checkedAt: Date.now(),
  }
}

interface CodexProtocolModel {
  id: string
  model: string
  displayName: string
  description: string
  hidden: boolean
  inputModalities?: Array<'text' | 'image' | 'audio'>
  supportedReasoningEfforts: Array<{ reasoningEffort: string }>
}

async function readCodexModels(): Promise<CodexProtocolModel[]> {
  const codexPath = await resolveCommand('codex')
  if (!codexPath) throw new Error('codex not found')
  return await new Promise((resolve, reject) => {
    const child = spawn(codexPath, ['app-server', '--stdio'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (
      error?: Error,
      models: CodexProtocolModel[] = [],
    ) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      child.kill()
      if (error) reject(error)
      else resolve(models)
    }
    const timer = setTimeout(
      () => finish(new Error('Codex capability handshake timed out')),
      TIMEOUT_MS,
    )
    child.on('error', (error) => finish(error))
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
      const lines = stdout.split(/\r?\n/)
      stdout = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const message = JSON.parse(line) as {
            id?: number
            result?: { data?: CodexProtocolModel[] }
            error?: { message?: string }
          }
          if (message.id === 1) {
            if (message.error) {
              finish(new Error(message.error.message ?? 'Codex initialize failed'))
              return
            }
            child.stdin.write(`${JSON.stringify({
              id: 2,
              method: 'model/list',
              params: { includeHidden: false },
            })}\n`)
          }
          if (message.id === 2) {
            if (message.error) {
              finish(new Error(message.error.message ?? 'Codex model list failed'))
              return
            }
            finish(undefined, message.result?.data ?? [])
          }
        } catch {
          // Notifications and non-JSON diagnostic lines are not handshake data.
        }
      }
    })
    child.on('exit', (code) => {
      if (!settled) {
        finish(new Error(stderr.trim() || `Codex exited with code ${code ?? 1}`))
      }
    })
    child.stdin.write(`${JSON.stringify({
      id: 1,
      method: 'initialize',
      params: {
        clientInfo: {
          name: 'fleet-desktop',
          title: 'Fleet Desktop',
          version: '1',
        },
        capabilities: { experimentalApi: true },
      },
    })}\n`)
  })
}

async function probeCodex(): Promise<CliRuntimeHandshake> {
  const [version, models] = await Promise.all([
    versionOf('codex'),
    readCodexModels(),
  ])
  return {
    id: 'codex',
    name: 'Codex',
    version,
    status: models.length > 0 ? 'ready' : 'partial',
    models: models
      .filter((model) => !model.hidden)
      .map((model) => ({
        id: model.model || model.id,
        name: model.displayName,
        description: model.description,
        supportedReasoningEfforts: model.supportedReasoningEfforts.map(
          (option) => option.reasoningEffort,
        ),
        inputModalities: model.inputModalities ?? ['text'],
      })),
    checkedAt: Date.now(),
  }
}

interface ClaudeCache {
  modelAccessCache?: Array<{ value?: string; label?: string; description?: string }>
  additionalModelOptionsCache?: Array<{
    value?: string
    label?: string
    description?: string
  }>
}

export function parseClaudeCachedModels(
  cache: ClaudeCache,
  efforts: string[],
): CliRuntimeModelCapability[] {
  const entries = [
    ...(cache.modelAccessCache ?? []),
    ...(cache.additionalModelOptionsCache ?? []),
  ]
  const seen = new Set<string>()
  return entries.flatMap((entry) => {
    const id = entry.value?.trim()
    if (!id || seen.has(id)) return []
    seen.add(id)
    return [{
      id,
      name: entry.label?.trim() || id,
      description: entry.description,
      supportedReasoningEfforts: efforts,
      inputModalities: ['text', 'image'] as Array<'text' | 'image'>,
    }]
  })
}

async function probeClaudeCode(): Promise<CliRuntimeHandshake> {
  const [version, help, cacheText] = await Promise.all([
    versionOf('claude'),
    resolveCommand('claude').then((resolved) => {
      if (!resolved) throw new Error('claude not found')
      return execFileAsync(resolved, ['--help'], {
      encoding: 'utf8',
      timeout: 5_000,
        maxBuffer: 1_000_000,
      })
    }).then((result) => result.stdout),
    readFile(join(homedir(), '.claude.json'), 'utf8').catch(() => '{}'),
  ])
  const effortMatch = help.match(/--effort <level>[\s\S]*?\(([^)]+)\)/)
  const efforts = effortMatch?.[1]
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? []
  const models = parseClaudeCachedModels(
    JSON.parse(cacheText) as ClaudeCache,
    efforts,
  )
  return {
    id: 'claude-code',
    name: 'Claude Code',
    version,
    status: models.length > 0 ? 'ready' : 'partial',
    models,
    checkedAt: Date.now(),
  }
}

async function safeProbe(
  id: CliRuntimeHandshake['id'],
  name: string,
  probe: () => Promise<CliRuntimeHandshake>,
): Promise<CliRuntimeHandshake> {
  try {
    return await probe()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const unavailable =
      /ENOENT|not found|cannot find/i.test(message)
    return {
      id,
      name,
      status: unavailable ? 'unavailable' : 'error',
      models: [],
      error: message,
      checkedAt: Date.now(),
    }
  }
}

export async function handshakeCliRuntimes(): Promise<CliRuntimeHandshake[]> {
  return await Promise.all([
    safeProbe('codex', 'Codex', probeCodex),
    safeProbe('claude-code', 'Claude Code', probeClaudeCode),
    safeProbe('opencode', 'OpenCode', probeOpenCode),
  ])
}
