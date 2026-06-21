/**
 * Artifact preview DOM evaluator bridge (LOCAL_ONLY).
 *
 * Artifact editable previews live in the renderer (iframe). Server-core applies
 * DOM patches by round-tripping JavaScript evaluation into that iframe.
 */
export interface IArtifactPreviewBridge {
  bindSession(sessionId: string, webContentsId: number): void
  unbindSession(sessionId: string): void
  evaluate(sessionId: string, artifactId: string, expression: string): Promise<unknown>
}
