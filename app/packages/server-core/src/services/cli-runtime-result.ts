function stringifyUnknown(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function textFromContentArray(content: unknown[]): string | null {
  const parts: string[] = []
  for (const item of content) {
    if (typeof item === 'string') {
      parts.push(item)
      continue
    }
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    if (typeof record.text === 'string') {
      parts.push(record.text)
    } else if (typeof record.content === 'string') {
      parts.push(record.content)
    }
  }
  const text = parts.join('\n').trim()
  return text || null
}

export function formatCliRuntimePromptResult(result: unknown): string {
  if (typeof result === 'string') return result
  if (result == null) return 'CLI Runtime 已完成。'

  if (Array.isArray(result)) {
    return textFromContentArray(result) ?? stringifyUnknown(result)
  }

  if (typeof result === 'object') {
    const record = result as Record<string, unknown>
    for (const key of ['text', 'content', 'message', 'output']) {
      const value = record[key]
      if (typeof value === 'string' && value.trim()) return value
    }
    if (Array.isArray(record.content)) {
      return textFromContentArray(record.content) ?? stringifyUnknown(result)
    }
    return stringifyUnknown(result)
  }

  return String(result)
}
