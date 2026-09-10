/**
 * LabelsSettingsPage
 *
 * One authority: labels/config.json (Craft tree).
 * R1: Settings creates / renames / colors / deletes definitions.
 * E10: identity = kind + systemPromptPreset inject; Skill/Source/permission binds not implemented.
 *
 * Layout:
 * 1) Craft hierarchy table (expand/collapse tree) — click row to select
 * 2) Editor for selected node (name, color, purpose, value type, role prompt)
 * 3) Auto-apply rules table + EditPopover
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, FileText } from 'lucide-react'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover'
import { getDocUrl } from '@craft-agent/shared/docs/doc-links'
import { useAppShellContext, useActiveWorkspace } from '@/context/AppShellContext'
import { useLabels } from '@/hooks/useLabels'
import { LabelsDataTable, AutoRulesDataTable } from '@/components/info'
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsInput,
  SettingsMenuSelect,
  SettingsSegmentedControl,
  SettingsTextarea,
} from '@/components/settings'
import { InlineColorPickerRow } from '@/components/ui/inline-color-picker-row'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import { getLocalizedLabelName } from '@/utils/label-display-name'
import { resolveEntityColor } from '@craft-agent/shared/colors'
import { useTheme } from '@/context/ThemeContext'
import type {
  CreateLabelInput,
  LabelConfig,
  UpdateLabelInput,
} from '@craft-agent/shared/labels'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'labels',
}

const COLOR_PRESETS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#06B6D4', '#EC4899', '#64748B',
] as const

export default function LabelsSettingsPage() {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const { activeWorkspaceId, onOpenFile } = useAppShellContext()
  const activeWorkspace = useActiveWorkspace()
  const { labels, flatLabels, isLoading, refresh } = useLabels(activeWorkspaceId)

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [newName, setNewName] = React.useState('')
  /** Create under currently selected node (tree parent) */
  const [asChildOfSelected, setAsChildOfSelected] = React.useState(false)

  const selected = React.useMemo(
    () => flatLabels.find((l) => l.id === selectedId) ?? null,
    [flatLabels, selectedId],
  )

  React.useEffect(() => {
    if (!flatLabels.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !flatLabels.some((l) => l.id === selectedId)) {
      setSelectedId(flatLabels[0].id)
    }
  }, [flatLabels, selectedId])

  const rootPath = activeWorkspace?.rootPath || ''
  const labelsConfigPath = rootPath ? `${rootPath}/labels/config.json` : null
  const labelsEditConfig = getEditConfig('edit-labels', rootPath)
  const autoRulesEditConfig = getEditConfig('edit-auto-rules', rootPath)

  const editFileAction = labelsConfigPath
    ? { label: t('common.editFile'), filePath: labelsConfigPath }
    : undefined

  const agentEditContext = React.useMemo(() => {
    if (!selected) return labelsEditConfig.context
    return {
      ...labelsEditConfig.context,
      context:
        `${labelsEditConfig.context.context ?? ''}\n\n` +
        `User selected label id="${selected.id}" (name="${selected.name}"). ` +
        `Update this node only unless asked to restructure the tree. ` +
        `Fields: name, color, valueType, kind (functional|identity), systemPromptPreset. ` +
        `Hierarchy uses children[]; prefer craft-agent label for create/move/delete. ` +
        `Do not invent skill/source/permission binding fields.`,
    }
  }, [labelsEditConfig.context, selected])

  const run = React.useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true)
      try {
        await fn()
        await refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('settings.labels.saveFailed'))
      } finally {
        setBusy(false)
      }
    },
    [refresh, t],
  )

  const persist = React.useCallback(
    (labelId: string, updates: UpdateLabelInput) => {
      if (!activeWorkspaceId || !window.electronAPI?.updateLabel) {
        toast.error(t('settings.labels.saveFailed'))
        return
      }
      void run(async () => {
        await window.electronAPI.updateLabel!(activeWorkspaceId, labelId, updates)
      })
    },
    [activeWorkspaceId, run, t],
  )

  const handleCreate = React.useCallback(() => {
    if (!activeWorkspaceId || !window.electronAPI?.createLabel) return
    const name = newName.trim()
    if (!name) {
      toast.error(t('settings.labels.nameRequired'))
      return
    }
    void run(async () => {
      const input: CreateLabelInput = {
        name,
        color: { light: COLOR_PRESETS[0], dark: COLOR_PRESETS[0] },
        ...(asChildOfSelected && selected ? { parentId: selected.id } : {}),
      }
      const created = await window.electronAPI.createLabel!(activeWorkspaceId, input)
      setSelectedId(created.id)
      setAdding(false)
      setNewName('')
      setAsChildOfSelected(false)
      toast.success(t('settings.labels.created', { name: created.name }))
    })
  }, [activeWorkspaceId, asChildOfSelected, newName, run, selected, t])

  const handleDelete = React.useCallback(() => {
    if (!selected || !activeWorkspaceId || !window.electronAPI?.deleteLabel) return
    const ok = window.confirm(
      t('settings.labels.deleteConfirm', {
        name: getLocalizedLabelName(t, selected),
        id: selected.id,
      }),
    )
    if (!ok) return
    void run(async () => {
      await window.electronAPI.deleteLabel!(activeWorkspaceId, selected.id)
      setSelectedId(null)
      toast.success(t('settings.labels.deleted', { name: selected.name }))
    })
  }, [activeWorkspaceId, run, selected, t])

  const openConfigFile = React.useCallback(() => {
    if (!labelsConfigPath) return
    onOpenFile(labelsConfigPath)
  }, [labelsConfigPath, onOpenFile])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('settings.labels.title')} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <SettingsSection title={t('settings.labels.aboutLabels')}>
                    <SettingsCard className="px-4 py-3.5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('settings.labels.aboutText1')}{' '}
                        <button
                          type="button"
                          onClick={() => window.electronAPI?.openUrl(getDocUrl('labels'))}
                          className="text-foreground/70 hover:text-foreground underline underline-offset-2"
                        >
                          {t('chat.learnMore')}
                        </button>
                      </p>
                    </SettingsCard>
                  </SettingsSection>

                  <SettingsSection
                    title={t('settings.labels.labelHierarchy')}
                    description={t('settings.labels.labelHierarchyDesc')}
                    action={
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2"
                          disabled={busy || !activeWorkspaceId}
                          onClick={() => setAdding((v) => !v)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {t('settings.labels.add')}
                        </Button>
                        {labelsConfigPath && (
                          <>
                            <EditPopover
                              trigger={<EditButton />}
                              context={agentEditContext}
                              example={
                                selected
                                  ? t('settings.labels.editExampleSelected', { id: selected.id })
                                  : labelsEditConfig.example
                              }
                              displayLabel={labelsEditConfig.displayLabel}
                              model={labelsEditConfig.model}
                              systemPromptPreset={labelsEditConfig.systemPromptPreset}
                              secondaryAction={editFileAction}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 px-2"
                              onClick={openConfigFile}
                              title={t('common.editFile')}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    }
                  >
                    {adding && (
                      <SettingsCard className="mb-3 p-4 space-y-3">
                        <div className="text-sm font-medium">{t('settings.labels.addTitle')}</div>
                        <SettingsInput
                          value={newName}
                          onChange={setNewName}
                          placeholder={t('settings.labels.addNamePlaceholder')}
                          disabled={busy}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate()
                            if (e.key === 'Escape') {
                              setAdding(false)
                              setNewName('')
                            }
                          }}
                        />
                        {selected && (
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-border"
                              checked={asChildOfSelected}
                              onChange={(e) => setAsChildOfSelected(e.target.checked)}
                            />
                            {t('settings.labels.addAsChild', {
                              name: getLocalizedLabelName(t, selected),
                            })}
                          </label>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              setAdding(false)
                              setNewName('')
                              setAsChildOfSelected(false)
                            }}
                          >
                            {t('common.cancel')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={busy || !newName.trim()}
                            onClick={handleCreate}
                          >
                            {t('settings.labels.addConfirm')}
                          </Button>
                        </div>
                      </SettingsCard>
                    )}

                    <SettingsCard className="p-0">
                      {labels.length > 0 ? (
                        <LabelsDataTable
                          data={labels}
                          searchable
                          maxHeight={320}
                          fullscreen
                          fullscreenTitle={t('settings.labels.labelHierarchy')}
                          selectedLabelId={selected?.id}
                          onLabelSelect={setSelectedId}
                          showPurposeColumn
                        />
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm">{t('settings.labels.noLabels')}</p>
                          <p className="text-xs mt-1 text-foreground/40">
                            {t('settings.labels.noLabelsDesc')}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-4"
                            disabled={!activeWorkspaceId}
                            onClick={() => setAdding(true)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            {t('settings.labels.add')}
                          </Button>
                        </div>
                      )}
                    </SettingsCard>

                    {selected && (
                      <div className="mt-3">
                        <LabelEditor
                          key={selected.id}
                          label={selected}
                          disabled={busy}
                          isDark={isDark}
                          onPatch={(updates) => persist(selected.id, updates)}
                          onDelete={handleDelete}
                        />
                      </div>
                    )}

                    {labelsConfigPath && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        <button
                          type="button"
                          onClick={openConfigFile}
                          className="font-mono text-foreground/50 hover:text-foreground underline underline-offset-2"
                        >
                          {labelsConfigPath}
                        </button>
                        <span className="mx-1.5 text-foreground/30">·</span>
                        <span className="text-foreground/40">{t('settings.labels.cliHint')}</span>
                      </p>
                    )}
                  </SettingsSection>

                  <SettingsSection
                    title={t('settings.labels.autoApplyRules')}
                    description={t('settings.labels.autoApplyRulesDesc')}
                    action={
                      labelsConfigPath ? (
                        <EditPopover
                          trigger={<EditButton />}
                          context={autoRulesEditConfig.context}
                          example={autoRulesEditConfig.example}
                          displayLabel={autoRulesEditConfig.displayLabel}
                          model={autoRulesEditConfig.model}
                          systemPromptPreset={autoRulesEditConfig.systemPromptPreset}
                          secondaryAction={editFileAction}
                        />
                      ) : undefined
                    }
                  >
                    <SettingsCard className="p-0">
                      <AutoRulesDataTable
                        data={labels}
                        searchable
                        maxHeight={300}
                        fullscreen
                        fullscreenTitle={t('settings.labels.autoApplyRules')}
                      />
                    </SettingsCard>
                  </SettingsSection>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function LabelEditor({
  label,
  disabled,
  isDark,
  onPatch,
  onDelete,
}: {
  label: LabelConfig
  disabled?: boolean
  isDark: boolean
  onPatch: (updates: UpdateLabelInput) => void
  onDelete: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = React.useState(label.name)
  const [prompt, setPrompt] = React.useState(label.systemPromptPreset ?? '')
  const kind = label.kind === 'identity' ? 'identity' : 'functional'
  const hex = label.color
    ? resolveEntityColor(label.color, isDark) || COLOR_PRESETS[0]
    : COLOR_PRESETS[0]

  React.useEffect(() => {
    setName(label.name)
    setPrompt(label.systemPromptPreset ?? '')
  }, [label])

  return (
    <SettingsCard className="p-0">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
        <div className="min-w-0 text-xs text-muted-foreground">
          <span className="font-mono">#{label.id}</span>
          <span className="mx-1.5 text-foreground/20">·</span>
          <span>{t('settings.labels.liveEditHint')}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {disabled && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-destructive hover:text-destructive"
            disabled={disabled}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <SettingsRow label={t('common.name')} description={t('settings.labels.nameDesc')}>
        <SettingsInput
          value={name}
          onChange={setName}
          disabled={disabled}
          className="w-52"
          onBlur={() => {
            const next = name.trim()
            if (next && next !== label.name) onPatch({ name: next })
            else setName(label.name)
          }}
        />
      </SettingsRow>

      <SettingsRow label={t('common.color')} description={t('settings.labels.colorDesc')}>
        <InlineColorPickerRow
          value={hex}
          presets={COLOR_PRESETS}
          onChange={(h) => {
            if (disabled) return
            onPatch({ color: { light: h, dark: h } })
          }}
          onClear={label.color ? () => onPatch({ color: null }) : undefined}
          clearLabel={t('common.clear')}
        />
      </SettingsRow>

      <SettingsRow label={t('common.type')} description={t('settings.labels.valueTypeDesc')}>
        <SettingsMenuSelect
          value={label.valueType ?? 'none'}
          disabled={disabled}
          menuWidth={240}
          onValueChange={(v) => {
            if (v === 'none') onPatch({ valueType: '' })
            else onPatch({ valueType: v as 'string' | 'number' | 'date' | 'link' })
          }}
          options={[
            { value: 'none', label: t('settings.labels.valueTypeNone') },
            { value: 'string', label: t('sidebar.labelValueType.string') },
            { value: 'number', label: t('sidebar.labelValueType.number') },
            { value: 'date', label: t('sidebar.labelValueType.date') },
            { value: 'link', label: t('sidebar.labelValueType.link') },
          ]}
        />
      </SettingsRow>

      {/* Full-width block: SettingsRow truncates long descriptions and squeezes textareas */}
    </SettingsCard>
  )
}
