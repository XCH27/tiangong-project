/**
 * 远程连接 — Craft settings page chrome (max-w-3xl, section/card/toggle/row).
 * LAN listen applies immediately; pairing is name + access link.
 */
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@craft-agent/ui'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type { ServerConfig, ServerStatus } from '@craft-agent/shared/config/server-config'
import type { Workspace } from '../../../shared/types'
import {
  SettingsSection,
  SettingsCard,
  SettingsCardFooter,
  SettingsRow,
  SettingsToggle,
  SettingsInputRow,
} from '@/components/settings'
import { parseAccessLink } from '@craft-agent/shared/remote'

/** Exactly what the RPC returns; the renderer never sees a token hash or a scope. */
type RemoteDeviceRow = Awaited<ReturnType<typeof window.electronAPI.listRemoteDevices>>[number]
import { attachRemoteFromAccessLink, attachRemoteFromServerToken } from '@/lib/remote-connect'
import { useOptionalAppShellContext } from '@/context/AppShellContext'

/**
 * The command Craft's own server documentation gives for a headless host. Offered
 * copyable rather than described, because a person setting up a VPS needs the line,
 * not a paraphrase of it.
 */
const HEADLESS_START_COMMAND =
  'CRAFT_SERVER_TOKEN=$(openssl rand -hex 32) CRAFT_RPC_HOST=0.0.0.0 bun run packages/server/src/index.ts'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'server',
}

export default function ServerSettingsPage() {
  const { t } = useTranslation()
  const shell = useOptionalAppShellContext()
  const refreshWorkspaces = shell?.onRefreshWorkspaces ?? (() => {})
  const [config, setConfig] = useState<ServerConfig | null>(null)
  const [status, setStatus] = useState<ServerStatus | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  // removeWorkspace deletes the Workspace's credentials and its whole data
  // directory (sessions, plans). That is irreversible, so it is confirmed and
  // the copy says what is actually removed rather than "device".
  const [disconnecting, setDisconnecting] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [accessLink, setAccessLink] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  // A server you run yourself (VPS, Docker, packages/server) has an address and a
  // token and cannot mint an access link — Craft's own documented path, and the only
  // route to a headless host.
  const [serverUrl, setServerUrl] = useState('')
  const [serverToken, setServerToken] = useState('')
  const [serverConnecting, setServerConnecting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  // Devices allowed to reach THIS machine. Their own object, not a projection of the
  // Workspace list: one machine can hold several Workspaces, and a phone holds none.
  const [allowed, setAllowed] = useState<RemoteDeviceRow[]>([])
  const [inviteName, setInviteName] = useState('')
  const [invite, setInvite] = useState<Awaited<ReturnType<typeof window.electronAPI.createRemoteInvite>> | null>(null)
  const [minting, setMinting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const parsed = parseAccessLink(accessLink)

  const load = useCallback(async () => {
    try {
      const [nextConfig, nextStatus, nextWorkspaces, nextAllowed] = await Promise.all([
        window.electronAPI.getServerConfig(),
        window.electronAPI.getServerStatus(),
        window.electronAPI.getWorkspaces(),
        window.electronAPI.listRemoteDevices(),
      ])
      setConfig(nextConfig)
      setStatus(nextStatus)
      setWorkspaces(nextWorkspaces)
      setAllowed(nextAllowed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const enabled = Boolean(config?.enabled && status?.running)
  const remoteDevices = workspaces.filter((ws) => ws.remoteServer)

  const mintInvite = async () => {
    setMinting(true)
    setInviteError(null)
    try {
      const created = await window.electronAPI.createRemoteInvite({ deviceName: inviteName.trim() })
      setInvite(created)
      setInviteName('')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setInviteError(
        message.includes('REMOTE_NO_REACHABLE_ADDRESS')
          ? t('settings.remote.noReachableAddress')
          : message,
      )
    } finally {
      setMinting(false)
    }
  }

  const revoke = async (deviceId: string) => {
    await window.electronAPI.revokeRemoteDevice(deviceId)
    await load()
  }

  const clearRevoked = async () => {
    await window.electronAPI.clearRevokedRemoteDevices()
    await load()
  }

  const setEnabled = async (next: boolean) => {
    if (!config) return
    setSaving(true)
    try {
      await window.electronAPI.setServerConfig({
        ...config,
        enabled: next,
        port: config.port || 9100,
      })
      await load()
    } catch (err) {
      toast.error(t('settings.server.failedToSave', { message: err instanceof Error ? err.message : String(err) }))
    } finally {
      setSaving(false)
    }
  }

  const handleConnect = async () => {
    if (!parsed) {
      setConnectError(t('settings.remote.pairingInvalid'))
      return
    }
    setConnecting(true)
    setConnectError(null)
    try {
      const workspace = await attachRemoteFromAccessLink(deviceName.trim(), accessLink)
      setDeviceName('')
      setAccessLink('')
      toast.success(t('settings.remote.deviceConnected', { name: workspace.name }))
      refreshWorkspaces()
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setConnectError(message === 'invalid-access-link' ? t('settings.remote.pairingInvalid') : message)
    } finally {
      setConnecting(false)
    }
  }

  const handleConnectServer = async () => {
    setServerConnecting(true)
    setServerError(null)
    try {
      const workspace = await attachRemoteFromServerToken(
        deviceName.trim() || serverUrl.trim(),
        serverUrl,
        serverToken,
      )
      setServerUrl('')
      setServerToken('')
      toast.success(t('settings.remote.deviceConnected', { name: workspace.name }))
      refreshWorkspaces()
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setServerError(
        message === 'invalid-server-url' ? t('settings.remote.serverUrlInvalid')
          : message === 'invalid-server-token' ? t('settings.remote.serverTokenRequired')
            : message,
      )
    } finally {
      setServerConnecting(false)
    }
  }

  if (loading || !config) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title={t('settings.server.title')} />
      <ScrollArea className="flex-1">
        <div className="px-5 py-7 max-w-3xl mx-auto space-y-5">
            <SettingsSection title={t('settings.remote.thisDevice')}>
              <SettingsCard>
                <SettingsToggle
                  label={t('settings.server.enableServerMode')}
                  description={t('settings.remote.thisDeviceDesc')}
                  checked={enabled}
                  disabled={saving}
                  onCheckedChange={(next) => void setEnabled(next)}
                />
              </SettingsCard>

              {enabled && (
                <SettingsCard>
                  <SettingsInputRow
                    label={t('settings.remote.addDevice')}
                    value={inviteName}
                    onChange={(value) => { setInviteName(value); setInviteError(null) }}
                    placeholder={t('settings.remote.deviceNamePlaceholder')}
                    disabled={minting}
                    error={inviteError ?? undefined}
                  />
                  {invite && (
                    <SettingsRow
                      label={invite.deviceName}
                      description={t('settings.remote.inviteOnce')}
                    >
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded max-w-[180px] truncate">
                          {invite.accessLink}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          aria-label={t('settings.remote.accessLink')}
                          onClick={() => {
                            void navigator.clipboard.writeText(invite.accessLink)
                            toast.success(t('settings.server.copiedToClipboard', { label: t('settings.remote.accessLink') }))
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </SettingsRow>
                  )}
                  <SettingsCardFooter>
                    <Button
                      size="sm"
                      disabled={minting}
                      onClick={() => void mintInvite()}
                    >
                      {minting ? <Spinner className="mr-1.5" /> : null}
                      {t('settings.remote.createAccessLink')}
                    </Button>
                  </SettingsCardFooter>
                </SettingsCard>
              )}

              {/* What this machine can actually be reached on. Upstream puts a fact like
                  this in a warning strip rather than in a row's description, and it is
                  the thing a person needs to know before they send the link. */}
              {invite && invite.reach !== 'anywhere' && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{t(`settings.remote.reach.${invite.reach}`)}</span>
                </div>
              )}

              {allowed.length > 0 && (
                <SettingsCard>
                  {allowed.map((device) => (
                    <SettingsRow
                      key={device.id}
                      label={device.name}
                      description={
                        device.revokedAt
                          ? t('settings.remote.revoked')
                          : device.online
                            ? t('settings.remote.online')
                            : t('settings.remote.offline')
                      }
                      action={device.revokedAt ? undefined : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[11px] px-2 shrink-0"
                          onClick={() => void revoke(device.id)}
                        >
                          {t('settings.remote.revoke')}
                        </Button>
                      )}
                    />
                  ))}
                  {allowed.some((device) => device.revokedAt) && (
                    <SettingsCardFooter>
                      <Button variant="outline" size="sm" onClick={() => void clearRevoked()}>
                        {t('settings.remote.clearRevoked')}
                      </Button>
                    </SettingsCardFooter>
                  )}
                </SettingsCard>
              )}
            </SettingsSection>

            <SettingsSection title={t('settings.remote.remoteDevices')}>
              <SettingsCard>
                <SettingsInputRow
                  label={t('settings.remote.deviceNameOptional')}
                  value={deviceName}
                  onChange={setDeviceName}
                  placeholder={t('settings.remote.deviceNamePlaceholder')}
                  disabled={connecting}
                />
                <SettingsInputRow
                  label={t('settings.remote.accessLink')}
                  value={accessLink}
                  onChange={(value) => { setAccessLink(value); setConnectError(null) }}
                  placeholder={t('settings.remote.accessLinkPlaceholder')}
                  disabled={connecting}
                  error={connectError ?? undefined}
                />
                <SettingsCardFooter>
                  <Button size="sm" disabled={connecting || !parsed} onClick={() => void handleConnect()}>
                    {connecting ? <Spinner className="mr-1.5" /> : null}
                    {t('settings.remote.connect')}
                  </Button>
                </SettingsCardFooter>
              </SettingsCard>
              {remoteDevices.length > 0 && (
                <SettingsCard>
                  {remoteDevices.map((ws) => (
                    <SettingsRow
                      key={ws.id}
                      label={ws.name}
                      description={ws.remoteServer?.url}
                      action={(
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          aria-label={t('settings.remote.disconnectDevice')}
                          title={t('settings.remote.disconnectDevice')}
                          onClick={() => setDisconnecting(ws)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    />
                  ))}
                </SettingsCard>
              )}
            </SettingsSection>

            {/* §8/§14: manual setup and headless installation are the advanced path,
                disclosed below the pairing flow rather than offered as a peer button. */}
            <SettingsSection title={t('settings.remote.advanced')}>
              <SettingsCard>
                <SettingsInputRow
                  label={t('settings.remote.serverUrl')}
                  value={serverUrl}
                  onChange={(value) => { setServerUrl(value); setServerError(null) }}
                  placeholder="wss://192.168.1.100:9100"
                  disabled={serverConnecting}
                />
                <SettingsInputRow
                  label={t('settings.remote.serverToken')}
                  value={serverToken}
                  onChange={(value) => { setServerToken(value); setServerError(null) }}
                  placeholder={t('settings.remote.serverTokenPlaceholder')}
                  disabled={serverConnecting}
                  error={serverError ?? undefined}
                />
                <SettingsCardFooter>
                  <Button
                    size="sm"
                    disabled={serverConnecting || !serverUrl.trim() || !serverToken.trim()}
                    onClick={() => void handleConnectServer()}
                  >
                    {serverConnecting ? <Spinner className="mr-1.5" /> : null}
                    {t('settings.remote.connectServer')}
                  </Button>
                </SettingsCardFooter>
              </SettingsCard>

              <SettingsCard>
                <SettingsRow
                  label={t('settings.remote.installOnServer')}
                  description={t('settings.remote.installOnServerDesc')}
                >
                  <div className="flex items-center gap-1.5">
                    <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded max-w-[180px] truncate">
                      {HEADLESS_START_COMMAND}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      aria-label={t('settings.remote.installOnServer')}
                      onClick={() => {
                        void navigator.clipboard.writeText(HEADLESS_START_COMMAND)
                        toast.success(t('settings.server.copiedToClipboard', { label: t('settings.remote.installOnServer') }))
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </SettingsRow>
              </SettingsCard>
            </SettingsSection>
          </div>
      </ScrollArea>

      <Dialog open={disconnecting !== null} onOpenChange={open => !open && setDisconnecting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('settings.remote.disconnectConfirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.remote.disconnectConfirmDescription', { name: disconnecting?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDisconnecting(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const target = disconnecting
                setDisconnecting(null)
                if (!target) return
                void window.electronAPI.removeWorkspace(target.id).then(removed => {
                  if (!removed) {
                    toast.error(t('settings.remote.disconnectFailed', { name: target.name }))
                    return
                  }
                  refreshWorkspaces()
                  void load()
                })
              }}
            >
              {t('settings.remote.disconnectDevice')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
