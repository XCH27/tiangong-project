/**
 * CliRuntimeCatalog（docs/23）——本机 CLI/ACP runtime 目录。
 *
 * detected 映射是内置的（Grok/Hermes/OpenCode + Gemini 候选）；custom 由用户自配并落盘。
 * 设置页可编辑边界由 `@craft-agent/shared/protocol` 的 can* helper 决定，不在这里另设一套。
 * 不建第二套 session store：catalog 只管 runtime 定义，发送/进程走 adapter（见 cli-runtime-host）。
 */

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
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

function emptyStore(): CliRuntimeStoreData {
  return { version: 1, custom: [], disabledIds: [], hiddenMappingIds: [] }
}

export class CliRuntimeCatalog {
  readonly path: string

  constructor(configRoot: string) {
    this.path = join(configRoot, STORE_RELATIVE_PATH)
  }

  /** 列出可见 runtime：detected（未隐藏）+ custom；enabled 反映禁用集合。 */
  list(): CliRuntimeDefinition[] {
    const data = this.load()
    const disabled = new Set(data.disabledIds)
    const hidden = new Set(data.hiddenMappingIds)
    const detected = DETECTED_RUNTIME_MAPPINGS
      .filter(mapping => !hidden.has(mapping.mappingId))
      .map(mapping => {
        const def = detectedRuntimeFromMapping(mapping)
        def.enabled = !disabled.has(def.id)
        return def
      })
    const custom = data.custom.map(def => ({ ...def, enabled: !disabled.has(def.id) }))
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
