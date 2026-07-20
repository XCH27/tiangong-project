import { describe, expect, it } from 'bun:test'
import type { TFunction } from 'i18next'
import { getLocalizedLabelName } from '../label-display-name'

const t = ((key: string, options?: { defaultValue?: string }) => ({
  'labels.default.content': '内容',
  'labels.default.design': '设计',
}[key] ?? options?.defaultValue ?? key)) as TFunction

describe('getLocalizedLabelName', () => {
  it('localizes untouched starter labels by stable ID', () => {
    expect(getLocalizedLabelName(t, { id: 'content', name: 'Content' })).toBe('内容')
    expect(getLocalizedLabelName(t, { id: 'design', name: 'Design' })).toBe('设计')
  })

  it('preserves renamed and user-created labels', () => {
    expect(getLocalizedLabelName(t, { id: 'content', name: '内容创作' })).toBe('内容创作')
    expect(getLocalizedLabelName(t, { id: 'demo', name: 'Demo' })).toBe('Demo')
  })
})
