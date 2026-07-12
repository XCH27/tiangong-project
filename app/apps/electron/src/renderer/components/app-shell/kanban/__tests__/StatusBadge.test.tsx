import { describe, expect, test } from 'bun:test'

import type { SessionStatus } from '@/config/session-status-config'
import { StatusBadge } from '../StatusBadge'

const status = {
  id: 'needs-review',
  label: 'Needs Review',
  category: 'open',
  resolvedColor: '#f59e0b',
} as SessionStatus

describe('StatusBadge', () => {
  test('uses a fixed control height instead of text-dependent vertical padding', () => {
    const badge = StatusBadge({ status })
    const className = (badge.props as { className: string }).className

    expect(className.split(/\s+/)).toContain('h-6')
    expect(className.split(/\s+/)).not.toContain('py-0.5')
  })
})
