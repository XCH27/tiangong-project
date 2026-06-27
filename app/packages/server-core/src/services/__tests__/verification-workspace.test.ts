import { describe, it, expect } from 'bun:test'
import { runPlanTestHint, runPlanRenderHint } from '../verification-workspace.ts'

describe('verification-workspace', () => {
  it('runPlanTestHint 识别 test 步骤', () => {
    const sig = runPlanTestHint({ steps: [{ op: 'run jest tests' }] })
    expect(sig?.kind).toBe('test')
    expect(sig?.evidence).toBe('estimated')
  })

  it('runPlanTestHint 无 test 返回 null', () => {
    expect(runPlanTestHint({ steps: [{ op: 'move file' }] })).toBeNull()
  })

  it('runPlanRenderHint 识别 render 步骤', () => {
    const sig = runPlanRenderHint({ steps: [{ op: 'export preview png' }] })
    expect(sig?.kind).toBe('render')
  })
})
