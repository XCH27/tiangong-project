import { describe, expect, it } from 'bun:test'
import { DesignSurfaceDomPatchWriter } from './design-surface-dom-writer'
import type { DesignDomPatchWriter, DomPatchBatch } from './design-dom-applier'

function recorder() {
  const applied: DomPatchBatch[] = []
  const reverted: DomPatchBatch[] = []
  const writer: DesignDomPatchWriter = {
    applyDomPatch(batch) {
      applied.push(batch)
    },
    revertDomPatch(batch) {
      reverted.push(batch)
    },
  }
  return { writer, applied, reverted }
}

describe('DesignSurfaceDomPatchWriter', () => {
  it('routes browser and artifact operations to separate writers', async () => {
    const browser = recorder()
    const artifact = recorder()
    const writer = new DesignSurfaceDomPatchWriter({ browser: browser.writer, artifact: artifact.writer })

    await writer.applyDomPatch({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_text', surface: 'browser', locator: { browserPaneId: 'pane-1', selector: '#a' }, text: 'A' },
        { kind: 'set_text', surface: 'artifact', locator: { artifactId: 'artifact-1', selector: '#b' }, text: 'B' },
      ],
    })

    expect(browser.applied).toHaveLength(1)
    expect(browser.applied[0]?.operations).toEqual([
      { kind: 'set_text', surface: 'browser', locator: { browserPaneId: 'pane-1', selector: '#a' }, text: 'A' },
    ])
    expect(artifact.applied).toHaveLength(1)
    expect(artifact.applied[0]?.operations).toEqual([
      { kind: 'set_text', surface: 'artifact', locator: { artifactId: 'artifact-1', selector: '#b' }, text: 'B' },
    ])
  })

  it('fails explicitly when an artifact writer has not been registered', async () => {
    const browser = recorder()
    const writer = new DesignSurfaceDomPatchWriter({ browser: browser.writer })

    await expect(
      writer.applyDomPatch({
        kind: 'dom_batch',
        operations: [{ kind: 'set_text', surface: 'artifact', locator: { artifactId: 'artifact-1', selector: '#b' }, text: 'B' }],
      }),
    ).rejects.toThrow('No DOM writer registered for artifact surface')
  })
})
