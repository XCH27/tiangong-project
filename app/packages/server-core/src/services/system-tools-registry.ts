/**
 * System Tools Registry（T-SYSTOOLS · `docs/28` §4/§8/§10 ENV-1）。
 *
 * 探测器按 category 注册，结果缓存，可 force redetect。对 Agent/UI 暴露统一
 * `ToolCapability` 目录。`env.listTools` 只读可自动；`env.runRepair` 不在此处
 * （v1 未接入，需 permission + timeline）。
 *
 * 不引入第二套 session/timeline——本 registry 只持有探测缓存，不持久化会话状态。
 */

import type {
  ToolCapability,
  ToolCategory,
  ToolCapabilityTag,
} from '@craft-agent/shared/protocol'
import {
  BUILTIN_DETECTORS,
  runDetector,
  detectPlatform,
  getLoginShellPath,
  type SpawnAdapter,
  type ToolDetectorDef,
  type DetectPlatform,
} from './system-tools-detector'

export interface RegistryOptions {
  spawn?: SpawnAdapter
  platform?: DetectPlatform
  /** 初始 PATH（默认 process.env.PATH）。 */
  initialPath?: string
  /** 额外探测器（与内置合并）。 */
  extraDetectors?: ToolDetectorDef[]
}

/**
 * 进程内工具能力注册表。一个 Electron server 一个实例。
 * 缓存按 toolId 存；force redetect 清单条目或全清。
 */
export class SystemToolsRegistry {
  private readonly detectors: Map<string, ToolDetectorDef> = new Map()
  private readonly cache: Map<string, ToolCapability> = new Map()
  private readonly spawn: SpawnAdapter
  private readonly platform: DetectPlatform
  private readonly initialPath: string
  private loginShellPathCache: string | null | undefined

  constructor(opts: RegistryOptions = {}) {
    this.spawn = opts.spawn ?? (require('./system-tools-detector').defaultSpawnAdapter as SpawnAdapter)
    this.platform = opts.platform ?? detectPlatform()
    this.initialPath = opts.initialPath ?? process.env.PATH ?? ''
    for (const d of BUILTIN_DETECTORS) this.detectors.set(d.toolId, d)
    for (const d of opts.extraDetectors ?? []) this.detectors.set(d.toolId, d)
  }

  /** 注册/覆盖一个探测器。 */
  registerDetector(def: ToolDetectorDef): void {
    this.detectors.set(def.toolId, def)
    this.cache.delete(def.toolId)
  }

  /** 列出全部已注册的 toolId。 */
  listToolIds(): string[] {
    return Array.from(this.detectors.keys())
  }

  /** 探测单个工具（带缓存）。 */
  async detectTool(toolId: string, force = false): Promise<ToolCapability> {
    const def = this.detectors.get(toolId)
    if (!def) {
      throw new Error(`Unknown toolId: ${toolId}`)
    }
    if (!force && this.cache.has(toolId)) {
      return this.cache.get(toolId)!
    }
    const cap = runDetector(def, {
      platform: this.platform,
      spawn: this.spawn,
      initialPath: this.initialPath,
      loginShellPath: this.ensureLoginShellPath(),
    })
    this.cache.set(toolId, cap)
    return cap
  }

  /** 探测某分类下全部工具。 */
  async detectCategory(category: ToolCategory, force = false): Promise<ToolCapability[]> {
    const ids = Array.from(this.detectors.values()).filter((d) => d.category === category).map((d) => d.toolId)
    return Promise.all(ids.map((id) => this.detectTool(id, force)))
  }

  /** 探测全部已注册工具。 */
  async detectAll(force = false): Promise<ToolCapability[]> {
    return Promise.all(Array.from(this.detectors.keys()).map((id) => this.detectTool(id, force)))
  }

  /**
   * 取某分类下最优工具（priority 最小；可按能力过滤）。
   * 只返回 status 为 available/conflict 的；missing/broken 不算可用。
   */
  async getBestTool(category: ToolCategory, capability?: ToolCapabilityTag): Promise<ToolCapability | null> {
    const tools = await this.detectCategory(category)
    const usable = tools
      .filter((t) => t.status === 'available' || t.status === 'conflict')
      .filter((t) => (capability ? t.capabilities.includes(capability) : true))
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
    return usable[0] ?? null
  }

  /** 列出全部缓存能力（不触发探测；未探测的 toolId 不在结果里）。 */
  listCached(): ToolCapability[] {
    return Array.from(this.cache.values())
  }

  /** 列出全部工具——未探测的也以 unknown 占位返回（UI 固定占位，docs/28 §2）。 */
  async listTools(force = false): Promise<ToolCapability[]> {
    return this.detectAll(force)
  }

  /** 清空缓存（或单条）。 */
  clearCache(toolId?: string): void {
    if (toolId) {
      this.cache.delete(toolId)
    } else {
      this.cache.clear()
    }
  }

  private ensureLoginShellPath(): string | null {
    if (this.loginShellPathCache === undefined) {
      this.loginShellPathCache = getLoginShellPath(this.platform, this.spawn)
    }
    return this.loginShellPathCache
  }
}
