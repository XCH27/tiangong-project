import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The raw "view as Markdown" overlay renders generated response content, not
 * a file that exists on disk. Its response.md label must therefore never
 * inherit CodePreviewOverlay's Open / Reveal in Finder actions.
 *
 * packages/ui has no DOM harness, so this source guard locks the real call
 * site where the virtual content enters the shared file-preview component.
 */
describe('virtual Markdown response preview', () => {
  it('marks response.md as display-only instead of exposing filesystem actions', () => {
    const source = readFileSync(join(__dirname, '../ChatDisplay.tsx'), 'utf8')
    const filePathOffset = source.indexOf('filePath="response.md"')
    const previewStart = source.lastIndexOf('<CodePreviewOverlay', filePathOffset)
    const previewEnd = source.indexOf('/>', filePathOffset)
    const responsePreview = previewStart >= 0 && previewEnd >= 0
      ? source.slice(previewStart, previewEnd + 2)
      : undefined

    expect(responsePreview).toBeDefined()
    expect(responsePreview).toContain('filePathActions={false}')
  })
})
