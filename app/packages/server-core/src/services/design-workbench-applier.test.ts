import { describe, expect, it } from 'bun:test'
import type { AnnotationV1 } from '@craft-agent/core/types'
import { USER_ACTOR, type DesignAction, type DesignSelection } from '@craft-agent/shared/protocol'
import { DesignEngineService } from './design-engine'
import { DesignAnnotationApplier, type AnnotationSessionWriter } from './design-annotation-applier'
import { DesignDomPatchApplier } from './design-dom-applier'
import { DesignWorkbenchApplier } from './design-workbench-applier'

const SESSION = 'session-workbench'

function selection(): DesignSelection {
  return {
    selectionId: 'selection-workbench',
    sessionId: SESSION,
    createdBy: USER_ACTOR,
    objects: [
      {
        type: 'design_node',
        surface: 'artifact',
        locator: { selector: '#card', computedStyle: { color: 'blue' }, textContent: 'Card' },
        preview: { text: 'Card' },
      },
    ],
  }
}

function action(op: DesignAction['op']): DesignAction {
  return {
    actionId: `action-${op.kind}`,
    sessionId: SESSION,
    selectionId: 'selection-workbench',
    actor: USER_ACTOR,
    origin: 'human_ui',
    op,
  }
}

function annotationWriter(): AnnotationSessionWriter & { added: AnnotationV1[] } {
  const added: AnnotationV1[] = []
  return {
    added,
    addMessageAnnotation(_sessionId, _messageId, annotation) {
      added.push(annotation)
    },
    removeMessageAnnotation() {},
  }
}

describe('DesignWorkbenchApplier', () => {
  it('routes annotate actions to annotations and style actions to DOM patches', async () => {
    const writer = annotationWriter()
    const applier = new DesignWorkbenchApplier(
      new DesignAnnotationApplier(writer),
      new DesignDomPatchApplier(),
    )
    const engine = new DesignEngineService(() => {}, applier)
    await engine.setSelection({ sessionId: SESSION, selection: selection() })

    const annotation = await engine.proposeAction({
      sessionId: SESSION,
      action: action({ kind: 'annotate', messageId: 'message-1', annotationId: 'ann-1', text: '这里要改' }),
    })
    expect(annotation.patch.forward).toMatchObject({ kind: 'addAnnotation' })
    await engine.commitPatch({ sessionId: SESSION, patchId: annotation.patch.patchId })
    expect(writer.added).toHaveLength(1)

    const style = await engine.proposeAction({
      sessionId: SESSION,
      action: action({ kind: 'set_style', props: { color: 'red' } }),
    })
    expect(style.patch.forward).toMatchObject({
      kind: 'dom_batch',
      operations: [{ kind: 'set_style', locator: { selector: '#card' }, props: { color: 'red' } }],
    })
    expect(style.patch.inverse).toMatchObject({
      kind: 'dom_batch',
      operations: [{ kind: 'set_style', locator: { selector: '#card' }, props: { color: 'blue' } }],
    })
  })
})
