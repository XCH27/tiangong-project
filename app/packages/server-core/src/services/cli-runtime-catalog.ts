import { accessSync, constants, existsSync } from 'node:fs'
import { delimiter, isAbsolute, join } from 'node:path'
import { DETECTED_ACP_RUNTIME_MAP, getUnsupportedDetectedRuntimeMessage } from './cli-runtime-detected-acp-mappings'
import { CliRuntimeAcpStdioClient } from './cli-runtime-acp-client'
import type { CliRuntimeCatalogItem, CliRuntimeHealthResult } from './cli-runtime-types'

export function defaultResolveCommand(command: string): string | null {
  if (!command.trim()) return null

  const candidatePaths = command.includes('/') || isAbsolute(command)
    ? [command]
    : (process.env.PATH ?? '').split(delimiter).map(dir => join(dir, command))

  for (const candidate of candidatePaths) {
    try {
      if (existsSync(candidate)) {
        accessSync(candidate, constants.X_OK)
        return candidate
      }
    } catch {
      // Continue searching PATH.
    }
  }
  return null
}

export function buildCliRuntimeCatalog(opts: {
  resolveCommand?: (command: string) => string | null
} = {}): CliRuntimeCatalogItem[] {
  const resolveCommand = opts.resolveCommand ?? defaultResolveCommand
  const supported = Object.values(DETECTED_ACP_RUNTIME_MAP).map(mapping => ({
    id: mapping.runtimeId,
    displayName: mapping.displayName,
    source: 'detected' as const,
    supported: true,
    enabled: true,
    command: resolveCommand(mapping.command) ?? mapping.command,
    args: mapping.args,
    mapping: {
      command: mapping.command,
      args: mapping.args,
    },
  }))

  const unsupported = ['claude', 'codex', 'qwen', 'gemini'].map(runtimeId => ({
    id: runtimeId,
    displayName: runtimeId === 'claude' ? 'Claude Code' : runtimeId === 'codex' ? 'Codex' : runtimeId === 'qwen' ? 'Qwen Code' : 'Gemini CLI',
    source: 'detected' as const,
    supported: false,
    enabled: false,
    unsupportedReason: getUnsupportedDetectedRuntimeMessage(runtimeId),
  }))

  return [...supported, ...unsupported]
}

export async function performCliRuntimeHealthTest(input: {
  runtimeId: string
  command: string
  args?: string[]
  env?: Record<string, string>
  acpMode?: boolean
  timeoutMs?: number
  resolveCommand?: (command: string) => string | null
}): Promise<CliRuntimeHealthResult> {
  const checkedAt = Date.now()
  const resolveCommand = input.resolveCommand ?? defaultResolveCommand
  const resolvedCommand = resolveCommand(input.command)
  if (!resolvedCommand) {
    return {
      status: 'fail_cli',
      stage: 'resolve',
      checkedAt,
      message: `CLI 启动失败：找不到或不可执行 ${input.command}`,
    }
  }

  const acpMode = input.acpMode ?? wantsAcp(input.args ?? [])
  if (!acpMode) {
    return {
      status: 'available',
      stage: 'launch',
      checkedAt,
      message: 'CLI 可执行。该 runtime 未声明 ACP 健康握手。',
    }
  }

  const client = new CliRuntimeAcpStdioClient({
    runtimeId: input.runtimeId,
    displayName: input.runtimeId,
    command: resolvedCommand,
    args: input.args ?? [],
    env: input.env,
  }, { timeoutMs: input.timeoutMs ?? 5000 })

  try {
    await client.initialize()
  } catch (error) {
    const diagnostics = client.diagnostics
    client.dispose()
    return {
      status: 'fail_acp',
      stage: 'initialize',
      checkedAt,
      message: `ACP 握手失败：${error instanceof Error ? error.message : String(error)}`,
      ...diagnostics,
    }
  }

  try {
    await client.createSession(process.cwd())
    const diagnostics = client.diagnostics
    client.dispose()
    return {
      status: 'available',
      stage: 'session/new',
      checkedAt,
      message: '最近测试通过',
      ...diagnostics,
    }
  } catch (error) {
    const diagnostics = client.diagnostics
    client.dispose()
    return {
      status: 'fail_acp',
      stage: 'session/new',
      checkedAt,
      message: `ACP 握手失败：${error instanceof Error ? error.message : String(error)}`,
      ...diagnostics,
    }
  }
}

function wantsAcp(args: string[]): boolean {
  return args.some(arg => /^(agent|stdio|acp)$/i.test(arg))
}
