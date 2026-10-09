/**
 * Smallest AIGC job loop on the Fleet host.
 *
 * Conversation agents call aigc.job_submit through HostTurnKernel. That action
 * stays approval-gated because the frozen row has no undo contract. This
 * module does not approve turns and it does not import Pi.
 *
 * Provider calls run only inside the admitted native effect. The correlation
 * record is an atomic file in the caller-supplied directory, the same
 * write-to-temp-then-rename replace as session.jsonl. It is the effect's
 * working record so a crash can inspect the provider job id. It is not a
 * second job database and it does not rewrite session.jsonl.
 *
 * A paid submit is not repeated. Stop before submit leaves no record. Stop or
 * crash after the provider id is committed restores as reconciling and recover
 * only inspects. Missing media bytes stay uncommitted.
 */

import { createHash } from 'node:crypto'
import { mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ActorRef } from './actor'
import type { FileAttachment } from './dto'
import { InternalActionId, type ActionInvocation } from './internal-action'
import { NativeEffectRegistry } from './native-effect-executor'
import { HostTurnKernel, type TurnOutcome } from './turn-admission'

export const AIGC_MEDIA_OPERATIONS = ['image.generate', 'video.generate'] as const
export type AigcMediaOperation = (typeof AIGC_MEDIA_OPERATIONS)[number]
export type AigcMediaKind = 'image' | 'video'

export interface AigcProviderSubmit {
  operation: AigcMediaOperation
  idempotencyKey: string
  promptDigest: string
  /** In-memory only. Callers must not copy this onto the job file or the snapshot. */
  prompt: string
}

export interface AigcProviderObservation {
  providerJobId: string
  phase: 'running' | 'completed' | 'unknown'
  mediaKind?: AigcMediaKind
  mimeType?: string
  fileName?: string
  bytes?: Uint8Array
  /** Explicit preview bytes. Absence is not a blank image. */
  previewBase64?: string
}

export interface AigcProvider {
  readonly providerId: string
  submit(input: AigcProviderSubmit): Promise<{ providerJobId: string }>
  inspect(providerJobId: string): Promise<AigcProviderObservation>
}

export interface AigcArtifact {
  kind: 'aigc_artifact'
  mediaKind: AigcMediaKind
  mimeType: string
  name: string
  path: string
  byteLength: number
  providerJobId: string
  idempotencyKey: string
  previewSrc?: string
}

export interface AigcJobRecord {
  invocationId: string
  sessionId: string
  idempotencyKey: string
  operation: AigcMediaOperation
  providerId: string
  promptDigest: string
  providerJobId?: string
  status: 'submitted' | 'completed'
  artifact?: AigcArtifact
}

export interface AigcHost {
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
  request(input: AigcJobCall): Promise<TurnOutcome>
  recover(kernel: HostTurnKernel, invocationId: string): Promise<TurnOutcome>
}

export interface AigcJobCall {
  invocationId: string
  sessionId: string
  actor: ActorRef
  operation: AigcMediaOperation
  prompt: string
  idempotencyKey: string
}

export interface AigcHostOptions {
  provider: AigcProvider
  directory: string
  now?: () => string
  /** Test latch. Production callers leave this unset. */
  prepareSubmit?: (signal: AbortSignal) => Promise<void>
  /** Test crash after the provider id is durable and before inspect. */
  crashAfterCommit?: boolean
}

const JOB_SUFFIX = '.job.json'

export function promptDigest(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex')
}

export function isAigcMediaOperation(value: unknown): value is AigcMediaOperation {
  return value === 'image.generate' || value === 'video.generate'
}

export function artifactPreviewAttachment(artifact: AigcArtifact): FileAttachment {
  const preview = artifact.previewSrc
  const base64 = preview?.startsWith('data:') ? preview.slice(preview.indexOf(',') + 1) : undefined
  return {
    type: artifact.mediaKind === 'image' ? 'image' : 'unknown',
    path: artifact.path,
    name: artifact.name,
    mimeType: artifact.mimeType,
    size: artifact.byteLength,
    ...(base64 ? { base64 } : {}),
  }
}

export function createAigcHost(options: AigcHostOptions): AigcHost {
  if (!options.directory.trim() || options.directory.split(/[\\/]/).includes('..')) {
    throw new Error('unsafe_job_directory')
  }
  const queue = new AigcJobQueue(options.directory, options.provider.providerId)
  const prompts = new Map<string, string>()
  const effects = new NativeEffectRegistry()
  effects.register(InternalActionId.AIGC_JOB_SUBMIT, (request) => executeJob(request, {
    provider: options.provider,
    queue,
    prompts,
    prepareSubmit: options.prepareSubmit,
    crashAfterCommit: options.crashAfterCommit === true,
  }))
  const kernel = new HostTurnKernel(undefined, {
    nativeEffects: effects,
    ...(options.now ? { now: options.now } : {}),
  })

  return {
    kernel,
    effects,
    request(input) {
      return requestAigcJob(kernel, prompts, input)
    },
    recover(active, invocationId) {
      return recoverAigcJob(active, queue, options.provider, invocationId)
    },
  }
}

async function requestAigcJob(
  kernel: HostTurnKernel,
  prompts: Map<string, string>,
  input: AigcJobCall,
): Promise<TurnOutcome> {
  if (!isAigcMediaOperation(input.operation) || input.prompt.trim().length === 0 || input.idempotencyKey.trim().length === 0) {
    return { status: 'failed', invocationId: input.invocationId, reason: 'invalid_job' }
  }
  prompts.set(input.invocationId, input.prompt)
  const callerKind = input.actor.kind === 'human' ? 'human_ui' : 'agent'
  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId: InternalActionId.AIGC_JOB_SUBMIT,
    payload: {
      invocationId: input.invocationId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      promptDigest: promptDigest(input.prompt),
    },
    targets: [],
    callerKind,
    sessionId: input.sessionId,
    createdAt: new Date().toISOString(),
  }
  const admitted = kernel.admit({ invocation, actor: input.actor })
  if (admitted.status !== 'admitted') return admitted
  return kernel.run(input.invocationId)
}

async function recoverAigcJob(
  kernel: HostTurnKernel,
  queue: AigcJobQueue,
  provider: AigcProvider,
  invocationId: string,
): Promise<TurnOutcome> {
  const turn = kernel.snapshot().turns.find((item) => item.request.invocation.invocationId === invocationId)
  if (!turn) return { status: 'failed', invocationId, reason: 'unknown_invocation' }
  if (turn.phase !== 'reconciling') {
    return { status: turn.phase === 'completed' ? 'completed' : 'failed', invocationId, reason: 'not_reconciling', output: turn.output }
  }
  const record = queue.read(invocationId)
  if (!record?.providerJobId) {
    return { status: 'reconciling', invocationId, reason: 'provider_job_missing' }
  }
  const observation = await provider.inspect(record.providerJobId)
  const artifact = queue.materialize(record, observation)
  if (!artifact) {
    return { status: 'reconciling', invocationId, reason: 'provider_unknown' }
  }
  return kernel.resolveReconciliation(invocationId, { status: 'completed', output: artifact })
}

async function executeJob(
  request: {
    payload: Record<string, unknown>
    sessionId: string
    signal: AbortSignal
    commit: () => void
  },
  deps: {
    provider: AigcProvider
    queue: AigcJobQueue
    prompts: Map<string, string>
    prepareSubmit?: (signal: AbortSignal) => Promise<void>
    crashAfterCommit: boolean
  },
): Promise<{ output: AigcArtifact }> {
  if (request.signal.aborted) throw abortError()
  const invocationId = typeof request.payload.invocationId === 'string' ? request.payload.invocationId : ''
  const operation = request.payload.operation
  const idempotencyKey = typeof request.payload.idempotencyKey === 'string' ? request.payload.idempotencyKey : ''
  const digest = typeof request.payload.promptDigest === 'string' ? request.payload.promptDigest : ''
  if (!invocationId || !isAigcMediaOperation(operation) || !idempotencyKey || !digest) {
    throw new Error('invalid_job')
  }

  const existing = deps.queue.findByIdempotency(idempotencyKey)
  if (existing?.artifact) {
    deps.prompts.delete(invocationId)
    return { output: existing.artifact }
  }

  let providerJobId = existing?.providerJobId
  if (!providerJobId) {
    if (deps.prepareSubmit) await deps.prepareSubmit(request.signal)
    if (request.signal.aborted) throw abortError()
    const prompt = deps.prompts.get(invocationId)
    if (!prompt) throw new Error('prompt_unavailable')
    const submitted = await deps.provider.submit({ operation, idempotencyKey, promptDigest: digest, prompt })
    providerJobId = submitted.providerJobId
  }

  const record: AigcJobRecord = {
    invocationId,
    sessionId: request.sessionId,
    idempotencyKey,
    operation,
    providerId: deps.provider.providerId,
    promptDigest: digest,
    providerJobId,
    status: 'submitted',
  }
  deps.queue.save(record)
  request.commit()
  deps.prompts.delete(invocationId)
  if (request.signal.aborted) throw abortError()
  if (deps.crashAfterCommit) throw new Error('crash_after_commit')

  const observation = await deps.provider.inspect(providerJobId)
  const artifact = deps.queue.materialize(record, observation)
  if (!artifact) throw new Error('provider_not_completed')
  return { output: artifact }
}

class AigcJobQueue {
  private readonly records = new Map<string, AigcJobRecord>()

  constructor(
    private readonly directory: string,
    private readonly providerId: string,
  ) {
    mkdirSync(directory, { recursive: true })
    let names: string[] = []
    try {
      names = readdirSync(directory)
    } catch {
      names = []
    }
    for (const name of names) {
      if (!name.endsWith(JOB_SUFFIX)) continue
      try {
        const parsed = JSON.parse(readFileSync(join(directory, name), 'utf8')) as AigcJobRecord
        if (parsed?.invocationId) this.records.set(parsed.invocationId, parsed)
      } catch {
        // A corrupt correlation file is ignored. The kernel snapshot still says reconciling.
      }
    }
  }

  read(invocationId: string): AigcJobRecord | undefined {
    return this.records.get(invocationId)
  }

  findByIdempotency(idempotencyKey: string): AigcJobRecord | undefined {
    for (const record of this.records.values()) {
      if (record.idempotencyKey === idempotencyKey && record.providerJobId) return record
    }
    return undefined
  }

  save(record: AigcJobRecord): void {
    const stored: AigcJobRecord = {
      ...record,
      providerId: this.providerId,
    }
    this.records.set(record.invocationId, stored)
    atomicWriteFile(this.fileFor(record.invocationId), `${JSON.stringify(stored)}\n`)
  }

  materialize(record: AigcJobRecord, observation: AigcProviderObservation): AigcArtifact | undefined {
    if (observation.phase !== 'completed') return undefined
    if (!observation.bytes || observation.bytes.byteLength === 0) return undefined
    if (typeof observation.mimeType !== 'string' || observation.mimeType.length === 0) return undefined
    const mediaKind = observation.mediaKind ?? mediaKindFor(record.operation)
    if (mediaKind !== 'image' && mediaKind !== 'video') return undefined
    const name = observation.fileName && observation.fileName.trim().length > 0
      ? observation.fileName
      : defaultName(mediaKind)
    const path = join(this.directory, `${safeId(record.invocationId)}-${name}`)
    atomicWriteFile(path, observation.bytes)
    const previewSrc = previewSrcFrom(observation.previewBase64, observation.mimeType)
    const artifact: AigcArtifact = {
      kind: 'aigc_artifact',
      mediaKind,
      mimeType: observation.mimeType,
      name,
      path,
      byteLength: observation.bytes.byteLength,
      providerJobId: observation.providerJobId,
      idempotencyKey: record.idempotencyKey,
      ...(previewSrc ? { previewSrc } : {}),
    }
    this.save({ ...record, providerJobId: observation.providerJobId, status: 'completed', artifact })
    return artifact
  }

  private fileFor(invocationId: string): string {
    return join(this.directory, `${safeId(invocationId)}${JOB_SUFFIX}`)
  }
}

function mediaKindFor(operation: AigcMediaOperation): AigcMediaKind {
  switch (operation) {
    case 'image.generate':
      return 'image'
    case 'video.generate':
      return 'video'
    default: {
      const unexpected: never = operation
      throw new Error(`Unhandled AIGC operation: ${String(unexpected)}`)
    }
  }
}

function defaultName(kind: AigcMediaKind): string {
  switch (kind) {
    case 'image':
      return 'frame.png'
    case 'video':
      return 'clip.mp4'
    default: {
      const unexpected: never = kind
      throw new Error(`Unhandled media kind: ${String(unexpected)}`)
    }
  }
}

function previewSrcFrom(previewBase64: string | undefined, mimeType: string): string | undefined {
  if (typeof previewBase64 !== 'string' || previewBase64.trim().length === 0) return undefined
  return `data:${mimeType};base64,${previewBase64}`
}

function safeId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '_')
  return cleaned.length > 0 ? cleaned : 'job'
}

function atomicWriteFile(filePath: string, body: string | Uint8Array): void {
  mkdirSync(dirname(filePath), { recursive: true })
  const tmpFile = `${filePath}.tmp`
  writeFileSync(tmpFile, body)
  try {
    unlinkSync(filePath)
  } catch {
    // First write has no previous file.
  }
  renameSync(tmpFile, filePath)
}

function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}
