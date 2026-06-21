import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, type DesignSelection } from '@craft-agent/shared/protocol'
import { DesignEngineService } from './design-engine'
import { ArtifactDesignDomWriter } from './design-artifact-dom-writer'
import { DesignDomPatchApplier } from './design-dom-applier'
import { DesignSurfaceDomPatchWriter } from './design-surface-dom-writer'
import { DesignWorkbenchApplier } from './design-workbench-applier'

const SESSION = 'session-artifact-preview'
const ARTIFACT_ID = 'artifact-demo'

function artifactSelection(): DesignSelection {
  return {
    selectionId: 'selection-artifact',
    sessionId: SESSION,
    createdBy: USER_ACTOR,
    objects: [
      {
        type: 'design_node',
        surface: 'artifact',
        locator: {
          artifactId: ARTIFACT_ID,
          selector: '#hero',
          computedStyle: { color: 'blue', width: '120px' },
          textContent: 'Old hero',
        },
        preview: { text: 'Old hero' },
      },
    ],
  }
}

describe('artifact preview design integration', () => {
  it('commitPatch evaluates forward DOM script and rollbackPatch evaluates inverse', async () => {
    const evaluated: Array<{ artifactId: string; expression: string; phase: 'forward' | 'inverse' }> = []
    const writer = new DesignSurfaceDomPatchWriter({
      artifact: new ArtifactDesignDomWriter({
        resolveArtifactEvaluator: () => ({
          async evaluate(artifactId, expression) {
            evaluated.push({
              artifactId,
              expression,
              phase: evaluated.length === 0 ? 'forward' : 'inverse',
            })
            return { applied: 1, missing: [], errors: [] }
          },
        }),
      }),
    })

    const noopAnnotationApplier = {
      preview: () => ({ forward: {}, inverse: {} }),
    }
    const engine = new DesignEngineService(
      () => {},
      new DesignWorkbenchApplier(noopAnnotationApplier, new DesignDomPatchApplier(writer)),
    )

    await engine.setSelection({ sessionId: SESSION, selection: artifactSelection() })
    const { patch } = await engine.proposeAction({
      sessionId: SESSION,
      action: {
        actionId: 'action-style',
        sessionId: SESSION,
        selectionId: 'selection-artifact',
        actor: USER_ACTOR,
        origin: 'human_ui',
        op: { kind: 'set_style', props: { color: 'red' } },
      },
    })

    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    await engine.rollbackPatch({ sessionId: SESSION, patchId: patch.patchId })

    expect(evaluated).toHaveLength(2)
    expect(evaluated[0]?.artifactId).toBe(ARTIFACT_ID)
    expect(evaluated[0]?.expression).toContain('document.querySelector')
    expect(evaluated[0]?.expression).toContain('"color":"red"')
    expect(evaluated[1]?.expression).toContain('"color":"blue"')
  })

  it('fails commit when artifact evaluator is not bound for the session', async () => {
    const writer = new DesignSurfaceDomPatchWriter({
      artifact: new ArtifactDesignDomWriter({ resolveArtifactEvaluator: () => null }),
    })
    const noopAnnotationApplier = {
      preview: () => ({ forward: {}, inverse: {} }),
    }
    const engine = new DesignEngineService(
      () => {},
      new DesignWorkbenchApplier(noopAnnotationApplier, new DesignDomPatchApplier(writer)),
    )

    await engine.setSelection({ sessionId: SESSION, selection: artifactSelection() })
    const { patch } = await engine.proposeAction({
      sessionId: SESSION,
      action: {
        actionId: 'action-style-missing',
        sessionId: SESSION,
        selectionId: 'selection-artifact',
        actor: USER_ACTOR,
        origin: 'human_ui',
        op: { kind: 'set_style', props: { color: 'red' } },
      },
    })

    await expect(engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })).rejects.toThrow(
      `No Artifact DOM evaluator available for session ${SESSION}`,
    )
  })
})
