/**
 * DocxPreviewOverlay — open a DOCX and edit its paragraphs.
 *
 * PreviewOverlay and ContentFrame are the existing chrome. Paragraph text
 * uses the same document.xml replace as the host. The Edit and Undo buttons
 * call onApply with the shared command when a parent admits the write.
 * Without that callback, Edit and Undo change only the bytes this overlay loaded.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import type { DocumentPreviewCommand } from '@craft-agent/shared/protocol/document-command'
import { paragraphsFromDocxBytes, replaceDocxParagraphBytes } from '../../lib/docx-preview'
import { ContentFrame } from './ContentFrame'
import { PreviewOverlay } from './PreviewOverlay'

export interface DocxPreviewOverlayProps {
  isOpen: boolean
  onClose: () => void
  filePath: string
  loadBytes: (path: string) => Promise<Uint8Array>
  theme?: 'light' | 'dark'
  onApply?: (command: DocumentPreviewCommand) => void
}

export function DocxPreviewOverlay({
  isOpen,
  onClose,
  filePath,
  loadBytes,
  theme = 'light',
  onApply,
}: DocxPreviewOverlayProps) {
  const { t } = useTranslation()
  const [bytes, setBytes] = useState<Uint8Array | null>(null)
  const [drafts, setDrafts] = useState<string[]>([])
  const [undoStack, setUndoStack] = useState<Uint8Array[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const title = filePath.split(/[\\/]/).pop() ?? 'Document'

  useEffect(() => {
    if (!isOpen || !filePath) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setBytes(null)
    setDrafts([])
    setUndoStack([])
    loadBytes(filePath)
      .then((loaded) => {
        if (cancelled) return
        setBytes(loaded)
        setDrafts(paragraphsFromDocxBytes(loaded))
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'invalid_docx')
        setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [isOpen, filePath, loadBytes])

  function applyEdit(index: number) {
    if (!bytes) return
    const text = drafts[index] ?? ''
    const next = replaceDocxParagraphBytes(bytes, index, text)
    setUndoStack((stack) => [...stack, bytes])
    setBytes(next)
    setDrafts(paragraphsFromDocxBytes(next))
    onApply?.({ op: 'edit', paragraphIndex: index, text })
  }

  function applyUndo() {
    const previous = undoStack[undoStack.length - 1]
    if (!previous) return
    setUndoStack((stack) => stack.slice(0, -1))
    setBytes(previous)
    setDrafts(paragraphsFromDocxBytes(previous))
    onApply?.({ op: 'undo' })
  }

  return (
    <PreviewOverlay
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      filePath={filePath}
      title={title}
      typeBadge={{ icon: FileText, label: 'DOCX', variant: 'blue' }}
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
          {isLoading && <p className="text-sm text-muted-foreground">DOCX</p>}
          {drafts.map((paragraph, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <textarea
                className="w-full resize-y bg-transparent text-sm leading-6 text-foreground outline-none"
                value={paragraph}
                rows={Math.max(1, paragraph.split('\n').length)}
                onChange={(event) => {
                  const next = event.target.value
                  setDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? next : item))
                }}
              />
              <button
                type="button"
                className="text-xs text-foreground/70"
                onClick={() => applyEdit(index)}
              >
                {t('common.edit')}
              </button>
            </div>
          ))}
        </div>
      </ContentFrame>
    </PreviewOverlay>
  )
}
