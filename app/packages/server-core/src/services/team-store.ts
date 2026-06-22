/**
 * TeamStore —— 团队收件箱 + 结构化报告的本地持久化（承重墙 · LOCAL_ONLY）。
 *
 * 真相边界（诚实）：
 * - 团队消息/任务的**记录真相**是 team 会话 transcript + 带 actor 的 SessionEvent。
 * - 本 store 只存**投递引用**（收件箱：哪个会话还有几条未消费）和**结构化报告**（待审队列从中派生）。
 * - 待审队列**不持久化**：由 TeamCoordinator 扫描 awaitingReview 成员 + 各自最新报告实时算（见 coordinator）。
 *
 * 存储：每 workspace 一个目录，原子写（temp+rename），与 FileDesignEnginePersistence 同模式。
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TeamInboxItem, TeamReport } from '@craft-agent/shared/protocol'

export interface TeamStore {
  enqueueInbox(item: TeamInboxItem): Promise<void>
  listInbox(sessionId: string): Promise<TeamInboxItem[]>
  /** 标记并清空一个会话的收件箱（被某轮消费时调用）。返回被清空的项。 */
  drainInbox(sessionId: string): Promise<TeamInboxItem[]>
  saveReport(report: TeamReport): Promise<void>
  getLatestReport(sessionId: string): Promise<TeamReport | null>
}

function key(value: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('key must be non-empty')
  return createHash('sha256').update(value).digest('hex')
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf-8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export class FileTeamStore implements TeamStore {
  constructor(private readonly dataDir: string) {}

  private inboxPath(sessionId: string): string {
    return join(this.dataDir, `${key(sessionId)}.inbox.json`)
  }

  private reportPath(sessionId: string): string {
    return join(this.dataDir, `${key(sessionId)}.report.json`)
  }

  async enqueueInbox(item: TeamInboxItem): Promise<void> {
    const items = await this.listInbox(item.sessionId)
    items.push(item)
    await this.writeAtomic(this.inboxPath(item.sessionId), items)
  }

  async listInbox(sessionId: string): Promise<TeamInboxItem[]> {
    return (await readJson<TeamInboxItem[]>(this.inboxPath(sessionId))) ?? []
  }

  async drainInbox(sessionId: string): Promise<TeamInboxItem[]> {
    const items = await this.listInbox(sessionId)
    if (items.length === 0) return []
    await this.writeAtomic(this.inboxPath(sessionId), [])
    return items
  }

  /** 只保留每个会话的最新报告（待审队列只看最新）。历史报告真相在 timeline 事件。 */
  async saveReport(report: TeamReport): Promise<void> {
    await this.writeAtomic(this.reportPath(report.reporterSessionId), report)
  }

  async getLatestReport(sessionId: string): Promise<TeamReport | null> {
    return readJson<TeamReport>(this.reportPath(sessionId))
  }

  private async writeAtomic(path: string, value: unknown): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    const tempPath = `${path}.${process.pid}.tmp`
    await writeFile(tempPath, JSON.stringify(value, null, 2), 'utf-8')
    await rename(tempPath, path)
  }
}

/** 内存实现：测试与无落盘场景。 */
export class MemoryTeamStore implements TeamStore {
  private inbox = new Map<string, TeamInboxItem[]>()
  private reports = new Map<string, TeamReport>()

  async enqueueInbox(item: TeamInboxItem): Promise<void> {
    const list = this.inbox.get(item.sessionId) ?? []
    list.push(item)
    this.inbox.set(item.sessionId, list)
  }

  async listInbox(sessionId: string): Promise<TeamInboxItem[]> {
    return [...(this.inbox.get(sessionId) ?? [])]
  }

  async drainInbox(sessionId: string): Promise<TeamInboxItem[]> {
    const list = this.inbox.get(sessionId) ?? []
    this.inbox.set(sessionId, [])
    return [...list]
  }

  async saveReport(report: TeamReport): Promise<void> {
    this.reports.set(report.reporterSessionId, report)
  }

  async getLatestReport(sessionId: string): Promise<TeamReport | null> {
    return this.reports.get(sessionId) ?? null
  }
}
