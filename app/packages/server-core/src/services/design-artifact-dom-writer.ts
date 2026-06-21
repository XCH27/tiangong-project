import type { DesignDomPatchWriter, DomPatchBatch, DomPatchContext, DomPatchOperation } from './design-dom-applier'

export interface ArtifactDomEvaluator {
  evaluate(artifactId: string, expression: string): Promise<unknown>
}

export interface ArtifactDesignDomWriterOptions {
  resolveArtifactEvaluator(sessionId: string): ArtifactDomEvaluator | null | undefined
}

interface ArtifactDomPatchResult {
  applied?: number
  missing?: string[]
  errors?: string[]
}

export class ArtifactDesignDomWriter implements DesignDomPatchWriter {
  constructor(private readonly options: ArtifactDesignDomWriterOptions) {}

  async applyDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    await this.run(batch, context)
  }

  async revertDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    await this.run(batch, context)
  }

  private async run(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    if (!context?.sessionId) {
      throw new Error('Artifact DOM writer requires a sessionId')
    }

    const evaluator = this.options.resolveArtifactEvaluator(context.sessionId)
    if (!evaluator) {
      throw new Error(`No Artifact DOM evaluator available for session ${context.sessionId}`)
    }

    for (const [artifactId, operations] of groupByArtifact(batch.operations)) {
      const result = await evaluator.evaluate(artifactId, buildArtifactDomPatchScript(operations))
      assertArtifactDomPatchResult(artifactId, result)
    }
  }
}

function groupByArtifact(operations: DomPatchOperation[]): Map<string, DomPatchOperation[]> {
  const groups = new Map<string, DomPatchOperation[]>()
  for (const operation of operations) {
    const artifactId = resolveArtifactId(operation)
    const list = groups.get(artifactId) ?? []
    list.push(operation)
    groups.set(artifactId, list)
  }
  return groups
}

function resolveArtifactId(operation: DomPatchOperation): string {
  const locator = operation.locator
  const value = locator.artifactId ?? locator.previewId ?? locator.artifactInstanceId ?? locator.instanceId
  if (typeof value === 'string' && value.trim()) return value
  throw new Error('DOM patch operation is missing artifact id in locator')
}

function buildArtifactDomPatchScript(operations: DomPatchOperation[]): string {
  return `(() => {
  const operations = ${JSON.stringify(operations)};
  const result = { applied: 0, missing: [], errors: [] };

  function findByXPath(xpath) {
    if (!xpath || typeof xpath !== 'string') return null;
    try {
      return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    } catch (error) {
      result.errors.push('invalid xpath: ' + String(xpath));
      return null;
    }
  }

  function findElement(locator) {
    if (locator && typeof locator.selector === 'string') {
      try {
        const bySelector = document.querySelector(locator.selector);
        if (bySelector) return bySelector;
      } catch (error) {
        result.errors.push('invalid selector: ' + String(locator.selector));
      }
    }
    return findByXPath(locator && locator.xpath);
  }

  function labelFor(locator) {
    if (!locator) return '<unknown>';
    return locator.selector || locator.xpath || locator.ref || '<unknown>';
  }

  for (const operation of operations) {
    const element = findElement(operation.locator || {});
    if (!element) {
      result.missing.push(labelFor(operation.locator));
      continue;
    }

    if (operation.kind === 'set_style') {
      for (const [key, value] of Object.entries(operation.props || {})) {
        element.style[key] = value == null ? '' : String(value);
      }
      result.applied += 1;
      continue;
    }

    if (operation.kind === 'set_text') {
      element.textContent = String(operation.text || '');
      result.applied += 1;
      continue;
    }

    result.errors.push('unsupported operation: ' + String(operation.kind));
  }

  return result;
})()`
}

function assertArtifactDomPatchResult(artifactId: string, result: unknown): void {
  if (!isRecord(result)) return

  const missing = Array.isArray(result.missing) ? result.missing.filter((item): item is string => typeof item === 'string') : []
  const errors = Array.isArray(result.errors) ? result.errors.filter((item): item is string => typeof item === 'string') : []

  if (missing.length > 0 || errors.length > 0) {
    const details = [...missing.map((item) => `missing ${item}`), ...errors].join('; ')
    throw new Error(`Missing DOM targets in Artifact ${artifactId}: ${details}`)
  }
}

function isRecord(value: unknown): value is ArtifactDomPatchResult & Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
