import { describe, expect, it } from 'bun:test'
import type { SessionEvent, DesignSelection, DesignAction } from '@craft-agent/shared/protocol'
import { USER_ACTOR, type ActorRef } from '@craft-agent/shared/protocol'
import { DesignEngineService, type DesignPatchApplier } from './design-engine'

const SESSION = 'sess-1'

function makeSelection(overrides: Partial<DesignSelection> = {}): DesignSelection {
  return {
    selectionId: 'sel-1',
    sessionId: SESSION,
    objects: [{ type: 'design_node', surface: 'browser', locator: { selector: '.card' } }],
    createdBy: USER_ACTOR,
    ...overrides,
  }
}

function makeAction(overrides: Partial<DesignAction> = {}): DesignAction {
  return {
    actionId: 'act-1',
    sessionId: SESSION,
    selectionId: 'sel-1',
    actor: USER_ACTOR,
    op: { kind: 'set_style', props: { fontSize: 18 } },
    origin: 'human_ui',
    ...overrides,
  }
}

const AGENT_ACTOR: ActorRef = {
  kind: 'agent',
  agentId: 'agent-design',
  role: 'design',
  runtime: 'test-runtime',
  displayName: 'Design Agent',
}

/** Collect emitted events for assertions. */
function makeEngine(applier?: DesignPatchApplier) {
  const events: SessionEvent[] = []
  const engine = new DesignEngineService((e) => events.push(e), applier)
  return { engine, events }
}

describe('DesignEngineService', () => {
  it('setSelection stores + emits selection_changed; getSelection returns it', async () => {
    const { engine, events } = makeEngine()
    const selection = makeSelection()
    await engine.setSelection({ sessionId: SESSION, selection })

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: 'selection_changed', sessionId: SESSION })
    await expect(engine.getSelection(SESSION)).resolves.toEqual(selection)
    await expect(engine.getSelection('other')).resolves.toBeNull()
  })

  it('proposeAction returns a preview patch + emits design_action_proposed', async () => {
    const { engine, events } = makeEngine()
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: makeAction() })

    expect(patch.status).toBe('preview')
    expect(patch.actionId).toBe('act-1')
    expect(patch.inverse).toBeDefined() // ledger-only marker when no applier
    const proposed = events.find((e) => e.type === 'design_action_proposed')
    expect(proposed).toBeTruthy()
  })

  it('commitPatch transitions preview→committed, sets committedAt, emits with actor', async () => {
    const { engine, events } = makeEngine()
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: makeAction() })
    const res = await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })

    expect(res.patch.status).toBe('committed')
    expect(res.patch.committedAt).toBeGreaterThan(0)
    const committed = events.find((e) => e.type === 'design_patch_committed')
    expect(committed).toMatchObject({ type: 'design_patch_committed', actor: { kind: 'user' } })
  })

  it('commitPatch is idempotent on an already-committed patch', async () => {
    const { engine } = makeEngine()
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: makeAction() })
    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    const again = await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    expect(again.patch.status).toBe('committed')
  })

  it('rollbackPatch transitions to rolled_back + emits with actor', async () => {
    const { engine, events } = makeEngine()
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: makeAction() })
    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    const res = await engine.rollbackPatch({ sessionId: SESSION, patchId: patch.patchId })

    expect(res.patch.status).toBe('rolled_back')
    expect(events.some((e) => e.type === 'design_patch_rolled_back')).toBe(true)
  })

  it('throws on unknown patch and on committing a rolled-back patch', async () => {
    const { engine } = makeEngine()
    await expect(engine.commitPatch({ sessionId: SESSION, patchId: 'nope' })).rejects.toThrow(/Unknown patch/)

    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: makeAction() })
    await engine.rollbackPatch({ sessionId: SESSION, patchId: patch.patchId })
    await expect(engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })).rejects.toThrow(/rolled-back/)
  })

  it('rejects a patch whose session does not match', async () => {
    const { engine } = makeEngine()
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: makeAction() })
    await expect(engine.commitPatch({ sessionId: 'wrong', patchId: patch.patchId })).rejects.toThrow(/does not belong/)
  })

  it('uses the surface applier for forward/inverse and calls apply/revert', async () => {
    let applied = 0
    let reverted = 0
    const applier: DesignPatchApplier = {
      preview: (_action, selection) => ({ forward: { real: true, selectionId: selection?.selectionId }, inverse: { undo: true } }),
      apply: () => { applied++ },
      revert: () => { reverted++ },
    }
    const { engine } = makeEngine(applier)
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: makeAction() })
    expect(patch.forward).toEqual({ real: true, selectionId: undefined })
    expect(patch.inverse).toEqual({ undo: true })

    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    expect(applied).toBe(1)
    await engine.rollbackPatch({ sessionId: SESSION, patchId: patch.patchId })
    expect(reverted).toBe(1)
  })

  it('holds agent-originated write actions pending until permission is granted', async () => {
    const { engine, events } = makeEngine()
    const { patch, permissionRequestId, permission } = await engine.proposeAction({
      sessionId: SESSION,
      action: makeAction({
        actor: AGENT_ACTOR,
        origin: 'agent_tool',
        op: { kind: 'set_style', props: { color: 'red' } },
      }),
    })

    expect(patch.status).toBe('pending')
    expect(permissionRequestId).toBeTruthy()
    expect(permission).toMatchObject({ required: true, level: 'L2' })
    const proposedEvent = events.find((e) => e.type === 'design_action_proposed')
    expect(proposedEvent).toMatchObject({
      type: 'design_action_proposed',
      permissionRequestId,
      permission: { required: true, level: 'L2' },
    })
    await expect(engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })).rejects.toThrow(/requires permission/)

    const committed = await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId, permissionGranted: true })
    expect(committed.patch.status).toBe('committed')
    const committedEvent = events.find((e) => e.type === 'design_patch_committed')
    expect(committedEvent).toMatchObject({ actor: AGENT_ACTOR })
  })
})
