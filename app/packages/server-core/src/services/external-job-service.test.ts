/**
 * ExternalJobService：状态机 + external_ai_review / image_gen 生命周期 + 证据链（docs/31 §5 · D9）。
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '@craft-agent/shared/protocol'
import {
  ExternalJobService,
  assertExternalJobTransition,
  defaultPermissionLevel,
  packProjectForReview,
  type ExternalJobTimelinePayload,
  type ExternalReviewProvider,
  type ImageGenProvider,
} from './external-job-service'
import { externalJobPayloadToSessionEvent } from '../handlers/rpc/external-job'

const USER: ActorRef = { kind: 'user', displayName: 'Tester' }

describe('external job state machine', () => {
  it('allows valid transitions', () => {
    expect(() => assertExternalJobTransition('draft', 'pending_permission')).not.toThrow()
    expect(() => assertExternalJobTransition('queued', 'running')).not.toThrow()
    expect(() => assertExternalJobTransition('running', 'completed')).not.toThrow()
  })

  it('rejects invalid transitions', () => {
    expect(() => assertExternalJobTransition('completed', 'running')).toThrow()
    expect(() => assertExternalJobTransition('draft', 'completed')).toThrow()
  })

  it('deploy_publish defaults to L3', () => {
    expect(defaultPermissionLevel('deploy_publish')).toBe('L3')
    expect(defaultPermissionLevel('image_gen')).toBe('L2')
  })
})

describe('packProjectForReview', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ext-job-pack-'))
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'src', 'ok.ts'), 'export const ok = 1\n')
    writeFileSync(join(root, 'src', 'secret.ts'), 'const api_key = "sk-test-123456789012345678901234567890"\n')
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('records bundle hash, file manifest, and secret scan findings', () => {
    const pack = packProjectForReview({ workspaceRoot: root })
    expect(pack.bundleHash).toMatch(/^[a-f0-9]{64}$/)
    expect(pack.fileManifest.some(e => e.path === 'src/ok.ts' && e.included)).toBe(true)
    expect(pack.secretScan.scannedFiles).toBeGreaterThan(0)
    expect(pack.secretScan.findings.some(f => f.path === 'src/secret.ts')).toBe(true)
  })
})

describe('ExternalJobService lifecycle', () => {
  let root: string
  let events: ExternalJobTimelinePayload[]
  let service: ExternalJobService

  const reviewProvider: ExternalReviewProvider = {
    async submit({ platform, bundleHash }) {
      return {
        rawOutput: `Review from ${platform} for ${bundleHash.slice(0, 8)}`,
        reportSummary: '2 findings',
      }
    },
  }

  const imageProvider: ImageGenProvider = {
    async generate({ prompt }) {
      return { resultRef: `library://img/${prompt.length}`, externalCostNotes: 'platform unknown' }
    },
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ext-job-svc-'))
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'README.md'), '# demo\n')
    events = []
    service = new ExternalJobService(
      root,
      payload => events.push(payload),
      { reviewProvider, imageProvider },
    )
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('external_ai_review: create → confirm → run → completed with evidence chain', async () => {
    const job = service.create({
      type: 'external_ai_review',
      sessionId: 'sess-1',
      workspaceId: 'ws-1',
      actor: USER,
      target: { site: 'claude-web', provider: 'anthropic' },
      inputRefs: [{ kind: 'workspace_root', ref: root }, { kind: 'prompt', ref: 'architecture_review' }],
      tokensBefore: 12000,
    })
    expect(job.status).toBe('pending_permission')

    const confirmed = service.confirmPermission({
      jobId: job.id,
      confirmedBy: USER,
      summary: 'User confirmed external review to Claude Web',
      userAuthorizedLogin: true,
    })
    expect(confirmed.status).toBe('queued')
    expect(confirmed.evidence?.bundleHash).toMatch(/^[a-f0-9]{64}$/)
    expect(confirmed.evidence?.fileManifest.length).toBeGreaterThan(0)
    expect(confirmed.evidence?.targetPlatform).toBe('claude-web')
    expect(confirmed.evidence?.permission.userAuthorizedLogin).toBe(true)

    const done = await service.run(job.id, 12500)
    expect(done.status).toBe('completed')
    expect(done.evidence?.rawOutput).toContain('Review from claude-web')
    expect(done.resultRefs?.length).toBe(1)

    const fleetCost = done.costs.find(c => c.category === 'fleet_api_tokens')
    expect(fleetCost?.tokensBefore).toBe(12000)
    expect(fleetCost?.tokensAfter).toBe(12500)
    expect(fleetCost?.truth).toBe('real')

    const extCost = done.costs.find(c => c.category === 'external_platform')
    expect(extCost?.truth).toBe('unknown')

    const savings = done.costs.find(c => c.category === 'estimated_savings')
    expect(savings?.truth).toBe('estimated')

    expect(events.some(e => e.status === 'completed')).toBe(true)
    const event = externalJobPayloadToSessionEvent(events[events.length - 1]!)
    expect(event.type).toBe('external_job_completed')
    if (event.type === 'external_job_completed') {
      expect(event.status).toBe('completed')
    }
  })

  it('rejects permission confirm without user-authorized login', () => {
    const job = service.create({
      type: 'external_ai_review',
      sessionId: 'sess-1',
      workspaceId: 'ws-1',
      actor: USER,
      target: { site: 'chatgpt-web' },
      inputRefs: [{ kind: 'workspace_root', ref: root }],
    })
    expect(() => service.confirmPermission({
      jobId: job.id,
      confirmedBy: USER,
      summary: 'no login',
      userAuthorizedLogin: false,
    })).toThrow(/user-authorized login/)
  })

  it('image_gen: confirm → run → completed with separated cost labels', async () => {
    const job = service.create({
      type: 'image_gen',
      sessionId: 'sess-2',
      workspaceId: 'ws-1',
      actor: USER,
      target: { provider: 'stub', model: 'sdxl' },
      inputRefs: [{ kind: 'prompt', ref: 'a red cube on white' }],
      permissionLevel: 'L2',
    })
    expect(job.status).toBe('pending_permission')

    service.confirmPermission({
      jobId: job.id,
      confirmedBy: USER,
      summary: 'User authorized image generation',
      userAuthorizedLogin: true,
    })

    const done = await service.run(job.id)
    expect(done.status).toBe('completed')
    expect(done.resultRefs?.[0]).toContain('library://img/')
    expect(done.costs.some(c => c.category === 'external_platform' && c.truth === 'unknown')).toBe(true)
  })

  it('cancel stops non-terminal job', () => {
    const job = service.create({
      type: 'image_gen',
      sessionId: 'sess-3',
      workspaceId: 'ws-1',
      actor: USER,
      target: { provider: 'stub' },
      inputRefs: [{ kind: 'prompt', ref: 'x' }],
    })
    service.confirmPermission({
      jobId: job.id,
      confirmedBy: USER,
      summary: 'ok',
      userAuthorizedLogin: true,
    })
    const cancelled = service.cancel(job.id)
    expect(cancelled.status).toBe('cancelled')
    expect(() => service.cancel(job.id)).toThrow(/terminal/)
  })

  it('list and get persist across service instances', async () => {
    const job = service.create({
      type: 'image_gen',
      sessionId: 'sess-4',
      workspaceId: 'ws-1',
      actor: USER,
      target: { provider: 'stub' },
      inputRefs: [{ kind: 'prompt', ref: 'persist' }],
    })
    service.confirmPermission({
      jobId: job.id,
      confirmedBy: USER,
      summary: 'ok',
      userAuthorizedLogin: true,
    })
    await service.run(job.id)
    const reloaded = new ExternalJobService(root)
    expect(reloaded.get(job.id)?.id).toBe(job.id)
    expect(reloaded.list('sess-4').some(j => j.id === job.id)).toBe(true)
  })
})
