import { MemoryStore, computeSimilarity } from './memory-store'
import type { MemoryEntry } from '@craft-agent/shared/protocol'
import { dirname } from 'node:path'

export class SuggestionService {
  /**
   * Get combined suggestions for the input text.
   */
  static getSuggestions(workspaceRoot: string, queryText: string): MemoryEntry[] {
    const store = new MemoryStore(workspaceRoot)
    if (!store.isMemoryEnabled()) return []

    const q = queryText.trim().toLowerCase()

    // 1. Fetch Snippets from the software partition
    const allSoftware = store.list({ partition: 'software' })
    const snippets = allSoftware
      .filter(entry => entry.content.startsWith('snippet:'))
      .map(entry => {
        try {
          const jsonStr = entry.content.slice('snippet:'.length)
          const parsed = JSON.parse(jsonStr) as { trigger: string; expansions: string[]; label: string }
          return { entry, parsed }
        } catch {
          return null
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    const matchedSnippets = snippets.filter(s =>
      !q || s.parsed.trigger.toLowerCase().startsWith(q)
    )

    const snippetSuggestions: MemoryEntry[] = []
    for (const s of matchedSnippets) {
      for (const expansion of s.parsed.expansions) {
        snippetSuggestions.push({
          id: `suggestion-snippet-${s.entry.id}-${expansion.slice(0, 10)}`,
          partition: 'software',
          tier: 'semantic',
          content: expansion,
          sensitivity: 'low',
          scopeId: s.parsed.trigger,
          source: `snippet:${s.parsed.label || ''}`,
          createdAt: s.entry.createdAt,
          updatedAt: s.entry.updatedAt,
        })
      }
    }

    // 2. Fetch Memory suggestions (user & project partitions)
    // Run semantic similarity to rank user and project memories
    const candidates = [
      ...store.list({ partition: 'user' }),
      ...store.listWorkspaceMemoriesWithoutScope().filter(e => e.partition === 'project'),
    ]

    const scored = candidates
      .map(entry => {
        const score = q ? computeSimilarity(q, entry.content) : 0.5
        return { entry, score }
      })
      .filter(x => !q || x.score >= 0.15)
      .sort((a, b) => b.score - a.score)

    const memorySuggestions = scored.map(x => ({
      ...x.entry,
      id: `suggestion-mem-${x.entry.id}`,
      source: 'memory_suggestion',
    }))

    // Combine them, placing snippet matches first, then top memory suggestions (limit total to 5)
    return [...snippetSuggestions, ...memorySuggestions].slice(0, 5)
  }
}
