import { describe, expect, test } from 'bun:test'
import { buildDocx, readDocxParagraphs, replaceDocxParagraph } from '@craft-agent/shared/protocol'
import { classifyFile } from '../file-classification'
import { paragraphsFromDocxBytes, replaceDocxParagraphBytes } from '../docx-preview'

describe('docx preview', () => {
  test('a docx opens in the preview and a legacy workbook opens as Locked', () => {
    expect(classifyFile('/work/note.docx')).toEqual({ type: 'docx', canPreview: true })
    expect(classifyFile('/work/budget.xlsx')).toEqual({ type: 'xlsx', canPreview: true })
    expect(classifyFile('/work/legacy.xls')).toEqual({ type: 'document-locked', canPreview: true })
    expect(classifyFile('/work/macros.xlsm')).toEqual({ type: 'document-locked', canPreview: true })
    expect(classifyFile('/work/talk.pptx')).toEqual({ type: 'pptx', canPreview: true })
    expect(classifyFile('/work/legacy.ppt')).toEqual({ type: 'document-locked', canPreview: true })
    expect(classifyFile('/work/macros.pptm')).toEqual({ type: 'document-locked', canPreview: true })
    expect(classifyFile('/work/legacy.doc').canPreview).toBe(false)
  })

  test('the overlay reader sees the same paragraphs the host package writes', () => {
    const original = buildDocx(['Alpha', 'Beta'])
    expect(paragraphsFromDocxBytes(original)).toEqual(['Alpha', 'Beta'])
    const edited = replaceDocxParagraph(original, 0, 'Human & <team>')
    expect(paragraphsFromDocxBytes(edited)).toEqual(['Human & <team>', 'Beta'])
    const fromPreview = replaceDocxParagraphBytes(original, 1, 'From the preview')
    expect(readDocxParagraphs(fromPreview)).toEqual(['Alpha', 'From the preview'])
  })
})