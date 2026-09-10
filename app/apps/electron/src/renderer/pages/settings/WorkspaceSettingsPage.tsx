/**
 * WorkspaceSettingsPage — product surface: **Project settings** (R1).
 *
 * Persistence is still the Craft workspace store (1:1 with Project). User-facing
 * copy says Project/folder; route id remains `settings/workspace` for compatibility.
 *
 * Settings:
 * - Identity (Name, Icon, folder path, local|remote)
 * - Default sources
 * - Advanced (default session folder fallback, Local MCP servers)
 *
 * Execution approval lives on PermissionsSettingsPage (orthogonal axis).
 * Provider credentials and model/reasoning defaults live on the separate
 * Providers and Models settings pages. Project overrides still persist in the
 * existing Workspace settings record; they do not create another model store.
 */

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  useAppShellContext,
  useActiveWorkspace,
} from '@/context/AppShellContext'
import { cn } from '@/lib/utils'

import { Spinner } from '@craft-agent/ui'
import { RenameDialog } from '@/components/ui/rename-dialog'
import type { WorkspaceSettings, LoadedSource } from '../../../shared/types'
import { useDirectoryPicker } from '@/hooks/useDirectoryPicker'
import { ServerDirectoryBrowser } from '@/components/ServerDirectoryBrowser'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import { SourceAvatar } from '@/components/ui/source-avatar'
import { toast } from 'sonner'

import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsToggle,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'workspace',
}

// ============================================
// Main Component
// ============================================

export default function WorkspaceSettingsPage() {
  const { t } = useTranslation()

  // R1 §3 / P6: soft-focus filters the Session list only — settings stay on the
  // shell-active Workspace (implementation Project). Do not re-bind settings to
  // sessionFilter.workspaceId without an owner decision that overrides P6.
  const appShellContext = useAppShellContext()
  const activeWorkspaceId = appShellContext.activeWorkspaceId
  const onRefreshWorkspaces = appShellContext.onRefreshWorkspaces
  const activeProject = useActiveWorkspace()
  const settingsWorkspaceId = activeWorkspaceId
  const projectFolder = activeProject?.rootPath?.trim() || ''
  const isRemoteProject = !!activeProject?.remoteServer

  // Project settings state
  const [wsName, setWsName] = useState('')
  const [wsNameEditing, setWsNameEditing] = useState('')
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [wsIconUrl, setWsIconUrl] = useState<string | null>(null)
  const [isUploadingIcon, setIsUploadingIcon] = useState(false)
  const [workingDirectory, setWorkingDirectory] = useState('')
  const [localMcpEnabled, setLocalMcpEnabled] = useState(true)
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(true)

  // Default sources state
  const [availableSources, setAvailableSources] = useState<LoadedSource[]>([])
  const [enabledSourceSlugs, setEnabledSourceSlugs] = useState<string[]>([])

  // Stale-response guard: bumped per load; an in-flight load whose generation
  // is no longer current must not touch form state (workspace switched mid-flight).
  const loadGenerationRef = useRef(0)

  // Load settings when the target project changes (active shell or soft-focused row)
  useEffect(() => {
    const generation = ++loadGenerationRef.current
    const isStale = () => generation !== loadGenerationRef.current

    const loadWorkspaceSettings = async () => {
      if (!window.electronAPI || !settingsWorkspaceId) {
        if (!isStale()) setIsLoadingWorkspace(false)
        return
      }

      setIsLoadingWorkspace(true)
      try {
        const settings =
          await window.electronAPI.getWorkspaceSettings(settingsWorkspaceId)
        if (isStale()) return
        if (settings) {
          setWsName(settings.name || '')
          setWsNameEditing(settings.name || '')
          setWorkingDirectory(settings.workingDirectory || '')
          setLocalMcpEnabled(settings.localMcpEnabled ?? true)
          // Load default source slugs
          const savedSlugs = settings.enabledSourceSlugs ?? []

          // Load available sources and auto-heal stale slugs
          const sources =
            await window.electronAPI.getSources(settingsWorkspaceId)
          if (isStale()) return
          setAvailableSources(sources)
          const validSlugs = new Set(sources.map((s) => s.config.slug))
          const healedSlugs = savedSlugs.filter((s) => validSlugs.has(s))
          setEnabledSourceSlugs(healedSlugs)

          // Persist cleaned list if stale slugs were removed
          if (healedSlugs.length !== savedSlugs.length) {
            window.electronAPI.updateWorkspaceSetting(
              settingsWorkspaceId,
              'enabledSourceSlugs',
              healedSlugs,
            )
          }
        }

        // Try to load workspace icon (check common extensions)
        const ICON_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif']
        let iconFound = false
        for (const ext of ICON_EXTENSIONS) {
          if (isStale()) return
          try {
            const iconData = await window.electronAPI.readWorkspaceImage(
              settingsWorkspaceId,
              `./icon.${ext}`,
            )
            if (isStale()) return
            // IPC returns null for missing files - continue to next extension
            if (!iconData) {
              continue
            }
            // For SVG, wrap in data URL
            if (ext === 'svg' && !iconData.startsWith('data:')) {
              setWsIconUrl(`data:image/svg+xml;base64,${btoa(iconData)}`)
            } else {
              setWsIconUrl(iconData)
            }
            iconFound = true
            break
          } catch {
            // Icon not found with this extension, try next
          }
        }
        if (!iconFound) {
          setWsIconUrl(null)
        }
      } catch (error) {
        if (!isStale()) {
          console.error('Failed to load workspace settings:', error)
        }
      } finally {
        if (!isStale()) {
          setIsLoadingWorkspace(false)
        }
      }
    }

    loadWorkspaceSettings()
  }, [settingsWorkspaceId])

  // Subscribe to live source changes (additions/removals)
  useEffect(() => {
    if (!window.electronAPI) return
    const cleanup = window.electronAPI.onSourcesChanged(
      (workspaceId: string, sources: LoadedSource[]) => {
        if (workspaceId !== settingsWorkspaceId) return
        setAvailableSources(sources)
        // Auto-heal: remove slugs for sources that no longer exist
        const validSlugs = new Set(sources.map((s) => s.config.slug))
        setEnabledSourceSlugs((prev) => {
          const healed = prev.filter((s) => validSlugs.has(s))
          if (healed.length !== prev.length && settingsWorkspaceId) {
            window.electronAPI.updateWorkspaceSetting(
              settingsWorkspaceId,
              'enabledSourceSlugs',
              healed,
            )
          }
          return healed
        })
      },
    )
    return cleanup
  }, [settingsWorkspaceId])

  // Save workspace setting
  const updateWorkspaceSetting = useCallback(
    async <K extends keyof WorkspaceSettings>(
      key: K,
      value: WorkspaceSettings[K],
    ) => {
      if (!window.electronAPI || !settingsWorkspaceId) return false

      try {
        await window.electronAPI.updateWorkspaceSetting(
          settingsWorkspaceId,
          key,
          value,
        )
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Failed to save ${String(key)}:`, error)
        toast.error(
          t('settings.workspace.failedToSave', { setting: String(key) }),
          {
            description: message,
          },
        )
        return false
      }
    },
    [settingsWorkspaceId, t],
  )

  // Workspace icon upload handler
  const handleIconUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !settingsWorkspaceId || !window.electronAPI) return

      // Validate file type
      const validTypes = [
        'image/png',
        'image/jpeg',
        'image/svg+xml',
        'image/webp',
        'image/gif',
      ]
      if (!validTypes.includes(file.type)) {
        console.error('Invalid file type:', file.type)
        return
      }

      setIsUploadingIcon(true)
      try {
        // Read file as base64
        const buffer = await file.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(buffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            '',
          ),
        )

        // Determine extension from mime type
        const extMap: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/svg+xml': 'svg',
          'image/webp': 'webp',
          'image/gif': 'gif',
        }
        const ext = extMap[file.type] || 'png'

        // Upload to workspace
        await window.electronAPI.writeWorkspaceImage(
          settingsWorkspaceId,
          `./icon.${ext}`,
          base64,
          file.type,
        )

        // Reload the icon locally for settings display
        const iconData = await window.electronAPI.readWorkspaceImage(
          settingsWorkspaceId,
          `./icon.${ext}`,
        )
        if (iconData) {
          if (ext === 'svg' && !iconData.startsWith('data:')) {
            setWsIconUrl(`data:image/svg+xml;base64,${btoa(iconData)}`)
          } else {
            setWsIconUrl(iconData)
          }
        }

        // Refresh workspaces to update sidebar icon
        onRefreshWorkspaces?.()
      } catch (error) {
        console.error('Failed to upload icon:', error)
      } finally {
        setIsUploadingIcon(false)
        // Reset the input so the same file can be selected again
        e.target.value = ''
      }
    },
    [settingsWorkspaceId, onRefreshWorkspaces],
  )

  // Workspace settings handlers
  const handleWorkingDirectorySelected = useCallback(
    async (selectedPath: string) => {
      const saved = await updateWorkspaceSetting(
        'workingDirectory',
        selectedPath,
      )
      if (saved) {
        setWorkingDirectory(selectedPath)
      }
    },
    [updateWorkspaceSetting],
  )

  const {
    pickDirectory: handleChangeWorkingDirectory,
    showServerBrowser: showWdBrowser,
    serverBrowserMode: wdBrowserMode,
    cancelServerBrowser: cancelWdBrowser,
    confirmServerBrowser: confirmWdBrowser,
  } = useDirectoryPicker(handleWorkingDirectorySelected)

  const handleClearWorkingDirectory = useCallback(async () => {
    if (!window.electronAPI) return

    const saved = await updateWorkspaceSetting('workingDirectory', undefined)
    if (saved) {
      setWorkingDirectory('')
    }
  }, [updateWorkspaceSetting])

  const handleLocalMcpEnabledChange = useCallback(
    async (enabled: boolean) => {
      setLocalMcpEnabled(enabled)
      await updateWorkspaceSetting('localMcpEnabled', enabled)
    },
    [updateWorkspaceSetting],
  )

  const handleSourceToggle = useCallback(
    async (slug: string, checked: boolean) => {
      const newSlugs = checked
        ? [...enabledSourceSlugs, slug]
        : enabledSourceSlugs.filter((s) => s !== slug)
      setEnabledSourceSlugs(newSlugs)
      await updateWorkspaceSetting('enabledSourceSlugs', newSlugs)
    },
    [enabledSourceSlugs, updateWorkspaceSetting],
  )

  // Show empty state if no project is available to edit
  if (!settingsWorkspaceId) {
    return (
      <div className="h-full flex flex-col">
        <PanelHeader title={t('settings.workspace.workspaceSettings')} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            {t('settings.workspace.noWorkspaceSelected')}
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoadingWorkspace) {
    return (
      <div className="h-full flex flex-col">
        <PanelHeader title={t('settings.workspace.workspaceSettings')} />
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('settings.workspace.workspaceSettings')} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {/* Project identity — folder is the product boundary (R1 clause 3) */}
              <SettingsSection title={t('settings.workspace.workspaceInfo')}>
                <SettingsCard>
                  <SettingsRow
                    label={t('common.name')}
                    description={wsName || t('settings.workspace.untitled')}
                    action={
                      <button
                        type="button"
                        onClick={() => {
                          setWsNameEditing(wsName)
                          setRenameDialogOpen(true)
                        }}
                        className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors"
                      >
                        {t('common.edit')}
                      </button>
                    }
                  />
                  <SettingsRow
                    label={t('settings.workspace.icon')}
                    action={
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                          onChange={handleIconUpload}
                          className="sr-only"
                          disabled={isUploadingIcon}
                        />
                        <span className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors">
                          {isUploadingIcon
                            ? t('common.uploading')
                            : t('common.change')}
                        </span>
                      </label>
                    }
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full overflow-hidden bg-foreground/5 flex items-center justify-center',
                        'ring-1 ring-border/50',
                      )}
                    >
                      {isUploadingIcon ? (
                        <Spinner className="text-muted-foreground text-[8px]" />
                      ) : wsIconUrl ? (
                        <img
                          src={wsIconUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {wsName?.charAt(0)?.toUpperCase() || 'P'}
                        </span>
                      )}
                    </div>
                  </SettingsRow>
                  <SettingsRow
                    label={t('settings.workspace.location')}
                    description={
                      isRemoteProject
                        ? t('settings.workspace.locationRemote')
                        : t('settings.workspace.locationLocal')
                    }
                  />
                  <SettingsRow
                    label={t('settings.workspace.projectFolder')}
                    description={
                      projectFolder ||
                      t('settings.workspace.projectFolderMissing')
                    }
                  />
                </SettingsCard>

                <RenameDialog
                  open={renameDialogOpen}
                  onOpenChange={setRenameDialogOpen}
                  title={t('settings.workspace.renameWorkspace')}
                  value={wsNameEditing}
                  onValueChange={setWsNameEditing}
                  onSubmit={() => {
                    const newName = wsNameEditing.trim()
                    if (newName && newName !== wsName) {
                      setWsName(newName)
                      updateWorkspaceSetting('name', newName)
                      onRefreshWorkspaces?.()
                    }
                    setRenameDialogOpen(false)
                  }}
                  placeholder={t('settings.workspace.enterWorkspaceName')}
                />
              </SettingsSection>

              {/* Default Sources */}
              <SettingsSection
                title={t('settings.workspace.defaultSources')}
                description={t('settings.workspace.defaultSourcesDesc')}
              >
                {availableSources.length > 0 ? (
                  <SettingsCard>
                    {availableSources.map((source) => (
                      <SettingsToggle
                        key={source.config.slug}
                        label={
                          <span className="inline-flex items-center gap-2">
                            <SourceAvatar source={source} size="xs" />
                            {source.config.name}
                          </span>
                        }
                        description={source.config.tagline}
                        checked={enabledSourceSlugs.includes(
                          source.config.slug,
                        )}
                        onCheckedChange={(checked) =>
                          handleSourceToggle(source.config.slug, checked)
                        }
                      />
                    ))}
                  </SettingsCard>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('settings.workspace.noSourcesConfigured')}
                  </p>
                )}
              </SettingsSection>

              {/* Advanced.
               * Project folder (rootPath) is the R1 boundary shown above. This default
               * working directory is a fallback for creates that still resolve via
               * user_default (legacy paths). New Task in a project binds rootPath directly. */}
              <SettingsSection
                title={t('settings.workspace.advanced')}
                description={t('settings.workspace.advancedDesc')}
              >
                <SettingsCard>
                  <SettingsRow
                    label={t('settings.workspace.defaultWorkingDir')}
                    description={
                      workingDirectory ||
                      (projectFolder
                        ? t('settings.workspace.defaultWorkingDirUsesProject', {
                            path: projectFolder,
                          })
                        : t('settings.workspace.defaultWorkingDirDesc'))
                    }
                    action={
                      <div className="flex items-center gap-2">
                        {workingDirectory && (
                          <button
                            type="button"
                            onClick={handleClearWorkingDirectory}
                            className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors text-foreground/60 hover:text-foreground"
                          >
                            {t('common.clear')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleChangeWorkingDirectory}
                          className="inline-flex items-center h-8 px-3 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors"
                        >
                          {t('common.change')}
                        </button>
                      </div>
                    }
                  />
                  <SettingsToggle
                    label={t('settings.workspace.localMcpServers')}
                    description={t('settings.workspace.localMcpServersDesc')}
                    checked={localMcpEnabled}
                    onCheckedChange={handleLocalMcpEnabledChange}
                  />
                </SettingsCard>
              </SettingsSection>
            </div>
          </div>
        </ScrollArea>
      </div>
      <ServerDirectoryBrowser
        open={showWdBrowser}
        mode={wdBrowserMode}
        onSelect={confirmWdBrowser}
        onCancel={cancelWdBrowser}
        initialPath={workingDirectory || undefined}
      />
    </div>
  )
}
