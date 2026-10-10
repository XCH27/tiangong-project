/**
 * One XLSX package around the first worksheet.
 * Cell edits keep the other parts. Legacy .xls and PPTX are not packages here.
 */

import { readZip, writeZip, ZipStoreError } from './zip-store'
import {
  buildWorkbookFiles,
  projectWorkbook,
  updateWorkbookCell,
  XlsxXmlError,
  type SheetProjection,
  type XlsxCellEdit,
  type XlsxFailure,
} from './xlsx-xml'

export class XlsxPackageError extends Error {
  readonly reason: XlsxFailure

  constructor(reason: XlsxFailure) {
    super(reason)
    this.name = 'XlsxPackageError'
    this.reason = reason
  }
}

export function buildXlsx(input: { sheetName?: string; rows?: readonly (readonly string[])[] } = {}): Uint8Array {
  try {
    return writeZip(buildWorkbookFiles(input))
  } catch (error) {
    throw packageError(error)
  }
}

export function readXlsxSheet(bytes: Uint8Array): SheetProjection {
  try {
    return projectWorkbook(readPackage(bytes))
  } catch (error) {
    throw packageError(error)
  }
}

export function replaceXlsxCell(bytes: Uint8Array, edit: XlsxCellEdit): Uint8Array {
  try {
    return writeZip(updateWorkbookCell(readPackage(bytes), edit))
  } catch (error) {
    throw packageError(error)
  }
}

function readPackage(bytes: Uint8Array): Map<string, Uint8Array> {
  try {
    return readZip(bytes)
  } catch (error) {
    if (error instanceof ZipStoreError) throw new XlsxPackageError('invalid_xlsx')
    throw error
  }
}

function packageError(error: unknown): Error {
  if (error instanceof XlsxPackageError) return error
  if (error instanceof XlsxXmlError) return new XlsxPackageError(error.reason)
  if (error instanceof ZipStoreError) return new XlsxPackageError('invalid_xlsx')
  if (error instanceof Error) return error
  return new XlsxPackageError('invalid_xlsx')
}
