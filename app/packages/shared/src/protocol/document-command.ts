/**
 * Document commands shared by the preview control and the agent caller.
 * Writes still go through HostTurnKernel as file.create or file.update.
 * This file does not admit anything and does not touch the filesystem.
 */

import type { ActorRef } from './actor'
import type { SheetValueType } from './xlsx-xml'

export const DOCUMENT_OPS = ['open', 'create', 'edit', 'update', 'undo', 'save', 'reopen'] as const
export type DocumentOpName = (typeof DOCUMENT_OPS)[number]

export const DOCUMENT_SUITES = [
  { id: 'docx', extensions: ['docx'], status: 'wired' },
  { id: 'xlsx', extensions: ['xlsx'], status: 'wired' },
  { id: 'xls', extensions: ['xls', 'xlsm'], status: 'Locked' },
  { id: 'pptx', extensions: ['pptx', 'ppt'], status: 'Locked' },
] as const

export type DocumentSuiteId = (typeof DOCUMENT_SUITES)[number]['id']
export type DocumentSuiteDeclaration = (typeof DOCUMENT_SUITES)[number]

export interface DocumentPreviewCommand {
  op: 'edit' | 'update' | 'undo' | 'save'
  paragraphIndex?: number
  text?: string
  cell?: string
  value?: string
  valueType?: SheetValueType
}

export interface DocumentCall {
  op: DocumentOpName
  filePath: string
  sessionId: string
  invocationId: string
  actor: ActorRef
  paragraphIndex?: number
  text?: string
  cell?: string
  value?: string
  valueType?: SheetValueType
  rows?: string[][]
  sheetName?: string
}

export function listDocumentSuites(): readonly DocumentSuiteDeclaration[] {
  return DOCUMENT_SUITES
}

export function suiteForPath(filePath: string): DocumentSuiteDeclaration | null {
  const extension = fileExtension(filePath)
  for (const suite of DOCUMENT_SUITES) {
    if ((suite.extensions as readonly string[]).includes(extension)) return suite
  }
  return null
}

export function isSafeDocumentPath(filePath: string): boolean {
  if (!filePath.trim()) return false
  return !filePath.split(/[\\/]/).includes('..')
}

function fileExtension(filePath: string): string {
  const base = filePath.split(/[\\/]/).pop() ?? ''
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot + 1).toLowerCase()
}
