import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, type DesignAction, type DesignSelection } from '@craft-agent/shared/protocol'
import { DesignEngineService } from './design-engine'
import { DesignDomPatchApplier, type DomPatchBatch, type DesignDomPatchWriter } from './design-dom-applier'

const SESSION = 'session-dom'

function selection(): DesignSelection {
  return {
    selectionId: 'selection-dom',
    sessionId: SESSION,
    createdBy: USER_ACTOR,
    objects: [
      {
        type: 'design_node',
        surface: 'artifact',
        locator: {
          selector: '#hero',
          computedStyle: { color: 'blue', width: '120px', borderRadius: '4px' },
          textContent: 'Old hero',
        },
        preview: { text: 'Old hero' },
      },
      {
        type: 'design_node',
        surface: 'artifact',
        locator: {
          selector: '.cta',
          computedStyle: { color: 'green', width: '80px', borderRadius: '2px' },
          textContent: 'Buy',
        },
        preview: { text: 'Buy' },
      },
    ],
  }
}

function action(op: DesignAction['op']): DesignAction {
  return {
    actionId: `action-${op.kind}`,
    sessionId: SESSION,
    selectionId: 'selection-dom',
    actor: USER_ACTOR,
    origin: 'human_ui',
    op,
  }
}

function writer() {
  const applied: DomPatchBatch[] = []
  const reverted: DomPatchBatch[] = []
  const patchWriter: DesignDomPatchWriter = {
    applyDomPatch(batch) {
      applied.push(batch)
    },
    revertDomPatch(batch) {
      reverted.push(batch)
    },
  }
  return { patchWriter, applied, reverted }
}

describe('DesignDomPatchApplier', () => {
  it('creates reversible style patches for all selected artifact nodes', async () => {
    const w = writer()
    const engine = new DesignEngineService(() => {}, new DesignDomPatchApplier(w.patchWriter))
    await engine.setSelection({ sessionId: SESSION, selection: selection() })

    const { patch } = await engine.proposeAction({
      sessionId: SESSION,
      action: action({ kind: 'set_style', props: { color: 'red', width: '240px' } }),
    })

    expect(patch.forward).toMatchObject({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_style', locator: { selector: '#hero' }, props: { color: 'red', width: '240px' } },
        { kind: 'set_style', locator: { selector: '.cta' }, props: { color: 'red', width: '240px' } },
      ],
    })
    expect(patch.inverse).toMatchObject({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_style', locator: { selector: '#hero' }, props: { color: 'blue', width: '120px' } },
        { kind: 'set_style', locator: { selector: '.cta' }, props: { color: 'green', width: '80px' } },
      ],
    })

    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    await engine.rollbackPatch({ sessionId: SESSION, patchId: patch.patchId })
    expect(w.applied).toHaveLength(1)
    expect(w.reverted).toHaveLength(1)
  })

  it('maps transform and text edits into reversible DOM operations', async () => {
    const engine = new DesignEngineService(() => {}, new DesignDomPatchApplier())
    await engine.setSelection({ sessionId: SESSION, selection: selection() })

    const transform = await engine.proposeAction({
      sessionId: SESSION,
      action: action({ kind: 'set_transform', w: 320, radius: 12, opacity: 0.7 }),
    })
    expect(transform.patch.forward).toMatchObject({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_style', locator: { selector: '#hero' }, props: { width: '320px', borderRadius: '12px', opacity: '0.7' } },
        { kind: 'set_style', locator: { selector: '.cta' }, props: { width: '320px', borderRadius: '12px', opacity: '0.7' } },
      ],
    })
    expect(transform.patch.inverse).toMatchObject({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_style', locator: { selector: '#hero' }, props: { width: '120px', borderRadius: '4px', opacity: null } },
        { kind: 'set_style', locator: { selector: '.cta' }, props: { width: '80px', borderRadius: '2px', opacity: null } },
      ],
    })

    const text = await engine.proposeAction({
      sessionId: SESSION,
      action: action({ kind: 'doc_edit', op: 'replace', payload: { text: 'New hero' } }),
    })
    expect(text.patch.forward).toMatchObject({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_text', locator: { selector: '#hero' }, text: 'New hero' },
        { kind: 'set_text', locator: { selector: '.cta' }, text: 'New hero' },
      ],
    })
    expect(text.patch.inverse).toMatchObject({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_text', locator: { selector: '#hero' }, text: 'Old hero' },
        { kind: 'set_text', locator: { selector: '.cta' }, text: 'Buy' },
      ],
    })
  })
})
