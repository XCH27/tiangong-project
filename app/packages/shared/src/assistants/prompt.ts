import { getAssistant, assistantWornBy } from './storage.ts'

/**
 * Stable system-prefix block for the identity this session wears.
 * Empty when nothing is worn. Switching identity changes the cache prefix,
 * which is the correct cost of a real costume change.
 */
export function formatAssistantContext(workspaceRootPath: string, sessionId: string): string | null {
  if (!workspaceRootPath || !sessionId) return null
  const id = assistantWornBy(workspaceRootPath, sessionId)
  if (!id) return null
  const assistant = getAssistant(workspaceRootPath, id)
  if (!assistant) throw new Error('The session assistant is missing; restore it before continuing')
  const lines = [
    `<assistant id="${assistant.id}" source="${assistant.source}">`,
    `name: ${assistant.name}`,
  ]
  if (assistant.description) lines.push(`description: ${assistant.description}`)
  if (assistant.systemPrompt.trim()) {
    lines.push('system:')
    lines.push(assistant.systemPrompt.trim())
  }
  if (assistant.commands.length > 0) {
    lines.push('commands:')
    for (const command of assistant.commands) {
      lines.push(`- ${command.name}: ${command.prompt}`)
    }
  }
  lines.push('</assistant>')
  return lines.join('\n')
}
