export interface BatchOperationFailure<T> {
  item: T
  error: unknown
}

export interface BatchOperationResult<T> {
  succeeded: T[]
  failed: BatchOperationFailure<T>[]
}

/**
 * Run automation mutations in order. The backing JSON file is updated through
 * read-modify-write RPCs, so parallel calls can overwrite one another.
 */
export async function runSequentialAutomationOperations<T>(
  items: readonly T[],
  operation: (item: T) => Promise<unknown>,
): Promise<BatchOperationResult<T>> {
  const succeeded: T[] = []
  const failed: BatchOperationFailure<T>[] = []

  for (const item of items) {
    try {
      await operation(item)
      succeeded.push(item)
    } catch (error) {
      failed.push({ item, error })
    }
  }

  return { succeeded, failed }
}

export function getBatchOperationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
