/**
 * MediaPreviewOverlay — image or video preview for an AIGC artifact.
 *
 * Uses the existing PreviewOverlay chrome. A missing preview source stays a
 * labeled media frame. It does not fall through to a code or diff view.
 */

import { Image, Video } from 'lucide-react'
import { PreviewOverlay } from './PreviewOverlay'

export interface MediaPreviewOverlayProps {
  isOpen: boolean
  onClose: () => void
  mediaKind: 'image' | 'video'
  mimeType: string
  filePath: string
  title?: string
  previewSrc?: string
  theme?: 'light' | 'dark'
  error?: string
}

export function MediaPreviewOverlay({
  isOpen,
  onClose,
  mediaKind,
  mimeType,
  filePath,
  title,
  previewSrc,
  theme = 'light',
  error,
}: MediaPreviewOverlayProps) {
  const Icon = mediaKind === 'video' ? Video : Image
  const label = mediaKind === 'video' ? 'Video' : 'Image'
  return (
    <PreviewOverlay
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
      filePath={filePath}
      title={title}
      typeBadge={{ icon: Icon, label, variant: 'blue' }}
      error={error ? { label: 'Error', message: error } : undefined}
    >
      <div className="flex h-full min-h-[240px] items-center justify-center p-6">
        {previewSrc && mediaKind === 'image' ? (
          <img src={previewSrc} alt={title ?? filePath} className="max-h-full max-w-full object-contain" />
        ) : previewSrc && mediaKind === 'video' ? (
          <video src={previewSrc} controls className="max-h-full max-w-full" />
        ) : (
          <p className="text-sm text-muted-foreground">{mimeType}</p>
        )}
      </div>
    </PreviewOverlay>
  )
}
