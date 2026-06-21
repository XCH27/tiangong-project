/**
 * External review job state machine — 待授权 → 已提交 → 等待结果 → 已完成/失败。
 * Does not auto-login, upload, or bypass platform limits.
 */

import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type ExternalReviewJobStatus =
  | 'pending_auth'
  | 'submitted'
  | 'awaiting_result'
  | 'completed'
  | 'failed'

export interface ExternalReviewJob {
  jobId: string
  bundleId: string
  bundleHash: string
  platformId: string
  status: ExternalReviewJobStatus
  createdAt: number
  updatedAt: number
  submittedAt?: number
  completedAt?: number
  failureReason?: string
  reportId?: string
  promptHash?: string
}

export interface CreateExternalReviewJobInput {
  bundleId: string
  bundleHash: string
  platformId: string
  promptHash?: string
}

export type ExternalReviewJobTransition =
  | { type: 'authorize'; submittedAt?: number }
  | { type: 'mark_awaiting_result' }
  | { type: 'complete'; reportId: string; completedAt?: number }
  | { type: 'fail'; reason: string }

const TRANSITIONS: Record<ExternalReviewJobStatus, ExternalReviewJobTransition['type'][]> = {
  pending_auth: ['authorize'],
  submitted: ['mark_awaiting_result', 'fail'],
  awaiting_result: ['complete', 'fail'],
  completed: [],
  failed: [],
}

export function canTransition(
  status: ExternalReviewJobStatus,
  transition: ExternalReviewJobTransition['type'],
): boolean {
  return TRANSITIONS[status].includes(transition)
}

export function applyExternalReviewJobTransition(
  job: ExternalReviewJob,
  transition: ExternalReviewJobTransition,
  now = Date.now(),
): ExternalReviewJob {
  if (!canTransition(job.status, transition.type)) {
    throw new Error(`Invalid transition ${transition.type} from status ${job.status}`)
  }

  switch (transition.type) {
    case 'authorize':
      return {
        ...job,
        status: 'submitted',
        updatedAt: now,
        submittedAt: transition.submittedAt ?? now,
        failureReason: undefined,
      }
    case 'mark_awaiting_result':
      return {
        ...job,
        status: 'awaiting_result',
        updatedAt: now,
      }
    case 'complete':
      return {
        ...job,
        status: 'completed',
        updatedAt: now,
        completedAt: transition.completedAt ?? now,
        reportId: transition.reportId,
        failureReason: undefined,
      }
    case 'fail':
      return {
        ...job,
        status: 'failed',
        updatedAt: now,
        failureReason: transition.reason.trim() || 'Unknown failure',
      }
    default: {
      const _exhaustive: never = transition
      throw new Error(`Unsupported transition: ${String(_exhaustive)}`)
    }
  }
}

export function createExternalReviewJob(input: CreateExternalReviewJobInput, now = Date.now()): ExternalReviewJob {
  const bundleId = input.bundleId.trim()
  const bundleHash = input.bundleHash.trim()
  const platformId = input.platformId.trim()
  if (!bundleId || !bundleHash || !platformId) {
    throw new Error('bundleId, bundleHash, and platformId are required')
  }

  return {
    jobId: randomUUID(),
    bundleId,
    bundleHash,
    platformId,
    status: 'pending_auth',
    createdAt: now,
    updatedAt: now,
    promptHash: input.promptHash?.trim() || createHash('sha256').update(`${bundleId}:${platformId}`).digest('hex'),
  }
}

export function getExternalReviewJobDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'external-review-jobs')
}

export class ExternalReviewJobStore {
  constructor(private readonly dataDir = getExternalReviewJobDataDir()) {}

  async create(input: CreateExternalReviewJobInput): Promise<ExternalReviewJob> {
    const job = createExternalReviewJob(input)
    await this.save(job)
    return job
  }

  async get(jobId: string): Promise<ExternalReviewJob | null> {
    try {
      return JSON.parse(await readFile(join(this.dataDir, `${jobId}.json`), 'utf-8')) as ExternalReviewJob
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async save(job: ExternalReviewJob): Promise<void> {
    await mkdir(this.dataDir, { recursive: true })
    await writeFile(join(this.dataDir, `${job.jobId}.json`), JSON.stringify(job, null, 2), 'utf-8')
  }

  async transition(jobId: string, transition: ExternalReviewJobTransition): Promise<ExternalReviewJob> {
    const job = await this.get(jobId)
    if (!job) throw new Error(`External review job not found: ${jobId}`)
    const next = applyExternalReviewJobTransition(job, transition)
    await this.save(next)
    return next
  }
}

export const externalReviewJobStore = new ExternalReviewJobStore()
