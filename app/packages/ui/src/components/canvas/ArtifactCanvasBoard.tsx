/**
 * ArtifactCanvasBoard — DOCX and AIGC cards on the existing canvas frame.
 *
 * ContentFrame is the card chrome. A DOCX edit emits the same
 * DocumentPreviewCommand as DocxPreviewOverlay. Image and video use the
 * same frame as MediaPreviewOverlay. Positions are CanvasNode cx/cy.
 * @xyflow/react is not installed in this repo. Hide, stop, and delete call
 * the parent; the card does not own the file or the job.
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CanvasCardView } from '@craft-agent/shared/protocol/canvas-card-view'
import type { DocumentPreviewCommand } from '@craft-agent/shared/protocol/document-command'
import { ContentFrame } from '../overlay/ContentFrame'

export interface ArtifactCanvasBoardProps {
  cards: CanvasCardView[]
  onDocxCommand?: (nodeId: string, command: DocumentPreviewCommand) => void
  onHide: (nodeId: string) => void
  onStop: (nodeId: string) => void
  onDelete: (nodeId: string) => void
}

export function ArtifactCanvasBoard({
  cards,
  onDocxCommand,
  onHide,
  onStop,
  onDelete,
}: ArtifactCanvasBoardProps) {
  const visible = cards.filter((card) => !card.hidden)
  const height = visible.reduce((max, card) => Math.max(max, card.frame.cy + card.frame.height), 320)
  return (
    <div className="relative w-full bg-background" style={{ minHeight: height }}>
      {visible.map((card) => (
        <div
          key={card.nodeId}
          className="absolute"
          style={{ left: card.frame.cx, top: card.frame.cy, width: card.frame.width }}
        >
          <CanvasArtifactCard
            card={card}
            onDocxCommand={onDocxCommand}
            onHide={onHide}
            onStop={onStop}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}

function CanvasArtifactCard({
  card,
  onDocxCommand,
  onHide,
  onStop,
  onDelete,
}: {
  card: CanvasCardView
  onDocxCommand?: (nodeId: string, command: DocumentPreviewCommand) => void
  onHide: (nodeId: string) => void
  onStop: (nodeId: string) => void
  onDelete: (nodeId: string) => void
}) {
  const { t } = useTranslation()
  return (
    <ContentFrame title={card.title} maxWidth={card.frame.width}>
      {card.docx ? (
        <DocxCardBody card={card} onDocxCommand={onDocxCommand} />
      ) : card.media ? (
        <MediaCardBody card={card} />
      ) : null}
      <div className="flex gap-3 px-4 py-3">
        <button type="button" className="text-xs text-foreground/70" onClick={() => onHide(card.nodeId)}>
          {t('canvas.hideCard')}
        </button>
        <button type="button" className="text-xs text-foreground/70" onClick={() => onStop(card.nodeId)}>
          {t('canvas.stopCard')}
        </button>
        <button type="button" className="text-xs text-foreground/70" onClick={() => onDelete(card.nodeId)}>
          {t('common.delete')}
        </button>
      </div>
    </ContentFrame>
  )
}

function DocxCardBody({
  card,
  onDocxCommand,
}: {
  card: CanvasCardView
  onDocxCommand?: (nodeId: string, command: DocumentPreviewCommand) => void
}) {
  const { t } = useTranslation()
  const paragraphs = card.docx?.paragraphs ?? []
  const [drafts, setDrafts] = useState(paragraphs)
  const paragraphKey = paragraphs.join('\n')

  useEffect(() => {
    setDrafts(paragraphs)
  }, [paragraphKey, paragraphs])

  if (!card.live) {
    return (
      <div className="px-8 py-6">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4 text-sm leading-6 text-foreground last:mb-0">{paragraph}</p>
        ))}
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
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
            onClick={() => onDocxCommand?.(card.nodeId, { op: 'edit', paragraphIndex: index, text: drafts[index] ?? '' })}
          >
            {t('common.edit')}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-foreground/70"
        onClick={() => onDocxCommand?.(card.nodeId, { op: 'undo' })}
      >
        {t('menu.undo')}
      </button>
    </div>
  )
}

function MediaCardBody({ card }: { card: CanvasCardView }) {
  const media = card.media
  if (!media) return null
  const previewSrc = card.live ? media.previewSrc : undefined
  return (
    <div className="flex min-h-[240px] items-center justify-center p-6">
      {previewSrc && media.mediaKind === 'image' ? (
        <img src={previewSrc} alt={media.title} className="max-h-full max-w-full object-contain" />
      ) : previewSrc && media.mediaKind === 'video' ? (
        <video src={previewSrc} controls className="max-h-full max-w-full" />
      ) : (
        <p className="text-sm text-muted-foreground">{media.mimeType || media.phase}</p>
      )}
    </div>
  )
}
