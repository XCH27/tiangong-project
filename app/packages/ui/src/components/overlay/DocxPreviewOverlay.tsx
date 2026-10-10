/**
 * DocxPreviewOverlay — read paragraphs from a DOCX.
 *
 * The shell mounts this reader. Edit and save stay Locked until a
 * main-process admit exists. This component does not call the document host
 * and does not rewrite the package.
 */

import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { suiteForPath } from '@craft-agent/shared/protocol/document-command'
import { paragraphsFromDocxBytes } from '../../lib/docx-preview'
import { AdmissionNotice } from './AdmissionNotice'
import { DOCUMENT_SAVE_LOCKED, presentDocumentViewer } from './admission-presentation'
import { ContentFrame } from './ContentFrame'
import { PreviewOverlay } from './PreviewOverlay'

export interface DocxPreviewOverlayProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  loadBytes: (path: string) => Promise<Uint8Array>
  theme?: 'light' | 'dark'
}

export function DocxPreviewOverlay({
  isOpen,
  onClose,
  filePath,
  loadBytes,
  theme = 'light',
}: DocxPreviewOverlayProps) {
  const suite = suiteForPath(filePath)
  const readable = suite?.id === 'docx' && suite.status === 'wired'
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(readable)
  const title = filePath.split(/[\\/]/).pop() ?? 'Document'

  useEffect(() => {
    if (!isOpen || !filePath || !readable) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setParagraphs([])
    loadBytes(filePath)
      .then((loaded) => {
        if (cancelled) return
        setParagraphs(paragraphsFromDocxBytes(loaded))
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'invalid_docx')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen, filePath, loadBytes, readable])

  const presentation = presentDocumentViewer({
    filePath,
    expectedSuite: 'docx',
    load: !readable ? 'ready' : isLoading ? 'loading' : error ? 'error' : 'ready',
    error,
    empty: !isLoading && !error && paragraphs.length === 0,
  })
  const showSaveLock = readable

  return (
    <PreviewOverlay
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      filePath={filePath}
      title={title}
      typeBadge={{ icon: FileText, label: 'DOCX', variant: 'blue' }}
      error={error ? { label: 'Load Failed', message: error } : undefined}
    >
      <ContentFrame title={title}>
        <div className="px-8 py-6" data-document-overlay="docx">
          <AdmissionNotice presentation={presentation} />
          {showSaveLock ? (
            <div className="mt-2">
              <AdmissionNotice presentation={DOCUMENT_SAVE_LOCKED} detailKey="admission.document.saveLocked" />
            </div>
          ) : null}
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </ContentFrame>
    </PreviewOverlay>
  )
}
