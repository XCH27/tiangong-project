import type { StoredMessage, StoredSession } from './types.ts'

const ROLE_HEADING: Record<string, string> = {
  user: 'User',
  assistant: 'Assistant',
  tool: 'Tool',
  error: 'Error',
  status: 'Status',
  info: 'Info',
  warning: 'Warning',
  plan: 'Plan',
  'auth-request': 'Auth',
}

function headingFor(message: StoredMessage): string {
  return ROLE_HEADING[message.type] ?? message.type
}

function bodyFor(message: StoredMessage): string {
  const parts: string[] = []
  if (message.toolName) {
    const status = message.toolStatus ? ` (${message.toolStatus})` : ''
    parts.push(`\`${message.toolName}\`${status}`)
  }
  const text = (message.content ?? '').trim()
  if (text) parts.push(text)
  if (message.toolResult && message.toolResult !== text) {
    parts.push('```')
    parts.push(message.toolResult.trim())
    parts.push('```')
  }
  return parts.join('\n\n')
}

/** Safe filename stem from a session title. */
export function markdownExportFilename(title: string, sessionId: string): string {
  const stem = (title || sessionId)
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
  return `${stem || sessionId}.md`
}

/**
 * Turn a stored session into Markdown covering every turn in the conversation.
 */
export function sessionToMarkdown(session: StoredSession): string {
  const title = session.name?.trim() || session.id
  const when = session.lastMessageAt || session.lastUsedAt || session.createdAt
  const lines: string[] = [
    `# ${title}`,
    '',
    `- Session: \`${session.id}\``,
    `- Exported: ${new Date().toISOString()}`,
  ]
  if (when) lines.push(`- Last message: ${new Date(when).toISOString()}`)
  lines.push('')

  for (const message of session.messages) {
    const body = bodyFor(message)
    if (!body) continue
    lines.push(`## ${headingFor(message)}`)
    lines.push('')
    lines.push(body)
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}
