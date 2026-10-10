/**
 * Host turn journal on the Craft session log.
 *
 * Events are lines in session.jsonl. Chat reads skip them. This is the M00
 * session authority, not a second database and not MemoryTurnJournal.
 */

import type { AuditSessionEvent } from './session-event'
import { sealHostRecord } from './provider-usage'
import type { TurnJournal } from './turn-admission'
import {
  HOST_SESSION_EVENT_RECORD,
  appendHostSessionEventLine,
  isHostSessionEventLine,
  makeSessionPathPortable,
  readHostSessionEventLines,
} from '../sessions/jsonl.ts'
import { dirname } from 'node:path'

export class SessionFileTurnJournal implements TurnJournal {
  constructor(private readonly sessionFile: string) {}

  append(event: AuditSessionEvent): void {
    const safe = sealHostRecord(event)
    const line = makeSessionPathPortable(
      JSON.stringify({ record: HOST_SESSION_EVENT_RECORD, event: safe }),
      dirname(this.sessionFile),
    )
    appendHostSessionEventLine(this.sessionFile, line)
  }

  read(sessionId: string): AuditSessionEvent[] {
    const events: AuditSessionEvent[] = []
    for (const line of readHostSessionEventLines(this.sessionFile)) {
      if (!isHostSessionEventLine(line)) continue
      let parsed: unknown
      try {
        parsed = JSON.parse(line) as { event?: AuditSessionEvent }
      } catch {
        continue
      }
      const event = parsed && typeof parsed === 'object'
        ? (parsed as { event?: AuditSessionEvent }).event
        : undefined
      if (!event || event.sessionId !== sessionId) continue
      events.push(event)
    }
    return events
  }
}
