import type { DesignAction, DesignPatch, DesignSelection, WorkbenchObjectRef } from '@craft-agent/shared/protocol'
import { USER_ACTOR } from '@craft-agent/shared/protocol'

export interface DesignPendingPatch {
  sessionId: string
  patch: DesignPatch
  action: DesignAction
}

const DOM_EDIT_SURFACES = new Set(['artifact', 'browser'])

export function isDomEditableSelection(selection: DesignSelection | null | undefined): boolean {
  if (!selection || selection.objects.length === 0) return false
  return selection.objects.every((object) => DOM_EDIT_SURFACES.has(object.surface))
}

export function primaryDomObject(selection: DesignSelection): WorkbenchObjectRef | null {
  return selection.objects.find((object) => DOM_EDIT_SURFACES.has(object.surface)) ?? null
}

export function readLocatorString(object: WorkbenchObjectRef, key: string): string {
  const value = object.locator[key]
  return typeof value === 'string' ? value : ''
}

export function readStyleValue(object: WorkbenchObjectRef, key: string): string {
  const style = object.locator.computedStyle ?? object.locator.style ?? object.locator.styles
  if (typeof style === 'object' && style !== null && !Array.isArray(style)) {
    const value = (style as Record<string, unknown>)[key]
    if (typeof value === 'string') return value
    if (typeof value === 'number') return String(value)
  }
  return ''
}

export function createDesignAction(
  sessionId: string,
  selection: DesignSelection,
  op: DesignAction['op'],
): DesignAction {
  return {
    actionId: `action-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
    sessionId,
    selectionId: selection.selectionId,
    actor: USER_ACTOR,
    origin: 'human_ui',
    op,
    createdAt: Date.now(),
  }
}

export function createSetStyleAction(
  sessionId: string,
  selection: DesignSelection,
  props: Record<string, string>,
): DesignAction {
  return createDesignAction(sessionId, selection, { kind: 'set_style', props })
}

export function createReplaceTextAction(
  sessionId: string,
  selection: DesignSelection,
  text: string,
): DesignAction {
  return createDesignAction(sessionId, selection, {
    kind: 'doc_edit',
    op: 'replace',
    payload: { text },
  })
}

export function createSetTransformAction(
  sessionId: string,
  selection: DesignSelection,
  transform: { w?: number; radius?: number; opacity?: number },
): DesignAction {
  return createDesignAction(sessionId, selection, { kind: 'set_transform', ...transform })
}

export function parsePixel(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number.parseFloat(trimmed.replace(/px$/i, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}
