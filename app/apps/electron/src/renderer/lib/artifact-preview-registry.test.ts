import { describe, expect, it } from 'bun:test'
import {
  evaluateArtifactPreview,
  installArtifactPreviewBridge,
  registerArtifactPreview,
  unregisterArtifactPreview,
} from './artifact-preview-registry'

const PREVIEW_HTML = `<!doctype html><html><body><div id="hero">Hero</div></body></html>`

describe('artifact preview registry', () => {
  it('evaluates DOM patch scripts inside the registered iframe', async () => {
    if (typeof document === 'undefined') return

    installArtifactPreviewBridge()
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    iframe.srcdoc = PREVIEW_HTML

    await new Promise<void>((resolve) => {
      iframe.addEventListener('load', () => resolve(), { once: true })
    })

    registerArtifactPreview('session-1', 'artifact-1', iframe)

    const result = await evaluateArtifactPreview(
      'session-1',
      'artifact-1',
      `(() => {
        const element = document.querySelector('#hero');
        if (!element) return { applied: 0, missing: ['#hero'], errors: [] };
        element.style.color = 'red';
        element.textContent = 'Updated hero';
        return { applied: 1, missing: [], errors: [] };
      })()`,
    )

    expect(result).toEqual({ applied: 1, missing: [], errors: [] })
    expect(iframe.contentDocument?.querySelector('#hero')?.textContent).toBe('Updated hero')
    expect((iframe.contentDocument?.querySelector('#hero') as HTMLElement | null)?.style.color).toBe('red')

    unregisterArtifactPreview('session-1', 'artifact-1')
    document.body.removeChild(iframe)
  })

  it('fails when artifact preview iframe is not registered', async () => {
    await expect(evaluateArtifactPreview('session-1', 'missing', '1')).rejects.toThrow(
      'No editable artifact preview registered for missing in session session-1',
    )
  })
})
