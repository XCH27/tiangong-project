import { describe, expect, test } from 'bun:test'
import { normalizeProgressTasks, summarizeProgress, isProgressTaskStatus, type ProgressTask } from '../progress'

describe('progress helpers (docs/35)', () => {
  test('isProgressTaskStatus 只接受合法状态', () => {
    expect(isProgressTaskStatus('in_progress')).toBe(true)
    expect(isProgressTaskStatus('completed')).toBe(true)
    expect(isProgressTaskStatus('done')).toBe(false)
    expect(isProgressTaskStatus(3)).toBe(false)
  })

  test('normalizeProgressTasks 丢弃脏数据、补默认状态', () => {
    const out = normalizeProgressTasks([
      { id: 'a', title: '第一步', status: 'completed' },
      { id: 'b', title: '第二步' }, // 缺 status → pending
      { id: '', title: '无 id' }, // 丢弃
      { title: '无 id 2' }, // 丢弃
      { id: 'c', title: '坏状态', status: 'nope' }, // status 回落 pending
      'garbage', // 丢弃
    ])
    expect(out.map(t => t.id)).toEqual(['a', 'b', 'c'])
    expect(out[1]?.status).toBe('pending')
    expect(out[2]?.status).toBe('pending')
  })

  test('summarizeProgress：done/total 忽略 cancelled，activeTitle 取第一个 in_progress', () => {
    const tasks: ProgressTask[] = [
      { id: '1', title: 'a', status: 'completed' },
      { id: '2', title: 'b', status: 'in_progress' },
      { id: '3', title: 'c', status: 'pending' },
      { id: '4', title: 'd', status: 'cancelled' },
    ]
    const s = summarizeProgress(tasks)
    expect(s.done).toBe(1)
    expect(s.total).toBe(3) // cancelled 不计
    expect(s.activeTitle).toBe('b')
  })
})
