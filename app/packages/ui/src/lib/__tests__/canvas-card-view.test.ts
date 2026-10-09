import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import type { CanvasNode } from '../../../../shared/src/protocol/canvas'
import {
  mediaFrameFromCard,
  projectCanvasCard,
  visibleCanvasCards,
} from '../../../../shared/src/protocol/canvas-card-view'

describe('canvas card view', () => {
  test('a hidden card leaves the visible board and a stopped card keeps its artifact frame', () => {
    const docx = projectCanvasCard({
      node: node('doc-1', 'text_frame', { kind: 'docx', filePath: '/work/note.docx' }),
      hidden: true,
      suspended: false,
      paragraphs: ['Alpha'],
    })
    const media = projectCanvasCard({
      node: node('image-1', 'image_asset', {
        kind: 'aigc_artifact',
        invocationId: 'inv-image',
        mediaKind: 'image',
      }),
      hidden: false,
      suspended: true,
      phase: 'completed',
      artifact: {
        mediaKind: 'image',
        mimeType: 'image/png',
        path: '/work/frame.png',
        name: 'frame.png',
        previewSrc: 'data:image/png;base64,AQID',
      },
    })
    expect(docx).toMatchObject({ hidden: true, live: true, docx: { paragraphs: ['Alpha'] } })
    expect(media).toMatchObject({ suspended: true, live: false })
    expect(mediaFrameFromCard(media!)).toMatchObject({
      mediaKind: 'image',
      mimeType: 'image/png',
      filePath: '/work/frame.png',
      previewSrc: 'data:image/png;base64,AQID',
    })
    expect(visibleCanvasCards([docx!, media!]).map((card) => card.nodeId)).toEqual(['image-1'])
  })

  test('the board uses the existing card chrome and the shared document command', () => {
    const source = readFileSync(new URL('../../components/canvas/ArtifactCanvasBoard.tsx', import.meta.url), 'utf8')
    expect(source.includes('ContentFrame')).toBe(true)
    expect(source.includes('DocumentPreviewCommand')).toBe(true)
    expect(source.includes("from '@xyflow/react'")).toBe(false)
    expect(source.includes('from "@xyflow/react"')).toBe(false)
    expect(source.includes('card.hidden')).toBe(true)
    expect(source.includes('card.live')).toBe(true)
  })
})

function node(id: string, type: CanvasNode['type'], binding: Record<string, unknown>): CanvasNode {
  return {
    id,
    type,
    cx: 12,
    cy: 16,
    width: 320,
    height: 240,
    data: { binding },
    contentType: 'live',
    seq: 1,
  }
}
