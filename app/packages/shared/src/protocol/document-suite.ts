/**
 * Built-in document suite host.
 *
 * DOCX open, edit, undo, save, and reopen share one paragraph operation.
 * A human control and an agent caller both use executeDocumentOp. A write
 * admits file.update on HostTurnKernel and stores the previous bytes on the
 * undo handle. XLSX and PPTX stay Locked. This is not a plugin marketplace.
 */

import { readFileSync } from 'node:fs'
import {
  type DocumentCall,
  type DocumentSuiteDeclaration,
  isSafeDocumentPath,
  suiteForPath,
} from './document-command'
import { DocxPackageError, readDocxParagraphs, replaceDocxParagraph } from './docx-package'
import { InternalActionId, type ActionInvocation } from './internal-action'
import { applyAtomicBytesEffect, NativeEffectRegistry } from './native-effect-executor'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome } from './turn-admission'

export interface DocumentSuiteShared {
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
}

export interface DocumentOpSuccess {
  status: 'completed'
  invocationId: string
  paragraphs: string[]
  persisted: boolean
}

export type DocumentOpResult =
  | DocumentOpSuccess
  | { status: 'Locked'; suite: 'xlsx' | 'pptx'; reason: 'suite_locked' }
  | { status: Exclude<TurnOutcome['status'], 'completed'>; invocationId: string; reason?: string }

interface OpenDocument {
  bytes: Uint8Array
  undo: Uint8Array[]
}

const openDocuments = new WeakMap<DocumentSuiteShared, Map<string, OpenDocument>>()

export function createDocumentSuiteHost(): DocumentSuiteShared {
  const effects = new NativeEffectRegistry()
  effects.register(InternalActionId.FILE_UPDATE, async (request) => {
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
      output: { filePath, actionId: InternalActionId.FILE_UPDATE },
      undoHandle: {
        undoId: `undo-${request.sessionId}`,
        label: 'Restore previous document bytes',
        snapshot: applied.previous ? encodeBytes(applied.previous) : '',
      },
    }
  })
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
  input: DocumentCall & { callerKind: 'human_ui' | 'agent' },
): Promise<DocumentOpResult> {
  const suite = suiteForPath(input.filePath)
  if (!suite) return failed(input.invocationId, 'unknown_suite')
  if (suite.status === 'Locked') return locked(suite)
  if (!isSafeDocumentPath(input.filePath)) return failed(input.invocationId, 'unsafe_file_path')

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
      return reopenDocument(shared, input)
    default: {
      const unexpected: never = input.op
      return failed(input.invocationId, `unknown_document_op:${String(unexpected)}`)
    }
  }
}

async function openDocument(
  shared: DocumentSuiteShared,
  input: DocumentCall & { callerKind: 'human_ui' | 'agent' },
): Promise<DocumentOpResult> {
  const bytes = readDocumentFile(input.filePath)
  if (!bytes) return failed(input.invocationId, 'file_missing')
  const paragraphs = paragraphsOf(bytes)
  if (!paragraphs) return failed(input.invocationId, 'invalid_docx')
  sessions(shared).set(input.filePath, { bytes: Uint8Array.from(bytes), undo: [] })
  return completed(input.invocationId, paragraphs, false)
}

async function editDocument(
  shared: DocumentSuiteShared,
  input: DocumentCall & { callerKind: 'human_ui' | 'agent' },
): Promise<DocumentOpResult> {
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
  const written = await persistDocument(shared, input, next)
  if (written.status !== 'completed') return unwritten(written)
  current.undo.push(Uint8Array.from(current.bytes))
  current.bytes = Uint8Array.from(next)
  return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], true)
}

async function undoDocument(
  shared: DocumentSuiteShared,
  input: DocumentCall & { callerKind: 'human_ui' | 'agent' },
): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  const previous = current.undo[current.undo.length - 1]
  if (!previous) return failed(input.invocationId, 'nothing_to_undo')
  const written = await persistDocument(shared, input, previous)
  if (written.status !== 'completed') return unwritten(written)
  current.undo.pop()
  current.bytes = Uint8Array.from(previous)
  return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], true)
}

async function saveDocument(
  shared: DocumentSuiteShared,
  input: DocumentCall & { callerKind: 'human_ui' | 'agent' },
): Promise<DocumentOpResult> {
  const current = sessions(shared).get(input.filePath)
  if (!current) return failed(input.invocationId, 'not_open')
  const disk = readDocumentFile(input.filePath)
  if (disk && sameBytes(disk, current.bytes)) {
    return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], false)
  }
  const written = await persistDocument(shared, input, current.bytes)
  if (written.status !== 'completed') return unwritten(written)
  return completed(input.invocationId, paragraphsOf(current.bytes) ?? [], true)
}

async function reopenDocument(
  shared: DocumentSuiteShared,
  input: DocumentCall & { callerKind: 'human_ui' | 'agent' },
): Promise<DocumentOpResult> {
  return openDocument(shared, input)
}

async function persistDocument(
  shared: DocumentSuiteShared,
  input: DocumentCall & { callerKind: 'human_ui' | 'agent' },
  next: Uint8Array,
): Promise<TurnOutcome> {
  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId: InternalActionId.FILE_UPDATE,
    payload: {
      filePath: input.filePath,
      suite: 'docx',
      paragraphIndex: input.paragraphIndex,
      text: input.text,
      nextBytesBase64: encodeBytes(next),
    },
    targets: [{ kind: 'file', id: input.filePath, label: input.op }],
    callerKind: input.callerKind,
    sessionId: input.sessionId,
    createdAt: '2026-10-09T00:00:00.000Z',
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
    case 'xlsx':
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
  return { status: 'completed', invocationId, paragraphs, persisted }
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
