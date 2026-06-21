import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ExternalReviewJobStore,
  applyExternalReviewJobTransition,
  canTransition,
  createExternalReviewJob,
} from './external-review-job-service'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('external review job state machine', () => {
  it('creates jobs in pending_auth', () => {
    const job = createExternalReviewJob({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'claude-web',
    })
    expect(job.status).toBe('pending_auth')
    expect(job.promptHash).toHaveLength(64)
  })

  it('walks pending_auth → submitted → awaiting_result → completed', () => {
    let job = createExternalReviewJob({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'claude-web',
    }, 1000)

    expect(canTransition(job.status, 'authorize')).toBe(true)
    job = applyExternalReviewJobTransition(job, { type: 'authorize', submittedAt: 1100 })
    expect(job.status).toBe('submitted')
    expect(job.submittedAt).toBe(1100)

    job = applyExternalReviewJobTransition(job, { type: 'mark_awaiting_result' })
    expect(job.status).toBe('awaiting_result')

    job = applyExternalReviewJobTransition(job, { type: 'complete', reportId: 'report-1', completedAt: 1200 })
    expect(job.status).toBe('completed')
    expect(job.reportId).toBe('report-1')
    expect(job.completedAt).toBe(1200)
    expect(canTransition(job.status, 'complete')).toBe(false)
  })

  it('allows failure from submitted or awaiting_result', () => {
    let job = createExternalReviewJob({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'gemini-web',
    })
    job = applyExternalReviewJobTransition(job, { type: 'authorize' })
    job = applyExternalReviewJobTransition(job, { type: 'fail', reason: '登录过期' })
    expect(job.status).toBe('failed')
    expect(job.failureReason).toBe('登录过期')
  })

  it('rejects invalid transitions', () => {
    const job = createExternalReviewJob({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'gemini-web',
    })
    expect(() => applyExternalReviewJobTransition(job, { type: 'complete', reportId: 'x' }))
      .toThrow('Invalid transition complete from status pending_auth')
  })

  it('persists transitions via store', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'external-review-job-'))
    tempDirs.push(dir)
    const store = new ExternalReviewJobStore(dir)
    const created = await store.create({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'chatgpt-web',
    })
    const submitted = await store.transition(created.jobId, { type: 'authorize' })
    expect(submitted.status).toBe('submitted')
    expect((await store.get(created.jobId))?.status).toBe('submitted')
  })
})
