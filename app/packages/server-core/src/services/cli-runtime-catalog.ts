/**
 * CliRuntimeCatalog（docs/23）——本机 CLI/ACP runtime 目录。
 *
 * detected 映射扫描常见本机 Agent CLI；只有本机 PATH 上能解析到命令时才进入目录。
 * protocol='acp' 可直接发送，native/subscription 只作为“已检测，待 adapter”展示。
 * custom 由用户自配 ACP runtime 并落盘。
 * 设置页可编辑边界由 `@craft-agent/shared/protocol` 的 can* helper 决定，不在这里另设一套。
 * 不建第二套 session store：catalog 只管 runtime 定义，发送/进程走 adapter（见 cli-runtime-host）。
 */

import { constants, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync, accessSync } from 'node:fs'
import { delimiter, dirname, isAbsolute, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  DETECTED_RUNTIME_MAPPINGS,
  detectedRuntimeFromMapping,
  canDeleteRuntime,
  canDisableRuntime,
  type CliRuntimeDefinition,
} from '@craft-agent/shared/protocol'
import { CONFIG_DIR } from '@craft-agent/shared/config'

const STORE_RELATIVE_PATH = '.fleet/cli-runtimes.json'

interface CliRuntimeStoreData {
  version: 1
  /** 用户自配的 custom runtime。 */
  custom: CliRuntimeDefinition[]
  /** 被禁用的 runtime id（detected/custom）。 */
  disabledIds: string[]
  /** 被删除（隐藏）的内置 detected 映射 id。 */
  hiddenMappingIds: string[]
}

export interface CustomRuntimeInput {
  displayName: string
  command: string
  args?: string[]
  env?: Record<string, string>
}

export interface CustomRuntimePatch {
  displayName?: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  enabled?: boolean
}

export interface CliRuntimeCatalogOptions {
  /** 测试注入点；生产默认解析本机 PATH。 */
  commandExists?: (command: string) => boolean
}

function emptyStore(): CliRuntimeStoreData {
  return { version: 1, custom: [], disabledIds: [], hiddenMappingIds: [] }
}

export class CliRuntimeCatalog {
  readonly path: string
  private readonly commandExists: (command: string) => boolean

  constructor(configRoot: string, options: CliRuntimeCatalogOptions = {}) {
    this.path = join(configRoot, STORE_RELATIVE_PATH)
    this.commandExists = options.commandExists ?? commandExistsOnPath
  }

  /** 列出可见 runtime：detected（未隐藏）+ custom；enabled 反映禁用集合。 */
  list(): CliRuntimeDefinition[] {
    const data = this.load()
    const disabled = new Set(data.disabledIds)
    const hidden = new Set(data.hiddenMappingIds)
    const detected = DETECTED_RUNTIME_MAPPINGS
      .filter(mapping => !hidden.has(mapping.mappingId))
      .filter(mapping => this.commandExists(mapping.command))
      .map(mapping => {
        const def = detectedRuntimeFromMapping(mapping)
        def.enabled = !disabled.has(def.id)
        return def
      })
    const custom = data.custom.map(def => ({ ...def, protocol: def.protocol ?? 'acp', enabled: !disabled.has(def.id) }))
    return [...detected, ...custom]
  }

  get(id: string): CliRuntimeDefinition | null {
    return this.list().find(runtime => runtime.id === id) ?? null
  }

  addCustom(input: CustomRuntimeInput): CliRuntimeDefinition {
    const displayName = input.displayName?.trim()
    const command = input.command?.trim()
    if (!displayName) throw new Error('Custom runtime 需要 displayName')
    if (!command) throw new Error('Custom runtime 需要 command')
    const def: CliRuntimeDefinition = {
      id: `custom:${randomUUID()}`,
      kind: 'custom',
      displayName,
      command,
      args: [...(input.args ?? [])],
      env: input.env ? { ...input.env } : undefined,
      enabled: true,
      protocol: 'acp',
      attachments: 'none',
    }
    const data = this.load()
    data.custom.push(def)
    this.save(data)
    return def
  }

  updateCustom(id: string, patch: CustomRuntimePatch): CliRuntimeDefinition {
    const data = this.load()
    const def = data.custom.find(runtime => runtime.id === id)
    if (!def) throw new Error(`只能编辑 custom runtime；未找到: ${id}`)
    def.protocol ??= 'acp'
    if (patch.displayName !== undefined) def.displayName = patch.displayName.trim()
    if (patch.command !== undefined) def.command = patch.command.trim()
    if (patch.args !== undefined) def.args = [...patch.args]
    if (patch.env !== undefined) def.env = { ...patch.env }
    if (patch.enabled !== undefined) this.applyEnabled(data, id, patch.enabled)
    this.save(data)
    return { ...def, enabled: !data.disabledIds.includes(id) }
  }

  /** 启用/禁用（detected/custom；managed 不可）。 */
  setEnabled(id: string, enabled: boolean): void {
    const runtime = this.get(id)
    if (!runtime) throw new Error(`未找到 runtime: ${id}`)
    if (!canDisableRuntime(runtime.kind)) throw new Error(`managed runtime 不可禁用: ${id}`)
    const data = this.load()
    this.applyEnabled(data, id, enabled)
    this.save(data)
  }

  /** 删除（custom 真删；detected 隐藏内置映射；managed 不可）。 */
  delete(id: string): void {
    const runtime = this.get(id)
    if (!runtime) throw new Error(`未找到 runtime: ${id}`)
    if (!canDeleteRuntime(runtime.kind)) throw new Error(`managed runtime 不可删除: ${id}`)
    const data = this.load()
    if (runtime.kind === 'custom') {
      data.custom = data.custom.filter(def => def.id !== id)
    } else if (runtime.kind === 'detected' && runtime.mappingId) {
      if (!data.hiddenMappingIds.includes(runtime.mappingId)) data.hiddenMappingIds.push(runtime.mappingId)
    }
    data.disabledIds = data.disabledIds.filter(disabledId => disabledId !== id)
    this.save(data)
  }

  private applyEnabled(data: CliRuntimeStoreData, id: string, enabled: boolean): void {
    const set = new Set(data.disabledIds)
    if (enabled) set.delete(id)
    else set.add(id)
    data.disabledIds = [...set]
  }

  private load(): CliRuntimeStoreData {
    if (!existsSync(this.path)) return emptyStore()
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as Partial<CliRuntimeStoreData>
      return {
        version: 1,
        custom: Array.isArray(parsed.custom) ? parsed.custom.filter(isCustomDef) : [],
        disabledIds: Array.isArray(parsed.disabledIds) ? parsed.disabledIds.filter(isStr) : [],
        hiddenMappingIds: Array.isArray(parsed.hiddenMappingIds) ? parsed.hiddenMappingIds.filter(isStr) : [],
      }
    } catch {
      return emptyStore()
    }
  }

  private save(data: CliRuntimeStoreData): void {
    mkdirSync(dirname(this.path), { recursive: true })
    const tempPath = `${this.path}.${process.pid}.tmp`
    try {
      writeFileSync(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
      renameSync(tempPath, this.path)
    } catch (error) {
      if (existsSync(tempPath)) unlinkSync(tempPath)
      throw error
    }
  }
}

/** 机器级共享单例（catalog 配置落 `~/.craft-agent`）。RPC 与 SessionManager 共用同一份。 */
let sharedCatalog: CliRuntimeCatalog | null = null
export function getDefaultCliRuntimeCatalog(): CliRuntimeCatalog {
  if (!sharedCatalog) sharedCatalog = new CliRuntimeCatalog(CONFIG_DIR)
  return sharedCatalog
}
/** 测试用：重置共享单例。 */
export function __resetDefaultCliRuntimeCatalog(): void {
  sharedCatalog = null
}

function isStr(value: unknown): value is string {
  return typeof value === 'string'
}

function isCustomDef(value: unknown): value is CliRuntimeDefinition {
  return typeof value === 'object' && value !== null
    && typeof (value as CliRuntimeDefinition).id === 'string'
    && (value as CliRuntimeDefinition).kind === 'custom'
    && typeof (value as CliRuntimeDefinition).command === 'string'
}

export function commandExistsOnPath(command: string): boolean {
  const trimmed = command.trim()
  if (!trimmed) return false
  if (trimmed.includes('/') || trimmed.includes('\\') || isAbsolute(trimmed)) {
    return isExecutableFile(trimmed)
  }

  const pathValue = process.env.PATH ?? ''
  const dirs = pathValue.split(delimiter).filter(Boolean)
  const extensions = process.platform === 'win32'
    ? (process.env.PATHEXT ?? '.EXE;.CMD;.BAT;.COM')
      .split(';')
      .filter(Boolean)
    : ['']

  for (const dir of dirs) {
    for (const ext of extensions) {
      if (isExecutableFile(join(dir, `${trimmed}${ext}`))) return true
    }
  }
  return false
}

function isExecutableFile(path: string): boolean {
  try {
    accessSync(path, constants.X_OK)
    return true
  } catch {
    return false
  }
}
