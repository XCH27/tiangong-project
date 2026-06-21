import { afterEach, describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { completeExternalReviewJobWithReport } from './external-review-completion-service'
import { ExternalReviewJobStore } from './external-review-job-service'
import { ExternalReviewReportStore } from './external-review-report'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function stores() {
  const root = await mkdtemp(join(tmpdir(), 'external-review-complete-'))
  tempDirs.push(root)
  return {
    jobs: new ExternalReviewJobStore(join(root, 'jobs')),
    reports: new ExternalReviewReportStore(join(root, 'reports')),
  }
}

describe('completeExternalReviewJobWithReport', () => {
  it('saves a report and completes the awaiting job', async () => {
    const store = await stores()
    const created = await store.jobs.create({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'claude-web',
    })
    await store.jobs.transition(created.jobId, { type: 'authorize', submittedAt: 1000 })
    await store.jobs.transition(created.jobId, { type: 'mark_awaiting_result' })

    const result = await completeExternalReviewJobWithReport({
      jobId: created.jobId,
      report: {
        bundleId: 'bundle-1',
        bundleHash: 'hash-1',
        platformId: 'claude-web',
        transport: 'manual',
        rawOutput: 'Looks good, one small issue.',
        receivedAt: 2000,
      },
    }, store)

    expect(result.report.reportId).toBeTruthy()
    expect(result.job.status).toBe('completed')
    expect(result.job.reportId).toBe(result.report.reportId)
    expect(result.job.completedAt).toBe(2000)
    expect((await store.jobs.get(created.jobId))?.reportId).toBe(result.report.reportId)
    expect(await store.reports.get(result.report.reportId)).toMatchObject({ bundleId: 'bundle-1' })
  })

  it('requires the job to be awaiting_result', async () => {
    const store = await stores()
    const created = await store.jobs.create({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'claude-web',
    })

    await expect(completeExternalReviewJobWithReport({
      jobId: created.jobId,
      report: {
        bundleId: 'bundle-1',
        bundleHash: 'hash-1',
        platformId: 'claude-web',
        transport: 'manual',
        rawOutput: 'Not ready.',
      },
    }, store)).rejects.toThrow(/awaiting_result/)
  })

  it('rejects report metadata that does not match the job', async () => {
    const store = await stores()
    const created = await store.jobs.create({
      bundleId: 'bundle-1',
      bundleHash: 'hash-1',
      platformId: 'claude-web',
    })
    await store.jobs.transition(created.jobId, { type: 'authorize' })
    await store.jobs.transition(created.jobId, { type: 'mark_awaiting_result' })

    await expect(completeExternalReviewJobWithReport({
      jobId: created.jobId,
      report: {
        bundleId: 'bundle-2',
        bundleHash: 'hash-1',
        platformId: 'claude-web',
        transport: 'manual',
        rawOutput: 'Wrong bundle.',
      },
    }, store)).rejects.toThrow(/does not match/)
  })
})
