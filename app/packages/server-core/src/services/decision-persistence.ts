import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { DecisionLevel } from '@craft-agent/shared/protocol'

export interface DecisionRule {
  id: string
  level: DecisionLevel
  action: string
  target?: string
  scope?: 'local' | 'external'
  allow: boolean
  reason: string
  updatedAt: number
}

export interface DecisionPersistence {
  saveRule(rule: DecisionRule): Promise<void>
  loadRules(): Promise<DecisionRule[]>
}

export function getDecisionDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'decision')
}

async function readJson<T>(p: string): Promise<T | null> {
  try { return JSON.parse(await readFile(p, 'utf-8')) as T } catch (e: any) { if (e.code === 'ENOENT') return null; throw e }
}

export class FileDecisionPersistence implements DecisionPersistence {
  constructor(private readonly dataDir = getDecisionDataDir()) {}

  private file(): string { return join(this.dataDir, 'rules.json') }

  async saveRule(rule: DecisionRule): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    const p = this.file()
    const tmp = `${p}.${process.pid}.tmp`
    const existing = (await readJson<DecisionRule[]>(p)) || []
    const idx = existing.findIndex(r => r.id === rule.id)
    if (idx >= 0) existing[idx] = rule; else existing.push(rule)
    await writeFile(tmp, JSON.stringify(existing, null, 2), 'utf-8')
    await rename(tmp, p)
  }

  async loadRules(): Promise<DecisionRule[]> {
    return (await readJson<DecisionRule[]>(this.file())) || []
  }
}

export const decisionPersistence = new FileDecisionPersistence()
