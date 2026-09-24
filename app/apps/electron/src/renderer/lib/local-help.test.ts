import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { formatLocalHelpMarkdown, localHelpPath, localHelpPathFromUrl } from './local-help'

const docsRoot = join(import.meta.dir, '../../../resources/docs/craft')

function markdownFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith('.md') ? [path] : []
  })
}

describe('packaged local Help', () => {
  it('opens the complete index and resolves every captured internal link offline', () => {
    expect(localHelpPath('all')).toBe('craft/index.md')
    const files = markdownFiles(docsRoot)
    const index = readFileSync(join(docsRoot, 'index.md'), 'utf8')
    const translatedIndex = readFileSync(join(docsRoot, '../i18n/zh-Hans/craft/index.md'), 'utf8')
    const indexLinks = [...index.matchAll(/\]\((\.\/[^)]+\.md)\)/g)].map(match => match[1]!)
    const translatedLinks = [...translatedIndex.matchAll(/\]\((\.\/[^)]+\.md)\)/g)].map(match => match[1]!)
    expect(files.length).toBe(72)
    expect(indexLinks.length).toBe(files.length - 1)
    expect(translatedLinks.sort()).toEqual(indexLinks.slice().sort())
    for (const link of indexLinks) {
      const path = localHelpPathFromUrl(link, 'craft/index.md')
      expect(path, link).not.toBeNull()
      expect(existsSync(join(docsRoot, path!.replace(/^craft\//, ''))), link).toBe(true)
    }

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      expect(content).not.toContain('https://agents.craft.do/docs/llms.txt')
      expect(content).not.toContain('Official Craft Agents reference captured from')
      expect(content).not.toContain('[All local documentation]')
      for (const url of content.matchAll(/\]\((\/docs\/[^)#]+)/g)) {
        const path = localHelpPathFromUrl(url[1]!)
        expect(path, `${relative(docsRoot, file)}: ${url[1]}`).not.toBeNull()
        expect(existsSync(join(docsRoot, path!.replace(/^craft\//, ''))), `${relative(docsRoot, file)}: ${url[1]}`).toBe(true)
      }
    }
  })

  it('converts hosted Craft article links without sending the reader to the site', () => {
    expect(localHelpPathFromUrl('https://agents.craft.do/docs/sources/apis/overview?ref=help'))
      .toBe('craft/sources/apis/overview.md')
    expect(localHelpPathFromUrl('https://thecraftagents.com/docs/core-concepts/conversations/'))
      .toBe('craft/core-concepts/conversations.md')
    expect(localHelpPathFromUrl('https://thecraftagents.com/docs/'))
      .toBe('craft/index.md')
    expect(localHelpPathFromUrl('/docs/go-further/themes#colors'))
      .toBe('craft/customisation/themes.md')
    expect(localHelpPathFromUrl('./sources/overview.md', 'craft/index.md'))
      .toBe('craft/sources/overview.md')
    expect(localHelpPathFromUrl('../skills/overview.md', 'craft/sources/overview.md'))
      .toBe('craft/skills/overview.md')
    expect(localHelpPathFromUrl('https://example.com/unrelated')).toBeNull()
    expect(localHelpPathFromUrl('https://example.com/docs/sources/overview')).toBeNull()
  })

  it('keeps official Mintlify sections readable in the existing Markdown reader', () => {
    const content = '<AccordionGroup>\n  <Accordion title="Use references">\n    Say "that document".\n  </Accordion>\n</AccordionGroup>\n<Steps>\n  <Step title="Open">\n    ```sh\n    echo ready\n    ```\n  </Step>\n</Steps>'
    const formatted = formatLocalHelpMarkdown(content)
    expect(formatted).toContain('### Use references\n\nSay "that document".')
    expect(formatted).toContain('### Open\n\n```sh\necho ready\n```')
    expect(formatted).not.toContain('<Accordion')
  })
})
