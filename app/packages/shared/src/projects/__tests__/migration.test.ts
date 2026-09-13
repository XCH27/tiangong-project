import { describe, expect, it } from 'bun:test'
import {
  isPlanUnattended,
  planNestedProjectMigration,
  type NestedProjectSnapshot,
  type WorkspaceSnapshot,
} from '../migration'

const ws: WorkspaceSnapshot = { id: 'ws_1', name: 'My Workspace', slug: 'my-workspace' }

function project(over: Partial<NestedProjectSnapshot> = {}): NestedProjectSnapshot {
  return {
    id: 'proj_1', slug: 'project', name: '股票交易',
    assetCount: 0, sessionIds: [], ...over,
  }
}

describe('the three cases from note 20 §5', () => {
  it('a Workspace with no nested Project is already the one boundary', () => {
    const plan = planNestedProjectMigration(ws, [])
    expect(plan.verdict).toBe('already-collapsed')
    expect(plan.merges).toEqual([])
    expect(plan.rebindSessionIds).toEqual([])
  })

  it('one nested Project merges, and names every session it rebinds', () => {
    const plan = planNestedProjectMigration(ws, [project({ sessionIds: ['s1', 's2'] })])
    expect(plan.verdict).toBe('merge-one')
    expect(plan.rebindSessionIds).toEqual(['s1', 's2'])
  })

  it('several nested Projects are never flattened silently', () => {
    const plan = planNestedProjectMigration(ws, [
      project({ id: 'a', name: '股票交易' }),
      project({ id: 'b', name: '文档整理' }),
    ])
    expect(plan.verdict).toBe('owner-must-choose')
    // Named, so the owner chooses between projects rather than between numbers.
    expect(plan.contenders).toEqual(['股票交易', '文档整理'])
    expect(plan.merges).toEqual([])
    expect(plan.rebindSessionIds).toEqual([])
  })
})

describe('what merges and what is contested', () => {
  it('takes values the Workspace does not have', () => {
    const plan = planNestedProjectMigration(ws, [project({
      description: '盯盘与复盘', color: '#6366f1',
      workingDirectory: '/Users/me/stocks',
      kanbanColumns: [{ id: 'todo', name: '待办' }, { id: 'done', name: '完成' }],
    })])
    expect(plan.merges.map(m => m.field).sort()).toEqual(
      ['color', 'description', 'kanbanColumns', 'workingDirectory'],
    )
    expect(plan.merges.find(m => m.field === 'kanbanColumns')?.value).toBe('2 column(s)')
  })

  it('never silently overwrites a value the Workspace already holds', () => {
    const plan = planNestedProjectMigration(
      { ...ws, workingDirectory: '/Users/me/ws', color: '#000000' },
      [project({ workingDirectory: '/Users/me/stocks', color: '#6366f1' })],
    )
    const fields = plan.conflicts.map(c => c.field).sort()
    expect(fields).toContain('workingDirectory')
    expect(fields).toContain('color')
    const wd = plan.conflicts.find(c => c.field === 'workingDirectory')!
    expect(wd.workspaceValue).toBe('/Users/me/ws')
    expect(wd.projectValue).toBe('/Users/me/stocks')
  })

  it('always reports the name as contested, because a Workspace always has one', () => {
    const plan = planNestedProjectMigration(ws, [project()])
    const name = plan.conflicts.find(c => c.field === 'name')
    expect(name).toEqual({ field: 'name', workspaceValue: 'My Workspace', projectValue: '股票交易' })
  })

  it('ignores fields the nested Project does not define', () => {
    const plan = planNestedProjectMigration(ws, [project()])
    expect(plan.merges).toEqual([])
    expect(plan.conflicts.map(c => c.field)).toEqual(['name'])
  })

  it('carries the asset count so files are moved before the record is archived', () => {
    expect(planNestedProjectMigration(ws, [project({ assetCount: 7 })]).assetCount).toBe(7)
  })
})

describe('applying without asking', () => {
  it('is allowed only when there is work to do and nothing is contested', () => {
    // The real tree: one project, name contested — so never unattended.
    expect(isPlanUnattended(planNestedProjectMigration(ws, [project()]))).toBe(false)
    expect(isPlanUnattended(planNestedProjectMigration(ws, []))).toBe(false)
    expect(isPlanUnattended(planNestedProjectMigration(
      { ...ws, name: '股票交易' }, [project({ name: '股票交易' })],
    ))).toBe(true)
  })
})

describe('every plan states how to get back', () => {
  it('promises the nested record is archived, not deleted', () => {
    for (const nested of [[], [project()], [project({ id: 'a' }), project({ id: 'b' })]]) {
      expect(planNestedProjectMigration(ws, nested).recovery).toContain('Nothing is deleted')
    }
  })
})
