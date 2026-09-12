import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { AddWorkspaceContainer, AddWorkspaceStepHeader, AddWorkspacePrimaryButton } from "./primitives"
import {
  formatInviteCredential,
  isInviteOffer,
  parseAccessLink,
  preferLastGood,
  raceEndpoints,
} from "@craft-agent/shared/remote"
import { attachRemoteFromAccessLink } from "@/lib/remote-connect"
import type { Workspace } from "../../../shared/types"

type ConnectRemoteProps =
  | {
      mode: 'create'
      onBack: () => void
      onCreated: (workspace: Workspace) => void
      isCreating?: boolean
    }
  | {
      mode: 'reconnect'
      onBack: () => void
      reconnectWorkspace: {
        id: string
        name: string
        remoteWorkspaceId: string
        /** Endpoint that last worked, tried first so a returning machine reconnects fast. */
        lastEndpoint?: string
      }
      onUpdate: (workspaceId: string, remoteServer: { url: string; token: string; remoteWorkspaceId: string }) => Promise<void>
    }

/**
 * Orca-style remote workspace: name + access link.
 * Used from Add workspace and from reconnect.
 */
export function AddWorkspaceStep_ConnectRemote(props: ConnectRemoteProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(props.mode === 'reconnect' ? props.reconnectWorkspace.name : '')
  const [accessLink, setAccessLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const parsed = parseAccessLink(accessLink)
  const creating = props.mode === 'create' && (props.isCreating || busy)
  const disabled = busy || creating
  const canSubmit = name.trim().length > 0 && parsed !== null && !disabled

  const handleSubmit = async () => {
    if (!canSubmit || !parsed) return
    setBusy(true)
    setError(null)
    try {
      if (props.mode === 'create') {
        const workspace = await attachRemoteFromAccessLink(name.trim(), accessLink)
        props.onCreated(workspace)
        return
      }
      // A fresh access link carries a one-time invite; the host mints this device a
      // grant during the handshake and hands it back. A pre-v3 link still carries a
      // shared token. Either way, what gets stored is what will authenticate later.
      const credential = isInviteOffer(parsed)
        ? formatInviteCredential({ enrollmentId: parsed.enrollmentId, secret: parsed.secret })
        : parsed.token
      const race = await raceEndpoints(
        preferLastGood(parsed.endpoints, props.reconnectWorkspace.lastEndpoint),
        async (url) => {
          const result = await window.electronAPI.testRemoteConnection(url, credential)
          if (!result.ok) throw new Error(result.error || t('settings.remote.testFailed'))
          return result
        },
      )
      const connectedUrl = race.endpoint
      const grantedToken = isInviteOffer(parsed) ? race.value?.deviceToken : credential
      if (!connectedUrl || !grantedToken) {
        setError(race.error || t('settings.remote.testFailed'))
        return
      }
      await props.onUpdate(props.reconnectWorkspace.id, {
        url: connectedUrl,
        token: grantedToken,
        remoteWorkspaceId: props.reconnectWorkspace.remoteWorkspaceId,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message === 'invalid-access-link' ? t('settings.remote.pairingInvalid') : message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AddWorkspaceContainer>
      <button
        type="button"
        onClick={props.onBack}
        disabled={disabled}
        className={cn(
          "self-start flex items-center gap-1 text-sm text-muted-foreground",
          "hover:text-foreground transition-colors mb-4",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {t("common.back")}
      </button>

      <AddWorkspaceStepHeader
        title={props.mode === 'reconnect'
          ? t('workspace.reconnect', { name: props.reconnectWorkspace.name })
          : t('workspace.connectRemote')}
        description={t('workspace.connectRemoteDesc')}
      />

      <div className="mt-6 w-full space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{t('settings.remote.deviceName')}</span>
          <div className="bg-background shadow-minimal rounded-lg">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('settings.remote.deviceNamePlaceholder')}
              disabled={disabled || props.mode === 'reconnect'}
              autoFocus={props.mode === 'create'}
              className="border-0 bg-transparent shadow-none"
            />
          </div>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">{t('settings.remote.accessLink')}</span>
          <div className="bg-background shadow-minimal rounded-lg">
            <Input
              value={accessLink}
              onChange={(e) => { setAccessLink(e.target.value); setError(null) }}
              placeholder={t('settings.remote.accessLinkPlaceholder')}
              disabled={disabled}
              autoFocus={props.mode === 'reconnect'}
              autoComplete="off"
              spellCheck={false}
              className="border-0 bg-transparent shadow-none font-mono text-sm"
            />
          </div>
        </label>

        {parsed && (
          <p className="text-xs text-muted-foreground">{t('settings.remote.endpointPreview', { url: parsed.endpoints[0] })}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}

        <AddWorkspacePrimaryButton
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          loading={disabled}
          loadingText={t('settings.remote.statusConnecting')}
        >
          {t('settings.remote.connect')}
        </AddWorkspacePrimaryButton>
      </div>
    </AddWorkspaceContainer>
  )
}
