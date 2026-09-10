import { describe, expect, it } from 'bun:test'
import {
  getBatchOperationErrorMessage,
  runSequentialAutomationOperations,
} from '../batch-operation'

describe('runSequentialAutomationOperations', () => {
  it('runs mutations sequentially and reports successes', async () => {
    const order: string[] = []
    const result = await runSequentialAutomationOperations(['a', 'b'], async (item) => {
      order.push(`start:${item}`)
      await Promise.resolve()
      order.push(`end:${item}`)
    })

    expect(order).toEqual(['start:a', 'end:a', 'start:b', 'end:b'])
    expect(result).toEqual({ succeeded: ['a', 'b'], failed: [] })
  })

  it('continues after a failure without reporting that item as successful', async () => {
    const failure = new Error('disk is read-only')
    const result = await runSequentialAutomationOperations(['a', 'b', 'c'], async (item) => {
      if (item === 'b') throw failure
    })

    expect(result.succeeded).toEqual(['a', 'c'])
    expect(result.failed).toEqual([{ item: 'b', error: failure }])
    expect(getBatchOperationErrorMessage(result.failed[0].error)).toBe('disk is read-only')
  })
})
