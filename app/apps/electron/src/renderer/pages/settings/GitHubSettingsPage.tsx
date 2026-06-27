import * as React from 'react'
import { CheckCircle2, ExternalLink, Github, RefreshCw, Terminal, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@craft-agent/ui'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActiveWorkspace } from '@/context/AppShellContext'
import { SettingsCard, SettingsCardContent, SettingsRow, SettingsSection } from '@/components/settings'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type { GitReviewState } from '../../../shared/types'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'github',
}

export default function GitHubSettingsPage() {
  const { t } = useTranslation()
  const activeWorkspace = useActiveWorkspace()
  const [state, setState] = React.useState<GitReviewState | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!activeWorkspace?.rootPath || !window.electronAPI?.getGitReview) {
      setState(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      setState(await window.electronAPI.getGitReview(activeWorkspace.rootPath))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [activeWorkspace?.rootPath])

  React.useEffect(() => {
    load()
  }, [load])

  const githubRepo = state?.remotes.find((remote) => remote.githubRepository)?.githubRepository

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-3xl space-y-8 px-8 py-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t('settings.github.title')}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('settings.github.description')}
          </p>
        </div>

        <SettingsSection
          title={t('settings.github.connectionTitle')}
          description={t('settings.github.connectionDesc')}
          action={
            <button
              type="button"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-3 text-xs text-foreground hover:bg-muted"
              onClick={load}
            >
              {loading ? <Spinner className="text-xs" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {t('common.refresh')}
            </button>
          }
        >
          <SettingsCard>
            <SettingsRow
              label={t('settings.github.cliStatus')}
              description={state?.github.error || t('settings.github.cliStatusDesc')}
              action={<StatusBadge ok={Boolean(state?.github.ghInstalled && state.github.authenticated)} loading={loading} />}
            >
              <span className="text-sm text-muted-foreground">
                {state?.github.ghInstalled
                  ? state.github.authenticated
                    ? (state.github.username ?? t('settings.github.connected'))
                    : t('settings.github.notLoggedIn')
                  : t('settings.github.cliMissing')}
              </span>
            </SettingsRow>
            <SettingsRow
              label={t('settings.github.repository')}
              description={state?.isGitRepository ? (state.repositoryRoot ?? activeWorkspace?.rootPath) : t('settings.github.notGitRepo')}
              action={githubRepo ? <Github className="h-4 w-4 text-muted-foreground" /> : undefined}
            >
              <span className="max-w-[240px] truncate text-sm text-muted-foreground">
                {githubRepo ?? state?.remotes[0]?.url ?? t('settings.github.noRemote')}
              </span>
            </SettingsRow>
          </SettingsCard>
        </SettingsSection>

        <SettingsSection
          title={t('settings.github.howToConnect')}
          description={t('settings.github.howToConnectDesc')}
        >
          <SettingsCard divided={false}>
            <SettingsCardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-foreground">
                gh auth login
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                  onClick={() => window.electronAPI.openUrl('https://cli.github.com/manual/gh_auth_login')}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('settings.github.openGhDocs')}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted"
                  onClick={() => window.electronAPI.openUrl('https://github.com/settings/tokens')}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  {t('settings.github.tokenSettings')}
                </button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </SettingsCardContent>
          </SettingsCard>
        </SettingsSection>
      </div>
    </ScrollArea>
  )
}

function StatusBadge({ ok, loading }: { ok: boolean; loading: boolean }) {
  if (loading) return <Spinner className="text-xs text-muted-foreground" />
  return ok
    ? <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
    : <XCircle className="h-4 w-4 text-muted-foreground" />
}
