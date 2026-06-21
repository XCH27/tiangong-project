import { ipcMain, webContents } from 'electron'
import type { IArtifactPreviewBridge } from '@craft-agent/server-core/handlers'

const BIND_CHANNEL = '__artifactPreview:bindSession'
const UNBIND_CHANNEL = '__artifactPreview:unbindSession'

export class ArtifactPreviewBridge implements IArtifactPreviewBridge {
  private readonly sessions = new Map<string, number>()

  registerIpc(): void {
    ipcMain.handle(BIND_CHANNEL, (event, sessionId: string) => {
      if (typeof sessionId !== 'string' || !sessionId.trim()) {
        throw new Error('artifact preview bind requires a sessionId')
      }
      this.bindSession(sessionId, event.sender.id)
    })

    ipcMain.handle(UNBIND_CHANNEL, (_event, sessionId: string) => {
      if (typeof sessionId !== 'string' || !sessionId.trim()) {
        throw new Error('artifact preview unbind requires a sessionId')
      }
      this.unbindSession(sessionId)
    })
  }

  bindSession(sessionId: string, webContentsId: number): void {
    this.sessions.set(sessionId, webContentsId)
  }

  unbindSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  async evaluate(sessionId: string, artifactId: string, expression: string): Promise<unknown> {
    const webContentsId = this.sessions.get(sessionId)
    if (webContentsId == null) {
      throw new Error(`No artifact preview renderer bound for session ${sessionId}`)
    }

    const contents = webContents.fromId(webContentsId)
    if (!contents || contents.isDestroyed()) {
      throw new Error(`Artifact preview renderer is not available for session ${sessionId}`)
    }

    const script = [
      'window.__fleetArtifactPreviewEvaluate(',
      `${JSON.stringify(sessionId)},`,
      `${JSON.stringify(artifactId)},`,
      `${JSON.stringify(expression)}`,
      ')',
    ].join('')

    return contents.executeJavaScript(script, true)
  }
}
