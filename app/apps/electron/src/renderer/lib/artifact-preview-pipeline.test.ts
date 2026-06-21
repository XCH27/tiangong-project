import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, type DesignSelection } from '@craft-agent/shared/protocol'
import {
  installArtifactPreviewBridge,
  registerArtifactPreview,
  unregisterArtifactPreview,
  evaluateArtifactPreview,
} from './artifact-preview-registry'
import { buildDomSnapshotScript } from './design-dom-snapshot'
import { refreshDesignSelectionFromDom } from './design-selection-refresh'

const PREVIEW_HTML = `<!doctype html><html><body><div id="hero">Hero</div></body></html>`

function buildPatchScript(selector: string, props: Record<string, string>): string {
  return `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return { applied: 0, missing: [${JSON.stringify(selector)}], errors: [] };
    for (const [key, value] of Object.entries(${JSON.stringify(props)})) {
      element.style[key] = value;
    }
    element.textContent = 'Updated hero';
    return { applied: 1, missing: [], errors: [] };
  })()`
}

function buildInverseScript(selector: string, props: Record<string, string | null>): string {
  return `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return { applied: 0, missing: [${JSON.stringify(selector)}], errors: [] };
    for (const [key, value] of Object.entries(${JSON.stringify(props)})) {
      element.style[key] = value == null ? '' : String(value);
    }
    element.textContent = 'Hero';
    return { applied: 1, missing: [], errors: [] };
  })()`
}

const baseSelection = (): DesignSelection => ({
  selectionId: 'selection-1',
  sessionId: 'session-1',
  createdBy: USER_ACTOR,
  objects: [{
    type: 'design_node',
    surface: 'artifact',
    locator: {
      artifactId: 'artifact-1',
      selector: '#hero',
      computedStyle: { color: 'rgb(0, 0, 255)', width: '120px' },
      textContent: 'Hero',
    },
    preview: { text: 'Hero' },
  }],
})

describe('artifact preview pipeline', () => {
  it('applies, refreshes selection, and rolls back DOM in the registered iframe', async () => {
    if (typeof document === 'undefined') return

    installArtifactPreviewBridge()
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    iframe.srcdoc = PREVIEW_HTML

    await new Promise<void>((resolve) => {
      iframe.addEventListener('load', () => resolve(), { once: true })
    })

    registerArtifactPreview('session-1', 'artifact-1', iframe)

    await evaluateArtifactPreview('session-1', 'artifact-1', buildPatchScript('#hero', { color: 'red' }))

    const refreshed = await refreshDesignSelectionFromDom('session-1', baseSelection())
    expect(refreshed.objects[0]?.locator.textContent).toBe('Updated hero')
    expect(refreshed.objects[0]?.locator.computedStyle).toMatchObject({ color: 'red' })

    await evaluateArtifactPreview(
      'session-1',
      'artifact-1',
      buildInverseScript('#hero', { color: 'rgb(0, 0, 255)', width: '120px' }),
    )

    const snapshot = await evaluateArtifactPreview('session-1', 'artifact-1', buildDomSnapshotScript('#hero'))
    expect(snapshot).toMatchObject({ textContent: 'Hero' })

    unregisterArtifactPreview('session-1', 'artifact-1')
    document.body.removeChild(iframe)
  })
})
