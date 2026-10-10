/**
 * XlsxPreviewOverlay — read cells from the first sheet of an XLSX.
 *
 * The shell mounts this reader. Formula cells stay Locked. Edit and save
 * stay Locked until a main-process admit exists. This component does not
 * call the document host and does not rewrite the package.
 */

import { useEffect, useState } from 'react'
import { Table } from 'lucide-react'
import { suiteForPath } from '@craft-agent/shared/protocol/document-command'
import type { SheetCell } from '@craft-agent/shared/protocol/xlsx-xml'
import { cellsFromXlsxBytes } from '../../lib/xlsx-preview'
import { AdmissionNotice } from './AdmissionNotice'
import { DOCUMENT_SAVE_LOCKED, presentDocumentRow, presentDocumentViewer } from './admission-presentation'
import { ContentFrame } from './ContentFrame'
import { PreviewOverlay } from './PreviewOverlay'

export interface XlsxPreviewOverlayProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  loadBytes: (path: string) => Promise<Uint8Array>
  theme?: 'light' | 'dark'
}

export function XlsxPreviewOverlay({
  isOpen,
  onClose,
  filePath,
  loadBytes,
  theme = 'light',
}: XlsxPreviewOverlayProps) {
  const suite = suiteForPath(filePath)
  const readable = suite?.id === 'xlsx' && suite.status === 'wired'
  const [sheetName, setSheetName] = useState('')
  const [cells, setCells] = useState<SheetCell[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(readable)
  const title = filePath.split(/[\\/]/).pop() ?? 'Workbook'

  useEffect(() => {
    if (!isOpen || !filePath || !readable) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setSheetName('')
    setCells([])
    loadBytes(filePath)
      .then((loaded) => {
        if (cancelled) return
        const projected = cellsFromXlsxBytes(loaded)
        setSheetName(projected.sheetName)
        setCells(projected.cells)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'invalid_xlsx')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen, filePath, loadBytes, readable])

  const presentation = presentDocumentViewer({
    filePath,
    expectedSuite: 'xlsx',
    load: !readable ? 'ready' : isLoading ? 'loading' : error ? 'error' : 'ready',
    error,
    empty: !isLoading && !error && cells.length === 0,
  })
  const showSaveLock = readable

  return (
    <PreviewOverlay
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      filePath={filePath}
      title={title}
      typeBadge={{ icon: Table, label: 'XLSX', variant: 'green' }}
      error={error ? { label: 'Load Failed', message: error } : undefined}
    >
      <ContentFrame title={title}>
        <div className="px-8 py-6" data-document-overlay="xlsx">
          <AdmissionNotice presentation={presentation} />
          {showSaveLock ? (
            <div className="mt-2">
              <AdmissionNotice presentation={DOCUMENT_SAVE_LOCKED} detailKey="admission.document.saveLocked" />
            </div>
          ) : null}
          {sheetName ? <p className="mb-4 mt-4 text-sm text-muted-foreground">{sheetName}</p> : null}
          {cells.map((cell) => {
            const row = presentDocumentRow({ filePath, rowLocked: cell.valueType === 'formula' })
            return (
              <div key={cell.ref} className="mb-4 last:mb-0">
                <p className="text-xs text-muted-foreground">{cell.ref}</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{cell.value}</p>
                {cell.valueType === 'formula' ? (
                  <AdmissionNotice presentation={row} detailKey="admission.document.formula" />
                ) : null}
              </div>
            )
          })}
        </div>
      </ContentFrame>
    </PreviewOverlay>
  )
}
