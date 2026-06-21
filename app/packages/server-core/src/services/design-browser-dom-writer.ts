import type { IBrowserPaneManager } from '../handlers/browser-pane-manager-interface'
import type { DesignDomPatchWriter, DomPatchBatch, DomPatchContext, DomPatchOperation } from './design-dom-applier'

export interface BrowserPaneEvaluator {
  evaluate(id: string, expression: string): Promise<unknown>
}

export interface BrowserPaneDesignDomWriterOptions {
  resolveBrowserPaneManager(sessionId: string): BrowserPaneEvaluator | IBrowserPaneManager | null | undefined
}

interface BrowserDomPatchResult {
  applied?: number
  missing?: string[]
  errors?: string[]
}

export class BrowserPaneDesignDomWriter implements DesignDomPatchWriter {
  constructor(private readonly options: BrowserPaneDesignDomWriterOptions) {}

  async applyDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    await this.run(batch, context)
  }

  async revertDomPatch(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    await this.run(batch, context)
  }

  private async run(batch: DomPatchBatch, context?: DomPatchContext): Promise<void> {
    if (!context?.sessionId) {
      throw new Error('BrowserPane DOM writer requires a sessionId')
    }

    const browserPaneManager = this.options.resolveBrowserPaneManager(context.sessionId)
    if (!browserPaneManager) {
      throw new Error(`No BrowserPane manager available for session ${context.sessionId}`)
    }

    for (const [browserPaneId, operations] of groupByBrowserPane(batch.operations)) {
      const result = await browserPaneManager.evaluate(browserPaneId, buildBrowserDomPatchScript(operations))
      assertBrowserDomPatchResult(browserPaneId, result)
    }
  }
}

function groupByBrowserPane(operations: DomPatchOperation[]): Map<string, DomPatchOperation[]> {
  const groups = new Map<string, DomPatchOperation[]>()
  for (const operation of operations) {
    const browserPaneId = resolveBrowserPaneId(operation)
    const list = groups.get(browserPaneId) ?? []
    list.push(operation)
    groups.set(browserPaneId, list)
  }
  return groups
}

function resolveBrowserPaneId(operation: DomPatchOperation): string {
  const locator = operation.locator
  const value = locator.browserPaneId ?? locator.browserInstanceId ?? locator.paneId ?? locator.instanceId
  if (typeof value === 'string' && value.trim()) return value
  throw new Error('DOM patch operation is missing browser pane id in locator')
}

function buildBrowserDomPatchScript(operations: DomPatchOperation[]): string {
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

function assertBrowserDomPatchResult(browserPaneId: string, result: unknown): void {
  if (!isRecord(result)) return

  const missing = Array.isArray(result.missing) ? result.missing.filter((item): item is string => typeof item === 'string') : []
  const errors = Array.isArray(result.errors) ? result.errors.filter((item): item is string => typeof item === 'string') : []

  if (missing.length > 0 || errors.length > 0) {
    const details = [...missing.map((item) => `missing ${item}`), ...errors].join('; ')
    throw new Error(`Missing DOM targets in BrowserPane ${browserPaneId}: ${details}`)
  }
}

function isRecord(value: unknown): value is BrowserDomPatchResult & Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
