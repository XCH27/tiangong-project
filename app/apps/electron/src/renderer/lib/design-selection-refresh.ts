import type { DesignSelection, WorkbenchObjectRef } from '@craft-agent/shared/protocol'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import { evaluateArtifactPreview } from './artifact-preview-registry'
import { applyDomSnapshotToObject, buildDomSnapshotScript, type DomElementSnapshot } from './design-dom-snapshot'
import { readLocatorString } from './design-inspector-actions'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asSnapshot(value: unknown): DomElementSnapshot | null {
  if (!isRecord(value) || typeof value.selector !== 'string') return null
  const computedStyle = isRecord(value.computedStyle) ? value.computedStyle : {}
  return {
    selector: value.selector,
    computedStyle: Object.fromEntries(
      Object.entries(computedStyle).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ),
    textContent: typeof value.textContent === 'string' ? value.textContent : '',
  }
}

async function snapshotArtifactObject(sessionId: string, object: WorkbenchObjectRef): Promise<WorkbenchObjectRef> {
  const artifactId = readLocatorString(object, 'artifactId')
  const selector = readLocatorString(object, 'selector')
  if (!artifactId || !selector) {
    throw new Error('Artifact selection is missing artifactId or selector')
  }

  const result = await evaluateArtifactPreview(sessionId, artifactId, buildDomSnapshotScript(selector))
  const snapshot = asSnapshot(result)
  if (!snapshot) {
    throw new Error(`Failed to snapshot artifact element ${selector}`)
  }
  return applyDomSnapshotToObject(object, snapshot)
}

async function snapshotBrowserObject(object: WorkbenchObjectRef): Promise<WorkbenchObjectRef> {
  const browserPaneId =
    readLocatorString(object, 'browserPaneId')
    || readLocatorString(object, 'browserInstanceId')
    || readLocatorString(object, 'paneId')
    || readLocatorString(object, 'instanceId')
  const selector = readLocatorString(object, 'selector')
  if (!browserPaneId || !selector) {
    throw new Error('Browser selection is missing browser pane id or selector')
  }

  const browserPane = window.electronAPI?.browserPane
  if (!browserPane?.evaluate) {
    throw new Error('BrowserPane evaluate is not available in this renderer')
  }

  const result = await browserPane.evaluate(browserPaneId, buildDomSnapshotScript(selector))
  const snapshot = asSnapshot(result)
  if (!snapshot) {
    throw new Error(`Failed to snapshot browser element ${selector}`)
  }

  return applyDomSnapshotToObject(object, snapshot)
}

export async function refreshDesignSelectionFromDom(
  sessionId: string,
  selection: DesignSelection,
): Promise<DesignSelection> {
  const objects = await Promise.all(selection.objects.map(async (object) => {
    if (object.surface === 'artifact') return snapshotArtifactObject(sessionId, object)
    if (object.surface === 'browser') return snapshotBrowserObject(object)
    return object
  }))

  return {
    ...selection,
    objects,
    createdAt: Date.now(),
    createdBy: USER_ACTOR,
  }
}
