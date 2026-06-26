import { dirname } from 'node:path'
import { SessionManager } from '../sessions/SessionManager'
import { ManagerDecisionService } from './manager-decision-service'
import { MemoryStore, computeSimilarity } from './memory-store'

// 1. Hook ManagerDecisionService.prototype.decide to inject matching memories into basis
const originalDecide = ManagerDecisionService.prototype.decide

ManagerDecisionService.prototype.decide = function (request, actor) {
  const { result, record } = originalDecide.call(this, request, actor)

  try {
    const workspaceRoot = dirname(dirname(this.path))
    const store = new MemoryStore(workspaceRoot)
    if (store.isMemoryEnabled()) {
      const action = request.action.toLowerCase()
      // Load user (global) and workspace-specific memories
      const candidates = [
        ...store.list({ partition: 'user' }),
        ...store.listWorkspaceMemoriesWithoutScope().filter(e => e.partition === 'project'),
      ]

      const scored = candidates
        .map(entry => {
          let score = computeSimilarity(action, entry.content)
          // Apply time decay to episodic memory
          if (entry.tier === 'episodic') {
            const daysOld = (Date.now() - entry.updatedAt) / (1000 * 60 * 60 * 24)
            const decayFactor = Math.exp(-0.05 * daysOld)
            score *= decayFactor
          }
          return { entry, score }
        })
        .filter(x => x.score >= 0.15)
        .sort((a, b) => b.score - a.score)

      if (scored.length > 0) {
        const evidence = scored.slice(0, 3).map(x => x.entry.content).join('; ')
        result.basis = `${result.basis} (依据记忆: ${evidence})`
        record.result.basis = result.basis
      }
    }
  } catch (err) {
    console.error('[MemoryService] Failed to inject memory into decision:', err)
  }

  return { result, record }
}

// 2. Hook SessionManager.prototype.onProcessingStopped to extract facts from completed turns
const originalOnProcessingStopped = (SessionManager.prototype as any).onProcessingStopped

;(SessionManager.prototype as any).onProcessingStopped = async function (
  sessionId: string,
  reason: 'complete' | 'interrupted' | 'error' | 'timeout'
) {
  if (originalOnProcessingStopped) {
    await originalOnProcessingStopped.call(this, sessionId, reason)
  }

  if (reason !== 'complete') return

  try {
    const managed = (this as any).sessions.get(sessionId)
    if (!managed || !managed.agent) return

    const store = new MemoryStore(managed.workspace.rootPath)
    if (!store.isMemoryEnabled()) return

    const messages = managed.messages
    const assistantMsg = [...messages].reverse().find(m => (m as any).role === 'assistant' && !(m as any).isIntermediate)
    if (!assistantMsg) return

    const userMsg = [...messages].reverse().find(m => (m as any).role === 'user' && (m as any).timestamp < (assistantMsg as any).timestamp)
    if (!userMsg) return

    const prompt = `You are a memory extractor. Analyze the following conversation turn between the User and the Assistant, and extract key facts about the user (e.g., preferences, stack, conventions) and project/task details.
Format each extracted memory as a single clear sentence. Return ONLY a JSON array of objects with "partition" and "content" fields, e.g. [{"partition": "user", "content": "User prefers TypeScript over JavaScript"}, {"partition": "project", "content": "Project uses Bun as the package manager"}].
Valid partition values: "user" (for user long-term preferences/habits), "project" (for project-specific constraints/goals/details).
If no new key facts or preferences are found, return [].

User message:
${(userMsg as any).content}

Assistant response:
${(assistantMsg as any).content}`

    const systemPrompt = "You are a memory extractor. Reply with ONLY a JSON array of objects. Do not include any explanations or markdown formatting outside the JSON."

    const result = await (managed.agent as any).queryLlm({
      prompt,
      systemPrompt,
    })

    if (result && result.text) {
      const text = result.text.trim()
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Array<{ partition: string; content: string }>
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.partition && item.content) {
              const partition = item.partition.trim().toLowerCase()
              const content = item.content.trim()
              if ((partition === 'user' || partition === 'project') && content) {
                const existing = store.list({ partition: partition as any, contains: content })
                if (existing.length === 0) {
                  store.add({
                    partition: partition as any,
                    content,
                    scopeId: partition === 'project' ? managed.workspace.id : undefined,
                    source: `session:${sessionId}`
                  })
                }
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[MemoryService] Fact extraction failed:', err)
  }
}
