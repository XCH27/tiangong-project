/**
 * PptxPreviewOverlay — read text from the first slide of a PPTX.
 *
 * The shell mounts this reader. Animation timing and the other slides stay
 * in the package. Edit and save stay Locked until a main-process admit
 * exists. This component does not call the document host and does not
 * rewrite the package. It is not a MotionDeck.
 */

import { useEffect, useState } from 'react'
import { Presentation } from 'lucide-react'
import { suiteForPath } from '@craft-agent/shared/protocol/document-command'
import { textsFromPptxBytes } from '../../lib/pptx-preview'
import { AdmissionNotice } from './AdmissionNotice'
import { DOCUMENT_SAVE_LOCKED, presentDocumentViewer } from './admission-presentation'
import { ContentFrame } from './ContentFrame'
import { PreviewOverlay } from './PreviewOverlay'

export interface PptxPreviewOverlayProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  loadBytes: (path: string) => Promise<Uint8Array>
  theme?: 'light' | 'dark'
}

export function PptxPreviewOverlay({
  isOpen,
  onClose,
  filePath,
  loadBytes,
  theme = 'light',
}: PptxPreviewOverlayProps) {
  const suite = suiteForPath(filePath)
  const readable = suite?.id === 'pptx' && suite.status === 'wired'
  const [texts, setTexts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(readable)
  const title = filePath.split(/[\\/]/).pop() ?? 'Presentation'

  useEffect(() => {
    if (!isOpen || !filePath || !readable) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setTexts([])
    loadBytes(filePath)
      .then((loaded) => {
        if (cancelled) return
        setTexts(textsFromPptxBytes(loaded))
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'invalid_pptx')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen, filePath, loadBytes, readable])

  const presentation = presentDocumentViewer({
    filePath,
    expectedSuite: 'pptx',
    load: !readable ? 'ready' : isLoading ? 'loading' : error ? 'error' : 'ready',
    error,
    empty: !isLoading && !error && texts.length === 0,
  })
  const showSaveLock = readable

  return (
    <PreviewOverlay
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      filePath={filePath}
      title={title}
      typeBadge={{ icon: Presentation, label: 'PPTX', variant: 'orange' }}
      error={error ? { label: 'Load Failed', message: error } : undefined}
    >
      <ContentFrame title={title}>
        <div className="px-8 py-6" data-document-overlay="pptx">
          <AdmissionNotice presentation={presentation} />
          {showSaveLock ? (
            <div className="mt-2">
              <AdmissionNotice presentation={DOCUMENT_SAVE_LOCKED} detailKey="admission.document.saveLocked" />
            </div>
          ) : null}
          {texts.length > 0 ? <p className="mb-4 mt-4 text-sm text-muted-foreground">Slide 1</p> : null}
          {texts.map((paragraph, index) => (
            <p key={index} className="mb-4 whitespace-pre-wrap text-sm leading-6 text-foreground last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
      </ContentFrame>
    </PreviewOverlay>
  )
}
