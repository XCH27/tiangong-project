import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { USER_ACTOR, type DesignAction, type DesignSelection } from '@craft-agent/shared/protocol'
import { DesignEngineService } from './design-engine'
import { FileDesignEnginePersistence } from './design-engine-persistence'

const dirs: string[] = []
afterEach(async () => Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))))

describe('DesignEngine file persistence', () => {
  it('restores selections and patches across engine instances', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'fleet-design-engine-'))
    dirs.push(dir)
    const persistence = new FileDesignEnginePersistence(dir)
    const selection: DesignSelection = {
      selectionId: 'selection-1',
      sessionId: 'session-1',
      objects: [{ type: 'design_node', surface: 'browser', locator: { selector: '.card' } }],
      createdBy: USER_ACTOR,
    }
    const action: DesignAction = {
      actionId: 'action-1',
      sessionId: 'session-1',
      selectionId: selection.selectionId,
      actor: USER_ACTOR,
      origin: 'human_ui',
      op: { kind: 'set_style', props: { color: 'red' } },
    }

    const first = new DesignEngineService(() => {}, undefined, persistence)
    await first.setSelection({ sessionId: 'session-1', selection })
    const { patch } = await first.proposeAction({ sessionId: 'session-1', action })

    const restored = new DesignEngineService(() => {}, undefined, persistence)
    await expect(restored.getSelection('session-1')).resolves.toEqual(selection)
    const committed = await restored.commitPatch({ sessionId: 'session-1', patchId: patch.patchId })
    expect(committed.patch.status).toBe('committed')

    const afterCommit = new DesignEngineService(() => {}, undefined, persistence)
    const rolledBack = await afterCommit.rollbackPatch({ sessionId: 'session-1', patchId: patch.patchId })
    expect(rolledBack.patch.status).toBe('rolled_back')
  })
})

