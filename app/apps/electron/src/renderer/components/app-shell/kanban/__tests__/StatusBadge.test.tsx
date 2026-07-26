import { describe, expect, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { setupI18n } from '@craft-agent/shared/i18n'
import { I18nextProvider } from 'react-i18next'

import type { SessionStatus } from '@/config/session-status-config'
import { StatusBadge } from '../StatusBadge'

// The badge translates its label. Hand the instance to `useTranslation` through
// context rather than the `initReactI18next` global: `setupI18n` only wires
// plugins on the first call, so whether the global carries the React
// integration depends on which test file initialized it first.
const i18n = setupI18n()

const status = {
  id: 'needs-review',
  label: 'Needs Review',
  category: 'open',
  resolvedColor: '#f59e0b',
} as SessionStatus

/**
 * Class list of the badge root, as actually rendered. The badge calls
 * `useTranslation`, so it has to go through a renderer rather than be invoked
 * directly — a bare call has no hook dispatcher installed.
 */
function rootClassNames(): string[] {
  const html = renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <StatusBadge status={status} />
    </I18nextProvider>
  )
  const rootClass = /^<span[^>]*\sclass="([^"]*)"/.exec(html)?.[1]
  if (rootClass === undefined) throw new Error(`badge root carries no class attribute: ${html}`)
  return rootClass.split(/\s+/)
}

describe('StatusBadge', () => {
  test('uses a fixed control height instead of text-dependent vertical padding', () => {
    const classNames = rootClassNames()

    expect(classNames).toContain('h-6')
    expect(classNames).not.toContain('py-0.5')
  })
})
