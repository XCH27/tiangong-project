/**
 * XlsxPreviewOverlay — open an XLSX and edit cells on its first sheet.
 *
 * PreviewOverlay and ContentFrame are the existing chrome. Cell text uses
 * the same worksheet replace as the host. The Edit and Undo buttons call
 * onApply with the shared command when a parent admits the write. Without
 * that callback, Edit and Undo change only the bytes this overlay loaded.
 * Formula cells stay read-only. This is not a spreadsheet editor.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Table } from 'lucide-react'
import type { DocumentPreviewCommand } from '@craft-agent/shared/protocol/document-command'
import type { SheetCell, SheetValueType } from '@craft-agent/shared/protocol/xlsx-xml'
import { cellsFromXlsxBytes, replaceXlsxCellBytes } from '../../lib/xlsx-preview'
import { ContentFrame } from './ContentFrame'
import { PreviewOverlay } from './PreviewOverlay'

export interface XlsxPreviewOverlayProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  loadBytes: (path: string) => Promise<Uint8Array>
  theme?: 'light' | 'dark'
  onApply?: (command: DocumentPreviewCommand) => void
}

export function XlsxPreviewOverlay({
  isOpen,
  onClose,
  filePath,
  loadBytes,
  theme = 'light',
  onApply,
}: XlsxPreviewOverlayProps) {
  const { t } = useTranslation()
  const [bytes, setBytes] = useState<Uint8Array | null>(null)
  const [sheetName, setSheetName] = useState('')
  const [drafts, setDrafts] = useState<SheetCell[]>([])
  const [undoStack, setUndoStack] = useState<Uint8Array[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const title = filePath.split(/[\\/]/).pop() ?? 'Workbook'

  useEffect(() => {
    if (!isOpen || !filePath) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setBytes(null)
    setSheetName('')
    setDrafts([])
    setUndoStack([])
    loadBytes(filePath)
      .then((loaded) => {
        if (cancelled) return
        const projected = cellsFromXlsxBytes(loaded)
        setBytes(loaded)
        setSheetName(projected.sheetName)
        setDrafts(shown(projected.cells))
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'invalid_xlsx')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen, filePath, loadBytes])

  function applyEdit(index: number) {
    if (!bytes) return
    const cell = drafts[index]
    if (!cell || cell.valueType === 'formula') return
    const valueType = editableType(cell)
    try {
      const next = replaceXlsxCellBytes(bytes, { cell: cell.ref, value: cell.value, valueType })
      const projected = cellsFromXlsxBytes(next)
      setUndoStack((stack) => [...stack, bytes])
      setBytes(next)
      setSheetName(projected.sheetName)
      setDrafts(shown(projected.cells))
      onApply?.({ op: 'update', cell: cell.ref, value: cell.value, valueType })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'invalid_xlsx')
    }
  }

  function applyUndo() {
    const previous = undoStack[undoStack.length - 1]
    if (!previous) return
    const projected = cellsFromXlsxBytes(previous)
    setUndoStack((stack) => stack.slice(0, -1))
    setBytes(previous)
    setSheetName(projected.sheetName)
    setDrafts(shown(projected.cells))
    onApply?.({ op: 'undo' })
  }

  return (
    <PreviewOverlay
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      filePath={filePath}
      title={title}
      typeBadge={{ icon: Table, label: 'XLSX', variant: 'green' }}
      error={error ? { label: 'Load Failed', message: error } : undefined}
      headerActions={(
        <button
          type="button"
          className="text-sm text-foreground/70 disabled:opacity-40"
          onClick={applyUndo}
          disabled={undoStack.length === 0}
        >
          {t('menu.undo')}
        </button>
      )}
    >
      <ContentFrame title={title}>
        <div className="px-8 py-6">
          {isLoading && <p className="text-sm text-muted-foreground">XLSX</p>}
          {sheetName && <p className="mb-4 text-sm text-muted-foreground">{sheetName}</p>}
          {drafts.map((cell, index) => (
            <div key={cell.ref} className="mb-4 last:mb-0">
              <p className="text-xs text-muted-foreground">{cell.ref}</p>
              <textarea
                className="w-full resize-y bg-transparent text-sm leading-6 text-foreground outline-none disabled:opacity-60"
                value={cell.value}
                rows={Math.max(1, cell.value.split('\n').length)}
                disabled={cell.valueType === 'formula'}
                onChange={(event) => {
                  const next = event.target.value
                  setDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: next } : item))
                }}
              />
              {cell.valueType === 'formula' ? (
                <p className="text-xs text-muted-foreground">formula</p>
              ) : (
                <button
                  type="button"
                  className="text-xs text-foreground/70"
                  onClick={() => applyEdit(index)}
                >
                  {t('common.edit')}
                </button>
              )}
            </div>
          ))}
        </div>
      </ContentFrame>
    </PreviewOverlay>
  )
}

function shown(cells: SheetCell[]): SheetCell[] {
  if (cells.length > 0) return cells
  return [{ ref: 'A1', value: '', valueType: 'string' }]
}

function editableType(cell: SheetCell): SheetValueType {
  if (cell.valueType === 'number' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(cell.value)) return 'number'
  if (cell.valueType === 'bool' && (cell.value === 'true' || cell.value === 'false')) return 'bool'
  return 'string'
}
