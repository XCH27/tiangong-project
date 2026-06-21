import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, type DesignSelection } from '@craft-agent/shared/protocol'
import {
  createReplaceTextAction,
  createSetStyleAction,
  createSetTransformAction,
  isDomEditableSelection,
  parsePixel,
  readLocatorString,
  readStyleValue,
} from './design-inspector-actions'

const selection: DesignSelection = {
  selectionId: 'sel-1',
  sessionId: 'session-1',
  createdBy: USER_ACTOR,
  objects: [{
    type: 'design_node',
    surface: 'artifact',
    locator: {
      artifactId: 'artifact-1',
      selector: '#hero',
      computedStyle: { color: 'rgb(0, 0, 255)', width: '120px', borderRadius: '4px' },
      textContent: 'Hero',
    },
    preview: { text: 'Hero' },
  }],
}

describe('design inspector actions', () => {
  it('detects artifact/browser selections as DOM editable', () => {
    expect(isDomEditableSelection(selection)).toBe(true)
    expect(isDomEditableSelection({ ...selection, objects: [{ ...selection.objects[0]!, surface: 'code' }] })).toBe(false)
  })

  it('reads locator and style values from the primary object', () => {
    const object = selection.objects[0]!
    expect(readLocatorString(object, 'artifactId')).toBe('artifact-1')
    expect(readLocatorString(object, 'selector')).toBe('#hero')
    expect(readStyleValue(object, 'width')).toBe('120px')
  })

  it('creates design actions for style, text, and transform edits', () => {
    expect(createSetStyleAction('session-1', selection, { color: 'red' }).op).toEqual({
      kind: 'set_style',
      props: { color: 'red' },
    })
    expect(createReplaceTextAction('session-1', selection, 'New hero').op).toEqual({
      kind: 'doc_edit',
      op: 'replace',
      payload: { text: 'New hero' },
    })
    expect(createSetTransformAction('session-1', selection, { w: 240, radius: 12 }).op).toEqual({
      kind: 'set_transform',
      w: 240,
      radius: 12,
    })
  })

  it('parses pixel style values', () => {
    expect(parsePixel('120px')).toBe(120)
    expect(parsePixel('')).toBeUndefined()
  })
})
