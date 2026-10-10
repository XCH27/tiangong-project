import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import type { CanvasNode } from '../../../../shared/src/protocol/canvas'
import {
  mediaFrameFromCard,
  officePreviewTarget,
  projectCanvasCard,
  visibleCanvasCards,
} from '../../../../shared/src/protocol/canvas-card-view'
import { classifyFile } from '../file-classification'

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

  test('xlsx and pptx cards project the first sheet or first slide and route to the existing preview', () => {
    const sheet = projectCanvasCard({
      node: node('sheet-1', 'text_frame', { kind: 'xlsx', filePath: '/work/budget.xlsx' }),
      hidden: false,
      suspended: false,
      sheetName: 'Budget',
      cells: [
        { ref: 'A1', value: 'name', valueType: 'string' },
        { ref: 'B1', value: '2', valueType: 'formula' },
      ],
    })
    const deck = projectCanvasCard({
      node: node('deck-1', 'text_frame', { kind: 'pptx', filePath: '/work/talk.pptx' }),
      hidden: false,
      suspended: true,
      texts: ['Hello', 'Team'],
    })
    expect(sheet).toMatchObject({
      kind: 'xlsx',
      live: true,
      title: 'budget.xlsx',
      xlsx: { sheetName: 'Budget', filePath: '/work/budget.xlsx' },
    })
    expect(deck).toMatchObject({ kind: 'pptx', live: false, suspended: true, pptx: { texts: ['Hello', 'Team'] } })
    expect(officePreviewTarget(sheet!)).toEqual({ type: 'xlsx', filePath: '/work/budget.xlsx' })
    expect(officePreviewTarget(deck!)).toEqual({ type: 'pptx', filePath: '/work/talk.pptx' })
    expect(classifyFile(officePreviewTarget(sheet!)!.filePath).type).toBe('xlsx')
    expect(classifyFile(officePreviewTarget(deck!)!.filePath).type).toBe('pptx')
    expect(officePreviewTarget(projectCanvasCard({
      node: node('doc-2', 'text_frame', { kind: 'docx', filePath: '/work/note.docx' }),
      hidden: false,
      suspended: false,
      paragraphs: ['Alpha'],
    })!)).toBeNull()
  })

  test('the board uses the existing card chrome and the shared document command', () => {
    const source = readFileSync(new URL('../../components/canvas/ArtifactCanvasBoard.tsx', import.meta.url), 'utf8')
    expect(source.includes('ContentFrame')).toBe(true)
    expect(source.includes('DocumentPreviewCommand')).toBe(true)
    expect(source.includes('XlsxPreviewOverlay')).toBe(true)
    expect(source.includes('PptxPreviewOverlay')).toBe(true)
    expect(source.includes('onOpenOffice')).toBe(true)
    expect(source.includes("from '@xyflow/react'")).toBe(false)
    expect(source.includes('from "@xyflow/react"')).toBe(false)
    expect(source.includes('card.hidden')).toBe(true)
    expect(source.includes('card.live')).toBe(true)
    const office = source.slice(source.indexOf('function OfficeSummary'), source.indexOf('function MediaCardBody'))
    expect(office.includes('textarea')).toBe(false)
    expect(office.includes('common.open')).toBe(true)
    expect(office.includes('data-office-preview')).toBe(true)
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
