/**
 * DelegationStrip — pure projection of child sessionMeta under a parent.
 * Vite's `?url` pdfjs worker is not loadable under bun; mock before dynamic import.
 */

import { describe, expect, test, mock, beforeAll } from 'bun:test'

mock.module('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }))
mock.module('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: () => ({}),
}))

import { renderToStaticMarkup } from 'react-dom/server'
import { createStore, Provider } from 'jotai'
import { I18nextProvider } from 'react-i18next'
import { setupI18n } from '@craft-agent/shared/i18n'

import { sessionMetaMapAtom, type SessionMeta } from '@/atoms/sessions'

let DelegationStrip: typeof import('../DelegationStrip').DelegationStrip

// Hand the instance through context (same pattern as StatusBadge tests).
const i18n = setupI18n()

beforeAll(async () => {
  ;({ DelegationStrip } = await import('../DelegationStrip'))
})

function meta(partial: Partial<SessionMeta> & Pick<SessionMeta, 'id' | 'workspaceId'>): SessionMeta {
  return {
    workspaceName: partial.workspaceName ?? 'ws',
    isProcessing: false,
    lastMessageAt: 0,
    ...partial,
  } as SessionMeta
}

function renderStrip(
  store: ReturnType<typeof createStore>,
  props: { parentSessionId: string; onOpenSession?: (id: string) => void },
): string {
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <DelegationStrip {...props} />
      </Provider>
    </I18nextProvider>,
  )
}

describe('DelegationStrip', () => {
  test('renders null when the parent has no child sessions', () => {
    const store = createStore()
    store.set(sessionMetaMapAtom, new Map([
      ['parent', meta({ id: 'parent', workspaceId: 'w1', name: 'Parent' })],
      ['other', meta({ id: 'other', workspaceId: 'w1', name: 'Unrelated', parentSessionId: 'elsewhere' })],
    ]))
    const html = renderStrip(store, { parentSessionId: 'parent' })
    expect(html).toBe('')
  })

  test('projects children under the parent with headline and labels', () => {
    const store = createStore()
    store.set(sessionMetaMapAtom, new Map([
      ['parent', meta({ id: 'parent', workspaceId: 'w1', name: 'Parent' })],
      ['c1', meta({
        id: 'c1',
        workspaceId: 'w1',
        name: 'Research',
        parentSessionId: 'parent',
        isProcessing: true,
        sessionStatus: 'in-progress',
      })],
      ['c2', meta({
        id: 'c2',
        workspaceId: 'w1',
        name: 'Draft',
        parentSessionId: 'parent',
        sessionStatus: 'done',
      })],
    ]))
    const html = renderStrip(store, { parentSessionId: 'parent' })
    // Localized region label (full i18n instance — not weakened to raw keys).
    expect(html).toContain('Delegated work')
    expect(html).toContain('running')
    expect(html).toContain('done')
    expect(html).toContain('Research')
    expect(html).toContain('Draft')
    expect(html).toContain('Open delegated session: Research')
  })
})
