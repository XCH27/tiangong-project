import type { AnnotationV1 } from '@craft-agent/core/types'
import { buildWorkbenchAnnotation } from '@craft-agent/shared/protocol'
import type { DesignAction, DesignPatch, DesignSelection } from '@craft-agent/shared/protocol'
import type { DesignPatchApplier } from './design-engine'

export interface AnnotationSessionWriter {
  addMessageAnnotation(sessionId: string, messageId: string, annotation: AnnotationV1): void
  removeMessageAnnotation(sessionId: string, messageId: string, annotationId: string): void
}

interface AnnotationPatchForward {
  kind: 'addAnnotation'
  sessionId: string
  messageId: string
  annotation: AnnotationV1
}

interface AnnotationPatchInverse {
  kind: 'removeAnnotation'
  sessionId: string
  messageId: string
  annotationId: string
}

function isAnnotateAction(action: DesignAction): action is DesignAction & {
  op: { kind: 'annotate'; messageId: string; annotationId?: string; text: string }
} {
  return action.op.kind === 'annotate'
}

function annotationPatch(patch: DesignPatch): { forward: AnnotationPatchForward; inverse: AnnotationPatchInverse } | null {
  const forward = patch.forward as Partial<AnnotationPatchForward>
  const inverse = patch.inverse as Partial<AnnotationPatchInverse>
  if (
    forward?.kind === 'addAnnotation' &&
    typeof forward.messageId === 'string' &&
    forward.annotation &&
    inverse?.kind === 'removeAnnotation' &&
    typeof inverse.messageId === 'string' &&
    typeof inverse.annotationId === 'string'
  ) {
    return { forward: forward as AnnotationPatchForward, inverse: inverse as AnnotationPatchInverse }
  }
  return null
}

export class DesignAnnotationApplier implements DesignPatchApplier {
  constructor(private readonly sessionWriter: AnnotationSessionWriter) {}

  preview(action: DesignAction, selection: DesignSelection | null): { forward: unknown; inverse: unknown } {
    if (!isAnnotateAction(action)) {
      return {
        forward: { op: action.op },
        inverse: { kind: 'unavailable', reason: 'no annotation operation' },
      }
    }
    if (!selection) {
      throw new Error(`Cannot annotate without selection ${action.selectionId}`)
    }

    const annotation = buildWorkbenchAnnotation({
      sessionId: action.sessionId,
      messageId: action.op.messageId,
      selection,
      note: action.op.text,
      actor: action.actor,
    })

    const annotationId = action.op.annotationId?.trim() || annotation.id
    const stableAnnotation: AnnotationV1 = {
      ...annotation,
      id: annotationId,
    }

    return {
      forward: {
        kind: 'addAnnotation',
        sessionId: action.sessionId,
        messageId: action.op.messageId,
        annotation: stableAnnotation,
      } satisfies AnnotationPatchForward,
      inverse: {
        kind: 'removeAnnotation',
        sessionId: action.sessionId,
        messageId: action.op.messageId,
        annotationId,
      } satisfies AnnotationPatchInverse,
    }
  }

  apply(patch: DesignPatch): void {
    const payload = annotationPatch(patch)
    if (!payload) return
    this.sessionWriter.addMessageAnnotation(
      payload.forward.sessionId,
      payload.forward.messageId,
      payload.forward.annotation,
    )
  }

  revert(patch: DesignPatch): void {
    const payload = annotationPatch(patch)
    if (!payload) return
    this.sessionWriter.removeMessageAnnotation(
      payload.inverse.sessionId,
      payload.inverse.messageId,
      payload.inverse.annotationId,
    )
  }
}
