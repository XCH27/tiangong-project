const previews = new Map<string, Map<string, HTMLIFrameElement>>()

export function registerArtifactPreview(sessionId: string, artifactId: string, iframe: HTMLIFrameElement): void {
  const byArtifact = previews.get(sessionId) ?? new Map<string, HTMLIFrameElement>()
  byArtifact.set(artifactId, iframe)
  previews.set(sessionId, byArtifact)
}

export function unregisterArtifactPreview(sessionId: string, artifactId: string): void {
  const byArtifact = previews.get(sessionId)
  if (!byArtifact) return
  byArtifact.delete(artifactId)
  if (byArtifact.size === 0) previews.delete(sessionId)
}

export function getArtifactPreviewIframe(sessionId: string, artifactId: string): HTMLIFrameElement | null {
  return previews.get(sessionId)?.get(artifactId) ?? null
}

export async function evaluateArtifactPreview(
  sessionId: string,
  artifactId: string,
  expression: string,
): Promise<unknown> {
  const iframe = getArtifactPreviewIframe(sessionId, artifactId)
  if (!iframe) {
    throw new Error(`No editable artifact preview registered for ${artifactId} in session ${sessionId}`)
  }

  const targetWindow = iframe.contentWindow
  if (!targetWindow) {
    throw new Error(`Artifact preview iframe is not ready for ${artifactId}`)
  }

  const run = (targetWindow as unknown as { eval: (source: string) => unknown }).eval
  return run.call(targetWindow, expression)
}

declare global {
  interface Window {
    __fleetArtifactPreviewEvaluate?: (
      sessionId: string,
      artifactId: string,
      expression: string,
    ) => Promise<unknown>
  }
}

export function installArtifactPreviewBridge(): void {
  if (typeof window === 'undefined') return
  window.__fleetArtifactPreviewEvaluate = evaluateArtifactPreview
}
