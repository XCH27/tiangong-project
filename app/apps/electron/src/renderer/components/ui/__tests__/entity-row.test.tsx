import { expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { EntityRow } from '../entity-row'

test('row navigation, status and compact menu remain sibling buttons', () => {
  const html = renderToStaticMarkup(
    <EntityRow
      title="Session"
      icon={<button type="button">Status</button>}
      titleTrailing={<span>Now</span>}
      isCompactMode
      compactMenu={() => null}
      buttonProps={{ tabIndex: 0 }}
    />,
  )
  let depth = 0
  for (const match of html.matchAll(/<\/?button\b[^>]*>/g)) {
    depth += match[0].startsWith('</') ? -1 : 1
    expect(depth).toBeLessThanOrEqual(1)
  }
  expect(depth).toBe(0)
  expect(html).toContain('aria-labelledby=')
  expect(html).toContain('tabindex="0"')
  expect(html).toContain('Status')
})
