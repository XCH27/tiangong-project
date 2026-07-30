import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronDown, Image as ImageIcon } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { ConnectionIcon } from '@/components/icons/ConnectionIcon'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { cn } from '@/lib/utils'
import * as storage from '@/lib/local-storage'
import { navigate, routes } from '@/lib/navigate'
import {
  isCompatProvider,
  modelSupportsImages,
  resolveEffectiveConnectionSlug,
} from '@config/llm-connections'
import { ANTHROPIC_MODELS, getModelDisplayName } from '@config/models'
import { derivePickerMode } from './picker-mode'
import {
  buildModelPickerGroups,
  formatTokenCount,
  getConnectionModels,
  stripPiPrefixForDisplay,
  type ModelPickerItem,
} from './model-picker-helpers'
import { ModelPickerList } from './ModelPickerList'
import { useModelVisionToggle } from './useModelVisionToggle'

interface CompactModelSelectorProps {
  currentModel: string
  currentConnection?: string
  onModelChange: (model: string, connection?: string) => void
  onConnectionChange?: (connectionSlug: string) => void
  isEmptySession?: boolean
  connectionUnavailable?: boolean
  contextStatus?: {
    isCompacting?: boolean
    inputTokens?: number
    contextWindow?: number
  }
}

export function CompactModelSelector({
  currentModel,
  currentConnection,
  onModelChange,
  onConnectionChange,
  isEmptySession = false,
  connectionUnavailable = false,
  contextStatus,
}: CompactModelSelectorProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const appShellCtx = useOptionalAppShellContext()
  const llmConnections = React.useMemo(
    () => appShellCtx?.llmConnections ?? [],
    [appShellCtx?.llmConnections],
  )
  const workspaceDefaultConnection = appShellCtx?.workspaceDefaultLlmConnection
  const toggleVision = useModelVisionToggle()

  const effectiveConnection = resolveEffectiveConnectionSlug(
    currentConnection,
    workspaceDefaultConnection,
    llmConnections,
  )
  const effectiveConnectionDetails = React.useMemo(
    () =>
      llmConnections.find(
        (connection) => connection.slug === effectiveConnection,
      ) ?? null,
    [effectiveConnection, llmConnections],
  )
  const connectionDefaultModel = React.useMemo(() => {
    const connection = effectiveConnectionDetails
    if (!connection || !isCompatProvider(connection.providerType)) return null
    if (connection.models && connection.models.length > 1) return null
    return connection.defaultModel ?? null
  }, [effectiveConnectionDetails])
  const pickerMode = derivePickerMode({
    connectionUnavailable,
    connectionDefaultModel,
    isEmptySession,
    connectionCount: llmConnections.length,
  })
  const availableModels = React.useMemo(() => {
    if (connectionUnavailable) return []
    if (!effectiveConnectionDetails) return ANTHROPIC_MODELS
    return getConnectionModels(effectiveConnectionDetails)
  }, [connectionUnavailable, effectiveConnectionDetails])
  const currentModelDisplayName = React.useMemo(() => {
    const modelToDisplay = connectionDefaultModel ?? currentModel
    const model = availableModels.find((entry) =>
      typeof entry === 'string'
        ? entry === modelToDisplay
        : entry.id === modelToDisplay,
    )
    if (!model)
      return stripPiPrefixForDisplay(getModelDisplayName(modelToDisplay))
    return typeof model === 'string'
      ? stripPiPrefixForDisplay(model)
      : (model.name ?? stripPiPrefixForDisplay(model.id))
  }, [availableModels, connectionDefaultModel, currentModel])

  const allGroups = React.useMemo(
    () => buildModelPickerGroups(llmConnections),
    [llmConnections],
  )
  const visibleGroups = React.useMemo(
    () =>
      pickerMode === 'switcher'
        ? allGroups
        : allGroups.filter(
            (group) => group.connection.slug === effectiveConnection,
          ),
    [allGroups, effectiveConnection, pickerMode],
  )
  const showConnectionIcon =
    !!effectiveConnectionDetails &&
    storage.get(storage.KEYS.showConnectionIcons, true)

  const handleSelect = React.useCallback(
    (connectionSlug: string, modelId: string) => {
      if (connectionSlug !== effectiveConnection && onConnectionChange) {
        onConnectionChange(connectionSlug)
      }
      onModelChange(modelId, connectionSlug)
      setOpen(false)
    },
    [effectiveConnection, onConnectionChange, onModelChange],
  )

  const renderVisionAction = React.useCallback(
    (item: ModelPickerItem) => {
      if (!isCompatProvider(item.connection.providerType)) return null
      const enabled = modelSupportsImages(item.connection, item.modelId)
      return (
        <VisionToggle
          visionOn={enabled}
          onToggle={(event) => {
            event.preventDefault()
            event.stopPropagation()
            toggleVision(item.connection.slug, item.modelId, !enabled)
          }}
        />
      )
    },
    [toggleVision],
  )

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label={
            connectionUnavailable
              ? t('common.unavailable')
              : `${t('common.model')}: ${currentModelDisplayName}`
          }
          className={cn(
            'flex h-7 min-w-[64px] shrink items-center gap-1.5 rounded-[6px] bg-foreground/5 px-2 text-xs font-medium text-foreground/70 outline-none',
            connectionUnavailable && 'bg-destructive/10 text-destructive',
          )}
        >
          {connectionUnavailable ? (
            <>
              <AlertCircle className="size-3.5" />
              <span>{t('common.unavailable')}</span>
            </>
          ) : (
            <>
              {showConnectionIcon && effectiveConnectionDetails && (
                <ConnectionIcon
                  connection={effectiveConnectionDetails}
                  size={14}
                />
              )}
              <span className="min-w-0 truncate">
                {currentModelDisplayName}
              </span>
              {pickerMode !== 'locked-single' && (
                <ChevronDown className="size-3 shrink-0 opacity-50" />
              )}
            </>
          )}
        </button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('common.model')}</DrawerTitle>
        </DrawerHeader>
        {pickerMode === 'unavailable' ? (
          <div className="flex flex-col items-center px-4 pb-6 pt-2 text-center">
            <AlertCircle className="mb-2 size-8 text-destructive" />
            <div className="mb-1 text-sm font-medium">
              {t('chat.connectionUnavailable')}
            </div>
            <div className="mb-3 text-xs text-muted-foreground">
              {t('chat.connectionUnavailableDescription')}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate(routes.view.settings('ai'))
              }}
              className="text-xs text-foreground/70 underline hover:text-foreground"
            >
              {t('chat.modelPicker.openAiSettings')}
            </button>
          </div>
        ) : (
          <ModelPickerList
            groups={visibleGroups}
            currentConnection={effectiveConnection}
            currentModel={connectionDefaultModel ?? currentModel}
            onSelect={handleSelect}
            renderItemAction={renderVisionAction}
            onManageModels={() => {
              setOpen(false)
              navigate(routes.view.settings('ai'))
            }}
            className="max-h-[55vh]"
          />
        )}

        {contextStatus?.inputTokens != null &&
          contextStatus.inputTokens > 0 && (
            <div className="mx-2 flex items-center justify-between border-t border-border/60 px-2 py-2 text-xs text-foreground/50">
              <span>{t('chat.context')}</span>
              <span className="flex items-center gap-1.5">
                {contextStatus.isCompacting && <Spinner className="size-3" />}
                {t('chat.tokensUsed', {
                  displayCount: formatTokenCount(contextStatus.inputTokens),
                })}
              </span>
            </div>
          )}
      </DrawerContent>
    </Drawer>
  )
}

function VisionToggle({
  visionOn,
  onToggle,
}: {
  visionOn: boolean
  onToggle: (event: React.MouseEvent | React.KeyboardEvent) => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={
        visionOn
          ? t('chat.modelPicker.supportsImagesOn')
          : t('chat.modelPicker.supportsImagesOff')
      }
      className="inline-flex size-7 items-center justify-center rounded-[6px] hover:bg-foreground/5"
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onToggle(event)
      }}
    >
      <ImageIcon
        className={cn(
          'size-3.5',
          visionOn ? 'text-foreground/70' : 'text-foreground/30',
        )}
      />
    </button>
  )
}
