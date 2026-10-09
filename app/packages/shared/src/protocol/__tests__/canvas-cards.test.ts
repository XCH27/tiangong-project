import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import {
  type AigcProvider,
  type AigcProviderObservation,
  type AigcProviderSubmit,
  artifactPreviewAttachment,
  createAigcHost,
} from '../aigc-job'
import {
  createCanvasCardHost,
  type CanvasCardHost,
} from '../canvas-cards'
import { mediaFrameFromCard } from '../canvas-card-view'
import {
  applyDocumentFromAgent,
  applyDocumentFromHuman,
  createDocumentSuiteHost,
} from '../document-suite'
import { buildDocx, readDocxParagraphs } from '../docx-package'
import { InternalActionId } from '../internal-action'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

class FakeAigcProvider implements AigcProvider {
  readonly providerId = 'fake-aigc'
  readonly submits: AigcProviderSubmit[] = []
  previewBase64?: string
  private readonly jobs = new Map<string, AigcProviderObservation & { idempotencyKey: string }>()

  async submit(input: AigcProviderSubmit): Promise<{ providerJobId: string }> {
    const providerJobId = `fake-${this.submits.length + 1}`
    this.submits.push(input)
    const mediaKind = input.operation === 'video.generate' ? 'video' : 'image'
    this.jobs.set(providerJobId, {
      providerJobId,
      idempotencyKey: input.idempotencyKey,
      phase: 'completed',
      mediaKind,
      mimeType: mediaKind === 'video' ? 'video/mp4' : 'image/png',
      fileName: mediaKind === 'video' ? 'clip.mp4' : 'frame.png',
      bytes: new Uint8Array([1, 2, 3, 4]),
      ...(this.previewBase64 ? { previewBase64: this.previewBase64 } : {}),
    })
    return { providerJobId }
  }

  async inspect(providerJobId: string): Promise<AigcProviderObservation> {
    const job = this.jobs.get(providerJobId)
    if (!job) return { providerJobId, phase: 'unknown' }
    return job
  }
}

describe('canvas artifact cards', () => {
  test('the card host does not import a renderer, approve itself, or stop a domain kernel', () => {
    const source = readFileSync(new URL('../canvas-cards.ts', import.meta.url), 'utf8')
    expect(source.includes("from '@xyflow/react'")).toBe(false)
    expect(source.includes('from "@xyflow/react"')).toBe(false)
    expect(source.includes('@earendil-works')).toBe(false)
    expect(source.includes('kernel.approve')).toBe(false)
    expect(source.includes('.stop(')).toBe(false)
    expect(source.includes('FILE_DELETE')).toBe(false)
    expect(source.includes('CANVAS_NODE_CREATE')).toBe(true)
    expect(source.includes('CANVAS_NODE_DELETE')).toBe(true)
  })

  test('xlsx and pptx stay locked and an unsafe path does not create a card', async () => {
    const root = tempDir()
    const host = board(root)
    const sheet = await host.placeDocx({
      nodeId: 'sheet',
      invocationId: 'place-sheet',
      filePath: join(root, 'budget.xlsx'),
      actor: human,
    })
    const deck = await host.placeDocx({
      nodeId: 'deck',
      invocationId: 'place-deck',
      filePath: join(root, 'talk.pptx'),
      actor: agent,
    })
    const escaped = await host.placeDocx({
      nodeId: 'escaped',
      invocationId: 'place-escaped',
      filePath: `${root}/../secret.docx`,
      actor: human,
    })
    expect(sheet).toEqual({ status: 'Locked', suite: 'xlsx', reason: 'suite_locked' })
    expect(deck).toEqual({ status: 'Locked', suite: 'pptx', reason: 'suite_locked' })
    expect(escaped).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })
    expect(host.readBoard()).toEqual([])
    expect(host.kernel.snapshot().turns).toEqual([])
  })

  test('the same docx is edited from the card and from the document suite', async () => {
    const root = tempDir()
    const filePath = writeDocx(root, ['Alpha', 'Beta'])
    const documents = createDocumentSuiteHost()
    const host = board(root, documents)

    const outside = await applyDocumentFromHuman(documents, {
      op: 'edit',
      filePath,
      sessionId: 'session-1',
      invocationId: 'edit-outside',
      actor: human,
      paragraphIndex: 0,
      text: 'Outside',
    })
    expect(outside.status).toBe('failed')

    await applyDocumentFromHuman(documents, {
      op: 'open',
      filePath,
      sessionId: 'session-1',
      invocationId: 'open-outside',
      actor: human,
    })
    expect(await applyDocumentFromHuman(documents, {
      op: 'edit',
      filePath,
      sessionId: 'session-1',
      invocationId: 'edit-outside',
      actor: human,
      paragraphIndex: 0,
      text: 'Outside',
    })).toMatchObject({ status: 'completed', paragraphs: ['Outside', 'Beta'] })

    expect(await host.placeDocx({
      nodeId: 'doc-1',
      invocationId: 'place-doc',
      filePath,
      actor: human,
    })).toMatchObject({ status: 'completed', nodeId: 'doc-1' })
    expect(host.readBoard()[0]).toMatchObject({
      kind: 'docx',
      live: true,
      docx: { paragraphs: ['Outside', 'Beta'] },
    })

    expect(await host.applyDocxCommand({
      nodeId: 'doc-1',
      invocationId: 'edit-card',
      actor: agent,
      command: { op: 'edit', paragraphIndex: 1, text: 'From the card' },
    })).toMatchObject({ status: 'completed', paragraphs: ['Outside', 'From the card'] })
    expect(readDocxParagraphs(readFileSync(filePath))).toEqual(['Outside', 'From the card'])

    expect(await applyDocumentFromHuman(documents, {
      op: 'edit',
      filePath,
      sessionId: 'session-1',
      invocationId: 'edit-again',
      actor: human,
      paragraphIndex: 0,
      text: 'Again',
    })).toMatchObject({ paragraphs: ['Again', 'From the card'] })
    expect(host.readBoard()[0]?.docx?.paragraphs).toEqual(['Again', 'From the card'])

    expect(await host.applyDocxCommand({
      nodeId: 'doc-1',
      invocationId: 'undo-card',
      actor: human,
      command: { op: 'undo' },
    })).toMatchObject({ paragraphs: ['Outside', 'From the card'] })
    expect(await applyDocumentFromAgent(documents, {
      op: 'undo',
      filePath,
      sessionId: 'session-1',
      invocationId: 'undo-outside',
      actor: agent,
    })).toMatchObject({ paragraphs: ['Outside', 'Beta'] })
    expect(host.readBoard()[0]?.docx?.paragraphs).toEqual(['Outside', 'Beta'])

    const stored = readFileSync(join(root, 'canvas.json'), 'utf8')
    expect(stored.includes('Outside')).toBe(false)
    expect(stored.includes(filePath)).toBe(true)
    expect(host.kernel.snapshot().turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.CANVAS_NODE_CREATE,
    ])
    expect(documents.kernel.snapshot().turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
    ])
  })

  test('image and video cards read the admitted artifact', async () => {
    const root = tempDir()
    const provider = new FakeAigcProvider()
    provider.previewBase64 = 'AQID'
    const aigc = createAigcHost({ provider, directory: join(root, 'jobs') })
    const host = board(root, undefined, aigc)
    await completeJob(aigc, 'inv-image', 'image.generate', 'idem-image')
    await completeJob(aigc, 'inv-video', 'video.generate', 'idem-video')

    expect(await host.placeAigc({
      nodeId: 'image-1',
      invocationId: 'place-image',
      jobInvocationId: 'inv-image',
      actor: agent,
      frame: { cx: 40, cy: 48, width: 320, height: 240 },
    })).toMatchObject({ status: 'completed' })
    expect(await host.placeAigc({
      nodeId: 'video-1',
      invocationId: 'place-video',
      jobInvocationId: 'inv-video',
      actor: human,
      frame: { cx: 400, cy: 48, width: 360, height: 240 },
    })).toMatchObject({ status: 'completed' })

    const [image, video] = host.readBoard()
    expect(image).toMatchObject({ kind: 'aigc_artifact', live: true, frame: { cx: 40, cy: 48 } })
    expect(mediaFrameFromCard(image!)).toMatchObject({
      mediaKind: 'image',
      mimeType: 'image/png',
      title: 'frame.png',
      previewSrc: 'data:image/png;base64,AQID',
    })
    expect(video).toMatchObject({ kind: 'aigc_artifact' })
    expect(mediaFrameFromCard(video!)).toMatchObject({
      mediaKind: 'video',
      mimeType: 'video/mp4',
      title: 'clip.mp4',
    })
    const imageTurn = aigc.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-image')
    expect(artifactPreviewAttachment(imageTurn!.output as never).base64).toBe('AQID')
    const stored = readFileSync(join(root, 'canvas.json'), 'utf8')
    expect(stored.includes('previewSrc')).toBe(false)
    expect(stored.includes('AQID')).toBe(false)
    expect(stored.includes('secret-prompt-value')).toBe(false)
  })

  test('hide, stop, and delete leave the admitted docx and job in place', async () => {
    const root = tempDir()
    const filePath = writeDocx(root, ['Alpha'])
    const documents = createDocumentSuiteHost()
    const provider = new FakeAigcProvider()
    provider.previewBase64 = 'AQID'
    const aigc = createAigcHost({ provider, directory: join(root, 'jobs') })
    const host = board(root, documents, aigc)

    await applyDocumentFromHuman(documents, {
      op: 'open',
      filePath,
      sessionId: 'session-1',
      invocationId: 'open-keep',
      actor: human,
    })
    await applyDocumentFromHuman(documents, {
      op: 'edit',
      filePath,
      sessionId: 'session-1',
      invocationId: 'edit-keep',
      actor: human,
      paragraphIndex: 0,
      text: 'Kept',
    })
    await host.placeDocx({ nodeId: 'doc-1', invocationId: 'place-doc', filePath, actor: human })
    await completeJob(aigc, 'inv-image', 'image.generate', 'idem-keep')
    await host.placeAigc({
      nodeId: 'image-1',
      invocationId: 'place-image',
      jobInvocationId: 'inv-image',
      actor: agent,
    })
    const pending = await aigc.request({
      invocationId: 'inv-waiting',
      sessionId: 'session-1',
      actor: agent,
      operation: 'video.generate',
      prompt: 'secret-prompt-value',
      idempotencyKey: 'idem-waiting',
    })
    expect(pending.status).toBe('approval_required')
    await host.placeAigc({
      nodeId: 'waiting-1',
      invocationId: 'place-waiting',
      jobInvocationId: 'inv-waiting',
      actor: human,
    })

    const documentTurns = snapshot(documents.kernel)
    const jobTurns = snapshot(aigc.kernel)
    const docxBytes = readFileSync(filePath)
    const canvasTurns = host.kernel.snapshot().turns.length

    expect(host.stop('doc-1').status).toBe('completed')
    expect(host.stop('image-1').status).toBe('completed')
    expect(host.stop('waiting-1').status).toBe('completed')
    expect(host.readBoard().every((card) => card.suspended && !card.live)).toBe(true)
    expect(host.hide('doc-1').status).toBe('completed')
    expect(host.hide('image-1').status).toBe('completed')
    expect(host.hide('waiting-1').status).toBe('completed')
    expect(host.visibleBoard()).toEqual([])
    expect(host.readBoard()).toHaveLength(3)
    expect(host.kernel.snapshot().turns).toHaveLength(canvasTurns)
    expect(snapshot(documents.kernel)).toEqual(documentTurns)
    expect(snapshot(aigc.kernel)).toEqual(jobTurns)
    expect(readFileSync(filePath)).toEqual(docxBytes)
    expect(aigc.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-waiting')?.phase).toBe('awaiting_approval')
    expect(provider.submits).toHaveLength(1)

    expect(host.show('doc-1').status).toBe('completed')
    expect(host.resume('doc-1').status).toBe('completed')
    expect(host.readBoard().find((card) => card.nodeId === 'doc-1')).toMatchObject({
      hidden: false,
      live: true,
      docx: { paragraphs: ['Kept'] },
    })

    const removal = await host.deleteCard({ nodeId: 'image-1', invocationId: 'delete-image', actor: human })
    expect(removal).toMatchObject({ status: 'approval_required', reason: 'human_approval_required' })
    expect(host.readBoard().some((card) => card.nodeId === 'image-1')).toBe(true)
    expect(snapshot(aigc.kernel)).toEqual(jobTurns)
    expect(host.kernel.approve('delete-image', human).status).toBe('admitted')
    expect(await host.kernel.run('delete-image')).toMatchObject({ status: 'completed' })
    expect(host.readBoard().some((card) => card.nodeId === 'image-1')).toBe(false)

    const rejected = await host.deleteCard({ nodeId: 'doc-1', invocationId: 'delete-doc', actor: agent })
    expect(rejected.status).toBe('approval_required')
    expect(host.kernel.reject('delete-doc', human).status).toBe('denied')
    expect(host.readBoard().some((card) => card.nodeId === 'doc-1')).toBe(true)

    expect(await host.deleteCard({ nodeId: 'waiting-1', invocationId: 'delete-waiting', actor: human })).toMatchObject({
      status: 'approval_required',
    })
    host.kernel.approve('delete-waiting', human)
    await host.kernel.run('delete-waiting')

    expect(readFileSync(filePath)).toEqual(docxBytes)
    expect(readDocxParagraphs(docxBytes)).toEqual(['Kept'])
    expect(snapshot(documents.kernel)).toEqual(documentTurns)
    expect(snapshot(aigc.kernel)).toEqual(jobTurns)
    const imageTurn = aigc.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-image')
    expect(imageTurn?.phase).toBe('completed')
    expect(existsSync((imageTurn!.output as { path: string }).path)).toBe(true)
    expect(existsSync(join(root, 'jobs', 'inv-image.job.json'))).toBe(true)
    expect(existsSync(join(root, 'jobs', 'inv-waiting.job.json'))).toBe(false)
    expect(aigc.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === 'inv-waiting')?.stopRequested).toBe(false)
    expect(provider.submits).toHaveLength(1)

    const stored = readFileSync(join(root, 'canvas.json'), 'utf8')
    expect(stored.includes('image-1')).toBe(false)
    expect(stored.includes('waiting-1')).toBe(false)
    expect(stored.includes('doc-1')).toBe(true)

    expect(await applyDocumentFromAgent(documents, {
      op: 'edit',
      filePath,
      sessionId: 'session-1',
      invocationId: 'edit-after-delete',
      actor: agent,
      paragraphIndex: 0,
      text: 'Still here',
    })).toMatchObject({ status: 'completed', paragraphs: ['Still here'] })
    expect(host.readBoard().find((card) => card.nodeId === 'doc-1')?.docx?.paragraphs).toEqual(['Still here'])
  })

  test('a credential-shaped card edit is denied and the card stays', async () => {
    const root = tempDir()
    const filePath = writeDocx(root, ['Alpha'])
    const documents = createDocumentSuiteHost()
    const host = board(root, documents)
    await host.placeDocx({ nodeId: 'doc-1', invocationId: 'place-doc', filePath, actor: agent })
    const before = readFileSync(filePath)
    const denied = await host.applyDocxCommand({
      nodeId: 'doc-1',
      invocationId: 'edit-secret',
      actor: agent,
      command: { op: 'edit', paragraphIndex: 0, text: 'prefix sk-livesecret' },
    })
    expect(denied).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(readFileSync(filePath)).toEqual(before)
    expect(host.readBoard()[0]?.docx?.paragraphs).toEqual(['Alpha'])
  })
})

function board(
  root: string,
  documents = createDocumentSuiteHost(),
  aigc = createAigcHost({ provider: new FakeAigcProvider(), directory: join(root, 'jobs') }),
): CanvasCardHost {
  return createCanvasCardHost({
    workspaceId: 'workspace-1',
    sessionId: 'session-1',
    documentPath: join(root, 'canvas.json'),
    documents,
    aigc,
    now: () => '2026-10-09T00:00:00.000Z',
  })
}

async function completeJob(
  aigc: ReturnType<typeof createAigcHost>,
  invocationId: string,
  operation: 'image.generate' | 'video.generate',
  idempotencyKey: string,
): Promise<void> {
  await aigc.request({
    invocationId,
    sessionId: 'session-1',
    actor: agent,
    operation,
    prompt: 'secret-prompt-value',
    idempotencyKey,
  })
  expect(aigc.kernel.approve(invocationId, human).status).toBe('admitted')
  expect((await aigc.kernel.run(invocationId)).status).toBe('completed')
}

function snapshot(kernel: { snapshot: () => unknown }): unknown {
  return JSON.parse(JSON.stringify(kernel.snapshot()))
}

function writeDocx(root: string, paragraphs: string[]): string {
  const filePath = join(root, 'note.docx')
  writeFileSync(filePath, buildDocx(paragraphs))
  return filePath
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-canvas-'))
  dirs.push(dir)
  return dir
}
