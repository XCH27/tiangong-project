import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import { DOCUMENT_OPS, listDocumentSuites } from '../document-command'
import {
  applyDocumentFromAgent,
  applyDocumentFromHuman,
  createDocumentSuiteHost,
  type DocumentSuiteShared,
} from '../document-suite'
import { buildDocx, readDocxParagraphs } from '../docx-package'
import { InternalActionId } from '../internal-action'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('docx document suite', () => {
  test('xlsx is wired and legacy xls and pptx stay locked', () => {
    expect(DOCUMENT_OPS).toEqual(['open', 'create', 'edit', 'update', 'undo', 'save', 'reopen'])
    expect(listDocumentSuites()).toEqual([
      { id: 'docx', extensions: ['docx'], status: 'wired' },
      { id: 'xlsx', extensions: ['xlsx'], status: 'wired' },
      { id: 'xls', extensions: ['xls', 'xlsm'], status: 'Locked' },
      { id: 'pptx', extensions: ['pptx', 'ppt'], status: 'Locked' },
    ])
  })

  test('human edit, agent edit, undo, save, and reopen share file.update', async () => {
    const filePath = fixture(['Alpha', 'Beta'])
    const shared = createDocumentSuiteHost()

    const opened = await applyDocumentFromHuman(shared, call('open', filePath, 'open-1'))
    expect(opened).toMatchObject({ status: 'completed', paragraphs: ['Alpha', 'Beta'], persisted: false })

    const humanEdit = await applyDocumentFromHuman(shared, call('edit', filePath, 'edit-human', human, { paragraphIndex: 0, text: 'Human' }))
    expect(humanEdit).toMatchObject({ status: 'completed', paragraphs: ['Human', 'Beta'], persisted: true })
    expect(readDocxParagraphs(readFileSync(filePath))).toEqual(['Human', 'Beta'])

    const agentEdit = await applyDocumentFromAgent(shared, call('edit', filePath, 'edit-agent', agent, { paragraphIndex: 0, text: 'Agent & <team>' }))
    expect(agentEdit).toMatchObject({ status: 'completed', paragraphs: ['Agent & <team>', 'Beta'], persisted: true })

    const undone = await applyDocumentFromHuman(shared, call('undo', filePath, 'undo-1'))
    expect(undone).toMatchObject({ status: 'completed', paragraphs: ['Human', 'Beta'], persisted: true })

    const beforeSave = readFileSync(filePath)
    const saved = await applyDocumentFromAgent(shared, call('save', filePath, 'save-1', agent))
    expect(saved).toMatchObject({ status: 'completed', paragraphs: ['Human', 'Beta'], persisted: false })
    expect(readFileSync(filePath)).toEqual(beforeSave)

    const reopened = await applyDocumentFromHuman(shared, call('reopen', filePath, 'reopen-1'))
    expect(reopened).toMatchObject({ status: 'completed', paragraphs: ['Human', 'Beta'], persisted: false })
    expect(actionIds(shared)).toEqual([
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
    ])
    const callers = shared.kernel.snapshot().turns.map((turn) => turn.request.invocation.callerKind)
    expect(callers).toEqual(['human_ui', 'agent', 'human_ui'])
  })

  test('a long paragraph round-trips through deflate and a second undo restores the original', async () => {
    const long = `Note ${'alpha '.repeat(80)}end`
    const filePath = fixture(['Short', long])
    const shared = createDocumentSuiteHost()
    await applyDocumentFromHuman(shared, call('open', filePath, 'open-long'))
    await applyDocumentFromAgent(shared, call('edit', filePath, 'edit-long', agent, { paragraphIndex: 1, text: 'Replaced' }))
    expect(readDocxParagraphs(readFileSync(filePath))).toEqual(['Short', 'Replaced'])
    const undone = await applyDocumentFromAgent(shared, call('undo', filePath, 'undo-long', agent))
    expect(undone).toMatchObject({ paragraphs: ['Short', long] })
  })

  test('a credential-shaped edit is denied before the file changes', async () => {
    const filePath = fixture(['Alpha'])
    const shared = createDocumentSuiteHost()
    await applyDocumentFromAgent(shared, call('open', filePath, 'open-secret'))
    const before = readFileSync(filePath)
    const denied = await applyDocumentFromAgent(shared, call('edit', filePath, 'edit-secret', agent, {
      paragraphIndex: 0,
      text: 'prefix sk-livesecret',
    }))
    expect(denied).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(readFileSync(filePath)).toEqual(before)
    const kept = await applyDocumentFromHuman(shared, call('reopen', filePath, 'reopen-secret'))
    expect(kept).toMatchObject({ paragraphs: ['Alpha'] })
  })

  test('locked suites and unsafe paths do not write', async () => {
    const dir = tempDir()
    const shared = createDocumentSuiteHost()
    const sheet = join(dir, 'budget.xls')
    const macro = join(dir, 'budget.xlsm')
    const deck = join(dir, 'talk.pptx')
    expect(await applyDocumentFromHuman(shared, call('edit', sheet, 'sheet-1', human, { paragraphIndex: 0, text: 'no' }))).toEqual({
      status: 'Locked',
      suite: 'xls',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('create', macro, 'macro-1', agent))).toEqual({
      status: 'Locked',
      suite: 'xls',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('open', deck, 'deck-1'))).toEqual({
      status: 'Locked',
      suite: 'pptx',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('edit', `${dir}/../escape.docx`, 'bad-path', agent, {
      paragraphIndex: 0,
      text: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })
    expect(shared.kernel.snapshot().turns).toEqual([])
  })

  test('a missing file, a bad package, and an unknown paragraph fail closed', async () => {
    const dir = tempDir()
    const shared = createDocumentSuiteHost()
    const missing = join(dir, 'missing.docx')
    expect(await applyDocumentFromHuman(shared, call('open', missing, 'missing-1'))).toMatchObject({
      status: 'failed',
      reason: 'file_missing',
    })

    const broken = join(dir, 'broken.docx')
    writeFileSync(broken, 'not a package')
    expect(await applyDocumentFromAgent(shared, call('open', broken, 'broken-1'))).toMatchObject({
      status: 'failed',
      reason: 'invalid_docx',
    })

    const filePath = fixture(['Alpha'])
    await applyDocumentFromHuman(shared, call('open', filePath, 'open-range'))
    expect(await applyDocumentFromAgent(shared, call('edit', filePath, 'range-1', agent, {
      paragraphIndex: 3,
      text: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'paragraph_out_of_range' })
    expect(readDocxParagraphs(readFileSync(filePath))).toEqual(['Alpha'])
    expect(await applyDocumentFromHuman(shared, call('undo', filePath, 'undo-empty'))).toMatchObject({
      status: 'failed',
      reason: 'nothing_to_undo',
    })
  })
})

function fixture(paragraphs: string[]): string {
  const filePath = join(tempDir(), 'note.docx')
  writeFileSync(filePath, buildDocx(paragraphs))
  return filePath
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-docx-'))
  dirs.push(dir)
  return dir
}

function call(
  op: 'open' | 'create' | 'edit' | 'update' | 'undo' | 'save' | 'reopen',
  filePath: string,
  invocationId: string,
  actor: ActorRef = human,
  extra: { paragraphIndex?: number; text?: string } = {},
) {
  return {
    op,
    filePath,
    sessionId: 'session-1',
    invocationId,
    actor,
    ...extra,
  }
}

function actionIds(shared: DocumentSuiteShared): string[] {
  return shared.kernel.snapshot().turns.map((turn) => turn.request.invocation.actionId)
}
