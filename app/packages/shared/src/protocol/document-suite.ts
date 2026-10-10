/**
 * Built-in document suite host.
 *
 * DOCX open, edit, undo, save, and reopen share one paragraph operation.
 * XLSX create writes a new workbook through file.create. A cell update, undo,
 * and dirty save use file.update. A human control and an agent caller both
 * use executeDocumentOp. The undo handle stores the previous bytes. Legacy
 * .xls, macro-enabled .xlsm, and PPTX stay Locked. This is not a plugin
 * marketplace and it is not a spreadsheet editor.
 */

import { existsSync, readFileSync } from 'node:fs'
import {
  type DocumentCall,
  type DocumentSuiteDeclaration,
  isSafeDocumentPath,
  suiteForPath,
} from './document-command'
import { DocxPackageError, readDocxParagraphs, replaceDocxParagraph } from './docx-package'
import { InternalActionId, type ActionInvocation } from './internal-action'
import { applyAtomicBytesEffect, type NativeEffect, NativeEffectRegistry } from './native-effect-executor'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome } from './turn-admission'
import { XlsxPackageError, buildXlsx, readXlsxSheet, replaceXlsxCell } from './xlsx-package'
import { type SheetCell, type SheetProjection, type SheetValueType } from './xlsx-xml'

export interface DocumentSuiteShared {
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
}

export interface DocumentOpSuccess {
  status: 'completed'
  invocationId: string
  paragraphs: string[]
  cells: SheetCell[]
  sheetName: string | null
  persisted: boolean
}

export type DocumentOpResult =
  | DocumentOpSuccess
  | { status: 'Locked'; suite: 'xls' | 'pptx'; reason: 'suite_locked' }
  | { status: Exclude<TurnOutcome['status'], 'completed'>; invocationId: string; reason?: string }

interface OpenDocument {
  bytes: Uint8Array
  undo: Uint8Array[]
}

type DocumentCaller = DocumentCall & { callerKind: 'human_ui' | 'agent' }

const openDocuments = new WeakMap<DocumentSuiteShared, Map<string, OpenDocument>>()

export function createDocumentSuiteHost(): DocumentSuiteShared {
  const effects = new NativeEffectRegistry()
  const writeBytes: NativeEffect = async (request) => {
    const filePath = typeof request.payload.filePath === 'string' ? request.payload.filePath : ''
    const encoded = typeof request.payload.nextBytesBase64 === 'string' ? request.payload.nextBytesBase64 : ''
    if (!filePath || !encoded) throw new Error('missing_document_bytes')
    const applied = await applyAtomicBytesEffect({
      filePath,
      next: decodeBytes(encoded),
      signal: request.signal,
      commit: request.commit,
    })
    return {
      output: { filePath, actionId: request.actionId },
      undoHandle: {
        undoId: `undo-${request.sessionId}`,
        label: 'Restore previous document bytes',
        snapshot: applied.previous ? encodeBytes(applied.previous) : '',
      },
    }
  }
  effects.register(InternalActionId.FILE_UPDATE, writeBytes)
  effects.register(InternalActionId.FILE_CREATE, writeBytes)
  const kernel = new HostTurnKernel(new MemoryTurnJournal(), { nativeEffects: effects })
  const shared = { kernel, effects }
  openDocuments.set(shared, new Map())
  return shared
}

export function applyDocumentFromHuman(shared: DocumentSuiteShared, input: DocumentCall): Promise<DocumentOpResult> {
  return executeDocumentOp(shared, { ...input, callerKind: 'human_ui' })
}

export function applyDocumentFromAgent(shared: DocumentSuiteShared, input: DocumentCall): Promise<DocumentOpResult> {
  return executeDocumentOp(shared, { ...input, callerKind: 'agent' })
}

export async function executeDocumentOp(
  shared: DocumentSuiteShared,
  input: DocumentCaller,
): Promise<DocumentOpResult> {
  const suite = suiteForPath(input.filePath)
  if (!suite) return failed(input.invocationId, 'unknown_suite')
  if (suite.status === 'Locked') return locked(suite)
  if (!isSafeDocumentPath(input.filePath)) return failed(input.invocationId, 'unsafe_file_path')

  switch (suite.id) {
    case 'docx':
      return runDocx(shared, input)
    case 'xlsx':
      return runXlsx(shared, input)
    default: {
      const unexpected: never = suite.id
      return failed(input.invocationId, `unknown_suite:${String(unexpected)}`)
    }
  }
}

async function runDocx(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  switch (input.op) {
    case 'open':
      return openDocument(shared, input)
    case 'edit':
      return editDocument(shared, input)
    case 'undo':
      return undoDocument(shared, input)
    case 'save':
      return saveDocument(shared, input)
    case 'reopen':
      return openDocument(shared, input)
    case 'create':
    case 'update':
      return failed(input.invocationId, 'unsupported_suite_op')
    default: {
      const unexpected: never = input.op
      return failed(input.invocationId, `unknown_document_op:${String(unexpected)}`)
    }
  }
}

async function runXlsx(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  switch (input.op) {
    case 'open':
    case 'reopen':
      return openWorkbook(shared, input)
    case 'create':
      return createWorkbook(shared, input)
    case 'update':
      return updateWorkbook(shared, input)
    case 'undo':
      return undoWorkbook(shared, input)
    case 'save':
      return saveWorkbook(shared, input)
    case 'edit':
      return failed(input.invocationId, 'unsupported_suite_op')
    default: {
      const unexpected: never = input.op
      return failed(input.invocationId, `unknown_document_op:${String(unexpected)}`)
    }
  }
}

async function openDocument(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const bytes = readDocumentFile(input.filePath)
  if (!bytes) return failed(input.invocationId, 'file_missing')
  const paragraphs = paragraphsOf(bytes)
  if (!paragraphs) return failed(input.invocationId, 'invalid_docx')
  sessions(shared).set(input.filePath, { bytes: Uint8Array.from(bytes), undo: [] })
  return completed(input.invocationId, paragraphs, false)
}

async function editDocument(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  if (input.paragraphIndex === undefined || input.text === undefined) return failed(input.invocationId, 'missing_paragraph')
  let next: Uint8Array
  try {
    next = replaceDocxParagraph(current.bytes, input.paragraphIndex, input.text)
  } catch (error) {
    if (error instanceof DocxPackageError) return failed(input.invocationId, error.reason)
    throw error
  }
  const written = await persistDocument(shared, input, InternalActionId.FILE_UPDATE, 'docx', next)
  if (written.status !== 'completed') return unwritten(written)
  current.undo.push(Uint8Array.from(current.bytes))
  current.bytes = Uint8Array.from(next)
  return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], true)
}

async function undoDocument(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  const previous = current.undo[current.undo.length - 1]
  if (!previous) return failed(input.invocationId, 'nothing_to_undo')
  const written = await persistDocument(shared, input, InternalActionId.FILE_UPDATE, 'docx', previous)
  if (written.status !== 'completed') return unwritten(written)
  current.undo.pop()
  current.bytes = Uint8Array.from(previous)
  return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], true)
}

async function saveDocument(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  const disk = readDocumentFile(input.filePath)
  if (disk && sameBytes(disk, current.bytes)) {
    return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], false)
  }
  const written = await persistDocument(shared, input, InternalActionId.FILE_UPDATE, 'docx', current.bytes)
  if (written.status !== 'completed') return unwritten(written)
  return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], true)
}

async function openWorkbook(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const bytes = readDocumentFile(input.filePath)
  if (!bytes) return failed(input.invocationId, 'file_missing')
  const projected = projectSheet(bytes)
  if (!projected.ok) return failed(input.invocationId, projected.reason)
  sessions(shared).set(input.filePath, { bytes: Uint8Array.from(bytes), undo: [] })
  return completedSheet(input.invocationId, projected.sheet, false)
}

async function createWorkbook(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  if (existsSync(input.filePath)) return failed(input.invocationId, 'file_exists')
  const rows = sheetRows(input.rows)
  if (!rows) return failed(input.invocationId, 'invalid_value')
  let next: Uint8Array
  try {
    next = buildXlsx({ sheetName: input.sheetName, rows })
  } catch (error) {
    if (error instanceof XlsxPackageError) return failed(input.invocationId, error.reason)
    throw error
  }
  const projected = projectSheet(next)
  if (!projected.ok) return failed(input.invocationId, projected.reason)
  const written = await persistDocument(shared, input, InternalActionId.FILE_CREATE, 'xlsx', next)
  if (written.status !== 'completed') return unwritten(written)
  sessions(shared).set(input.filePath, { bytes: Uint8Array.from(next), undo: [] })
  return completedSheet(input.invocationId, projected.sheet, true)
}

async function updateWorkbook(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  if (!input.cell || input.value === undefined) return failed(input.invocationId, 'missing_cell')
  const valueType = sheetValueType(input.valueType)
  if (!valueType) return failed(input.invocationId, 'invalid_value')
  let next: Uint8Array
  try {
    next = replaceXlsxCell(current.bytes, {
      cell: input.cell,
      value: input.value,
      valueType,
      sheetName: input.sheetName,
    })
  } catch (error) {
    if (error instanceof XlsxPackageError) return failed(input.invocationId, error.reason)
    throw error
  }
  const projected = projectSheet(next)
  if (!projected.ok) return failed(input.invocationId, projected.reason)
  const written = await persistDocument(shared, input, InternalActionId.FILE_UPDATE, 'xlsx', next)
  if (written.status !== 'completed') return unwritten(written)
  current.undo.push(Uint8Array.from(current.bytes))
  current.bytes = Uint8Array.from(next)
  return completedSheet(input.invocationId, projected.sheet, true)
}

async function undoWorkbook(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  const previous = current.undo[current.undo.length - 1]
  if (!previous) return failed(input.invocationId, 'nothing_to_undo')
  const written = await persistDocument(shared, input, InternalActionId.FILE_UPDATE, 'xlsx', previous)
  if (written.status !== 'completed') return unwritten(written)
  current.undo.pop()
  current.bytes = Uint8Array.from(previous)
  const projected = projectSheet(current.bytes)
  if (!projected.ok) return failed(input.invocationId, projected.reason)
  return completedSheet(input.invocationId, projected.sheet, true)
}

async function saveWorkbook(shared: DocumentSuiteShared, input: DocumentCaller): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  const projected = projectSheet(current.bytes)
  if (!projected.ok) return failed(input.invocationId, projected.reason)
  const disk = readDocumentFile(input.filePath)
  if (disk && sameBytes(disk, current.bytes)) return completedSheet(input.invocationId, projected.sheet, false)
  const written = await persistDocument(shared, input, InternalActionId.FILE_UPDATE, 'xlsx', current.bytes)
  if (written.status !== 'completed') return unwritten(written)
  return completedSheet(input.invocationId, projected.sheet, true)
}

async function persistDocument(
  shared: DocumentSuiteShared,
  input: DocumentCaller,
  actionId: typeof InternalActionId.FILE_CREATE | typeof InternalActionId.FILE_UPDATE,
  suite: 'docx' | 'xlsx',
  next: Uint8Array,
): Promise<TurnOutcome> {
  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId,
    payload: {
      filePath: input.filePath,
      suite,
      paragraphIndex: input.paragraphIndex,
      text: input.text,
      cell: input.cell,
      value: input.value,
      valueType: input.valueType,
      rows: input.rows,
      sheetName: input.sheetName,
      nextBytesBase64: encodeBytes(next),
    },
    targets: [{ kind: 'file', id: input.filePath, label: input.op }],
    callerKind: input.callerKind,
    sessionId: input.sessionId,
    createdAt: '2026-10-10T00:00:00.000Z',
  }
  const admitted = shared.kernel.admit({ invocation, actor: input.actor })
  if (admitted.status !== 'admitted') return admitted
  return shared.kernel.run(input.invocationId)
}

function sessions(shared: DocumentSuiteShared): Map<string, OpenDocument> {
  const found = openDocuments.get(shared)
  if (!found) throw new Error('document_host_missing')
  return found
}

function locked(suite: Extract<DocumentSuiteDeclaration, { status: 'Locked' }>): DocumentOpResult {
  switch (suite.id) {
    case 'xls':
    case 'pptx':
      return { status: 'Locked', suite: suite.id, reason: 'suite_locked' }
    default: {
      const unexpected: never = suite
      return unexpected
    }
  }
}

function unwritten(outcome: TurnOutcome): DocumentOpResult {
  switch (outcome.status) {
    case 'completed':
      return failed(outcome.invocationId, 'unexpected_completed_write')
    case 'admitted':
    case 'approval_required':
    case 'denied':
    case 'failed':
    case 'interrupted':
    case 'reconciling':
      return { status: outcome.status, invocationId: outcome.invocationId, reason: outcome.reason }
    default: {
      const unexpected: never = outcome.status
      return failed(outcome.invocationId, String(unexpected))
    }
  }
}

function completed(invocationId: string, paragraphs: string[], persisted: boolean): DocumentOpSuccess {
  return { status: 'completed', invocationId, paragraphs, cells: [], sheetName: null, persisted }
}

function completedSheet(invocationId: string, sheet: SheetProjection, persisted: boolean): DocumentOpSuccess {
  return {
    status: 'completed',
    invocationId,
    paragraphs: [],
    cells: sheet.cells,
    sheetName: sheet.sheetName,
    persisted,
  }
}

function failed(invocationId: string, reason: string): DocumentOpResult {
  return { status: 'failed', invocationId, reason }
}

function readDocumentFile(filePath: string): Uint8Array | null {
  try {
    return new Uint8Array(readFileSync(filePath))
  } catch {
    return null
  }
}

function paragraphsOf(bytes: Uint8Array): string[] | null {
  try {
    return readDocxParagraphs(bytes)
  } catch (error) {
    if (error instanceof DocxPackageError) return null
    throw error
  }
}

function projectSheet(bytes: Uint8Array): { ok: true; sheet: SheetProjection } | { ok: false; reason: string } {
  try {
    return { ok: true, sheet: readXlsxSheet(bytes) }
  } catch (error) {
    if (error instanceof XlsxPackageError) return { ok: false, reason: error.reason }
    throw error
  }
}

function sheetRows(value: string[][] | undefined): string[][] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null
  const rows: string[][] = []
  for (const row of value) {
    if (!Array.isArray(row)) return null
    const cells: string[] = []
    for (const cell of row) {
      if (typeof cell !== 'string') return null
      cells.push(cell)
    }
    rows.push(cells)
  }
  return rows
}

function sheetValueType(value: string | undefined): SheetValueType | null {
  if (value === undefined || value === 'string') return 'string'
  if (value === 'number' || value === 'bool') return value
  return null
}

function sameBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

function encodeBytes(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

function decodeBytes(value: string): Uint8Array {
  return new Uint8Array(Buffer.from(value, 'base64'))
}
