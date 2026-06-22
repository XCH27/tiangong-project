/**
 * TeamStore —— 团队收件箱投递引用的本地持久化（承重墙 · LOCAL_ONLY）。
 *
 * 真相边界（诚实）：
 * - 团队消息/任务的**记录真相**是 team 会话 transcript + 带 actor 的 SessionEvent。
 * - 本 store 只存**投递引用**（收件箱：哪个会话还有几条未消费）。正文和结构化汇报均由 session timeline 持久化。
 * - 待审队列**不持久化**：由 TeamCoordinator 扫描 awaitingReview 成员 + timeline 中各自最新报告实时算。
 *
 * 存储：每 workspace 一个目录，原子写（temp+rename），与 FileDesignEnginePersistence 同模式。
 */

import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TeamInboxItem } from '@craft-agent/shared/protocol'

export interface TeamStore {
  enqueueInbox(item: TeamInboxItem): Promise<void>
  listInbox(sessionId: string): Promise<TeamInboxItem[]>
  /** 标记并清空一个会话的收件箱（被某轮消费时调用）。返回被清空的项。 */
  drainInbox(sessionId: string): Promise<TeamInboxItem[]>
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
  private writeChains = new Map<string, Promise<void>>()
  constructor(private readonly dataDir: string) {}

  private inboxPath(sessionId: string): string {
    return join(this.dataDir, `${key(sessionId)}.inbox.json`)
  }

  async enqueueInbox(item: TeamInboxItem): Promise<void> {
    await this.serialize(this.inboxPath(item.sessionId), async () => {
      const items = await this.listInbox(item.sessionId)
      items.push(item)
      await this.writeAtomic(this.inboxPath(item.sessionId), items)
    })
  }

  async listInbox(sessionId: string): Promise<TeamInboxItem[]> {
    return (await readJson<TeamInboxItem[]>(this.inboxPath(sessionId))) ?? []
  }

  async drainInbox(sessionId: string): Promise<TeamInboxItem[]> {
    let drained: TeamInboxItem[] = []
    await this.serialize(this.inboxPath(sessionId), async () => {
      drained = await this.listInbox(sessionId)
      if (drained.length > 0) await this.writeAtomic(this.inboxPath(sessionId), [])
    })
    return drained
  }

  private async writeAtomic(path: string, value: unknown): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`
    await writeFile(tempPath, JSON.stringify(value, null, 2), 'utf-8')
    await rename(tempPath, path)
  }

  private async serialize(path: string, operation: () => Promise<void>): Promise<void> {
    const previous = this.writeChains.get(path) ?? Promise.resolve()
    const current = previous.catch(() => undefined).then(operation)
    this.writeChains.set(path, current)
    try {
      await current
    } finally {
      if (this.writeChains.get(path) === current) this.writeChains.delete(path)
    }
  }
}

/** 内存实现：测试与无落盘场景。 */
export class MemoryTeamStore implements TeamStore {
  private inbox = new Map<string, TeamInboxItem[]>()

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

}
