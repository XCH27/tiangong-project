import { expect, it } from 'bun:test'
import { getSessionActivity } from '@/utils/session'
import type { SessionMeta } from '@/atoms/sessions'

const session: SessionMeta = { id: 'one', workspaceId: 'test', sessionStatus: 'in-progress' }

it('never turns a manual Board status into live execution', () => {
  expect(getSessionActivity(session)).toBeNull()
  expect(getSessionActivity({ ...session, isProcessing: true })).toBe('running')
})
it('shows pending interaction during a running turn and clears old errors on retry', () => {
  expect(getSessionActivity({ ...session, isProcessing: true }, true)).toBe('waiting')
  expect(getSessionActivity({ ...session, lastMessageRole: 'error' })).toBe('failed')
  expect(getSessionActivity({ ...session, lastMessageRole: 'error', isProcessing: true })).toBe('running')
})
it('keeps plan and unread information reachable without a status selector', () => {
  expect(getSessionActivity({ ...session, lastMessageRole: 'plan' })).toBe('planReady')
  expect(getSessionActivity({ ...session, hasUnread: true })).toBe('unread')
})
