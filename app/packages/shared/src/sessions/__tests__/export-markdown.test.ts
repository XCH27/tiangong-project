import { describe, expect, it } from 'bun:test'
import { markdownExportFilename, sessionToMarkdown } from '../export-markdown.ts'
import type { StoredSession } from '../types.ts'

function session(partial: Partial<StoredSession> & Pick<StoredSession, 'messages'>): StoredSession {
  return {
    id: 'sess-1',
    workspaceRootPath: '/tmp',
    createdAt: 0,
    lastUsedAt: 0,
    name: 'Demo chat',
    tokenUsage: { input: 0, output: 0 },
    ...partial,
  } as StoredSession
}

describe('sessionToMarkdown', () => {
  it('exports the full conversation as Markdown', () => {
    const md = sessionToMarkdown(
      session({
        messages: [
          { id: '1', type: 'user', content: 'Hello', timestamp: 1 },
          { id: '2', type: 'assistant', content: 'Hi there.', timestamp: 2 },
          { id: '3', type: 'tool', content: '', toolName: 'read_file', toolStatus: 'completed', toolResult: 'ok', timestamp: 3 },
        ],
      }),
    )
    expect(md).toContain('# Demo chat')
    expect(md).toContain('## User')
    expect(md).toContain('Hello')
    expect(md).toContain('## Assistant')
    expect(md).toContain('Hi there.')
    expect(md).toContain('`read_file`')
    expect(md).toContain('ok')
  })

  it('sanitizes the download filename', () => {
    expect(markdownExportFilename('a/b:c', 'id')).toBe('a-b-c.md')
  })
})
