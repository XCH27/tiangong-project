import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { AddWorkspaceContainer, AddWorkspaceStepHeader, AddWorkspacePrimaryButton } from "./primitives"
import { slugify } from "@/lib/slugify"
import { buildRunTargets } from "@craft-agent/shared/remote"
import type { Workspace } from "../../../shared/types"

interface AddWorkspaceStep_RemoteWorkspaceProps {
  onBack: () => void
  onCreated: (workspace: Workspace) => void
  onOpenSettings: () => void
  isCreating?: boolean
}

async function resolveUniqueSlug(baseName: string): Promise<{ path: string }> {
  const baseSlug = slugify(baseName) || 'remote'
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const result = await window.electronAPI.checkWorkspaceSlug(slug)
    if (!result.exists) return { path: result.path }
    attempt += 1
    slug = attempt === 1 ? `${baseSlug}-remote` : `${baseSlug}-${attempt}`
    if (attempt > 20) return { path: result.path }
  }
}

/**
 * After 远程连接 is configured in Settings, create a folder/workspace on that device.
 * If it is not configured, send the user to Settings.
 */
export function AddWorkspaceStep_RemoteWorkspace({
  onBack,
  onCreated,
  onOpenSettings,
  isCreating,
}: AddWorkspaceStep_RemoteWorkspaceProps) {
  const { t } = useTranslation()
  const [remotes, setRemotes] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void window.electronAPI.getWorkspaces().then((list) => {
      const next = list.filter((ws) => ws.remoteServer)
      setRemotes(next)
      setSelectedId(next[0]?.id ?? null)
      setLoading(false)
    })
  }, [])

  // One row per computer, not one per paired project: a device with three projects
  // is still one device to choose between.
  const devices = buildRunTargets(remotes, { localName: '' })
    .filter((target) => target.kind === 'remote')

  const selected = remotes.find((ws) => ws.id === selectedId)
  const disabled = busy || Boolean(isCreating)

  const handleCreate = async () => {
    if (!selected?.remoteServer || !name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const remote = selected.remoteServer
      const created = await window.electronAPI.invokeOnServer(
        remote.url,
        remote.token,
        'server:createWorkspace',
        name.trim(),
      ) as { id: string; name: string }
      const { path } = await resolveUniqueSlug(name.trim())
      const workspace = await window.electronAPI.createWorkspace(path, name.trim(), {
        url: remote.url,
        token: remote.token,
        remoteWorkspaceId: created.id,
        // Same computer, same device record — otherwise this project would read as
        // a separate machine in the run-target list.
        deviceId: remote.deviceId,
        deviceName: remote.deviceName ?? selected.name,
        endpoints: remote.endpoints,
      })
      onCreated(workspace)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <AddWorkspaceContainer>
        <AddWorkspaceStepHeader title={t('workspace.connectRemote')} description="" />
      </AddWorkspaceContainer>
    )
  }

  if (remotes.length === 0) {
    return (
      <AddWorkspaceContainer>
        <button
          type="button"
          onClick={onBack}
          className="self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </button>
        <AddWorkspaceStepHeader
          title={t('workspace.connectRemote')}
          description={t('workspace.remoteNeedsSetup')}
        />
        <div className="mt-8 w-full">
          <AddWorkspacePrimaryButton onClick={onOpenSettings}>
            {t('workspace.openRemoteSettings')}
          </AddWorkspacePrimaryButton>
        </div>
      </AddWorkspaceContainer>
    )
  }

  return (
    <AddWorkspaceContainer>
      <button
        type="button"
        onClick={onBack}
        disabled={disabled}
        className={cn(
          "self-start flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>
      <AddWorkspaceStepHeader
        title={t('workspace.connectRemote')}
        description={t('workspace.remoteCreateFolderDesc')}
      />
      <div className="mt-6 w-full space-y-5">
        {devices.length > 1 && (
          <label className="block space-y-2">
            <span className="text-sm font-medium">{t('settings.remote.remoteDevices')}</span>
            <div className="space-y-2">
              {devices.map((device) => {
                const firstWorkspaceId = device.workspaces[0]?.id
                const isSelected = device.workspaces.some((w) => w.id === selectedId)
                return (
                  <button
                    key={device.key}
                    type="button"
                    onClick={() => firstWorkspaceId && setSelectedId(firstWorkspaceId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg bg-background p-3 text-left shadow-minimal",
                      isSelected && "ring-2 ring-ring",
                    )}
                  >
                    <Monitor className="h-4 w-4 shrink-0 text-foreground/70" />
                    <span className="truncate text-sm font-medium">{device.name}</span>
                  </button>
                )
              })}
            </div>
          </label>
        )}
        <label className="block space-y-2">
          <span className="text-sm font-medium">{t('workspace.nameLabel')}</span>
          <div className="bg-background shadow-minimal rounded-lg">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workspace.newWorkspaceName')}
              disabled={disabled}
              autoFocus
              className="border-0 bg-transparent shadow-none"
            />
          </div>
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <AddWorkspacePrimaryButton
          onClick={() => void handleCreate()}
          disabled={disabled || !name.trim() || !selected}
          loading={disabled}
          loadingText={t('workspace.creating')}
        >
          {t('workspace.createWorkspace')}
        </AddWorkspacePrimaryButton>
      </div>
    </AddWorkspaceContainer>
  )
}
