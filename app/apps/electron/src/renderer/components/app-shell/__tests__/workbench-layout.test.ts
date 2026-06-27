import { describe, expect, test } from 'bun:test'

import { getContentGridSpec, getRequiredContentSize } from '../workbench-layout'

describe('workbench-layout', () => {
  test('3 panels use 上二下一 grid without overlap', () => {
    const spec = getContentGridSpec(3)
    expect(spec.mode).toBe('grid')
    expect(spec.cells).toHaveLength(3)
    expect(spec.cells[2]?.columnSpan).toBe(2)
  })

  test('required content width scales with grid columns not panel count', () => {
    const two = getRequiredContentSize(2)
    const three = getRequiredContentSize(3)
    expect(three.width).toBe(two.width)
    expect(three.height).toBeGreaterThan(two.height)
  })
})
