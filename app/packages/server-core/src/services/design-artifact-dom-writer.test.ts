import { describe, expect, it } from 'bun:test'
import { ArtifactDesignDomWriter } from './design-artifact-dom-writer'
import type { DomPatchBatch } from './design-dom-applier'

const batch: DomPatchBatch = {
  kind: 'dom_batch',
  operations: [
    {
      kind: 'set_style',
      surface: 'artifact',
      locator: { artifactId: 'artifact-1', selector: '#hero' },
      props: { color: 'red' },
    },
    {
      kind: 'set_text',
      surface: 'artifact',
      locator: { artifactId: 'artifact-1', selector: '.title' },
      text: 'New title',
    },
  ],
}

describe('ArtifactDesignDomWriter', () => {
  it('evaluates DOM patch operations inside the target artifact', async () => {
    const calls: Array<{ artifactId: string; expression: string }> = []
    const writer = new ArtifactDesignDomWriter({
      resolveArtifactEvaluator: () => ({
        async evaluate(artifactId, expression) {
          calls.push({ artifactId, expression })
          return { applied: 2, missing: [], errors: [] }
        },
      }),
    })

    await writer.applyDomPatch(batch, { sessionId: 'session-1', action: {} as never, selection: null })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.artifactId).toBe('artifact-1')
    expect(calls[0]?.expression).toContain('document.querySelector')
    expect(calls[0]?.expression).toContain('New title')
  })

  it('fails when no artifact evaluator is registered for the session', async () => {
    const writer = new ArtifactDesignDomWriter({ resolveArtifactEvaluator: () => null })

    await expect(writer.applyDomPatch(batch, { sessionId: 'missing', action: {} as never, selection: null })).rejects.toThrow(
      'No Artifact DOM evaluator available for session missing',
    )
  })

  it('fails when an operation has no artifact id', async () => {
    const writer = new ArtifactDesignDomWriter({
      resolveArtifactEvaluator: () => ({
        async evaluate() {
          return { applied: 0 }
        },
      }),
    })

    await expect(
      writer.applyDomPatch(
        {
          kind: 'dom_batch',
          operations: [{ kind: 'set_text', surface: 'artifact', locator: { selector: '#x' }, text: 'x' }],
        },
        { sessionId: 'session-1', action: {} as never, selection: null },
      ),
    ).rejects.toThrow('DOM patch operation is missing artifact id in locator')
  })
})
