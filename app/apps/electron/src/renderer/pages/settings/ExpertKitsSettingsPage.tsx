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
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
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
  SettingsToggle,
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
import {
  KIT_CATEGORIES,
  summarizeKitCard,
  type KitListing,
} from '@craft-agent/shared/labels/kit-gallery'
import { EXAMPLE_KITS } from '@craft-agent/shared/labels/example-kits'
import { cn } from '@/lib/utils'
import { resolveKitCatalog } from '@craft-agent/shared/labels/kit-resolve'
import type { LoadedSkill } from '@craft-agent/shared/skills'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'expert-kits',
}

/**
 * A skill's tier is its scope, and the words have to say so plainly — "global"
 * means every workspace on this machine, not "the default one".
 */
const SKILL_SCOPE_KEY: Record<LoadedSkill['source'], string> = {
  global: 'settings.expertKits.scopeGlobal',
  workspace: 'settings.expertKits.scopeWorkspace',
  project: 'settings.expertKits.scopeProject',
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

  const [installedSkills, setInstalledSkills] = React.useState<LoadedSkill[]>([])
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

  // A kit's declared skill slugs mean nothing without the installed set to
  // resolve them against, so the page loads it and follows changes — a skill
  // added on disk must make a kit's "not installed" warning disappear without a
  // restart, or the warning teaches users to distrust it.
  const refreshSkills = React.useCallback(() => {
    if (!activeWorkspaceId) {
      setInstalledSkills([])
      return
    }
    void window.electronAPI
      .getSkills(activeWorkspaceId)
      .then((skills) => setInstalledSkills(skills ?? []))
      .catch(() => setInstalledSkills([]))
  }, [activeWorkspaceId])

  React.useEffect(() => {
    refreshSkills()
    if (!activeWorkspaceId) return
    // A move rewrites files the watcher also reports, so the explicit refresh
    // after a move and this subscription can both fire. Re-reading is cheap and
    // idempotent; missing the update is not.
    const unsubscribe = window.electronAPI.onSkillsChanged?.((changedWorkspaceId, skills) => {
      if (changedWorkspaceId === activeWorkspaceId) setInstalledSkills(skills ?? [])
    })
    return () => unsubscribe?.()
  }, [activeWorkspaceId, refreshSkills])

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
                  <KitGallery
                    installedKits={flatLabels.filter((l) => normalizeLabelKind(l.kind) === 'expert')}
                    installedSkills={installedSkills}
                    busy={busy}
                    onInstalled={(labelId) => {
                      setSelectedId(labelId)
                      refresh()
                      refreshSkills()
                    }}
                    onSelectInstalled={setSelectedId}
                  />

                  {selected && normalizeLabelKind(selected.kind) === 'expert' ? (
                    <SettingsSection
                      title={getLocalizedLabelName(t, selected)}
                      description={t('settings.expertKits.editorDesc')}
                    >
                      <KitEditor
                        key={selected.id}
                        label={selected}
                        disabled={busy}
                        installedSkills={installedSkills}
                        onPatch={(updates) => persist(selected.id, updates)}
                        onDelete={handleDelete}
                        onSkillsChanged={refreshSkills}
                      />
                    </SettingsSection>
                  ) : null}

                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function KitEditor({
  label,
  disabled,
  installedSkills,
  onPatch,
  onDelete,
  onSkillsChanged,
}: {
  label: LabelConfig
  disabled?: boolean
  installedSkills: readonly LoadedSkill[]
  onPatch: (updates: UpdateLabelInput) => void
  onDelete: () => void
  onSkillsChanged: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = React.useState(label.name)
  const [prompt, setPrompt] = React.useState(label.systemPromptPreset ?? '')
  const kind = normalizeLabelKind(label.kind)

  React.useEffect(() => {
    setName(label.name)
    setPrompt(label.systemPromptPreset ?? '')
    // Sync drafts only when a different label is shown. Depending on the label
    // object itself would reset in-progress typing on every live-edit update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label.id])

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

      {(
        <KitPayload
          label={label}
          installedSkills={installedSkills}
          disabled={disabled}
          onPatch={onPatch}
          onSkillsChanged={onSkillsChanged}
        />
      )}
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
function KitPayload({
  label,
  installedSkills,
  disabled,
  onPatch,
  onSkillsChanged,
}: {
  label: LabelConfig
  installedSkills: readonly LoadedSkill[]
  disabled?: boolean
  onPatch: (updates: UpdateLabelInput) => void
  onSkillsChanged: () => void
}) {
  const { t } = useTranslation()

  // Resolve before measuring. This block used to assess `expertKit?.skills ?? []`
  // directly, which no write path could ever fill, so the verdict below was a
  // confident statement about an always-empty value (H36). It now measures what
  // the declared slugs actually resolve to against the installed skills.
  const { catalog, unresolved } = resolveKitCatalog(label.expertKit?.skills, installedSkills)
  const kit: ExpertKit = {
    labelId: label.id,
    skills: catalog.map((skill) => skill.id),
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
      {unresolved.length > 0 && (
        // Naming them is the point. A kit that silently carries fewer skills
        // than it declares reads as a specialist that cannot do its job, and
        // the missing file is the last place anyone looks.
        <div className="flex items-start gap-2 text-xs text-info">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            {t('settings.expertKits.skillsNotInstalled', {
              count: unresolved.length,
              names: unresolved.join('、'),
            })}
          </span>
        </div>
      )}
      {needsRouting && (
        // `info` is the reserved warning colour (UI-SPEC §1). A raw amber here
        // would be a seventh colour that no theme controls.
        <div className="flex items-start gap-2 text-xs text-info">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          <span>{t('settings.expertKits.loadsEverything')}</span>
        </div>
      )}
      <KitSkillsPicker
        label={label}
        installedSkills={installedSkills}
        unresolved={unresolved}
        disabled={disabled}
        onPatch={onPatch}
        onSkillsChanged={onSkillsChanged}
      />
      <p className="text-xs leading-relaxed text-foreground/40">
        {t('settings.expertKits.payloadHint')}
      </p>
    </div>
  )
}

/**
 * The kit gallery — what a kit is, shown rather than described.
 *
 * This replaced a card of prose explaining the concept. A person deciding
 * whether they want an expert kit is not helped by a definition; they are
 * helped by seeing a Code review kit that carries eight skills, and installing
 * it.
 *
 * Two counted tabs rather than two pages, and the retired second-level detail
 * page is deliberate: everything about a listing that matters on the decision —
 * what it carries, whether it routes, who published it — belongs on the card,
 * and a listing whose card cannot say that has a card problem, not a missing
 * page.
 *
 * The gallery source is what Fleet actually ships (`EXAMPLE_KITS`) plus what is
 * installed. There is no remote registry, and inventing listings that cannot be
 * installed would make the whole surface a mockup.
 */
function KitGallery({
  installedKits,
  installedSkills,
  busy,
  onInstalled,
  onSelectInstalled,
}: {
  installedKits: readonly LabelConfig[]
  installedSkills: readonly LoadedSkill[]
  busy: boolean
  onInstalled: (labelId: string) => void
  onSelectInstalled: (labelId: string) => void
}) {
  const { t } = useTranslation()
  const { activeWorkspaceId } = useAppShellContext()
  const [tab, setTab] = React.useState<'gallery' | 'installed'>('gallery')
  const [category, setCategory] = React.useState<string>('all')
  const [installing, setInstalling] = React.useState<string | null>(null)

  const installedNames = React.useMemo(
    () => new Set(installedKits.map((kit) => kit.name.toLowerCase())),
    [installedKits],
  )

  const listings = React.useMemo<KitListing[]>(
    () =>
      EXAMPLE_KITS.map((kit) => ({
        id: kit.id,
        name: kit.name,
        description: kit.audience.join(' · '),
        version: '1.0.0',
        categories: [],
        skills: kit.skills,
        installed: installedNames.has(kit.name.toLowerCase()),
      })),
    [installedNames],
  )

  const install = React.useCallback(
    async (listing: KitListing) => {
      if (!activeWorkspaceId) return
      const api = window.electronAPI.installKit
      if (!api) return
      setInstalling(listing.id)
      try {
        const result = await api(activeWorkspaceId, listing.name, [...listing.skills])
        if (result?.ok) {
          toast.success(
            t('settings.expertKits.installed', {
              name: listing.name,
              count: result.skillsWritten.length,
            }),
          )
          onInstalled(result.label.id)
          setTab('installed')
        } else {
          toast.error(result?.message ?? t('settings.expertKits.saveFailed'))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('settings.expertKits.saveFailed'))
      } finally {
        setInstalling(null)
      }
    },
    [activeWorkspaceId, onInstalled, t],
  )

  const visible = tab === 'gallery' ? listings : []

  return (
    <div className="space-y-3">
      {/* Counted tabs. The count is the point — an empty gallery should say so
          on the tab, not by looking broken once you click it. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {(
            [
              ['gallery', t('settings.expertKits.galleryTab'), listings.length],
              ['installed', t('settings.expertKits.installedTab'), installedKits.length],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                tab === id ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground/70',
              )}
            >
              {label}
              <span className="rounded-[4px] bg-foreground/[0.07] px-1.5 text-xs tabular-nums text-foreground/60">
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'gallery' && (
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'all', labelKey: 'settings.expertKits.categoryAll' }, ...KIT_CATEGORIES].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                'rounded-[6px] px-2 py-1 text-xs transition-colors',
                category === cat.id
                  ? 'bg-foreground/[0.07] text-foreground'
                  : 'text-foreground/50 hover:bg-foreground/[0.05] hover:text-foreground/70',
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      )}

      {tab === 'installed' ? (
        installedKits.length === 0 ? (
          <p className="py-6 text-center text-sm text-foreground/40">
            {t('settings.expertKits.noneInstalled')}
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {installedKits.map((kit) => {
              const { catalog, unresolved } = resolveKitCatalog(kit.expertKit?.skills, installedSkills)
              return (
                <button
                  key={kit.id}
                  type="button"
                  onClick={() => onSelectInstalled(kit.id)}
                  className="rounded-[8px] border border-border/60 bg-foreground/[0.02] p-3 text-left transition-colors hover:bg-foreground/[0.05]"
                >
                  <div className="truncate text-sm font-medium">{getLocalizedLabelName(t, kit)}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-foreground/50">
                    <span>{t('settings.expertKits.skillCount', { count: catalog.length })}</span>
                    {unresolved.length > 0 && (
                      <span className="text-info">
                        {t('settings.expertKits.missingCount', { count: unresolved.length })}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {visible.map((listing) => {
            const summary = summarizeKitCard(listing)
            return (
              <div
                key={listing.id}
                className="rounded-[8px] border border-border/60 bg-foreground/[0.02] p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{listing.name}</div>
                    <div className="truncate text-xs text-foreground/50">{listing.description}</div>
                  </div>
                  {/* The action says what happens, not what the state is —
                      "installed" tells a reader nothing they can act on. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || listing.installed || installing === listing.id}
                    onClick={() => void install(listing)}
                  >
                    {listing.installed
                      ? t('settings.expertKits.alreadyInstalled')
                      : installing === listing.id
                        ? t('settings.expertKits.installing')
                        : t('settings.expertKits.install')}
                  </Button>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-foreground/50">
                  <span>{t('settings.expertKits.skillCount', { count: summary.skillCount })}</span>
                  <span className="text-foreground/30">·</span>
                  <span>v{listing.version}</span>
                  {summary.warning === 'loads-everything' && (
                    <span className="text-info">{t('settings.expertKits.loadsEverything')}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * A skill's scope, shown where it matters and changeable there.
 *
 * The badge was read-only, which left "make this one global" with no answer
 * anywhere in the product. Moving is a real file operation, so the menu reports
 * what happened rather than assuming: a refusal ("a skill with that name is
 * already there") is an answer this surface renders, and a move that leaves the
 * global scope says so, because `~/.agents/skills` is shared with other agent
 * tools on this machine and they lose the skill too.
 */
function SkillScopeMenu({
  skill,
  disabled,
  onMoved,
}: {
  skill: LoadedSkill
  disabled?: boolean
  onMoved: () => void
}) {
  const { t } = useTranslation()
  const { activeWorkspaceId } = useAppShellContext()
  const [busy, setBusy] = React.useState(false)

  const move = React.useCallback(
    async (to: LoadedSkill['source']) => {
      if (!activeWorkspaceId || to === skill.source) return
      const api = window.electronAPI.moveSkillScope
      if (!api) return
      setBusy(true)
      try {
        const result = await api(activeWorkspaceId, skill.slug, skill.source, to)
        if (result?.ok) toast.success(result.message)
        else toast.error(result?.message ?? t('settings.expertKits.saveFailed'))
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('settings.expertKits.saveFailed'))
      } finally {
        setBusy(false)
        onMoved()
      }
    },
    [activeWorkspaceId, onMoved, skill.slug, skill.source, t],
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled || busy}>
        <button
          type="button"
          // Sibling control, never nested inside the toggle's own hit area.
          onClick={(event) => event.stopPropagation()}
          className="shrink-0 rounded-[4px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
            {t(SKILL_SCOPE_KEY[skill.source])}
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {(['global', 'workspace', 'project'] as const).map((scope) => (
          <DropdownMenuItem
            key={scope}
            disabled={scope === skill.source}
            onSelect={() => void move(scope)}
          >
            {t(SKILL_SCOPE_KEY[scope])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * The picker that makes a kit authorable without opening a JSON file.
 *
 * Until the write path opened (H38) the payload could only be edited by hand in
 * `labels/config.json`, and the page said so. A control the product tells you to
 * work around is not a control, so the skills a kit carries are chosen here —
 * against the skills that are actually installed, which is the same set the kit
 * resolves against at runtime. Sources and tools keep their existing hand-edit
 * path until they have a resolver of their own; claiming a picker for them here
 * would promise a binding that does not exist yet.
 *
 * A declared slug whose skill is not installed keeps its row, with a way to drop
 * it. Silently removing it on load would rewrite the user's file behind their
 * back, and a kit authored on another machine would quietly lose half itself the
 * first time this page opened.
 */
function KitSkillsPicker({
  label,
  installedSkills,
  unresolved,
  disabled,
  onPatch,
  onSkillsChanged,
}: {
  label: LabelConfig
  installedSkills: readonly LoadedSkill[]
  unresolved: readonly string[]
  disabled?: boolean
  onPatch: (updates: UpdateLabelInput) => void
  onSkillsChanged: () => void
}) {
  const { t } = useTranslation()
  const declared = React.useMemo(
    () => label.expertKit?.skills ?? [],
    [label.expertKit?.skills],
  )
  const selected = React.useMemo(() => new Set(declared), [declared])

  // The payload is replaced whole on update, so every patch carries the fields
  // this control does not own. Sending only `skills` would clear sources, tools
  // and the requested mode — the cost of whole-object replace, paid here rather
  // than by making "remove the last skill" unexpressible.
  const patchSkills = React.useCallback(
    (nextSkills: string[]) => {
      onPatch({
        expertKit: {
          skills: nextSkills,
          ...(label.expertKit?.sources ? { sources: label.expertKit.sources } : {}),
          ...(label.expertKit?.tools ? { tools: label.expertKit.tools } : {}),
          ...(label.expertKit?.requestedPermissionMode
            ? { requestedPermissionMode: label.expertKit.requestedPermissionMode }
            : {}),
        },
      })
    },
    [label.expertKit, onPatch],
  )

  return (
    <div className="space-y-1.5 pt-1">
      <div className="text-sm font-medium">{t('settings.expertKits.skillsHeader')}</div>
      <p className="text-xs leading-relaxed text-foreground/50">
        {t('settings.expertKits.skillsDesc')}
      </p>

      {installedSkills.length === 0 && unresolved.length === 0 ? (
        <p className="py-1 text-xs leading-relaxed text-foreground/40">
          {t('settings.expertKits.noSkillsInstalled')}
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {installedSkills.map((skill) => (
            <SettingsToggle
              key={skill.slug}
              inCard={false}
              className="px-0"
              label={
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{skill.metadata.name || skill.slug}</span>
                  {/* Where a skill lives is where it applies, and that is not
                      guessable from its name: global reaches every workspace,
                      workspace only this one, project only this folder. */}
                  <SkillScopeMenu
                    skill={skill}
                    disabled={disabled}
                    onMoved={onSkillsChanged}
                  />
                </span>
              }
              description={skill.metadata.description}
              checked={selected.has(skill.slug)}
              disabled={disabled}
              onCheckedChange={(on) => {
                patchSkills(
                  on
                    ? [...declared, skill.slug]
                    : declared.filter((slug) => slug !== skill.slug),
                )
              }}
            />
          ))}
          {unresolved.map((slug) => (
            <div key={slug} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] text-foreground/60">{slug}</div>
                <div className="text-xs text-foreground/40">
                  {t('settings.expertKits.skillMissing')}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => patchSkills(declared.filter((entry) => entry !== slug))}
              >
                {t('common.remove')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
