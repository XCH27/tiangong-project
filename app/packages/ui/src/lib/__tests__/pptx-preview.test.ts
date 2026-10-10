import { describe, expect, test } from 'bun:test'
import { unzipSync } from 'fflate'
import { buildPptx, readPptxSlide } from '@craft-agent/shared/protocol'
import { classifyFile } from '../file-classification'
import { replacePptxTextBytes, textsFromPptxBytes } from '../pptx-preview'

describe('pptx preview', () => {
  test('pptx opens in the overlay and legacy ppt opens as Locked', () => {
    expect(classifyFile('/work/talk.pptx')).toEqual({ type: 'pptx', canPreview: true })
    expect(classifyFile('/work/legacy.ppt')).toEqual({ type: 'document-locked', canPreview: true })
    expect(classifyFile('/work/macros.pptm')).toEqual({ type: 'document-locked', canPreview: true })
  })

  test('the overlay reader sees the same first-slide text the host package writes', () => {
    const original = buildPptx({
      slides: [
        { title: 'Hello', body: 'Team' },
        { title: 'Keep', body: '' },
      ],
    })
    expect(textsFromPptxBytes(original)).toEqual(readPptxSlide(original).texts)
    const edited = replacePptxTextBytes(original, 0, 'Human & <team>')
    expect(textsFromPptxBytes(edited)).toEqual(['Human & <team>', 'Team'])
    const files = unzipSync(edited)
    const slide2 = new TextDecoder().decode(files['ppt/slides/slide2.xml'])
    expect(slide2).toContain('>Keep<')
    expect(readPptxSlide(edited).texts).toEqual(['Human & <team>', 'Team'])
  })
})
