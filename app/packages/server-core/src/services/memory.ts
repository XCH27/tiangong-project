import { dirname } from 'node:path'
import { SessionManager } from '../sessions/SessionManager'
import { ManagerDecisionService } from './manager-decision-service'
import { MemoryStore, computeSimilarity } from './memory-store'

let hooksInstalled = false

/** 安装记忆注入与 turn 抽取 hooks。须在 SessionManager 等模块加载完成后调用一次。 */
export function installMemoryHooks(): void {
  if (hooksInstalled) return
  hooksInstalled = true

  installManagerDecisionHook()
  installSessionProcessingHook()
}

function installManagerDecisionHook(): void {
  const originalDecide = ManagerDecisionService.prototype.decide

  ManagerDecisionService.prototype.decide = function (request, actor) {
    const { result, record } = originalDecide.call(this, request, actor)

    try {
      const workspaceRoot = dirname(dirname(this.path))
      const store = new MemoryStore(workspaceRoot)
      if (store.isMemoryEnabled()) {
        const action = request.action.toLowerCase()
        const candidates = [
          ...store.list({ partition: 'user' }),
          ...store.listWorkspaceMemoriesWithoutScope().filter(e => e.partition === 'project'),
        ]

        const scored = candidates
          .map(entry => {
            let score = computeSimilarity(action, entry.content)
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
}

function installSessionProcessingHook(): void {
  const originalOnProcessingStopped = (SessionManager.prototype as unknown as {
    onProcessingStopped?: (
      sessionId: string,
      reason: 'complete' | 'interrupted' | 'error' | 'timeout',
    ) => Promise<void>
  }).onProcessingStopped

  ;(SessionManager.prototype as unknown as {
    onProcessingStopped: (
      sessionId: string,
      reason: 'complete' | 'interrupted' | 'error' | 'timeout',
    ) => Promise<void>
  }).onProcessingStopped = async function (
    sessionId: string,
    reason: 'complete' | 'interrupted' | 'error' | 'timeout',
  ) {
    if (originalOnProcessingStopped) {
      await originalOnProcessingStopped.call(this, sessionId, reason)
    }

    if (reason !== 'complete') return

    try {
      const managed = (this as unknown as { sessions: Map<string, {
        agent?: { queryLlm?: (input: { prompt: string; systemPrompt: string }) => Promise<{ text?: string }> }
        messages: unknown[]
        workspace: { rootPath: string; id: string }
      }> }).sessions.get(sessionId)
      if (!managed?.agent?.queryLlm) return

      const store = new MemoryStore(managed.workspace.rootPath)
      if (!store.isMemoryEnabled()) return

      const messages = managed.messages
      const assistantMsg = [...messages].reverse().find(m => (m as { role?: string; isIntermediate?: boolean }).role === 'assistant' && !(m as { isIntermediate?: boolean }).isIntermediate)
      if (!assistantMsg) return

      const userMsg = [...messages].reverse().find(m => {
        const msg = m as { role?: string; timestamp?: number }
        const asst = assistantMsg as { timestamp?: number }
        return msg.role === 'user' && (msg.timestamp ?? 0) < (asst.timestamp ?? 0)
      })
      if (!userMsg) return

      const prompt = `You are a memory extractor. Analyze the following conversation turn between the User and the Assistant, and extract key facts about the user (e.g., preferences, stack, conventions) and project/task details.
Format each extracted memory as a single clear sentence. Return ONLY a JSON array of objects with "partition" and "content" fields, e.g. [{"partition": "user", "content": "User prefers TypeScript over JavaScript"}, {"partition": "project", "content": "Project uses Bun as the package manager"}].
Valid partition values: "user" (for user long-term preferences/habits), "project" (for project-specific constraints/goals/details).
If no new key facts or preferences are found, return [].

User message:
${(userMsg as { content?: string }).content}

Assistant response:
${(assistantMsg as { content?: string }).content}`

      const systemPrompt = 'You are a memory extractor. Reply with ONLY a JSON array of objects. Do not include any explanations or markdown formatting outside the JSON.'

      const result = await managed.agent.queryLlm({ prompt, systemPrompt })

      if (result?.text) {
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
                  const existing = store.list({ partition: partition as 'user' | 'project', contains: content })
                  if (existing.length === 0) {
                    store.add({
                      partition: partition as 'user' | 'project',
                      content,
                      scopeId: partition === 'project' ? managed.workspace.id : undefined,
                      source: `session:${sessionId}`,
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
}
