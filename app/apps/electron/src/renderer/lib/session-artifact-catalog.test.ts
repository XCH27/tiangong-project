import { describe, expect, it } from 'bun:test'
import { extractSessionArtifactSources, DEMO_ARTIFACT_SOURCE } from './session-artifact-catalog'

describe('session artifact catalog', () => {
  it('extracts single and multi-item html-preview blocks from assistant messages', () => {
    const sources = extractSessionArtifactSources([
      {
        id: 'msg-1',
        role: 'user',
        content: 'ignored',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: [
          'Here is a preview:',
          '```html-preview',
          '{"title":"Landing","src":"/tmp/landing.html"}',
          '```',
          'And a thread:',
          '```html-preview',
          '{"title":"Email","items":[{"src":"/tmp/a.html","label":"A"},{"src":"/tmp/b.html","label":"B"}]}',
          '```',
        ].join('\n'),
      },
    ])

    expect(sources).toEqual([
      {
        artifactId: 'artifact-msg-2-0',
        title: 'Landing',
        src: '/tmp/landing.html',
        messageId: 'msg-2',
      },
      {
        artifactId: 'artifact-msg-2-1',
        title: 'A',
        src: '/tmp/a.html',
        messageId: 'msg-2',
      },
      {
        artifactId: 'artifact-msg-2-2',
        title: 'B',
        src: '/tmp/b.html',
        messageId: 'msg-2',
      },
    ])
  })

  it('falls back to demo artifact html for local preview', () => {
    expect(DEMO_ARTIFACT_SOURCE.html).toContain('#hero')
  })
})
