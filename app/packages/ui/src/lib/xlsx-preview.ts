/**
 * XLSX bytes to the first-sheet cells the preview overlay renders.
 * fflate reads the package in the renderer. The cell text comes from the
 * same worksheet operation the host uses before file.create or file.update.
 */

import { unzipSync, zipSync } from 'fflate'
import {
  projectWorkbook,
  updateWorkbookCell,
  type SheetProjection,
  type XlsxCellEdit,
} from '@craft-agent/shared/protocol/xlsx-xml'

export function cellsFromXlsxBytes(bytes: Uint8Array): SheetProjection {
  try {
    return projectWorkbook(unzipToMap(bytes))
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'invalid_xlsx')
  }
}

export function replaceXlsxCellBytes(bytes: Uint8Array, edit: XlsxCellEdit): Uint8Array {
  let files: Map<string, Uint8Array>
  try {
    files = unzipToMap(bytes)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'invalid_xlsx')
  }
  const next = updateWorkbookCell(files, edit)
  const record: Record<string, Uint8Array> = {}
  for (const [name, data] of next) record[name] = data
  return zipSync(record)
}

function unzipToMap(bytes: Uint8Array): Map<string, Uint8Array> {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new Error('invalid_xlsx')
  }
  return new Map(Object.entries(files))
}
