/**
 * View projection for one canvas card.
 *
 * The node stores a binding. Paragraphs and media bytes stay with their
 * owners. This module does not admit turns and does not touch the filesystem.
 */

import type { CanvasNode, NodeType } from './canvas'

export const CANVAS_CARD_KINDS = ['docx', 'aigc_artifact'] as const
export type CanvasCardKind = (typeof CANVAS_CARD_KINDS)[number]

export interface DocxCardBinding {
  kind: 'docx'
  filePath: string
}

export interface AigcCardBinding {
  kind: 'aigc_artifact'
  invocationId: string
  mediaKind: 'image' | 'video'
}

export type CanvasCardBinding = DocxCardBinding | AigcCardBinding

export interface CanvasCardFrame {
  cx: number
  cy: number
  width: number
  height: number
}

export interface CanvasCardMediaFrame {
  mediaKind: 'image' | 'video'
  mimeType: string
  filePath: string
  title: string
  previewSrc?: string
  phase: string
}

export interface CanvasCardView {
  nodeId: string
  kind: CanvasCardKind
  title: string
  hidden: boolean
  suspended: boolean
  live: boolean
  frame: CanvasCardFrame
  docx?: {
    filePath: string
    paragraphs: string[]
  }
  media?: CanvasCardMediaFrame
}

export interface CanvasCardProjection {
  node: CanvasNode
  hidden: boolean
  suspended: boolean
  paragraphs?: string[]
  phase?: string
  artifact?: {
    mediaKind: 'image' | 'video'
    mimeType: string
    path: string
    name: string
    previewSrc?: string
  } | null
}

export function parseCanvasCardBinding(value: unknown): CanvasCardBinding | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (record.kind === 'docx' && typeof record.filePath === 'string' && record.filePath.trim().length > 0) {
    return { kind: 'docx', filePath: record.filePath }
  }
  if (
    record.kind === 'aigc_artifact'
    && typeof record.invocationId === 'string'
    && record.invocationId.trim().length > 0
    && (record.mediaKind === 'image' || record.mediaKind === 'video')
  ) {
    return { kind: 'aigc_artifact', invocationId: record.invocationId, mediaKind: record.mediaKind }
  }
  return null
}

export function bindingFromNode(node: CanvasNode): CanvasCardBinding | null {
  return parseCanvasCardBinding(node.data.binding)
}

export function nodeTypeForBinding(binding: CanvasCardBinding): NodeType {
  switch (binding.kind) {
    case 'docx':
      return 'text_frame'
    case 'aigc_artifact':
      return binding.mediaKind === 'video' ? 'video_frame' : 'image_asset'
    default: {
      const unexpected: never = binding
      return unexpected
    }
  }
}

export function projectCanvasCard(input: CanvasCardProjection): CanvasCardView | null {
  const binding = bindingFromNode(input.node)
  if (!binding) return null
  const frame: CanvasCardFrame = {
    cx: input.node.cx,
    cy: input.node.cy,
    width: input.node.width,
    height: input.node.height,
  }
  const live = input.node.contentType === 'live' && !input.suspended
  switch (binding.kind) {
    case 'docx':
      return {
        nodeId: input.node.id,
        kind: 'docx',
        title: fileName(binding.filePath),
        hidden: input.hidden,
        suspended: input.suspended,
        live,
        frame,
        docx: {
          filePath: binding.filePath,
          paragraphs: input.paragraphs ?? [],
        },
      }
    case 'aigc_artifact': {
      const artifact = input.artifact
      const mediaKind = artifact?.mediaKind ?? binding.mediaKind
      const title = artifact?.name ?? (mediaKind === 'video' ? 'Video' : 'Image')
      return {
        nodeId: input.node.id,
        kind: 'aigc_artifact',
        title,
        hidden: input.hidden,
        suspended: input.suspended,
        live,
        frame,
        media: {
          mediaKind,
          mimeType: artifact?.mimeType ?? '',
          filePath: artifact?.path ?? '',
          title: artifact?.name ?? binding.invocationId,
          phase: input.phase ?? 'unknown',
          ...(artifact?.previewSrc ? { previewSrc: artifact.previewSrc } : {}),
        },
      }
    }
    default: {
      const unexpected: never = binding
      return unexpected
    }
  }
}

export function visibleCanvasCards(cards: readonly CanvasCardView[]): CanvasCardView[] {
  return cards.filter((card) => !card.hidden)
}

export function mediaFrameFromCard(card: CanvasCardView): CanvasCardMediaFrame | null {
  return card.media ?? null
}

function fileName(filePath: string): string {
  const name = filePath.split(/[\\/]/).pop()
  return name && name.length > 0 ? name : 'Document'
}
