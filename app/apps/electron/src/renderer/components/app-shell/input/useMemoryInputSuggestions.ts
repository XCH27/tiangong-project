import * as React from 'react'
import type { MemoryEntry } from '@craft-agent/shared/protocol'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 280

export function useMemoryInputSuggestions(
  workspaceId: string | undefined,
  query: string,
  enabled: boolean,
): { suggestions: MemoryEntry[]; loading: boolean } {
  const [suggestions, setSuggestions] = React.useState<MemoryEntry[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!enabled || !workspaceId || query.trim().length < MIN_QUERY_LENGTH || !window.electronAPI?.listMemory) {
      setSuggestions([])
      setLoading(false)
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const results = await window.electronAPI.listMemory(workspaceId, {
            partition: 'software',
            contains: `suggestion:${query.trim()}`,
          })
          if (!cancelled) setSuggestions(results)
        } catch {
          if (!cancelled) setSuggestions([])
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [enabled, workspaceId, query])

  return { suggestions, loading }
}
