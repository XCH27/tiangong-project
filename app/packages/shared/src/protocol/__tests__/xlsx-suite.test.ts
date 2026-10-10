import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import {
  applyDocumentFromAgent,
  applyDocumentFromHuman,
  createDocumentSuiteHost,
  type DocumentSuiteShared,
} from '../document-suite'
import { buildDocx } from '../docx-package'
import { InternalActionId } from '../internal-action'
import { readZip, writeZip } from '../zip-store'
import { readXlsxSheet } from '../xlsx-package'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('xlsx document suite', () => {
  test('human create, agent update, undo, save, and reopen share file.create and file.update', async () => {
    const filePath = join(tempDir(), 'budget.xlsx')
    const shared = createDocumentSuiteHost()

    const created = await applyDocumentFromHuman(shared, call('create', filePath, 'create-1', human, {
      sheetName: 'Q1',
      rows: [['name', 'score'], ['alice', '42']],
    }))
    expect(created).toMatchObject({
      status: 'completed',
      sheetName: 'Q1',
      persisted: true,
      cells: [
        { ref: 'A1', value: 'name', valueType: 'string' },
        { ref: 'B1', value: 'score', valueType: 'string' },
        { ref: 'A2', value: 'alice', valueType: 'string' },
        { ref: 'B2', value: '42', valueType: 'string' },
      ],
    })

    const updated = await applyDocumentFromAgent(shared, call('update', filePath, 'update-1', agent, {
      cell: 'A2',
      value: 'Ada & <team>',
    }))
    expect(updated).toMatchObject({
      status: 'completed',
      persisted: true,
      cells: expect.arrayContaining([{ ref: 'A2', value: 'Ada & <team>', valueType: 'string' }]),
    })
    expect(readXlsxSheet(readFileSync(filePath)).cells.find((cell) => cell.ref === 'A2')?.value).toBe('Ada & <team>')

    const undone = await applyDocumentFromHuman(shared, call('undo', filePath, 'undo-1'))
    expect(undone).toMatchObject({
      status: 'completed',
      persisted: true,
      cells: expect.arrayContaining([{ ref: 'A2', value: 'alice', valueType: 'string' }]),
    })

    const beforeSave = readFileSync(filePath)
    const saved = await applyDocumentFromAgent(shared, call('save', filePath, 'save-1', agent))
    expect(saved).toMatchObject({ status: 'completed', persisted: false, sheetName: 'Q1' })
    expect(readFileSync(filePath)).toEqual(beforeSave)

    const reopened = await applyDocumentFromHuman(shared, call('reopen', filePath, 'reopen-1'))
    expect(reopened).toMatchObject({
      status: 'completed',
      persisted: false,
      cells: expect.arrayContaining([{ ref: 'A2', value: 'alice', valueType: 'string' }]),
    })
    expect(await applyDocumentFromHuman(shared, call('undo', filePath, 'undo-empty'))).toMatchObject({
      status: 'failed',
      reason: 'nothing_to_undo',
    })
    expect(actionIds(shared)).toEqual([
      InternalActionId.FILE_CREATE,
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
    ])
    expect(shared.kernel.snapshot().turns.map((turn) => turn.request.invocation.callerKind)).toEqual([
      'human_ui',
      'agent',
      'human_ui',
    ])
  })

  test('a fixture workbook keeps shared strings, numbers, and the second sheet', async () => {
    const filePath = join(tempDir(), 'budget.xlsx')
    writeFileSync(filePath, fixtureBook('budget'))
    const shared = createDocumentSuiteHost()
    const opened = await applyDocumentFromHuman(shared, call('open', filePath, 'open-fixture'))
    expect(opened).toMatchObject({
      status: 'completed',
      sheetName: 'Budget',
      persisted: false,
      cells: [
        { ref: 'A1', value: 'name', valueType: 'string' },
        { ref: 'B1', value: 'score', valueType: 'string' },
        { ref: 'A2', value: 'alice', valueType: 'string' },
        { ref: 'B2', value: '42', valueType: 'number' },
      ],
    })

    const updated = await applyDocumentFromAgent(shared, call('update', filePath, 'update-fixture', agent, {
      cell: 'C1',
      value: 'note',
      sheetName: 'Budget',
    }))
    expect(updated).toMatchObject({
      cells: expect.arrayContaining([
        { ref: 'B1', value: 'score', valueType: 'string' },
        { ref: 'B2', value: '42', valueType: 'number' },
        { ref: 'C1', value: 'note', valueType: 'string' },
      ]),
    })
    const parts = readZip(readFileSync(filePath))
    expect(new TextDecoder().decode(parts.get('xl/worksheets/sheet2.xml'))).toContain('Keep')
    expect(new TextDecoder().decode(parts.get('xl/sharedStrings.xml'))).toContain('>score<')

    const typed = await applyDocumentFromHuman(shared, call('update', filePath, 'update-typed', human, {
      cell: 'C2',
      value: 'true',
      valueType: 'bool',
    }))
    expect(typed).toMatchObject({
      cells: expect.arrayContaining([{ ref: 'C2', value: 'true', valueType: 'bool' }]),
    })
    expect(new TextDecoder().decode(readZip(readFileSync(filePath)).get('xl/worksheets/sheet1.xml'))).toContain('t="b"')
  })

  test('a long cell round-trips and a formula cell does not change', async () => {
    const long = `Note ${'alpha '.repeat(80)}end`
    const filePath = join(tempDir(), 'long.xlsx')
    const shared = createDocumentSuiteHost()
    await applyDocumentFromHuman(shared, call('create', filePath, 'create-long', human, { rows: [[long]] }))
    const updated = await applyDocumentFromAgent(shared, call('update', filePath, 'update-long', agent, {
      cell: 'A1',
      value: 'Short',
    }))
    expect(updated).toMatchObject({ cells: [{ ref: 'A1', value: 'Short', valueType: 'string' }] })
    const undone = await applyDocumentFromAgent(shared, call('undo', filePath, 'undo-long', agent))
    expect(undone).toMatchObject({ cells: [{ ref: 'A1', value: long, valueType: 'string' }] })

    const formulaPath = join(tempDir(), 'formula.xlsx')
    writeFileSync(formulaPath, fixtureBook('formula'))
    const before = readFileSync(formulaPath)
    const formulaHost = createDocumentSuiteHost()
    const opened = await applyDocumentFromHuman(formulaHost, call('open', formulaPath, 'open-formula'))
    expect(opened).toMatchObject({
      cells: [
        { ref: 'A1', value: 'total', valueType: 'string' },
        { ref: 'B1', value: '2', valueType: 'formula' },
      ],
    })
    const refused = await applyDocumentFromAgent(formulaHost, call('update', formulaPath, 'update-formula', agent, {
      cell: 'B1',
      value: '9',
      valueType: 'number',
    }))
    expect(refused).toMatchObject({ status: 'failed', reason: 'formula_cell' })
    expect(readFileSync(formulaPath)).toEqual(before)
    const edited = await applyDocumentFromHuman(formulaHost, call('update', formulaPath, 'update-label', human, {
      cell: 'A1',
      value: 'sum',
    }))
    expect(edited).toMatchObject({
      cells: [
        { ref: 'A1', value: 'sum', valueType: 'string' },
        { ref: 'B1', value: '2', valueType: 'formula' },
      ],
    })
    expect(new TextDecoder().decode(readZip(readFileSync(formulaPath)).get('xl/worksheets/sheet1.xml'))).toContain('<f>1+1</f>')
  })

  test('locked workbooks, bad cells, and credential text do not write', async () => {
    const dir = tempDir()
    const shared = createDocumentSuiteHost()
    const legacy = join(dir, 'legacy.xls')
    const macroName = join(dir, 'macro.xlsm')
    const deck = join(dir, 'talk.ppt')
    const macroDeck = join(dir, 'macro.pptm')
    expect(await applyDocumentFromHuman(shared, call('create', legacy, 'legacy-1'))).toEqual({
      status: 'Locked',
      suite: 'xls',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('open', macroName, 'macro-1', agent))).toEqual({
      status: 'Locked',
      suite: 'xls',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('update', deck, 'deck-1', agent, { cell: 'A1', value: 'no' }))).toEqual({
      status: 'Locked',
      suite: 'ppt',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromHuman(shared, call('open', macroDeck, 'pptm-1'))).toEqual({
      status: 'Locked',
      suite: 'ppt',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('create', `${dir}/../escape.xlsx`, 'escape-1', agent, {
      rows: [['no']],
    }))).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })

    const docxPath = join(dir, 'note.docx')
    writeFileSync(docxPath, buildDocx(['Alpha']))
    const docxBefore = readFileSync(docxPath)
    expect(await applyDocumentFromHuman(shared, call('create', docxPath, 'docx-create'))).toMatchObject({
      status: 'failed',
      reason: 'unsupported_suite_op',
    })
    expect(readFileSync(docxPath)).toEqual(docxBefore)

    const missing = join(dir, 'missing.xlsx')
    expect(await applyDocumentFromHuman(shared, call('update', missing, 'missing-update', human, {
      cell: 'A1',
      value: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'not_open' })
    expect(await applyDocumentFromHuman(shared, call('open', missing, 'missing-open'))).toMatchObject({
      status: 'failed',
      reason: 'file_missing',
    })

    const filePath = join(dir, 'sheet.xlsx')
    await applyDocumentFromHuman(shared, call('create', filePath, 'create-guard', human, { rows: [['Alpha']] }))
    const before = readFileSync(filePath)
    expect(await applyDocumentFromAgent(shared, call('create', filePath, 'create-again', agent))).toMatchObject({
      status: 'failed',
      reason: 'file_exists',
    })
    expect(await applyDocumentFromAgent(shared, call('edit', filePath, 'edit-sheet', agent, {
      paragraphIndex: 0,
      text: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'unsupported_suite_op' })
    expect(await applyDocumentFromHuman(shared, call('update', filePath, 'bad-cell', human, {
      cell: 'Sheet1!A1',
      value: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'invalid_cell' })
    expect(await applyDocumentFromHuman(shared, call('update', filePath, 'bad-number', human, {
      cell: 'B1',
      value: '1e2',
      valueType: 'number',
    }))).toMatchObject({ status: 'failed', reason: 'invalid_value' })
    expect(await applyDocumentFromAgent(shared, call('update', filePath, 'bad-bool', agent, {
      cell: 'B1',
      value: 'yes',
      valueType: 'bool',
    }))).toMatchObject({ status: 'failed', reason: 'invalid_value' })
    expect(await applyDocumentFromAgent(shared, call('update', filePath, 'secret-cell', agent, {
      cell: 'A1',
      value: 'prefix sk-livesecret',
    }))).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(readFileSync(filePath)).toEqual(before)

    const wide = join(dir, 'wide.xlsx')
    expect(await applyDocumentFromHuman(shared, call('create', wide, 'wide-1', human, {
      rows: [Array.from({ length: 27 }, () => 'x')],
    }))).toMatchObject({ status: 'failed', reason: 'sheet_too_large' })
    expect(existsSync(wide)).toBe(false)

    const secretBook = join(dir, 'secret.xlsx')
    expect(await applyDocumentFromAgent(shared, call('create', secretBook, 'secret-create', agent, {
      rows: [['sk-livesecret']],
    }))).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(existsSync(secretBook)).toBe(false)

    const packaged = loadFixture('budget')
    packaged.set('xl/vbaProject.bin', new Uint8Array([1, 2, 3]))
    const macroBook = join(dir, 'macros.xlsx')
    writeFileSync(macroBook, writeZip(packaged))
    expect(await applyDocumentFromHuman(shared, call('open', macroBook, 'open-macro'))).toMatchObject({
      status: 'failed',
      reason: 'macro_workbook',
    })

    const otherSheet = join(dir, 'notes.xlsx')
    writeFileSync(otherSheet, fixtureBook('budget'))
    const notesBefore = readFileSync(otherSheet)
    await applyDocumentFromHuman(shared, call('open', otherSheet, 'open-notes'))
    expect(await applyDocumentFromAgent(shared, call('update', otherSheet, 'update-notes', agent, {
      cell: 'A1',
      value: 'no',
      sheetName: 'Notes',
    }))).toMatchObject({ status: 'failed', reason: 'sheet_not_supported' })
    expect(readFileSync(otherSheet)).toEqual(notesBefore)
    expect(shared.kernel.snapshot().turns.filter((turn) => turn.phase === 'completed').map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.FILE_CREATE,
    ])
  })

  test('an out-of-range character reference fails closed and does not throw', async () => {
    const filePath = join(tempDir(), 'scalar.xlsx')
    const shared = createDocumentSuiteHost()
    await applyDocumentFromHuman(shared, call('create', filePath, 'create-scalar', human, { rows: [['Alpha']] }))
    const parts = readZip(readFileSync(filePath))
    const sheet = new TextDecoder().decode(parts.get('xl/worksheets/sheet1.xml'))
    parts.set('xl/worksheets/sheet1.xml', new TextEncoder().encode(sheet.replace('Alpha', '&#x110000;')))
    const before = writeZip(parts)
    writeFileSync(filePath, before)
    const opened = await applyDocumentFromHuman(createDocumentSuiteHost(), call('open', filePath, 'open-scalar'))
    expect(opened).toMatchObject({ status: 'failed', reason: 'invalid_xlsx' })
    expect(readFileSync(filePath)).toEqual(before)
  })
})

function fixtureBook(name: 'budget' | 'formula'): Uint8Array {
  return writeZip(loadFixture(name))
}

function loadFixture(name: string): Map<string, Uint8Array> {
  const root = join(import.meta.dir, 'fixtures', 'xlsx', name)
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

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-xlsx-'))
  dirs.push(dir)
  return dir
}

function call(
  op: 'open' | 'create' | 'edit' | 'update' | 'undo' | 'save' | 'reopen',
  filePath: string,
  invocationId: string,
  actor: ActorRef = human,
  extra: {
    paragraphIndex?: number
    text?: string
    cell?: string
    value?: string
    valueType?: 'string' | 'number' | 'bool'
    rows?: string[][]
    sheetName?: string
  } = {},
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
