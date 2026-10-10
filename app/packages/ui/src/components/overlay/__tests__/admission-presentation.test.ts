import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import {
  DOCUMENT_SAVE_LOCKED,
  presentDocumentRow,
  presentDocumentViewer,
  presentMcpAppsPane,
} from '../admission-presentation'
import { documentViewerFixtures, mcpAppsPaneFixtures } from './fixtures/admission-states'

describe('office viewer admission', () => {
  for (const fixture of documentViewerFixtures) {
    test(fixture.name, () => {
      const presentation = presentDocumentViewer(fixture.input)
      expect(presentation.phase).toBe(fixture.phase)
      expect(presentation.status).toBe(fixture.status)
      expect(presentation.reason).toBe(fixture.reason)
    })
  }

  test('a formula row stays Locked inside a wired workbook', () => {
    expect(presentDocumentRow({ filePath: '/work/budget.xlsx', rowLocked: true })).toEqual({
      phase: 'locked',
      status: 'Locked',
      reason: 'formula_cell',
    })
    expect(presentDocumentRow({ filePath: '/work/budget.xlsx', rowLocked: false })).toMatchObject({
      phase: 'viewer',
      status: 'wired',
    })
  })

  test('save stays Locked and is not a completed write', () => {
    expect(DOCUMENT_SAVE_LOCKED).toEqual({ phase: 'locked', status: 'Locked', reason: 'save_locked' })
  })

  test('the shipping overlays do not offer a local save', () => {
    for (const name of ['DocxPreviewOverlay.tsx', 'XlsxPreviewOverlay.tsx', 'PptxPreviewOverlay.tsx']) {
      const source = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8')
      expect(source.includes('onApply')).toBe(false)
      expect(source.includes('createDocumentSuiteHost')).toBe(false)
      expect(source.includes('HostTurnKernel')).toBe(false)
      expect(source.includes('DOCUMENT_SAVE_LOCKED')).toBe(true)
      expect(source.includes('<textarea')).toBe(false)
    }
    const docx = readFileSync(new URL('../DocxPreviewOverlay.tsx', import.meta.url), 'utf8')
    expect(docx.includes('replaceDocxParagraphBytes')).toBe(false)
    const xlsx = readFileSync(new URL('../XlsxPreviewOverlay.tsx', import.meta.url), 'utf8')
    expect(xlsx.includes('replaceXlsxCellBytes')).toBe(false)
    const pptx = readFileSync(new URL('../PptxPreviewOverlay.tsx', import.meta.url), 'utf8')
    expect(pptx.includes('replacePptxTextBytes')).toBe(false)
  })
})

describe('mcp apps pane admission', () => {
  for (const fixture of mcpAppsPaneFixtures) {
    test(fixture.name, () => {
      const presentation = presentMcpAppsPane(fixture.input)
      expect(presentation.phase).toBe(fixture.phase)
      expect(presentation.status).toBe(fixture.status)
      expect(presentation.reason).toBe(fixture.reason)
      expect(presentation.lockedSurfaces.map((surface) => surface.id)).toEqual([
        'sandboxed_app_view',
        'tool_invocation',
        'live_tool_list',
        'mcp_registry_catalogs',
        'remote_marketplace',
      ])
      expect(presentation.lockedSurfaces.every((surface) => surface.status === 'Locked')).toBe(true)
    })
  }

  test('the pane constructs the host and settings does not', () => {
    const pane = readFileSync(new URL('../../../../../../apps/electron/src/renderer/components/right-sidebar/McpAppsSidePane.tsx', import.meta.url), 'utf8')
    const settings = readFileSync(new URL('../../../../../../apps/electron/src/renderer/pages/settings/PluginsSettingsPage.tsx', import.meta.url), 'utf8')
    const presentation = readFileSync(new URL('../admission-presentation.ts', import.meta.url), 'utf8')
    expect(pane.includes('createMcpAppsHost()')).toBe(true)
    expect(pane.includes('runMcpAppsPaneFocus')).toBe(true)
    expect(pane.includes('runMcpAppsPaneClose')).toBe(true)
    expect(pane.includes('HostTurnKernel')).toBe(false)
    expect(pane.includes('presentMcpAppsPane')).toBe(true)
    expect(settings.includes('createMcpAppsHost')).toBe(false)
    expect(settings.includes('openMcpAppsFromHuman')).toBe(false)
    expect(settings.includes('runMcpAppsPaneOpen')).toBe(false)
    expect(presentation.includes('createMcpAppsHost')).toBe(false)
    expect(presentation.includes('HostTurnKernel')).toBe(false)
  })
})
