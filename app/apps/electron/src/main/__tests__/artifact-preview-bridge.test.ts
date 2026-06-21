import { describe, expect, it, mock } from 'bun:test'

mock.module('electron', () => ({
  ipcMain: {
    handle: () => {},
  },
  webContents: {
    fromId: () => null,
  },
}))

const { ArtifactPreviewBridge } = await import('../artifact-preview-bridge')

describe('ArtifactPreviewBridge', () => {
  it('fails when no renderer is bound for the session', async () => {
    const bridge = new ArtifactPreviewBridge()
    await expect(bridge.evaluate('missing', 'artifact-1', '1')).rejects.toThrow(
      'No artifact preview renderer bound for session missing',
    )
  })

  it('binds and unbinds session webContents ids', async () => {
    const bridge = new ArtifactPreviewBridge()
    bridge.bindSession('session-1', 42)
    bridge.unbindSession('session-1')
    await expect(bridge.evaluate('session-1', 'artifact-1', '1')).rejects.toThrow(
      'No artifact preview renderer bound for session session-1',
    )
  })
})
