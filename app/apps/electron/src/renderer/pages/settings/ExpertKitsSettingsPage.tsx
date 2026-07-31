/**
 * ExpertKitsSettingsPage — the single home for the label store.
 *
 * There used to be two settings categories over one `labels/config.json`:
 * "Labels" (this page's CRUD) and a separate read-only "Expert kits" summary.
 * That is the §11.6 violation stated plainly — a second settings category for a
 * surface that already existed — and worse, it left the retired word visible in
 * navigation, so the rename that Decision H21 performed looked like it had not
 * happened. One store, one page.
 *
 * Terminology, per H21: an **expert kit** is a label whose kind resolves to
 * `expert`; the legacy spelling was `identity` and `kind-normalize.ts` is the
 * only place allowed to know that. A **functional label** is the same record
 * without a payload — a plain tag used for filtering. Both are edited here,
 * because they are the same record and splitting the editor would mean deciding
 * up front which kind you are creating.
 *
 * Layout:
 * 1) Hierarchy table (expand/collapse tree) — click row to select
 * 2) Editor for the selected node (name, color, kind, value type, prompt)
 * 3) What the kit carries, when the selection is an expert kit
 * 4) Auto-apply rules table + EditPopover
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, FileText, TriangleAlert } from 'lucide-react'
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
import {
  normalizeLabelKind,
  type NormalizedLabelKind,
} from '@craft-agent/shared/labels/kind-normalize'
import { assessExpertKit, type ExpertKit } from '@craft-agent/shared/labels/expert-kit'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'expert-kits',
}

const COLOR_PRESETS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981', '#06B6D4', '#EC4899', '#64748B',
] as const

export default function ExpertKitsSettingsPage() {
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
        `Fields: name, color, valueType, kind (functional|expert), systemPromptPreset, expertKit. ` +
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
        toast.error(err instanceof Error ? err.message : t('settings.expertKits.saveFailed'))
      } finally {
        setBusy(false)
      }
    },
    [refresh, t],
  )

  const persist = React.useCallback(
    (labelId: string, updates: UpdateLabelInput) => {
      if (!activeWorkspaceId || !window.electronAPI?.updateLabel) {
        toast.error(t('settings.expertKits.saveFailed'))
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
      toast.error(t('settings.expertKits.nameRequired'))
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
      toast.success(t('settings.expertKits.created', { name: created.name }))
    })
  }, [activeWorkspaceId, asChildOfSelected, newName, run, selected, t])

  const handleDelete = React.useCallback(() => {
    if (!selected || !activeWorkspaceId || !window.electronAPI?.deleteLabel) return
    const ok = window.confirm(
      t('settings.expertKits.deleteConfirm', {
        name: getLocalizedLabelName(t, selected),
        id: selected.id,
      }),
    )
    if (!ok) return
    void run(async () => {
      await window.electronAPI.deleteLabel!(activeWorkspaceId, selected.id)
      setSelectedId(null)
      toast.success(t('settings.expertKits.deleted', { name: selected.name }))
    })
  }, [activeWorkspaceId, run, selected, t])

  const openConfigFile = React.useCallback(() => {
    if (!labelsConfigPath) return
    onOpenFile(labelsConfigPath)
  }, [labelsConfigPath, onOpenFile])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('settings.expertKits.title')} />
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
                  <SettingsSection title={t('settings.expertKits.about')}>
                    <SettingsCard className="px-4 py-3.5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {t('settings.expertKits.aboutText1')}{' '}
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
                    title={t('settings.expertKits.hierarchy')}
                    description={t('settings.expertKits.hierarchyDesc')}
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
                          {t('settings.expertKits.add')}
                        </Button>
                        {labelsConfigPath && (
                          <>
                            <EditPopover
                              trigger={<EditButton />}
                              context={agentEditContext}
                              example={
                                selected
                                  ? t('settings.expertKits.editExampleSelected', { id: selected.id })
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
                        <div className="text-sm font-medium">{t('settings.expertKits.addTitle')}</div>
                        <SettingsInput
                          value={newName}
                          onChange={setNewName}
                          placeholder={t('settings.expertKits.addNamePlaceholder')}
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
                            {t('settings.expertKits.addAsChild', {
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
                            {t('settings.expertKits.addConfirm')}
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
                          fullscreenTitle={t('settings.expertKits.hierarchy')}
                          selectedLabelId={selected?.id}
                          onLabelSelect={setSelectedId}
                          showPurposeColumn
                        />
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm">{t('settings.expertKits.noLabels')}</p>
                          <p className="text-xs mt-1 text-foreground/40">
                            {t('settings.expertKits.noLabelsDesc')}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-4"
                            disabled={!activeWorkspaceId}
                            onClick={() => setAdding(true)}
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" />
                            {t('settings.expertKits.add')}
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
                        <span className="text-foreground/40">{t('settings.expertKits.cliHint')}</span>
                      </p>
                    )}
                  </SettingsSection>

                  <SettingsSection
                    title={t('settings.expertKits.autoApplyRules')}
                    description={t('settings.expertKits.autoApplyRulesDesc')}
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
                        fullscreenTitle={t('settings.expertKits.autoApplyRules')}
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
  const kind = normalizeLabelKind(label.kind)
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
          <span>{t('settings.expertKits.liveEditHint')}</span>
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

      <SettingsRow label={t('common.name')} description={t('settings.expertKits.nameDesc')}>
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

      <SettingsRow label={t('common.color')} description={t('settings.expertKits.colorDesc')}>
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

      <SettingsRow label={t('settings.expertKits.kindHeader')} description={t('settings.expertKits.kindDesc')}>
        <div className={disabled ? 'pointer-events-none opacity-50' : undefined}>
          <SettingsSegmentedControl
            value={kind}
            onValueChange={(v) => onPatch({ kind: v as NormalizedLabelKind })}
            options={[
              { value: 'functional', label: t('settings.expertKits.kindFunctional') },
              { value: 'expert', label: t('settings.expertKits.kindExpert') },
            ]}
          />
        </div>
      </SettingsRow>

      <SettingsRow label={t('common.type')} description={t('settings.expertKits.valueTypeDesc')}>
        <SettingsMenuSelect
          value={label.valueType ?? 'none'}
          disabled={disabled}
          menuWidth={240}
          onValueChange={(v) => {
            if (v === 'none') onPatch({ valueType: '' })
            else onPatch({ valueType: v as 'string' | 'number' | 'date' | 'link' })
          }}
          options={[
            { value: 'none', label: t('settings.expertKits.valueTypeNone') },
            { value: 'string', label: t('sidebar.labelValueType.string') },
            { value: 'number', label: t('sidebar.labelValueType.number') },
            { value: 'date', label: t('sidebar.labelValueType.date') },
            { value: 'link', label: t('sidebar.labelValueType.link') },
          ]}
        />
      </SettingsRow>

      {/* Full-width block: SettingsRow truncates long descriptions and squeezes textareas */}
      <div className="space-y-2 border-t border-border/50 px-4 py-3.5">
        <div className="text-sm font-medium">{t('settings.expertKits.promptHeader')}</div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('settings.expertKits.promptDesc')}
        </p>
        <SettingsTextarea
          value={prompt}
          onChange={setPrompt}
          disabled={disabled}
          rows={4}
          placeholder={t('settings.expertKits.promptPlaceholder')}
          onBlur={() => {
            if (prompt === (label.systemPromptPreset ?? '')) return
            onPatch({
              systemPromptPreset: prompt,
              // Writing a prompt is what makes a plain tag into a kit; asking
              // the user to also flip the kind would make the field they just
              // filled in have no effect until they found a second control.
              ...(prompt.trim() && kind !== 'expert' ? { kind: 'expert' as const } : {}),
            })
          }}
        />
      </div>

      {kind === 'expert' && <KitPayload label={label} />}
    </SettingsCard>
  )
}

/**
 * What the kit carries, and whether that is a problem.
 *
 * Shown only for expert kits, because for a functional label the answer is
 * always "nothing" and a row of zeroes reads as a broken feature rather than as
 * a tag doing exactly what a tag does.
 *
 * The size alone does not tell the reader whether a kit is healthy: a routed
 * twenty-skill kit and an unrouted one look identical in a count and behave
 * nothing alike. `assessExpertKit` is the authority on that, and the warning
 * names the fix rather than the symptom — "add routing", not "too many skills",
 * because the budget governs what is *active*, not what the kit may contain
 * (Decision H13).
 */
function KitPayload({ label }: { label: LabelConfig }) {
  const { t } = useTranslation()
  const kit: ExpertKit = {
    labelId: label.id,
    skills: label.expertKit?.skills ?? [],
    sources: label.expertKit?.sources ?? [],
    tools: label.expertKit?.tools ?? [],
    ...(label.expertKit?.requestedPermissionMode
      ? { requestedPermissionMode: label.expertKit.requestedPermissionMode }
      : {}),
  }
  const assessment = assessExpertKit(kit)
  const needsRouting = assessment.suggestion === 'add-skill-routing'

  return (
    <div className="space-y-2 border-t border-border/50 px-4 py-3.5">
      <div className="text-sm font-medium">{t('settings.expertKits.carriesHeader')}</div>
      <p className="text-xs leading-relaxed text-foreground/50">
        {t('settings.expertKits.carries', {
          skills: kit.skills.length,
          tools: kit.tools.length,
          sources: kit.sources.length,
        })}
      </p>
      {needsRouting && (
        // `info` is the reserved warning colour (UI-SPEC §1). A raw amber here
        // would be a seventh colour that no theme controls.
        <div className="flex items-start gap-2 text-xs text-info">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{t('settings.expertKits.loadsEverything')}</span>
        </div>
      )}
      <p className="text-xs leading-relaxed text-foreground/40">
        {t('settings.expertKits.payloadHint')}
      </p>
    </div>
  )
}
