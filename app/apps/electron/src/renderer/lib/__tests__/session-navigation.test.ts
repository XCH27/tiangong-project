import { describe, expect, it } from 'bun:test'
import { isEmptySessionMeta } from '../session-navigation'
import type { SessionMeta } from '@/atoms/sessions'

function meta(overrides: Partial<SessionMeta> = {}): SessionMeta {
  return {
    id: 's1',
    workspaceId: 'ws1',
    name: '',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  } as SessionMeta
}

describe('isEmptySessionMeta', () => {
  it('treats brand-new sessions as empty', () => {
    expect(isEmptySessionMeta(meta())).toBe(true)
  })

  it('is false when session has a name', () => {
    expect(isEmptySessionMeta(meta({ name: 'Draft' }))).toBe(false)
  })

  it('is false when session has assistant output', () => {
    expect(isEmptySessionMeta(meta({ lastFinalMessageId: 'm1' }))).toBe(false)
  })

  it('is false when session is processing', () => {
    expect(isEmptySessionMeta(meta({ isProcessing: true }))).toBe(false)
  })

  it('is false when a draft exists', () => {
    expect(isEmptySessionMeta(meta(), () => 'hello')).toBe(false)
  })

  it('is false when session has messages', () => {
    expect(isEmptySessionMeta(meta({ messageCount: 1 }))).toBe(false)
  })

  it('is false when session has a preview', () => {
    expect(isEmptySessionMeta(meta({ preview: 'hello' }))).toBe(false)
  })

  it('is false when meta is missing', () => {
    expect(isEmptySessionMeta(undefined)).toBe(false)
  })
})
