import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Play, RefreshCw, ShieldCheck, Square, XCircle } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  SettingsCard,
  SettingsCardContent,
  SettingsInput,
  SettingsRow,
  SettingsSection,
  SettingsToggle,
} from '@/components/settings'
import { useAppShellContext } from '@/context/AppShellContext'
import { cn } from '@/lib/utils'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import {
  USER_ACTOR,
  type ExternalJobRecord,
  type ExternalJobStatus,
  type ExternalJobType,
} from '@craft-agent/shared/protocol'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'externalJobs',
}

const SETTINGS_SESSION_ID = 'fleet-external-jobs-settings'

const STATUS_TONE: Record<ExternalJobStatus, string> = {
  draft: 'text-muted-foreground',
  pending_permission: 'text-amber-600 dark:text-amber-400',
  queued: 'text-blue-600 dark:text-blue-400',
  running: 'text-blue-600 dark:text-blue-400',
  polling: 'text-blue-600 dark:text-blue-400',
  completed: 'text-green-600 dark:text-green-400',
  failed: 'text-destructive',
  cancelled: 'text-muted-foreground',
}

export default function ExternalJobsSettingsPage(): React.ReactElement {
  const { t } = useTranslation()
  const { activeWorkspaceId } = useAppShellContext()
  const [jobs, setJobs] = useState<ExternalJobRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [permissionSummary, setPermissionSummary] = useState('')
  const [userAuthorizedLogin, setUserAuthorizedLogin] = useState(false)
  const [targetSite, setTargetSite] = useState('claude-web')

  const selected = jobs.find((job) => job.id === selectedId) ?? null

  const load = useCallback(async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    setLoading(true)
    try {
      const next = await window.electronAPI.listExternalJobs(activeWorkspaceId)
      setJobs(next.sort((a, b) => b.updatedAt - a.updatedAt))
      setSelectedId((current) => {
        if (current && next.some((job) => job.id === current)) return current
        return next[0]?.id ?? null
      })
    } catch (error) {
      toast.error(t('settings.externalJobs.loadFailed', {
        message: error instanceof Error ? error.message : String(error),
      }))
    } finally {
      setLoading(false)
    }
  }, [activeWorkspaceId, t])

  useEffect(() => {
    void load()
  }, [load])

  const createReviewJob = async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    setActing(true)
    try {
      const job = await window.electronAPI.createExternalJob(activeWorkspaceId, {
        type: 'external_ai_review',
        sessionId: SETTINGS_SESSION_ID,
        workspaceId: activeWorkspaceId,
        actor: USER_ACTOR,
        target: { site: targetSite.trim() || 'claude-web', provider: 'stub' },
        inputRefs: [{ kind: 'workspace_root', ref: '.' }],
        permissionLevel: 'L3',
      })
      setSelectedId(job.id)
      await load()
      toast.success(t('settings.externalJobs.created'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setActing(false)
    }
  }

  const confirmPermission = async () => {
    if (!window.electronAPI || !activeWorkspaceId || !selected) return
    if (!userAuthorizedLogin) {
      toast.error(t('settings.externalJobs.loginRequired'))
      return
    }
    setActing(true)
    try {
      await window.electronAPI.confirmExternalJobPermission(activeWorkspaceId, {
        jobId: selected.id,
        confirmedBy: USER_ACTOR,
        summary: permissionSummary.trim() || t('settings.externalJobs.defaultPermissionSummary'),
        userAuthorizedLogin: true,
      })
      await load()
      toast.success(t('settings.externalJobs.permissionConfirmed'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setActing(false)
    }
  }

  const runJob = async () => {
    if (!window.electronAPI || !activeWorkspaceId || !selected) return
    setActing(true)
    try {
      await window.electronAPI.runExternalJob(activeWorkspaceId, selected.id)
      await load()
      toast.success(t('settings.externalJobs.runStarted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setActing(false)
    }
  }

  const pollJob = async () => {
    if (!window.electronAPI || !activeWorkspaceId || !selected) return
    setActing(true)
    try {
      await window.electronAPI.pollExternalJob(activeWorkspaceId, selected.id)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setActing(false)
    }
  }

  const cancelJob = async () => {
    if (!window.electronAPI || !activeWorkspaceId || !selected) return
    setActing(true)
    try {
      await window.electronAPI.cancelExternalJob(activeWorkspaceId, selected.id)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error))
    } finally {
      setActing(false)
    }
  }

  if (!activeWorkspaceId) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-sm text-muted-foreground">
        {t('settings.externalJobs.noWorkspace')}
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl space-y-8 px-8 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t('settings.externalJobs.title')}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('settings.externalJobs.description')}
          </p>
          <p className="text-xs text-muted-foreground">{t('settings.externalJobs.providerStubNote')}</p>
        </div>

        <SettingsSection
          title={t('settings.externalJobs.listTitle')}
          action={(
            <Button type="button" size="sm" variant="outline" onClick={() => void load()} disabled={loading}>
              {loading ? <Spinner className="text-xs" /> : <RefreshCw className="h-3.5 w-3.5" />}
              <span className="ml-2">{t('common.refresh')}</span>
            </Button>
          )}
        >
          <SettingsCard>
            <SettingsCardContent className="space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[180px] flex-1">
                  <SettingsInput
                    label={t('settings.externalJobs.targetSite')}
                    value={targetSite}
                    onChange={setTargetSite}
                    placeholder="claude-web"
                  />
                </div>
                <Button type="button" size="sm" onClick={() => void createReviewJob()} disabled={acting}>
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  {t('settings.externalJobs.createReview')}
                </Button>
              </div>

              {jobs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t('settings.externalJobs.listEmpty')}
                </p>
              ) : (
                <div className="space-y-1">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left hover:bg-muted',
                        selectedId === job.id && 'border-border bg-muted',
                      )}
                      onClick={() => setSelectedId(job.id)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{jobLabel(t, job.type)}</div>
                        <div className="truncate font-mono text-[11px] text-muted-foreground">{job.id}</div>
                      </div>
                      <span className={cn('shrink-0 text-xs font-medium', STATUS_TONE[job.status])}>
                        {t(`settings.externalJobs.status.${job.status}`)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </SettingsCardContent>
          </SettingsCard>
        </SettingsSection>

        {selected && (
          <SettingsSection title={t('settings.externalJobs.detailTitle')}>
            <SettingsCard divided={false}>
              <SettingsCardContent className="space-y-4">
                <SettingsRow label={t('settings.externalJobs.statusLabel')} description={selected.id}>
                  <span className={cn('text-sm font-medium', STATUS_TONE[selected.status])}>
                    {t(`settings.externalJobs.status.${selected.status}`)}
                  </span>
                </SettingsRow>

                {selected.status === 'pending_permission' && (
                  <>
                    <SettingsInput
                      label={t('settings.externalJobs.permissionSummary')}
                      value={permissionSummary}
                      onChange={setPermissionSummary}
                    />
                    <SettingsToggle
                      label={t('settings.externalJobs.userAuthorizedLogin')}
                      description={t('settings.externalJobs.userAuthorizedLoginDesc')}
                      checked={userAuthorizedLogin}
                      onCheckedChange={setUserAuthorizedLogin}
                      inCard={false}
                    />
                    <Button type="button" size="sm" onClick={() => void confirmPermission()} disabled={acting}>
                      <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                      {t('settings.externalJobs.confirmPermission')}
                    </Button>
                  </>
                )}

                {selected.status === 'queued' && (
                  <Button type="button" size="sm" onClick={() => void runJob()} disabled={acting}>
                    <Play className="mr-2 h-3.5 w-3.5" />
                    {t('settings.externalJobs.run')}
                  </Button>
                )}

                {selected.status === 'polling' && (
                  <Button type="button" size="sm" onClick={() => void pollJob()} disabled={acting}>
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    {t('settings.externalJobs.poll')}
                  </Button>
                )}

                {!['completed', 'failed', 'cancelled'].includes(selected.status) && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void cancelJob()} disabled={acting}>
                    <Square className="mr-2 h-3.5 w-3.5" />
                    {t('settings.externalJobs.cancel')}
                  </Button>
                )}

                {selected.error && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{selected.error}</span>
                  </div>
                )}

                {selected.evidence && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3 text-xs">
                    <div className="font-medium text-foreground">{t('settings.externalJobs.evidenceTitle')}</div>
                    <div className="font-mono text-muted-foreground">
                      {t('settings.externalJobs.bundleHash')}: {selected.evidence.bundleHash.slice(0, 16)}…
                    </div>
                    {selected.evidence.reportSummary && (
                      <div>{t('settings.externalJobs.reportSummary')}: {selected.evidence.reportSummary}</div>
                    )}
                    {selected.evidence.rawOutput && (
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-background p-2 text-[11px]">
                        {selected.evidence.rawOutput}
                      </pre>
                    )}
                  </div>
                )}

                {selected.costs.length > 0 && (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground">{t('settings.externalJobs.costTitle')}</div>
                    {selected.costs.map((cost) => (
                      <div key={`${cost.category}-${cost.label}`} className="flex justify-between gap-3">
                        <span>{cost.label}</span>
                        <span className="font-mono">{cost.truth}</span>
                      </div>
                    ))}
                  </div>
                )}
              </SettingsCardContent>
            </SettingsCard>
          </SettingsSection>
        )}
      </div>
    </ScrollArea>
  )
}

function jobLabel(t: (key: string) => string, type: ExternalJobType): string {
  const key = `settings.externalJobs.type.${type}`
  const translated = t(key)
  return translated === key ? type : translated
}
