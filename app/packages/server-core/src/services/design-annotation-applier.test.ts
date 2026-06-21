import { describe, expect, it } from 'bun:test'
import type { AnnotationV1 } from '@craft-agent/core/types'
import { USER_ACTOR, type DesignAction, type DesignSelection } from '@craft-agent/shared/protocol'
import { DesignEngineService } from './design-engine'
import { DesignAnnotationApplier, type AnnotationSessionWriter } from './design-annotation-applier'

const SESSION = 'session-1'
const MESSAGE = 'message-1'

function selection(): DesignSelection {
  return {
    selectionId: 'selection-1',
    sessionId: SESSION,
    createdBy: USER_ACTOR,
    objects: [
      {
        type: 'design_node',
        surface: 'browser',
        locator: {
          selector: '#hero',
          url: 'https://example.test',
          rect: { x: 10, y: 20, width: 300, height: 160 },
        },
        preview: { text: 'Hero copy' },
      },
    ],
  }
}

function annotateAction(overrides: Partial<DesignAction> = {}): DesignAction {
  return {
    actionId: 'action-1',
    sessionId: SESSION,
    selectionId: 'selection-1',
    actor: USER_ACTOR,
    origin: 'human_ui',
    op: { kind: 'annotate', messageId: MESSAGE, annotationId: 'ann-fixed', text: '这里需要修改' },
    ...overrides,
  }
}

function writer() {
  const added: Array<{ sessionId: string; messageId: string; annotation: AnnotationV1 }> = []
  const removed: Array<{ sessionId: string; messageId: string; annotationId: string }> = []
  const sessionWriter: AnnotationSessionWriter = {
    addMessageAnnotation(sessionId, messageId, annotation) {
      added.push({ sessionId, messageId, annotation })
    },
    removeMessageAnnotation(sessionId, messageId, annotationId) {
      removed.push({ sessionId, messageId, annotationId })
    },
  }
  return { sessionWriter, added, removed }
}

describe('DesignAnnotationApplier', () => {
  it('commits annotate actions through the existing message annotation writer', async () => {
    const w = writer()
    const engine = new DesignEngineService(() => {}, new DesignAnnotationApplier(w.sessionWriter))
    await engine.setSelection({ sessionId: SESSION, selection: selection() })

    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: annotateAction() })
    expect(patch.forward).toMatchObject({
      kind: 'addAnnotation',
      sessionId: SESSION,
      messageId: MESSAGE,
      annotation: {
        id: 'ann-fixed',
        target: { source: { sessionId: SESSION, messageId: MESSAGE } },
      },
    })

    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    expect(w.added).toHaveLength(1)
    expect(w.added[0]).toMatchObject({
      sessionId: SESSION,
      messageId: MESSAGE,
      annotation: {
        id: 'ann-fixed',
        body: [{ type: 'note', text: '这里需要修改', format: 'plain' }],
      },
    })
  })

  it('rolls back committed annotation patches through removeMessageAnnotation', async () => {
    const w = writer()
    const engine = new DesignEngineService(() => {}, new DesignAnnotationApplier(w.sessionWriter))
    await engine.setSelection({ sessionId: SESSION, selection: selection() })
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: annotateAction() })

    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    await engine.rollbackPatch({ sessionId: SESSION, patchId: patch.patchId })

    expect(w.removed).toEqual([{ sessionId: SESSION, messageId: MESSAGE, annotationId: 'ann-fixed' }])
  })

  it('rejects annotate actions without a matching selection', async () => {
    const w = writer()
    const engine = new DesignEngineService(() => {}, new DesignAnnotationApplier(w.sessionWriter))

    await expect(engine.proposeAction({ sessionId: SESSION, action: annotateAction() })).rejects.toThrow(
      'Cannot annotate without selection selection-1',
    )
  })
})
