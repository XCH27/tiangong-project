import type {
  CompleteExternalReviewJobWithReportInput,
  CompleteExternalReviewJobWithReportResult,
  ExternalReviewJob,
  ExternalReviewReport,
} from '@craft-agent/shared/protocol'
import type { ExternalReviewJobStore } from './external-review-job-service'
import type { ExternalReviewReportStore } from './external-review-report'

export async function completeExternalReviewJobWithReport(
  input: CompleteExternalReviewJobWithReportInput,
  stores: {
    jobs: ExternalReviewJobStore
    reports: ExternalReviewReportStore
  },
): Promise<CompleteExternalReviewJobWithReportResult> {
  const jobId = input.jobId?.trim()
  if (!jobId) throw new Error('jobId is required')

  const job = await stores.jobs.get(jobId)
  if (!job) throw new Error(`External review job not found: ${jobId}`)
  if (job.status !== 'awaiting_result') {
    throw new Error(`External review job ${jobId} must be awaiting_result before completing with a report`)
  }

  assertReportMatchesJob(input.report, job)

  const report: ExternalReviewReport = await stores.reports.save(input.report)
  const completed = await stores.jobs.transition(jobId, {
    type: 'complete',
    reportId: report.reportId,
    completedAt: report.receivedAt,
  })

  return { job: completed, report }
}

function assertReportMatchesJob(
  report: CompleteExternalReviewJobWithReportInput['report'],
  job: ExternalReviewJob,
): void {
  if (report.bundleId !== job.bundleId) {
    throw new Error(`Report bundleId ${report.bundleId} does not match job bundleId ${job.bundleId}`)
  }
  if (report.bundleHash !== job.bundleHash) {
    throw new Error(`Report bundleHash ${report.bundleHash} does not match job bundleHash ${job.bundleHash}`)
  }
  if (report.platformId !== job.platformId) {
    throw new Error(`Report platformId ${report.platformId} does not match job platformId ${job.platformId}`)
  }
}
