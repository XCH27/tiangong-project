import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, type DesignSelection } from '@craft-agent/shared/protocol'
import { buildWorkbenchAnnotation } from './annotation-evidence'

function selection(overrides: Partial<DesignSelection> = {}): DesignSelection {
  return {
    selectionId: 'sel-browser-1',
    sessionId: 'session-1',
    createdBy: USER_ACTOR,
    objects: [
      {
        type: 'design_node',
        surface: 'browser',
        locator: {
          selector: '.hero-card',
          url: 'https://example.test',
          title: 'Example',
          tagName: 'SECTION',
          rect: { x: 10, y: 20, width: 300, height: 160 },
        },
        preview: { text: 'Hero card copy' },
      },
    ],
    ...overrides,
  }
}

describe('buildWorkbenchAnnotation', () => {
  it('turns a browser/design selection into an AnnotationV1 draft', () => {
    const annotation = buildWorkbenchAnnotation({
      sessionId: 'session-1',
      messageId: 'message-1',
      selection: selection(),
      note: '这里需要强调主按钮',
      now: 100,
    })

    expect(annotation.schemaVersion).toBe(1)
    expect(annotation.createdAt).toBe(100)
    expect(annotation.intent).toBe('comment')
    expect(annotation.status).toBe('pending')
    expect(annotation.target.source).toEqual({ sessionId: 'session-1', messageId: 'message-1' })
    expect(annotation.target.selectors).toContainEqual({
      type: 'xywh',
      unit: 'pixel',
      x: 10,
      y: 20,
      w: 300,
      h: 160,
      page: undefined,
      rotation: undefined,
    })
    expect(annotation.target.selectors).toContainEqual({
      type: 'text-quote',
      exact: 'Hero card copy',
    })
    expect(annotation.body).toEqual([{ type: 'note', text: '这里需要强调主按钮', format: 'plain' }])
  })

  it('keeps technical evidence in meta instead of annotation body', () => {
    const annotation = buildWorkbenchAnnotation({
      sessionId: 'session-1',
      messageId: 'message-1',
      selection: selection(),
      now: 100,
    })

    expect(annotation.body).toEqual([{ type: 'highlight' }])
    expect(annotation.intent).toBe('highlight')
    const evidence = annotation.meta?.fleetWorkbenchEvidence as {
      selectionId: string
      objectCount: number
      evidenceHash: string
      objects: Array<{ selector?: string; url?: string; title?: string; text?: string }>
    }

    expect(evidence.selectionId).toBe('sel-browser-1')
    expect(evidence.objectCount).toBe(1)
    expect(evidence.evidenceHash).toMatch(/^[a-f0-9]{16}$/)
    expect(evidence.objects[0]).toMatchObject({
      selector: '.hero-card',
      url: 'https://example.test',
      title: 'Example',
      text: 'Hero card copy',
    })
  })

  it('uses agent actor metadata when the selection came from an agent', () => {
    const annotation = buildWorkbenchAnnotation({
      sessionId: 'session-1',
      messageId: 'message-1',
      selection: selection({
        createdBy: {
          kind: 'agent',
          agentId: 'project:session-1',
          runtime: 'grok',
          role: 'design',
          displayName: '设计 Agent',
        },
      }),
      now: 100,
    })

    expect(annotation.createdBy).toEqual({
      id: 'project:session-1',
      type: 'agent',
      name: '设计 Agent',
    })
  })

  it('rejects selections that cannot anchor an annotation', () => {
    expect(() => buildWorkbenchAnnotation({
      sessionId: 'session-1',
      messageId: 'message-1',
      selection: selection({
        objects: [
          {
            type: 'design_node',
            surface: 'browser',
            locator: { selector: '.no-box' },
          },
        ],
      }),
    })).toThrow('selection has no xywh or text anchor')
  })
})
