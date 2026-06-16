import type {
  CliRuntimeDetectResult,
  CliRuntimeId,
  CliRuntimeProbeResult,
} from '../../shared/types'
import * as storage from './local-storage'

export const CLI_RUNTIME_DETECTED_EVENT = 'craft:cli-runtime-detected'
const CLI_RUNTIME_CACHE_VERSION = 4

interface CachedCliRuntimeDetectResult {
  version: number
  result: CliRuntimeDetectResult
}

interface SupportedCliRuntime {
  id: CliRuntimeId
  command: string
  displayName: string
}

export const SUPPORTED_CLI_RUNTIMES: readonly SupportedCliRuntime[] = [
  { id: 'aionrs', command: 'aionrs', displayName: 'Aion CLI' },
  { id: 'claude', command: 'claude', displayName: 'Claude Code' },
  { id: 'codex', command: 'codex', displayName: 'Codex CLI' },
  { id: 'qwen', command: 'qwen', displayName: 'Qwen CLI' },
  { id: 'opencode', command: 'opencode', displayName: 'OpenCode' },
  { id: 'cursor', command: 'cursor', displayName: 'Cursor CLI' },
  { id: 'antigravity', command: 'agy', displayName: 'Antigravity' },
  { id: 'hermes', command: 'hermes', displayName: 'Hermes Agent' },
  { id: 'openclaw', command: 'openclaw', displayName: 'OpenClaw' },
  { id: 'grok', command: 'grok', displayName: 'Grok Build' },
  { id: 'goose', command: 'goose', displayName: 'Goose AI' },
  { id: 'codebuddy', command: 'codebuddy', displayName: 'CodeBuddy' },
  { id: 'kimi', command: 'kimi', displayName: 'Kimi CLI' },
  { id: 'droid', command: 'droid', displayName: 'Factory Droid' },
  { id: 'auggie', command: 'auggie', displayName: 'Augment Code' },
  { id: 'copilot', command: 'copilot', displayName: 'GitHub Copilot' },
  { id: 'qoder', command: 'qoder', displayName: 'Qoder CLI' },
  { id: 'vibe', command: 'vibe', displayName: 'Mistral Vibe' },
  { id: 'nanobot', command: 'nanobot', displayName: 'Nanobot' },
  { id: 'snow', command: 'snow', displayName: 'Snow CLI' },
] as const

export function formatCliRuntimeVersion(version: string | undefined): string | undefined {
  const line = version
    ?.replace(/\x1b\[[0-9;]*m/g, '')
    .split(/\r?\n/)
    .map(value => value.trim())
    .find(Boolean)

  if (!line) return undefined

  const explicitSemver = line.match(/(?:^|[\s@_-])v(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/i)
  if (explicitSemver?.[1]) return explicitSemver[1]

  const dateVersion = line.match(/\b(\d{4}\.\d{1,2}\.\d{1,2})(?:-[0-9a-f]{6,})?\b/i)
  if (dateVersion?.[1]) return dateVersion[1]

  const semver = line.match(/(?:^|[\s@_-])v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)/)
  if (semver?.[1]) return semver[1]

  return line
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*[·-]\s*(?:upstream\s*)?[0-9a-f]{6,}\b/gi, '')
    .trim() || undefined
}

export function readCachedCliRuntimeDetectResult(): CliRuntimeDetectResult | null {
  const cached = storage.get<CachedCliRuntimeDetectResult | CliRuntimeDetectResult | null>(storage.KEYS.cliRuntimeDetectResult, null)
  if (!cached) return null
  if ('version' in cached && cached.version === CLI_RUNTIME_CACHE_VERSION) return cached.result

  storage.remove(storage.KEYS.cliRuntimeDetectResult)
  return null
}

export function writeCachedCliRuntimeDetectResult(result: CliRuntimeDetectResult): void {
  storage.set(storage.KEYS.cliRuntimeDetectResult, {
    version: CLI_RUNTIME_CACHE_VERSION,
    result,
  } satisfies CachedCliRuntimeDetectResult)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLI_RUNTIME_DETECTED_EVENT, { detail: result }))
  }
}

export function mergeSupportedCliRuntimeTools(result: CliRuntimeDetectResult | null): CliRuntimeProbeResult[] {
  const byId = new Map((result?.tools ?? []).map(tool => [tool.id, tool]))
  const checkedAt = result?.checkedAt ?? 0

  return SUPPORTED_CLI_RUNTIMES.map(definition => {
    const detected = byId.get(definition.id)
    if (detected) {
      return {
        ...detected,
        command: detected.command || definition.command,
        displayName: detected.displayName || definition.displayName,
      }
    }

    return {
      id: definition.id,
      command: definition.command,
      displayName: definition.displayName,
      available: false,
      configDirs: [],
      failureReason: 'not_found',
      checkedAt,
    } satisfies CliRuntimeProbeResult
  })
}

export async function refreshCliRuntimeDetectCache(): Promise<CliRuntimeDetectResult> {
  const result = await window.electronAPI.detectCliRuntimes()
  writeCachedCliRuntimeDetectResult(result)
  return result
}
