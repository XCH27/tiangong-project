import { createHash, randomUUID } from 'node:crypto'
import type {
  AnnotationAuthor,
  AnnotationBody,
  AnnotationIntent,
  AnnotationSelector,
  AnnotationV1,
} from '@craft-agent/core/types'
import type { ActorRef, DesignSelection, WorkbenchObjectRef } from '@craft-agent/shared/protocol'

const MAX_TEXT_QUOTE = 500
const MAX_META_TEXT = 240
const MAX_META_OBJECTS = 20

export interface BuildWorkbenchAnnotationInput {
  sessionId: string
  messageId: string
  selection: DesignSelection
  note?: string
  intent?: AnnotationIntent
  actor?: ActorRef
  now?: number
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function clampText(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max)}...`
}

function actorToAnnotationAuthor(actor?: ActorRef): AnnotationAuthor | undefined {
  if (!actor) return undefined
  if (actor.kind === 'user') {
    return { id: 'user', type: 'user', name: actor.displayName ?? 'User' }
  }
  return {
    id: actor.agentId ?? actor.runtime ?? 'agent',
    type: 'agent',
    name: actor.displayName ?? actor.role ?? actor.runtime ?? 'Agent',
  }
}

function rectFromLocator(locator: Record<string, unknown>): { x: number; y: number; w: number; h: number } | null {
  const rect = locator.rect
  if (rect && typeof rect === 'object') {
    const rec = rect as Record<string, unknown>
    const x = finiteNumber(rec.x)
    const y = finiteNumber(rec.y)
    const w = finiteNumber(rec.w) ?? finiteNumber(rec.width)
    const h = finiteNumber(rec.h) ?? finiteNumber(rec.height)
    if (x !== undefined && y !== undefined && w !== undefined && h !== undefined && w > 0 && h > 0) {
      return { x, y, w, h }
    }
  }

  const x = finiteNumber(locator.x)
  const y = finiteNumber(locator.y)
  const w = finiteNumber(locator.w) ?? finiteNumber(locator.width)
  const h = finiteNumber(locator.h) ?? finiteNumber(locator.height)
  if (x !== undefined && y !== undefined && w !== undefined && h !== undefined && w > 0 && h > 0) {
    return { x, y, w, h }
  }

  return null
}

function selectorsForObject(object: WorkbenchObjectRef): AnnotationSelector[] {
  const selectors: AnnotationSelector[] = []
  const rect = rectFromLocator(object.locator)
  if (rect) {
    selectors.push({
      type: 'xywh',
      unit: object.locator.unit === 'percent' ? 'percent' : 'pixel',
      ...rect,
      page: finiteNumber(object.locator.page),
      rotation: finiteNumber(object.locator.rotation),
    })
  }

  const exact = nonEmptyString(object.preview?.text) ?? nonEmptyString(object.locator.text)
  if (exact) {
    selectors.push({ type: 'text-quote', exact: clampText(exact, MAX_TEXT_QUOTE) })
  }

  return selectors
}

function summarizeObject(object: WorkbenchObjectRef): Record<string, unknown> {
  const locator = object.locator
  return {
    type: object.type,
    surface: object.surface,
    selector: nonEmptyString(locator.selector),
    xpath: nonEmptyString(locator.xpath),
    url: nonEmptyString(locator.url),
    title: nonEmptyString(locator.title),
    frameUrl: nonEmptyString(locator.frameUrl),
    tagName: nonEmptyString(locator.tagName),
    role: nonEmptyString(locator.role),
    accessibleName: nonEmptyString(locator.accessibleName),
    rect: rectFromLocator(locator) ?? undefined,
    text: object.preview?.text ? clampText(object.preview.text, MAX_META_TEXT) : undefined,
  }
}

function annotationBody(note?: string): AnnotationBody[] {
  const trimmed = note?.trim()
  if (trimmed) {
    return [{ type: 'note', text: trimmed, format: 'plain' }]
  }
  return [{ type: 'highlight' }]
}

function stableEvidenceHash(input: Pick<BuildWorkbenchAnnotationInput, 'sessionId' | 'messageId' | 'selection'>): string {
  return createHash('sha256')
    .update(JSON.stringify({
      sessionId: input.sessionId,
      messageId: input.messageId,
      selectionId: input.selection.selectionId,
      objects: input.selection.objects.map((object) => ({
        type: object.type,
        surface: object.surface,
        locator: summarizeObject(object),
      })),
    }))
    .digest('hex')
}

export function buildWorkbenchAnnotation(input: BuildWorkbenchAnnotationInput): AnnotationV1 {
  const now = input.now ?? Date.now()
  const selectors = input.selection.objects.flatMap(selectorsForObject)
  if (selectors.length === 0) {
    throw new Error('Cannot create annotation: selection has no xywh or text anchor')
  }

  const actor = input.actor ?? input.selection.createdBy
  const objects = input.selection.objects.slice(0, MAX_META_OBJECTS).map(summarizeObject)

  return {
    id: `ann-${randomUUID()}`,
    schemaVersion: 1,
    createdAt: now,
    createdBy: actorToAnnotationAuthor(actor),
    body: annotationBody(input.note),
    target: {
      source: {
        sessionId: input.sessionId,
        messageId: input.messageId,
      },
      selectors,
    },
    intent: input.intent ?? (input.note?.trim() ? 'comment' : 'highlight'),
    status: input.note?.trim() ? 'pending' : undefined,
    style: { color: 'blue', opacity: 0.24 },
    meta: {
      fleetWorkbenchEvidence: {
        schemaVersion: 1,
        kind: 'design-selection',
        evidenceHash: stableEvidenceHash(input),
        selectionId: input.selection.selectionId,
        objectCount: input.selection.objects.length,
        objectsTruncated: input.selection.objects.length > MAX_META_OBJECTS,
        objects,
      },
    },
  }
}
