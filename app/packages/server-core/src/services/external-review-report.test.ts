import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { ExternalReviewReportStore, createExternalReviewReport } from './external-review-report'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('external review report', () => {
  it('keeps Fleet token usage separate from unknown external cost', () => {
    const report = createExternalReviewReport({
      bundleId: 'bundle-1',
      bundleHash: 'abc123',
      platformId: 'example-ai-web',
      transport: 'web',
      rawOutput: 'No critical issues found.',
    }, 1000)

    expect(report.fleetTokenUsage).toEqual({ kind: 'actual', value: 0 })
    expect(report.externalCost.kind).toBe('unknown')
    expect(report.rawOutputHash).toHaveLength(64)
  })

  it('persists raw output and structured findings by bundle', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fleet-external-review-'))
    tempDirs.push(dir)
    const store = new ExternalReviewReportStore(dir)
    const saved = await store.save({
      bundleId: 'bundle-1',
      bundleHash: 'abc123',
      platformId: 'example-ai-web',
      transport: 'manual',
      rawOutput: 'High: missing authorization check.',
      findings: [{
        severity: 'high',
        title: 'Missing authorization check',
        evidence: 'handler.ts accepts an unchecked actor',
        recommendation: 'Validate actor permissions before mutation',
        relativePath: 'handler.ts',
        line: 42,
      }],
    })

    expect((await store.get(saved.reportId))?.rawOutput).toBe('High: missing authorization check.')
    const reports = await store.listByBundle('bundle-1')
    expect(reports).toHaveLength(1)
    expect(reports[0]?.findingCounts.high).toBe(1)
  })
})

