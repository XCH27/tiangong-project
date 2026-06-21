import type { DesignAction, DesignPatch, DesignSelection } from '@craft-agent/shared/protocol'
import type { DesignPatchApplier } from './design-engine'

export class DesignWorkbenchApplier implements DesignPatchApplier {
  constructor(
    private readonly annotationApplier: DesignPatchApplier,
    private readonly domApplier: DesignPatchApplier,
  ) {}

  preview(action: DesignAction, selection: DesignSelection | null): Promise<{ forward: unknown; inverse: unknown }> | { forward: unknown; inverse: unknown } {
    return this.route(action).preview(action, selection)
  }

  apply(patch: DesignPatch, action: DesignAction, selection: DesignSelection | null): Promise<void> | void {
    return this.route(action).apply?.(patch, action, selection)
  }

  revert(patch: DesignPatch, action: DesignAction, selection: DesignSelection | null): Promise<void> | void {
    return this.route(action).revert?.(patch, action, selection)
  }

  private route(action: DesignAction): DesignPatchApplier {
    if (action.op.kind === 'annotate') return this.annotationApplier
    if (action.op.kind === 'set_style' || action.op.kind === 'set_transform') return this.domApplier
    if (action.op.kind === 'doc_edit' && 'op' in action.op && action.op.op === 'replace') return this.domApplier
    throw new Error(`No workbench applier registered for action ${action.op.kind}`)
  }
}
