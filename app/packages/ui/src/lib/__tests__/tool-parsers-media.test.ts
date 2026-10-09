import { describe, expect, it } from 'bun:test'
import type { ActivityItem } from '../../components/chat/TurnCard'
import { extractOverlayData } from '../tool-parsers'

function activity(content: string): ActivityItem {
  return {
    id: 'tool-1',
    type: 'tool',
    status: 'completed',
    timestamp: 1,
    toolName: 'aigc.job_submit',
    toolInput: {},
    content,
  }
}

describe('extractOverlayData media artifacts', () => {
  it('opens an image artifact as a media preview instead of a code overlay', () => {
    const overlay = extractOverlayData(activity(JSON.stringify({
      kind: 'aigc_artifact',
      mediaKind: 'image',
      mimeType: 'image/png',
      name: 'frame.png',
      path: '/tmp/frame.png',
      previewSrc: 'data:image/png;base64,AQID',
    })))
    expect(overlay).toMatchObject({
      type: 'media',
      mediaKind: 'image',
      mimeType: 'image/png',
      filePath: '/tmp/frame.png',
      title: 'frame.png',
      previewSrc: 'data:image/png;base64,AQID',
    })
  })

  it('keeps a video artifact previewable when the provider sent no preview bytes', () => {
    const overlay = extractOverlayData(activity(JSON.stringify({
      kind: 'aigc_artifact',
      mediaKind: 'video',
      mimeType: 'video/mp4',
      name: 'clip.mp4',
      path: '/tmp/clip.mp4',
    })))
    expect(overlay).toMatchObject({
      type: 'media',
      mediaKind: 'video',
      mimeType: 'video/mp4',
    })
    expect(overlay && overlay.type === 'media' ? overlay.previewSrc : 'present').toBeUndefined()
  })

  it('leaves ordinary JSON on the json overlay', () => {
    const overlay = extractOverlayData(activity('{"ok":true}'))
    expect(overlay?.type).toBe('json')
  })
})
