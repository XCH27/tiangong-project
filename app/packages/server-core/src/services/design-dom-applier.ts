import type { DesignAction, DesignPatch, DesignSelection, WorkbenchObjectRef } from '@craft-agent/shared/protocol'
import type { DesignPatchApplier } from './design-engine'

export type DomPatchValue = string | null

export interface DomPatchTarget {
  surface: string
  locator: Record<string, unknown>
}

export interface DomSetStyleOperation extends DomPatchTarget {
  kind: 'set_style'
  props: Record<string, DomPatchValue>
}

export interface DomSetTextOperation extends DomPatchTarget {
  kind: 'set_text'
  text: string
}

export type DomPatchOperation = DomSetStyleOperation | DomSetTextOperation

export interface DomPatchBatch {
  kind: 'dom_batch'
  operations: DomPatchOperation[]
}

export interface DomPatchContext {
  sessionId: string
  action: DesignAction
  selection: DesignSelection | null
}

export interface DesignDomPatchWriter {
  applyDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> | void
  revertDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> | void
}

export class DesignDomPatchApplier implements DesignPatchApplier {
  constructor(private readonly writer?: DesignDomPatchWriter) {}

  preview(action: DesignAction, selection: DesignSelection | null): { forward: DomPatchBatch; inverse: DomPatchBatch } {
    const targets = domTargets(selection)
    const forward: DomPatchOperation[] = []
    const inverse: DomPatchOperation[] = []

    if (isSetStyleOp(action.op)) {
      for (const target of targets) {
        forward.push({ ...target, kind: 'set_style', props: normalizeStyleProps(action.op.props) })
        inverse.push({ ...target, kind: 'set_style', props: previousStyleProps(target.object, Object.keys(action.op.props)) })
      }
      return { forward: batch(forward), inverse: batch(inverse) }
    }

    if (isSetTransformOp(action.op)) {
      const next = transformToStyleProps(action.op)
      for (const target of targets) {
        forward.push({ ...target, kind: 'set_style', props: next })
        inverse.push({ ...target, kind: 'set_style', props: previousStyleProps(target.object, Object.keys(next)) })
      }
      return { forward: batch(forward), inverse: batch(inverse) }
    }

    if (isReplaceTextOp(action.op)) {
      const text = textPayload(action.op.payload)
      for (const target of targets) {
        forward.push({ ...target, kind: 'set_text', text })
        inverse.push({ ...target, kind: 'set_text', text: previousText(target.object) })
      }
      return { forward: batch(forward), inverse: batch(inverse) }
    }

    throw new Error(`DesignDomPatchApplier does not support action ${action.op.kind}`)
  }

  async apply(patch: DesignPatch, action: DesignAction, selection: DesignSelection | null): Promise<void> {
    const batchPatch = asDomBatch(patch.forward)
    if (!batchPatch || !this.writer) return
    await this.writer.applyDomPatch(batchPatch, { sessionId: patch.sessionId, action, selection })
  }

  async revert(patch: DesignPatch, action: DesignAction, selection: DesignSelection | null): Promise<void> {
    const batchPatch = asDomBatch(patch.inverse)
    if (!batchPatch || !this.writer) return
    await this.writer.revertDomPatch(batchPatch, { sessionId: patch.sessionId, action, selection })
  }
}

type ResolvedTarget = DomPatchTarget & { object: WorkbenchObjectRef }

function batch(operations: DomPatchOperation[]): DomPatchBatch {
  return { kind: 'dom_batch', operations }
}

function domTargets(selection: DesignSelection | null): ResolvedTarget[] {
  const targets = (selection?.objects ?? [])
    .filter((object) => object.surface === 'browser' || object.surface === 'artifact')
    .map((object) => ({ surface: object.surface, locator: object.locator, object }))

  if (targets.length === 0) {
    throw new Error('Cannot create DOM patch without a browser/artifact selection')
  }
  return targets
}

function normalizeStyleProps(props: Record<string, string | number>): Record<string, DomPatchValue> {
  return Object.fromEntries(Object.entries(props).map(([key, value]) => [key, String(value)]))
}

function transformToStyleProps(op: Extract<DesignAction['op'], { kind: 'set_transform' }>): Record<string, DomPatchValue> {
  const props: Record<string, DomPatchValue> = {}
  if (typeof op.x === 'number') props.left = `${op.x}px`
  if (typeof op.y === 'number') props.top = `${op.y}px`
  if (typeof op.w === 'number') props.width = `${op.w}px`
  if (typeof op.h === 'number') props.height = `${op.h}px`
  if (typeof op.rotate === 'number') props.transform = `rotate(${op.rotate}deg)`
  if (typeof op.radius === 'number') props.borderRadius = `${op.radius}px`
  if (typeof op.opacity === 'number') props.opacity = String(op.opacity)
  return props
}

function previousStyleProps(object: WorkbenchObjectRef, keys: string[]): Record<string, DomPatchValue> {
  const style = styleSource(object)
  return Object.fromEntries(keys.map((key) => [key, style[key] === undefined ? null : String(style[key])]))
}

function styleSource(object: WorkbenchObjectRef): Record<string, unknown> {
  const locator = object.locator
  const computed = locator.computedStyle
  if (isRecord(computed)) return computed
  const style = locator.style
  if (isRecord(style)) return style
  const styles = locator.styles
  if (isRecord(styles)) return styles
  return {}
}

function previousText(object: WorkbenchObjectRef): string {
  if (typeof object.locator.textContent === 'string') return object.locator.textContent
  return object.preview?.text ?? ''
}

function textPayload(payload: unknown): string {
  if (isRecord(payload) && typeof payload.text === 'string') return payload.text
  throw new Error('doc_edit replace requires payload.text')
}

function isSetStyleOp(op: DesignAction['op']): op is Extract<DesignAction['op'], { kind: 'set_style' }> {
  return op.kind === 'set_style' && 'props' in op && isRecord(op.props)
}

function isSetTransformOp(op: DesignAction['op']): op is Extract<DesignAction['op'], { kind: 'set_transform' }> {
  return op.kind === 'set_transform'
}

function isReplaceTextOp(op: DesignAction['op']): op is Extract<DesignAction['op'], { kind: 'doc_edit' }> & { op: 'replace' } {
  return op.kind === 'doc_edit' && 'op' in op && op.op === 'replace'
}

function asDomBatch(value: unknown): DomPatchBatch | null {
  if (!isRecord(value) || value.kind !== 'dom_batch' || !Array.isArray(value.operations)) return null
  return value as unknown as DomPatchBatch
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
