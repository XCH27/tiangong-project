import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import {
  artifactPreviewAttachment,
  createAigcHost,
  type AigcProvider,
  type AigcProviderObservation,
  type AigcProviderSubmit,
} from '../aigc-job'
import { HostTurnKernel } from '../turn-admission'

const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const human: ActorRef = { kind: 'human', id: 'owner-1', displayName: 'Owner' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-aigc-'))
  dirs.push(dir)
  return dir
}

class FakeAigcProvider implements AigcProvider {
  readonly providerId = 'fake-aigc'
  readonly submits: AigcProviderSubmit[] = []
  phase: AigcProviderObservation['phase'] = 'completed'
  previewBase64?: string
  mimeType = 'image/png'
  bytes: Uint8Array = new Uint8Array([1, 2, 3, 4])
  private readonly jobs = new Map<string, AigcProviderObservation & { idempotencyKey: string }>()

  async submit(input: AigcProviderSubmit): Promise<{ providerJobId: string }> {
    const prior = [...this.jobs.values()].find((job) => job.idempotencyKey === input.idempotencyKey)
    if (prior) return { providerJobId: prior.providerJobId }
    const providerJobId = `fake-${this.submits.length + 1}`
    this.submits.push(input)
    const mediaKind = input.operation === 'video.generate' ? 'video' : 'image'
    this.jobs.set(providerJobId, {
      providerJobId,
      idempotencyKey: input.idempotencyKey,
      phase: this.phase,
      mediaKind,
      mimeType: mediaKind === 'video' ? 'video/mp4' : this.mimeType,
      fileName: mediaKind === 'video' ? 'clip.mp4' : 'frame.png',
      bytes: this.bytes,
      ...(this.previewBase64 ? { previewBase64: this.previewBase64 } : {}),
    })
    return { providerJobId }
  }

  async inspect(providerJobId: string): Promise<AigcProviderObservation> {
    const job = this.jobs.get(providerJobId)
    if (!job) return { providerJobId, phase: 'unknown' }
    return { ...job, phase: this.phase, bytes: this.bytes }
  }
}

describe('aigc job loop', () => {
  test('the job module does not import Pi or approve the turn itself', () => {
    const source = readFileSync(new URL('../aigc-job.ts', import.meta.url), 'utf8')
    expect(source.includes('@earendil-works')).toBe(false)
    expect(source.includes('full Pi SDK')).toBe(false)
    expect(source.includes('kernel.approve')).toBe(false)
  })

  test('an agent submit stays approval-gated and does not call the provider', async () => {
    const provider = new FakeAigcProvider()
    const host = createAigcHost({ provider, directory: workspace() })
    const outcome = await host.request({
      invocationId: 'inv-job',
      sessionId: 'session-1',
      actor: agent,
      operation: 'image.generate',
      prompt: 'a red square',
      idempotencyKey: 'idem-1',
    })
    expect(outcome).toMatchObject({ status: 'approval_required', reason: 'undo_contract_missing' })
    expect(provider.submits).toHaveLength(0)
    await expect(host.kernel.run('inv-job')).resolves.toMatchObject({ status: 'approval_required' })
    expect(provider.submits).toHaveLength(0)
  })

  test('after approval the fake provider writes a previewable image artifact', async () => {
    const provider = new FakeAigcProvider()
    provider.previewBase64 = 'AQID'
    const root = workspace()
    const host = createAigcHost({ provider, directory: root })
    await host.request({
      invocationId: 'inv-image',
      sessionId: 'session-1',
      actor: agent,
      operation: 'image.generate',
      prompt: 'secret-prompt-value',
      idempotencyKey: 'idem-image',
    })
    expect(host.kernel.approve('inv-image', human).status).toBe('admitted')
    const completed = await host.kernel.run('inv-image')
    expect(completed.status).toBe('completed')
    const artifact = completed.output as {
      kind: string
      path: string
      previewSrc?: string
      mediaKind: string
      mimeType: string
    }
    expect(artifact.kind).toBe('aigc_artifact')
    expect(artifact.mediaKind).toBe('image')
    expect(artifact.mimeType).toBe('image/png')
    expect(artifact.previewSrc).toBe('data:image/png;base64,AQID')
    expect(existsSync(artifact.path)).toBe(true)
    expect([...readFileSync(artifact.path)]).toEqual([1, 2, 3, 4])
    const preview = artifactPreviewAttachment(artifact as never)
    expect(preview.type).toBe('image')
    expect(preview.base64).toBe('AQID')
    const dumped = JSON.stringify(host.kernel.snapshot()) + readdirSync(root).filter((name) => name.endsWith('.job.json')).map((name) => readFileSync(join(root, name), 'utf8')).join('\n')
    expect(dumped.includes('secret-prompt-value')).toBe(false)
    expect(provider.submits[0]?.prompt).toBe('secret-prompt-value')
  })

  test('a video job uses the same admission path and stays previewable from an explicit preview', async () => {
    const provider = new FakeAigcProvider()
    provider.previewBase64 = 'AQID'
    const host = createAigcHost({ provider, directory: workspace() })
    await host.request({
      invocationId: 'inv-video',
      sessionId: 'session-1',
      actor: agent,
      operation: 'video.generate',
      prompt: 'a short pan',
      idempotencyKey: 'idem-video',
    })
    host.kernel.approve('inv-video', human)
    const completed = await host.kernel.run('inv-video')
    expect(completed.output).toMatchObject({
      kind: 'aigc_artifact',
      mediaKind: 'video',
      mimeType: 'video/mp4',
      previewSrc: 'data:video/mp4;base64,AQID',
    })
    expect(artifactPreviewAttachment(completed.output as never).type).toBe('unknown')
  })

  test('a missing preview is omitted rather than invented', async () => {
    const provider = new FakeAigcProvider()
    const host = createAigcHost({ provider, directory: workspace() })
    await host.request({
      invocationId: 'inv-plain',
      sessionId: 'session-1',
      actor: agent,
      operation: 'image.generate',
      prompt: 'no thumb',
      idempotencyKey: 'idem-plain',
    })
    host.kernel.approve('inv-plain', human)
    const completed = await host.kernel.run('inv-plain')
    expect(completed.output).toMatchObject({ kind: 'aigc_artifact' })
    expect((completed.output as { previewSrc?: string }).previewSrc).toBeUndefined()
    expect(artifactPreviewAttachment(completed.output as never).base64).toBeUndefined()
  })

  test('stop before submit does not call the provider or write a job file', async () => {
    const provider = new FakeAigcProvider()
    const root = workspace()
    let release: (() => void) | undefined
    const started = new Promise<void>((resolve) => {
      release = resolve
    })
    const host = createAigcHost({
      provider,
      directory: root,
      prepareSubmit: (signal) => new Promise((_resolve, reject) => {
        release?.()
        if (signal.aborted) {
          reject(abortError())
          return
        }
        signal.addEventListener('abort', () => reject(abortError()))
      }),
    })
    await host.request({
      invocationId: 'inv-stop',
      sessionId: 'session-1',
      actor: agent,
      operation: 'image.generate',
      prompt: 'stop me',
      idempotencyKey: 'idem-stop',
    })
    host.kernel.approve('inv-stop', human)
    const running = host.kernel.run('inv-stop')
    await started
    expect(host.kernel.stop('inv-stop').reason).toBe('stop_requested')
    await expect(running).resolves.toMatchObject({ status: 'interrupted' })
    expect(provider.submits).toHaveLength(0)
    expect(readdirSync(root).filter((name) => name.endsWith('.job.json'))).toEqual([])
  })

  test('a crash after the provider id recovers by inspect and does not submit again', async () => {
    const provider = new FakeAigcProvider()
    const root = workspace()
    const first = createAigcHost({ provider, directory: root, crashAfterCommit: true })
    await first.request({
      invocationId: 'inv-crash',
      sessionId: 'session-1',
      actor: agent,
      operation: 'image.generate',
      prompt: 'keep the id',
      idempotencyKey: 'idem-crash',
    })
    first.kernel.approve('inv-crash', human)
    await expect(first.kernel.run('inv-crash')).resolves.toMatchObject({ status: 'reconciling' })
    expect(provider.submits).toHaveLength(1)
    expect(readdirSync(root).some((name) => name.endsWith('.png'))).toBe(false)

    const snapshot = JSON.parse(JSON.stringify(first.kernel.snapshot()))
    const revived = createAigcHost({ provider, directory: root })
    const restored = HostTurnKernel.restore(snapshot, undefined, { nativeEffects: revived.effects })
    await restored.run('inv-crash')
    const recovered = await revived.recover(restored, 'inv-crash')
    expect(recovered.status).toBe('completed')
    expect((recovered.output as { kind: string }).kind).toBe('aigc_artifact')
    expect(provider.submits).toHaveLength(1)
    expect(existsSync((recovered.output as { path: string }).path)).toBe(true)
  })

  test('the same idempotency key does not submit a second provider job', async () => {
    const provider = new FakeAigcProvider()
    const host = createAigcHost({ provider, directory: workspace() })
    await host.request({
      invocationId: 'inv-a',
      sessionId: 'session-1',
      actor: agent,
      operation: 'image.generate',
      prompt: 'once',
      idempotencyKey: 'idem-same',
    })
    host.kernel.approve('inv-a', human)
    await host.kernel.run('inv-a')
    await host.request({
      invocationId: 'inv-b',
      sessionId: 'session-1',
      actor: human,
      operation: 'image.generate',
      prompt: 'once',
      idempotencyKey: 'idem-same',
    })
    host.kernel.approve('inv-b', human)
    const second = await host.kernel.run('inv-b')
    expect(second.status).toBe('completed')
    expect((second.output as { kind: string }).kind).toBe('aigc_artifact')
    expect(provider.submits).toHaveLength(1)
  })

  test('an unknown provider phase stays reconciling and is not resubmitted', async () => {
    const provider = new FakeAigcProvider()
    provider.phase = 'unknown'
    const host = createAigcHost({ provider, directory: workspace() })
    await host.request({
      invocationId: 'inv-unknown',
      sessionId: 'session-1',
      actor: agent,
      operation: 'image.generate',
      prompt: 'wait',
      idempotencyKey: 'idem-unknown',
    })
    host.kernel.approve('inv-unknown', human)
    await expect(host.kernel.run('inv-unknown')).resolves.toMatchObject({ status: 'reconciling' })
    provider.phase = 'completed'
    const recovered = await host.recover(host.kernel, 'inv-unknown')
    expect(recovered.status).toBe('completed')
    expect(provider.submits).toHaveLength(1)
  })
})

function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}
