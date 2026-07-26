/**
 * R2-C1/R2-C2 guard: with no FLEET_UPDATE_FEED_URL configured, the updater is
 * honestly disabled — no feed URL is set, no network check runs, nothing can
 * install, and a stale updater cache cannot auto-install on quit.
 */

import { describe, it, expect, mock } from 'bun:test'

const checkForUpdatesSpy = mock(async () => {
  throw new Error('checkForUpdates must not be called while the updater is disabled')
})
const setFeedURLSpy = mock(() => {})
const quitAndInstallSpy = mock(() => {})

const autoUpdaterMock: Record<string, unknown> = {
  autoDownload: true,
  autoInstallOnAppQuit: true,
  logger: null,
  on: mock(() => {}),
  setFeedURL: setFeedURLSpy,
  checkForUpdates: checkForUpdatesSpy,
  quitAndInstall: quitAndInstallSpy,
}

mock.module('electron-updater', () => ({ autoUpdater: autoUpdaterMock }))

mock.module('electron', () => ({
  app: {
    getName: mock(() => 'Fleet'),
    getPath: mock((_name: string) => '/tmp/fleet-test-home'),
    getVersion: mock(() => '0.0.0-test'),
  },
  BrowserWindow: { getAllWindows: mock(() => []) },
}))

mock.module('../logger', () => {
  const stubLog = { info: () => {}, error: () => {}, warn: () => {}, debug: () => {} }
  return {
    mainLog: stubLog,
    sessionLog: stubLog,
    handlerLog: stubLog,
    windowLog: stubLog,
    agentLog: stubLog,
    searchLog: stubLog,
    autoUpdateLog: stubLog,
    isDebugMode: false,
    getLogFilePath: () => '/tmp/main.log',
  }
})

// The gate is read at module load — clear it before importing the module under test.
delete process.env.FLEET_UPDATE_FEED_URL

const { checkForUpdates, installUpdate, isUpdaterEnabled, getUpdateInfo } =
  await import('../auto-update')

describe('auto-update with no Fleet feed configured', () => {
  it('reports the updater as disabled and never configures a feed URL', () => {
    expect(isUpdaterEnabled()).toBe(false)
    expect(setFeedURLSpy).not.toHaveBeenCalled()
    expect(getUpdateInfo().downloadState).toBe('disabled')
  })

  it('disables auto-download and auto-install-on-quit so a stale cache cannot install', () => {
    // Both start true on the mock; module init must force them off.
    expect(autoUpdaterMock.autoDownload).toBe(false)
    expect(autoUpdaterMock.autoInstallOnAppQuit).toBe(false)
  })

  it('checkForUpdates returns disabled without any network check', async () => {
    const info = await checkForUpdates({ autoDownload: true })
    expect(info.downloadState).toBe('disabled')
    expect(info.available).toBe(false)
    expect(info.latestVersion).toBeNull()
    expect(checkForUpdatesSpy).not.toHaveBeenCalled()
  })

  it('installUpdate refuses because nothing can be ready', async () => {
    await expect(installUpdate()).rejects.toThrow('No update ready to install')
    expect(quitAndInstallSpy).not.toHaveBeenCalled()
  })
})
