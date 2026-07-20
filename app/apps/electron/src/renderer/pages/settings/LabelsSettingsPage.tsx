/**
 * LabelsSettingsPage
 *
 * Displays workspace label configuration in two data tables:
 * 1. Label Hierarchy - tree table with expand/collapse showing all labels
 * 2. Auto-Apply Rules - flat table showing all regex rules across labels
 *
 * Each section has an Edit button that opens an EditPopover for AI-assisted editing
 * of the underlying labels/config.json file.
 *
 * Data is loaded via the useLabels hook which subscribes to live config changes.
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { EditPopover, EditButton, getEditConfig } from '@/components/ui/EditPopover'
import { getDocUrl } from '@craft-agent/shared/docs/doc-links'
import { Database, Hash, Loader2, ShieldCheck, Sparkles } from 'lucide-react'
import { useAppShellContext, useActiveWorkspace } from '@/context/AppShellContext'
import { useLabels } from '@/hooks/useLabels'
import {
  LabelsDataTable,
  AutoRulesDataTable,
} from '@/components/info'
import {
  SettingsSection,
  SettingsCard,
  SettingsMenuSelect,
} from '@/components/settings'
import { routes } from '@/lib/navigate'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import { getLocalizedLabelName } from '@/utils/label-display-name'
import { getSystemIdentityLabel } from '@craft-agent/shared/labels'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'labels',
}

export default function LabelsSettingsPage() {
  const { t } = useTranslation()
  const { activeWorkspaceId, enabledSources = [], skills = [] } = useAppShellContext()
  const activeWorkspace = useActiveWorkspace()
  const { labels, flatLabels, isLoading } = useLabels(activeWorkspaceId)
  const [selectedLabelId, setSelectedLabelId] = React.useState('')
  const selectedLabel = flatLabels.find(label => label.id === selectedLabelId) ?? flatLabels[0]

  React.useEffect(() => {
    if (selectedLabel && selectedLabel.id !== selectedLabelId) setSelectedLabelId(selectedLabel.id)
  }, [selectedLabel, selectedLabelId])

  // Resolve edit configs using the workspace root path
  const rootPath = activeWorkspace?.rootPath || ''
  const labelsEditConfig = getEditConfig('edit-labels', rootPath)
  const autoRulesEditConfig = getEditConfig('edit-auto-rules', rootPath)

  // Secondary action: open the labels config file directly in system editor
  const editFileAction = rootPath ? {
    label: t("common.editFile"),
    filePath: `${rootPath}/labels/config.json`,
  } : undefined

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t("settings.labels.title")} actions={<HeaderMenu route={routes.view.settings('labels')} />} />
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
                  {/* About Section */}
                  <SettingsSection title={t("settings.labels.aboutLabels")}>
                    <SettingsCard className="px-4 py-3.5">
                      <div className="text-sm text-muted-foreground leading-relaxed space-y-1.5">
                        <p>
                          {t("settings.labels.aboutText1")}
                        </p>
                        <p>
                          {t("settings.labels.aboutText2")}
                        </p>
                        <p>
                          {t("settings.labels.aboutText3")}
                        </p>
                        <p>
                          <button
                            type="button"
                            onClick={() => window.electronAPI?.openUrl(getDocUrl('labels'))}
                            className="text-foreground/70 hover:text-foreground underline underline-offset-2"
                          >
                            {t("chat.learnMore")}
                          </button>
                        </p>
                      </div>
                    </SettingsCard>
                  </SettingsSection>

                  {/* Label Hierarchy Section */}
                  <SettingsSection
                    title={t("settings.labels.labelHierarchy")}
                    description={t("settings.labels.labelHierarchyDesc")}
                    action={
                      <EditPopover
                        trigger={<EditButton />}
                        context={labelsEditConfig.context}
                        example={labelsEditConfig.example}
                        displayLabel={labelsEditConfig.displayLabel}
                        model={labelsEditConfig.model}
                        systemPromptPreset={labelsEditConfig.systemPromptPreset}
                        secondaryAction={editFileAction}
                      />
                    }
                  >
                    <SettingsCard className="p-0">
                      {labels.length > 0 ? (
                        <LabelsDataTable
                          data={labels}
                          searchable
                          maxHeight={350}
                          fullscreen
                          fullscreenTitle={t("settings.labels.labelHierarchy")}
                        />
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm">{t("settings.labels.noLabels")}</p>
                          <p className="text-xs mt-1 text-foreground/40">
                            {t("settings.labels.noLabelsDesc")}
                          </p>
                        </div>
                      )}
                    </SettingsCard>
                  </SettingsSection>

                  {selectedLabel && (
                    <SettingsSection
                      title={t('settings.labels.identityDetails')}
                      description={t('settings.labels.identityDetailsDesc')}
                    >
                      <div className="space-y-3">
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {t('settings.labels.bindingsNotImplemented')}
                        </p>
                        <SettingsCard className="p-0">
                          <div className="flex items-center gap-3 border-b border-border/50 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-foreground/[0.04]">
                              <Hash className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-base font-semibold">{getLocalizedLabelName(t, selectedLabel)}</span>
                                <span className="rounded-md bg-foreground/[0.05] px-2 py-0.5 text-[11px] text-muted-foreground">
                                  {getSystemIdentityLabel(selectedLabel.id)
                                    ? t('settings.labels.identitySystem')
                                    : t('settings.labels.identityCustom')}
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-muted-foreground">#{selectedLabel.id}</div>
                            </div>
                            <SettingsMenuSelect
                              value={selectedLabel.id}
                              onValueChange={setSelectedLabelId}
                              options={flatLabels.map(label => ({
                                value: label.id,
                                label: getLocalizedLabelName(t, label),
                              }))}
                            />
                          </div>

                          <IdentityCapabilityRow
                            icon={<Hash className="h-4 w-4" />}
                            title={t('settings.labels.quickCommand')}
                            detail={`#${selectedLabel.id}`}
                          />
                          <IdentityCapabilityRow
                            icon={<Database className="h-4 w-4" />}
                            title={t('settings.labels.availableSources')}
                            detail={enabledSources.length
                              ? enabledSources.map(source => source.config.name).join('、')
                              : t('settings.labels.noneAvailable')}
                          />
                          <IdentityCapabilityRow
                            icon={<Sparkles className="h-4 w-4" />}
                            title={t('settings.labels.availableSkills')}
                            detail={skills.length
                              ? skills.map(skill => skill.metadata.name).join('、')
                              : t('settings.labels.noneAvailable')}
                          />
                          <IdentityCapabilityRow
                            icon={<ShieldCheck className="h-4 w-4" />}
                            title={t('settings.labels.permissionScope')}
                            detail={t('settings.labels.inheritedSessionPermissions')}
                            last
                          />
                        </SettingsCard>
                      </div>
                    </SettingsSection>
                  )}

                  {/* Auto-Apply Rules Section */}
                  <SettingsSection
                    title={t("settings.labels.autoApplyRules")}
                    description={t("settings.labels.autoApplyRulesDesc")}
                    action={
                      <EditPopover
                        trigger={<EditButton />}
                        context={autoRulesEditConfig.context}
                        example={autoRulesEditConfig.example}
                        displayLabel={autoRulesEditConfig.displayLabel}
                        model={autoRulesEditConfig.model}
                        systemPromptPreset={autoRulesEditConfig.systemPromptPreset}
                        secondaryAction={editFileAction}
                      />
                    }
                  >
                    <SettingsCard className="p-0">
                      <AutoRulesDataTable
                        data={labels}
                        searchable
                        maxHeight={350}
                        fullscreen
                        fullscreenTitle={t("settings.labels.autoApplyRules")}
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

function IdentityCapabilityRow({
  icon,
  title,
  detail,
  last = false,
}: {
  icon: React.ReactNode
  title: string
  detail: string
  last?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${last ? '' : 'border-b border-border/50'}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04] text-muted-foreground">
        {icon}
      </span>
      <span className="w-28 shrink-0 text-sm font-medium">{title}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{detail}</span>
    </div>
  )
}
