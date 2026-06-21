import type { DesignDomPatchWriter, DomPatchBatch, DomPatchContext, DomPatchOperation } from './design-dom-applier'

export interface DesignSurfaceDomPatchWriters {
  browser?: DesignDomPatchWriter
  artifact?: DesignDomPatchWriter
}

export class DesignSurfaceDomPatchWriter implements DesignDomPatchWriter {
  constructor(private readonly writers: DesignSurfaceDomPatchWriters) {}

  async applyDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    await this.run('applyDomPatch', batch, context)
  }

  async revertDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    await this.run('revertDomPatch', batch, context)
  }

  private async run(method: keyof DesignDomPatchWriter, batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    const groups = groupBySurface(batch.operations)
    for (const [surface, operations] of groups) {
      const writer = this.writerFor(surface)
      if (!writer) {
        throw new Error(`No DOM writer registered for ${surface} surface`)
      }
      await writer[method]({ kind: 'dom_batch', operations }, context)
    }
  }

  private writerFor(surface: string): DesignDomPatchWriter | undefined {
    if (surface === 'browser') return this.writers.browser
    if (surface === 'artifact') return this.writers.artifact
    return undefined
  }
}

function groupBySurface(operations: DomPatchOperation[]): Map<string, DomPatchOperation[]> {
  const groups = new Map<string, DomPatchOperation[]>()
  for (const operation of operations) {
    const list = groups.get(operation.surface) ?? []
    list.push(operation)
    groups.set(operation.surface, list)
  }
  return groups
}
