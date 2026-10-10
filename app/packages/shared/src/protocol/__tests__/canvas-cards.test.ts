import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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
  closeOfficeCardFromAgent,
  createCanvasCardHost,
  focusOfficeCardFromAgent,
  focusOfficeCardFromHuman,
  openOfficeCardFromAgent,
  openOfficeCardFromHuman,
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
import { writeZip } from '../zip-store'

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
    expect(source.includes('CANVAS_NODE_SELECT')).toBe(true)
    expect(source.includes('FILE_CREATE')).toBe(false)
    expect(source.includes('FILE_UPDATE')).toBe(false)
  })

  test('legacy and macro packages do not become cards and an unsafe path does not create one', async () => {
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
    const legacyDeck = await host.placeDocx({
      nodeId: 'legacy-deck',
      invocationId: 'place-legacy-deck',
      filePath: join(root, 'talk.ppt'),
      actor: human,
    })
    const escaped = await host.placeDocx({
      nodeId: 'escaped',
      invocationId: 'place-escaped',
      filePath: `${root}/../secret.docx`,
      actor: human,
    })
    expect(sheet).toMatchObject({ status: 'failed', reason: 'not_docx' })
    expect(deck).toMatchObject({ status: 'failed', reason: 'not_docx' })
    expect(legacyDeck).toEqual({ status: 'Locked', suite: 'ppt', reason: 'suite_locked' })
    expect(escaped).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })

    const legacySheet = await host.placeXlsx({
      nodeId: 'legacy-sheet',
      invocationId: 'place-legacy-sheet',
      filePath: join(root, 'legacy.xls'),
      actor: human,
    })
    const macroName = await host.placeXlsx({
      nodeId: 'macro-name',
      invocationId: 'place-macro-name',
      filePath: join(root, 'budget.xlsm'),
      actor: agent,
    })
    const macroDeck = await host.placePptx({
      nodeId: 'macro-deck',
      invocationId: 'place-macro-deck',
      filePath: join(root, 'talk.pptm'),
      actor: human,
    })
    const escapedSheet = await host.placeXlsx({
      nodeId: 'escaped-sheet',
      invocationId: 'place-escaped-sheet',
      filePath: `${root}/../secret.xlsx`,
      actor: agent,
    })
    const macroBook = join(root, 'macros.xlsx')
    const packaged = loadFixture('xlsx', 'budget')
    packaged.set('xl/vbaProject.bin', new Uint8Array([1, 2, 3]))
    writeFileSync(macroBook, writeZip(packaged))
    const macroInside = await host.placeXlsx({
      nodeId: 'macro-inside',
      invocationId: 'place-macro-inside',
      filePath: macroBook,
      actor: human,
    })
    const macroSlide = join(root, 'macros.pptx')
    const deckParts = loadFixture('pptx', 'talk')
    deckParts.set('ppt/vbaProject.bin', new Uint8Array([1, 2, 3]))
    writeFileSync(macroSlide, writeZip(deckParts))
    const macroSlideCard = await host.placePptx({
      nodeId: 'macro-slide',
      invocationId: 'place-macro-slide',
      filePath: macroSlide,
      actor: agent,
    })

    expect(legacySheet).toEqual({ status: 'Locked', suite: 'xls', reason: 'suite_locked' })
    expect(macroName).toEqual({ status: 'Locked', suite: 'xls', reason: 'suite_locked' })
    expect(macroDeck).toEqual({ status: 'Locked', suite: 'ppt', reason: 'suite_locked' })
    expect(escapedSheet).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })
    expect(macroInside).toMatchObject({ status: 'failed', reason: 'macro_workbook' })
    expect(macroSlideCard).toMatchObject({ status: 'failed', reason: 'macro_deck' })
    expect(host.readBoard()).toEqual([])
    expect(host.kernel.snapshot().turns).toEqual([])
    expect(host.officePreview()).toBeNull()
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

  test('xlsx and pptx cards project the first sheet or slide and open the existing preview', async () => {
    const root = tempDir()
    const sheetPath = join(root, 'budget.xlsx')
    const deckPath = join(root, 'talk.pptx')
    writeFileSync(sheetPath, writeZip(loadFixture('xlsx', 'budget')))
    writeFileSync(deckPath, writeZip(loadFixture('pptx', 'talk')))
    const documents = createDocumentSuiteHost()
    const host = board(root, documents)
    const sheetBytes = readFileSync(sheetPath)
    const deckBytes = readFileSync(deckPath)

    expect(await host.placeXlsx({
      nodeId: 'sheet-1',
      invocationId: 'place-sheet',
      filePath: sheetPath,
      actor: human,
    })).toMatchObject({ status: 'completed', nodeId: 'sheet-1' })
    expect(await host.placePptx({
      nodeId: 'deck-1',
      invocationId: 'place-deck',
      filePath: deckPath,
      actor: agent,
    })).toMatchObject({ status: 'completed', nodeId: 'deck-1' })

    const [sheet, deck] = host.readBoard()
    expect(sheet).toMatchObject({
      kind: 'xlsx',
      live: true,
      title: 'budget.xlsx',
      xlsx: {
        sheetName: 'Budget',
        filePath: sheetPath,
        cells: [
          { ref: 'A1', value: 'name', valueType: 'string' },
          { ref: 'B1', value: 'score', valueType: 'string' },
          { ref: 'A2', value: 'alice', valueType: 'string' },
          { ref: 'B2', value: '42', valueType: 'number' },
        ],
      },
    })
    expect(sheet?.xlsx?.cells.some((cell) => cell.value === 'Keep')).toBe(false)
    expect(deck).toMatchObject({
      kind: 'pptx',
      title: 'talk.pptx',
      pptx: { filePath: deckPath, texts: ['Hello', 'Team & more'] },
    })
    expect(deck?.pptx?.texts.includes('Keep')).toBe(false)

    const stored = readFileSync(join(root, 'canvas.json'), 'utf8')
    expect(stored.includes(sheetPath)).toBe(true)
    expect(stored.includes(deckPath)).toBe(true)
    expect(stored.includes('alice')).toBe(false)
    expect(stored.includes('Team & more')).toBe(false)
    expect(stored.includes('Keep')).toBe(false)
    expect(stored.includes('tmRoot')).toBe(false)

    const documentTurns = snapshot(documents.kernel)
    const opened = await openOfficeCardFromHuman(host, {
      nodeId: 'sheet-1',
      invocationId: 'open-sheet',
      actor: human,
    })
    expect(opened).toMatchObject({
      status: 'completed',
      admitted: true,
      preview: { nodeId: 'sheet-1', suite: 'xlsx', filePath: sheetPath },
    })
    expect(host.officePreview()).toEqual({ nodeId: 'sheet-1', suite: 'xlsx', filePath: sheetPath })

    const focused = await focusOfficeCardFromAgent(host, {
      nodeId: 'deck-1',
      invocationId: 'focus-deck',
      actor: agent,
    })
    expect(focused).toMatchObject({
      status: 'completed',
      admitted: true,
      preview: { nodeId: 'deck-1', suite: 'pptx', filePath: deckPath },
    })
    const again = await focusOfficeCardFromHuman(host, {
      nodeId: 'deck-1',
      invocationId: 'focus-deck-again',
      actor: human,
    })
    expect(again).toMatchObject({ status: 'completed', admitted: false, preview: { nodeId: 'deck-1', suite: 'pptx' } })
    expect(host.kernel.snapshot().turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.CANVAS_NODE_CREATE,
      InternalActionId.CANVAS_NODE_CREATE,
      InternalActionId.CANVAS_NODE_SELECT,
      InternalActionId.CANVAS_NODE_SELECT,
    ])
    expect(host.kernel.snapshot().turns.map((turn) => turn.request.invocation.callerKind)).toEqual([
      'human_ui',
      'agent',
      'human_ui',
      'agent',
    ])
    const mismatch = await openOfficeCardFromAgent(host, {
      nodeId: 'sheet-1',
      invocationId: 'open-mismatch',
      actor: human,
    })
    expect(mismatch).toMatchObject({ status: 'denied', reason: 'caller_actor_mismatch' })
    expect(host.officePreview()).toEqual({ nodeId: 'deck-1', suite: 'pptx', filePath: deckPath })
    const docxOpen = await openOfficeCardFromHuman(host, {
      nodeId: 'missing',
      invocationId: 'open-missing',
      actor: human,
    })
    expect(docxOpen).toMatchObject({ status: 'failed', reason: 'not_office_card' })
    expect(snapshot(documents.kernel)).toEqual(documentTurns)
    expect(readFileSync(sheetPath)).toEqual(sheetBytes)
    expect(readFileSync(deckPath)).toEqual(deckBytes)

    expect(await applyDocumentFromAgent(documents, {
      op: 'open',
      filePath: sheetPath,
      sessionId: 'session-1',
      invocationId: 'open-suite',
      actor: agent,
    })).toMatchObject({ status: 'completed', sheetName: 'Budget' })
    expect(await applyDocumentFromAgent(documents, {
      op: 'update',
      filePath: sheetPath,
      sessionId: 'session-1',
      invocationId: 'update-suite',
      actor: agent,
      cell: 'A2',
      value: 'Ada',
    })).toMatchObject({ status: 'completed' })
    expect(host.readBoard().find((card) => card.nodeId === 'sheet-1')?.xlsx?.cells.find((cell) => cell.ref === 'A2')?.value).toBe('Ada')
    expect(documents.kernel.snapshot().turns.map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.FILE_UPDATE,
    ])
    expect(host.kernel.snapshot().turns.filter((turn) => (
      turn.request.invocation.actionId === InternalActionId.CANVAS_NODE_SELECT && turn.phase === 'completed'
    ))).toHaveLength(2)

    const updatedBytes = readFileSync(sheetPath)
    const closed = await closeOfficeCardFromAgent(host, {
      nodeId: 'deck-1',
      invocationId: 'close-deck',
      actor: agent,
    })
    expect(closed).toMatchObject({ status: 'completed', admitted: true, preview: null })
    expect(host.officePreview()).toBeNull()
    expect(readFileSync(deckPath)).toEqual(deckBytes)

    expect(await host.deleteCard({ nodeId: 'sheet-1', invocationId: 'delete-sheet', actor: human })).toMatchObject({
      status: 'approval_required',
    })
    expect(host.kernel.approve('delete-sheet', human).status).toBe('admitted')
    expect(await host.kernel.run('delete-sheet')).toMatchObject({ status: 'completed' })
    expect(host.readBoard().some((card) => card.nodeId === 'sheet-1')).toBe(false)
    expect(readFileSync(sheetPath)).toEqual(updatedBytes)
    expect(existsSync(sheetPath)).toBe(true)

    const formulaPath = join(root, 'formula.xlsx')
    writeFileSync(formulaPath, writeZip(loadFixture('xlsx', 'formula')))
    expect(await host.placeXlsx({
      nodeId: 'formula-1',
      invocationId: 'place-formula',
      filePath: formulaPath,
      actor: agent,
    })).toMatchObject({ status: 'completed' })
    expect(host.readBoard().find((card) => card.nodeId === 'formula-1')?.xlsx?.cells).toEqual([
      { ref: 'A1', value: 'total', valueType: 'string' },
      { ref: 'B1', value: '2', valueType: 'formula' },
    ])
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

function loadFixture(kind: 'xlsx' | 'pptx', name: string): Map<string, Uint8Array> {
  const root = join(import.meta.dir, 'fixtures', kind, name)
  const parts = new Map<string, Uint8Array>()
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(full, rel)
      else parts.set(rel, new Uint8Array(readFileSync(full)))
    }
  }
  walk(root, '')
  return parts
}
