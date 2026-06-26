/**
 * External Job 服务（docs/31 §5 · D9/D14 · docs/16）。
 *
 * 生图/生视频/图转3D/网页生成/外部审查统一 job 抽象：创建→权限→运行→轮询→完成/失败/取消，
 * 证据链（平台、权限确认、原始输出、token before/after、真实/估算/未知成本、回滚点）。
 *
 * 类型从 Lead 冻结的 `shared/protocol/external-job.ts` re-export。
 * LOCAL_ONLY；落 `<workspace>/.fleet/external-jobs/`。
 */

import { createHash, randomUUID } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import type { ActorRef } from '@craft-agent/shared/protocol'
import {
  EXTERNAL_JOB_TYPES,
  EXTERNAL_JOB_STATUSES,
} from '@craft-agent/shared/protocol'
import type {
  ExternalJobType,
  ExternalJobStatus,
  CostTruth,
  ExternalJobCostCategory,
  ExternalJobCostEntry,
  ExternalJobPermissionRecord,
  SecretScanFinding,
  ProjectPackManifestEntry,
  ExternalAiReviewEvidence,
  ExternalJobInputRef,
  ExternalJobTarget,
  ExternalJobRecord,
  CreateExternalJobInput,
  ConfirmExternalJobPermissionInput,
  ExternalJobTimelinePayload,
} from '@craft-agent/shared/protocol'

// Re-export contract types so existing consumers don't break (rule: single source of truth).
export type {
  ExternalJobType,
  ExternalJobStatus,
  CostTruth,
  ExternalJobCostCategory,
  ExternalJobCostEntry,
  ExternalJobPermissionRecord,
  SecretScanFinding,
  ProjectPackManifestEntry,
  ExternalAiReviewEvidence,
  ExternalJobInputRef,
  ExternalJobTarget,
  ExternalJobRecord,
  CreateExternalJobInput,
  ConfirmExternalJobPermissionInput,
  ExternalJobTimelinePayload,
}

export { EXTERNAL_JOB_TYPES, EXTERNAL_JOB_STATUSES }

export type ExternalJobEventEmitter = (payload: ExternalJobTimelinePayload) => void

// ---------------------------------------------------------------------------
// State machine
// ---------------------------------------------------------------------------

const TERMINAL: ReadonlySet<ExternalJobStatus> = new Set(['completed', 'failed', 'cancelled'])

const TRANSITIONS: Record<ExternalJobStatus, readonly ExternalJobStatus[]> = {
  draft: ['pending_permission', 'queued', 'cancelled'],
  pending_permission: ['queued', 'cancelled'],
  queued: ['running', 'cancelled'],
  running: ['polling', 'completed', 'failed', 'cancelled'],
  polling: ['completed', 'failed', 'cancelled'],
  completed: [],
  failed: [],
  cancelled: [],
}

export function assertExternalJobTransition(from: ExternalJobStatus, to: ExternalJobStatus): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new Error(`Invalid external job transition: ${from} → ${to}`)
  }
}

export function defaultPermissionLevel(type: ExternalJobType): 'L2' | 'L3' {
  return type === 'deploy_publish' ? 'L3' : 'L2'
}

// ---------------------------------------------------------------------------
// Project pack + secret scan (repomix-style behavior, no upstream copy)
// ---------------------------------------------------------------------------

const SECRET_PATTERNS: Array<{ rule: string; pattern: RegExp; severity: SecretScanFinding['severity'] }> = [
  { rule: 'api_key_assignment', pattern: /(?:api[_-]?key|secret[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{8,}/i, severity: 'high' },
  { rule: 'aws_access_key', pattern: /AKIA[0-9A-Z]{16}/, severity: 'high' },
  { rule: 'private_key_block', pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/, severity: 'high' },
  { rule: 'bearer_token', pattern: /Bearer\s+[A-Za-z0-9_\-.]{20,}/, severity: 'medium' },
]

const PACK_SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.fleet', 'coverage'])
const PACK_MAX_FILES = 500
const PACK_MAX_BYTES = 2_000_000
const PACK_MAX_FILE_BYTES = 256_000

export interface PackProjectInput {
  workspaceRoot: string
  scope?: 'workspace' | 'git_staged'
}

export interface PackProjectResult {
  bundleHash: string
  fileManifest: ProjectPackManifestEntry[]
  secretScan: ExternalAiReviewEvidence['secretScan']
  bundleText: string
}

function walkProjectFiles(root: string): ProjectPackManifestEntry[] {
  const entries: ProjectPackManifestEntry[] = []
  const stack: string[] = [root]

  while (stack.length > 0 && entries.length < PACK_MAX_FILES) {
    const dir = stack.pop()!
    let names: string[]
    try {
      names = readdirSync(dir)
    } catch {
      continue
    }
    for (const name of names) {
      if (PACK_SKIP_DIRS.has(name)) continue
      const full = join(dir, name)
      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }
      if (st.isDirectory()) {
        stack.push(full)
        continue
      }
      if (!st.isFile()) continue
      const rel = relative(root, full)
      if (st.size > PACK_MAX_FILE_BYTES) {
        entries.push({ path: rel, size: st.size, included: false, reason: 'file_too_large' })
        continue
      }
      entries.push({ path: rel, size: st.size, included: true })
    }
  }
  return entries
}

function scanSecrets(root: string, manifest: ProjectPackManifestEntry[]): ExternalAiReviewEvidence['secretScan'] {
  const findings: SecretScanFinding[] = []
  let scanned = 0
  for (const entry of manifest) {
    if (!entry.included) continue
    const full = join(root, entry.path)
    let content: string
    try {
      content = readFileSync(full, 'utf8')
    } catch {
      continue
    }
    scanned += 1
    for (const { rule, pattern, severity } of SECRET_PATTERNS) {
      const match = pattern.exec(content)
      if (match) {
        findings.push({
          path: entry.path,
          rule,
          severity,
          excerpt: match[0].slice(0, 80),
        })
      }
    }
  }
  return { scannedFiles: scanned, findings }
}

export function packProjectForReview(input: PackProjectInput): PackProjectResult {
  const root = resolve(input.workspaceRoot)
  const manifest = walkProjectFiles(root)
  const included = manifest.filter(e => e.included)
  let totalBytes = 0
  const chunks: string[] = []
  for (const entry of included) {
    if (totalBytes >= PACK_MAX_BYTES) {
      entry.included = false
      entry.reason = 'bundle_size_cap'
      continue
    }
    const full = join(root, entry.path)
    try {
      const text = readFileSync(full, 'utf8')
      totalBytes += text.length
      chunks.push(`--- ${entry.path} ---\n${text}`)
    } catch {
      entry.included = false
      entry.reason = 'read_error'
    }
  }
  const bundleText = chunks.join('\n\n')
  const bundleHash = createHash('sha256').update(bundleText).digest('hex')
  const secretScan = scanSecrets(root, manifest)
  return { bundleHash, fileManifest: manifest, secretScan, bundleText }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export interface ExternalJobRunOptions {
  /** Stub provider for tests; production uses browser handoff (user-authorized only). */
  reviewProvider?: ExternalReviewProvider
  imageProvider?: ImageGenProvider
}

export interface ExternalReviewProvider {
  submit(input: {
    platform: string
    bundleHash: string
    template?: string
    userAuthorizedLogin: boolean
  }): Promise<{ rawOutput: string; reportSummary: string }>
}

export interface ImageGenProvider {
  generate(input: { prompt: string; model?: string }): Promise<{ resultRef: string; externalCostNotes?: string }>
}

const defaultReviewProvider: ExternalReviewProvider = {
  async submit({ platform, bundleHash, template, userAuthorizedLogin }) {
    if (!userAuthorizedLogin) {
      throw new Error('External AI review requires user-authorized login; automatic registration is not allowed')
    }
    return {
      rawOutput: `[stub] Review submitted to ${platform} for bundle ${bundleHash.slice(0, 12)}… template=${template ?? 'default'}`,
      reportSummary: 'Stub review: no critical issues detected in packaged scope.',
    }
  },
}

const defaultImageProvider: ImageGenProvider = {
  async generate({ prompt, model }) {
    return {
      resultRef: `library://generated/${createHash('sha256').update(`${model ?? 'default'}:${prompt}`).digest('hex').slice(0, 16)}.png`,
      externalCostNotes: 'External platform cost unknown; not Fleet API tokens.',
    }
  },
}

export class ExternalJobService {
  private readonly jobsDir: string
  private readonly workspaceRoot: string
  private readonly emit: ExternalJobEventEmitter
  private readonly reviewProvider: ExternalReviewProvider
  private readonly imageProvider: ImageGenProvider

  constructor(
    workspaceRoot: string,
    emit: ExternalJobEventEmitter = () => {},
    options: ExternalJobRunOptions = {},
  ) {
    this.workspaceRoot = resolve(workspaceRoot)
    this.jobsDir = join(this.workspaceRoot, '.fleet', 'external-jobs')
    this.emit = emit
    this.reviewProvider = options.reviewProvider ?? defaultReviewProvider
    this.imageProvider = options.imageProvider ?? defaultImageProvider
    mkdirSync(this.jobsDir, { recursive: true })
  }

  create(input: CreateExternalJobInput): ExternalJobRecord {
    assertJobType(input.type)
    const now = Date.now()
    const permissionLevel = input.permissionLevel ?? defaultPermissionLevel(input.type)
    const job: ExternalJobRecord = {
      id: randomUUID(),
      type: input.type,
      sessionId: input.sessionId,
      workspaceId: input.workspaceId,
      actor: input.actor,
      status: 'pending_permission',
      target: input.target,
      inputRefs: input.inputRefs,
      permissionLevel,
      costs: buildInitialCosts(input.tokensBefore),
      rollbackPointId: randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    this.save(job)
    this.emitTimeline(job, `External job created (${job.type})`)
    return job
  }

  get(jobId: string): ExternalJobRecord | null {
    return this.load(jobId)
  }

  list(sessionId?: string): ExternalJobRecord[] {
    if (!existsSync(this.jobsDir)) return []
    const ids = readdirSync(this.jobsDir).filter(f => f.endsWith('.json'))
    const jobs: ExternalJobRecord[] = []
    for (const file of ids) {
      const job = this.load(file.replace(/\.json$/, ''))
      if (job && (!sessionId || job.sessionId === sessionId)) jobs.push(job)
    }
    return jobs.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  confirmPermission(input: ConfirmExternalJobPermissionInput): ExternalJobRecord {
    const job = this.requireJob(input.jobId)
    if (job.status !== 'pending_permission') {
      throw new Error(`Job ${input.jobId} is not awaiting permission (${job.status})`)
    }
    if (!input.userAuthorizedLogin) {
      throw new Error('External jobs require explicit user-authorized login confirmation')
    }
    job.permission = {
      confirmedAt: Date.now(),
      confirmedBy: input.confirmedBy,
      permissionLevel: job.permissionLevel,
      summary: input.summary,
      userAuthorizedLogin: true,
    }
    if (job.type === 'external_ai_review') {
      const pack = packProjectForReview({ workspaceRoot: this.workspaceRoot })
      job.evidence = {
        bundleHash: pack.bundleHash,
        fileManifest: pack.fileManifest,
        secretScan: pack.secretScan,
        targetPlatform: job.target.site ?? job.target.provider ?? 'unknown',
        reviewTemplate: job.inputRefs.find(r => r.kind === 'prompt')?.ref,
        permission: job.permission,
      }
    }
    this.transition(job, 'queued')
    this.emitTimeline(job, 'Permission confirmed; job queued')
    return job
  }

  async run(jobId: string, tokensAfter?: number): Promise<ExternalJobRecord> {
    const job = this.requireJob(jobId)
    if (job.status !== 'queued') {
      throw new Error(`Job ${jobId} cannot run from status ${job.status}`)
    }
    this.transition(job, 'running')
    this.emitTimeline(job, 'Job running')

    try {
      if (job.type === 'external_ai_review') {
        await this.runExternalAiReview(job)
      } else if (job.type === 'image_gen') {
        await this.runImageGen(job)
      } else {
        throw new Error(`Job type ${job.type} is not implemented in this wave`)
      }
      if (typeof tokensAfter === 'number') {
        appendTokenCost(job, tokensAfter)
      }
      this.transition(job, 'completed')
      job.completedAt = Date.now()
      this.emitTimeline(job, 'Job completed')
    } catch (error) {
      job.error = error instanceof Error ? error.message : String(error)
      this.transition(job, 'failed')
      this.emitTimeline(job, `Job failed: ${job.error}`)
    }
    this.save(job)
    return job
  }

  async poll(jobId: string): Promise<ExternalJobRecord> {
    const job = this.requireJob(jobId)
    if (job.status !== 'polling') {
      return job
    }
    // Stub polling: immediately complete for async providers in future waves.
    this.transition(job, 'completed')
    job.completedAt = Date.now()
    this.save(job)
    this.emitTimeline(job, 'Job polling complete')
    return job
  }

  cancel(jobId: string): ExternalJobRecord {
    const job = this.requireJob(jobId)
    if (TERMINAL.has(job.status)) {
      throw new Error(`Job ${jobId} already terminal (${job.status})`)
    }
    this.transition(job, 'cancelled')
    this.emitTimeline(job, 'Job cancelled')
    return job
  }

  private async runExternalAiReview(job: ExternalJobRecord): Promise<void> {
    if (!job.permission?.userAuthorizedLogin) {
      throw new Error('External AI review requires permission confirmation with user-authorized login')
    }
    let evidence = job.evidence
    if (!evidence) {
      const pack = packProjectForReview({ workspaceRoot: this.workspaceRoot })
      evidence = {
        bundleHash: pack.bundleHash,
        fileManifest: pack.fileManifest,
        secretScan: pack.secretScan,
        targetPlatform: job.target.site ?? job.target.provider ?? 'unknown',
        reviewTemplate: job.inputRefs.find(r => r.kind === 'prompt')?.ref,
        permission: job.permission,
      }
      job.evidence = evidence
    }
    const platform = evidence.targetPlatform
    const result = await this.reviewProvider.submit({
      platform,
      bundleHash: evidence.bundleHash,
      template: evidence.reviewTemplate,
      userAuthorizedLogin: evidence.permission.userAuthorizedLogin,
    })
    evidence.rawOutput = result.rawOutput
    evidence.reportSummary = result.reportSummary
    job.resultRefs = [`fleet://external-jobs/${job.id}/report`]
    job.costs.push({
      category: 'external_platform',
      label: 'External AI platform cost',
      truth: 'unknown',
      notes: 'User account / platform quota; not Fleet API tokens.',
    })
    job.costs.push({
      category: 'estimated_savings',
      label: 'Estimated API cost avoided',
      truth: 'estimated',
      notes: 'If equivalent review used Fleet API routing; estimate only.',
    })
  }

  private async runImageGen(job: ExternalJobRecord): Promise<void> {
    if (!job.permission?.userAuthorizedLogin) {
      throw new Error('Image generation requires permission confirmation')
    }
    const prompt = job.inputRefs.find(r => r.kind === 'prompt')?.ref
    if (!prompt) throw new Error('image_gen requires a prompt input ref')
    const result = await this.imageProvider.generate({
      prompt,
      model: job.target.model,
    })
    job.resultRefs = [result.resultRef]
    job.costs.push({
      category: 'external_platform',
      label: 'Image generation platform cost',
      truth: 'unknown',
      notes: result.externalCostNotes,
    })
  }

  private transition(job: ExternalJobRecord, to: ExternalJobStatus): void {
    assertExternalJobTransition(job.status, to)
    job.status = to
    job.updatedAt = Date.now()
    this.save(job)
  }

  private requireJob(jobId: string): ExternalJobRecord {
    const job = this.load(jobId)
    if (!job) throw new Error(`External job not found: ${jobId}`)
    return job
  }

  private jobPath(jobId: string): string {
    return join(this.jobsDir, `${jobId}.json`)
  }

  private load(jobId: string): ExternalJobRecord | null {
    const path = this.jobPath(jobId)
    if (!existsSync(path)) return null
    try {
      return JSON.parse(readFileSync(path, 'utf8')) as ExternalJobRecord
    } catch {
      return null
    }
  }

  private save(job: ExternalJobRecord): void {
    mkdirSync(dirname(this.jobPath(job.id)), { recursive: true })
    const temp = `${this.jobPath(job.id)}.${process.pid}.tmp`
    try {
      writeFileSync(temp, `${JSON.stringify(job, null, 2)}\n`, 'utf8')
      renameSync(temp, this.jobPath(job.id))
    } catch (error) {
      if (existsSync(temp)) unlinkSync(temp)
      throw error
    }
  }

  private emitTimeline(job: ExternalJobRecord, message: string): void {
    this.emit({
      type: 'external_job',
      sessionId: job.sessionId,
      jobId: job.id,
      jobType: job.type,
      status: job.status,
      message,
      timestamp: Date.now(),
    })
  }
}

function assertJobType(type: string): asserts type is ExternalJobType {
  if (!(EXTERNAL_JOB_TYPES as readonly string[]).includes(type)) {
    throw new Error(`Unknown external job type: ${type}`)
  }
}

function buildInitialCosts(tokensBefore?: number): ExternalJobCostEntry[] {
  const costs: ExternalJobCostEntry[] = []
  if (typeof tokensBefore === 'number') {
    costs.push({
      category: 'fleet_api_tokens',
      label: 'Fleet session tokens (before job)',
      tokensBefore,
      truth: 'real',
    })
  }
  return costs
}

function appendTokenCost(job: ExternalJobRecord, tokensAfter: number): void {
  const beforeEntry = job.costs.find(c => c.category === 'fleet_api_tokens')
  if (beforeEntry) {
    beforeEntry.tokensAfter = tokensAfter
    if (typeof beforeEntry.tokensBefore === 'number') {
      beforeEntry.notes = `Delta: ${tokensAfter - beforeEntry.tokensBefore} tokens`
    }
  } else {
    job.costs.push({
      category: 'fleet_api_tokens',
      label: 'Fleet session tokens (after job)',
      tokensAfter,
      truth: 'real',
    })
  }
}
