import { describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { DOCS, getLocalDocPath, getUpstreamDocUrl, type DocFeature } from '../doc-links'

const BUNDLED = join(import.meta.dir, '../../../../../apps/electron/resources/docs')

describe('every documented feature has a local page', () => {
  it('resolves to a file under the mirrored guide', () => {
    expect(getLocalDocPath('sources')).toBe('docs/guide/sources/overview.md')
    expect(getLocalDocPath('skills')).toBe('docs/guide/skills/overview.md')
  })

  /**
   * The point of the mirror is that no surface has to reach a Craft-operated site.
   * A feature whose page is missing from the bundle would silently open nothing, so
   * the bundle is checked rather than trusted.
   */
  it('ships the page every feature points at', () => {
    const missing: string[] = []
    for (const feature of Object.keys(DOCS) as DocFeature[]) {
      const rel = getLocalDocPath(feature).replace(/^docs\//, '')
      if (!existsSync(join(BUNDLED, rel))) missing.push(`${feature} -> ${rel}`)
    }
    expect(missing).toEqual([])
  })

  it('keeps the upstream URL as provenance only', () => {
    expect(getUpstreamDocUrl('sources')).toBe('https://thecraftagents.com/docs/sources/overview')
  })
})
