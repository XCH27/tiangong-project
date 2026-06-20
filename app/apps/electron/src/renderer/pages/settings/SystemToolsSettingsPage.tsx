/**
 * SystemToolsSettingsPage（T-SYSTOOLS · `docs/28` §9）。
 *
 * 自包含只读设置页：展示全局工具检测结果 + 诊断 + 项目环境 profile。
 * - 探测可自动（rule 28）；"重新检测" 只读触发 `listTools({force:true})`。
 * - 安装/改 PATH/写配置/修复命令 **不在此执行**（v1 未接入，需 permission + timeline）。
 *   修复只展示文字建议；按钮明确标注"未接入"。
 * - 不改 AppShell/Inspector/Stage 等共享壳（docs/32 §3.1 纪律 3）。
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, RotateCw, AlertTriangle, CheckCircle2, XCircle, AlertCircle, MinusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Spinner } from '@craft-agent/ui'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type {
  ToolCapability,
  ToolCategory,
  ToolDiagnostic,
  ProjectEnvironmentProfile,
  DetectOptions,
} from '@craft-agent/shared/protocol'

import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsInputRow,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'systemTools',
}

const CATEGORY_ORDER: ToolCategory[] = [
  'runtime',
  'package-manager',
  'cli-agent',
  'search',
  'browser',
  'context',
  'design',
  'video',
  'app-bundled',
  'custom',
]

const CATEGORY_LABEL_KEY: Record<ToolCategory, string> = {
  runtime: 'settings.systemTools.category.runtime',
  'package-manager': 'settings.systemTools.category.packageManager',
  'cli-agent': 'settings.systemTools.category.cliAgent',
  search: 'settings.systemTools.category.search',
  browser: 'settings.systemTools.category.browser',
  context: 'settings.systemTools.category.context',
  design: 'settings.systemTools.category.design',
  video: 'settings.systemTools.category.video',
  'app-bundled': 'settings.systemTools.category.appBundled',
  custom: 'settings.systemTools.category.custom',
}

function StatusIcon({ status }: { status: ToolCapability['status'] }) {
  const cls = 'h-3.5 w-3.5 shrink-0'
  switch (status) {
    case 'available':
      return <CheckCircle2 className={`${cls} text-success`} />
    case 'conflict':
      return <AlertCircle className={`${cls} text-warning`} />
    case 'broken':
      return <XCircle className={`${cls} text-destructive`} />
    case 'missing':
      return <MinusCircle className={`${cls} text-muted-foreground`} />
    case 'disabled':
      return <MinusCircle className={`${cls} text-muted-foreground`} />
    default:
      return <MinusCircle className={`${cls} text-muted-foreground`} />
  }
}

function statusLabelKey(status: ToolCapability['status']): string {
  return `settings.systemTools.status.${status}`
}

function sourceLabelKey(source: ToolCapability['source']): string {
  return `settings.systemTools.source.${source}`
}

function DiagnosticItem({ d }: { d: ToolDiagnostic }) {
  const color =
    d.level === 'error' ? 'text-destructive' : d.level === 'warning' ? 'text-warning' : 'text-muted-foreground'
  return (
    <li className={`text-[11px] leading-snug ${color}`}>
      <span className="font-mono opacity-70">[{d.code}]</span> {d.message}
      {d.repairSuggestion && (
        <span className="block text-muted-foreground mt-0.5">→ {d.repairSuggestion}</span>
      )}
    </li>
  )
}

function ToolRow({ tool }: { tool: ToolCapability }) {
  const { t } = useTranslation()
  const handleCopy = () => {
    if (tool.path) {
      navigator.clipboard.writeText(tool.path)
      toast.success(t('settings.systemTools.copiedToClipboard', { label: tool.displayName }))
    }
  }
  return (
    <div className="px-3 py-2.5 border-b last:border-b-0">
      <div className="flex items-center gap-2">
        <StatusIcon status={tool.status} />
        <span className="text-sm font-medium flex-1 truncate">{tool.displayName}</span>
        {tool.version && (
          <code className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tool.version}
          </code>
        )}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t(statusLabelKey(tool.status))}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
        {tool.path && (
          <>
            <code className="font-mono bg-muted px-1.5 py-0.5 rounded max-w-[260px] truncate">{tool.path}</code>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={handleCopy} title={t('settings.systemTools.copyPath')}>
              <Copy className="h-3 w-3" />
            </Button>
          </>
        )}
        <span>· {t(sourceLabelKey(tool.source))}</span>
        <span>· {t(`settings.systemTools.risk.${tool.risk}`)}</span>
        {tool.lastCheckedAt && (
          <span>· {new Date(tool.lastCheckedAt).toLocaleTimeString()}</span>
        )}
      </div>
      {tool.diagnostics.length > 0 && (
        <ul className="mt-1.5 space-y-1 ml-5">
          {tool.diagnostics.map((d, i) => <DiagnosticItem key={i} d={d} />)}
        </ul>
      )}
      {tool.usedBy && tool.usedBy.length > 0 && (
        <div className="mt-1 text-[10px] text-muted-foreground ml-5">
          {t('settings.systemTools.usedBy')}: {tool.usedBy.join('、')}
        </div>
      )}
    </div>
  )
}

export default function SystemToolsSettingsPage() {
  const { t } = useTranslation()
  const [tools, setTools] = useState<ToolCapability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRedetecting, setIsRedetecting] = useState(false)
  const [projectPath, setProjectPath] = useState('')
  const [profile, setProfile] = useState<ProjectEnvironmentProfile | null>(null)
  const [isDiagnosing, setIsDiagnosing] = useState(false)

  const load = useCallback(async (opts?: DetectOptions) => {
    setIsLoading(true)
    try {
      const list = await window.electronAPI.systemTools.listTools(opts)
      setTools(list)
    } catch (err) {
      console.error('Failed to detect tools:', err)
      toast.error(t('settings.systemTools.detectFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    load()
  }, [load])

  const handleRedetect = async () => {
    setIsRedetecting(true)
    try {
      const list = await window.electronAPI.systemTools.listTools({ force: true })
      setTools(list)
      toast.success(t('settings.systemTools.redetected'))
    } catch (err) {
      console.error('Redetect failed:', err)
      toast.error(t('settings.systemTools.detectFailed'))
    } finally {
      setIsRedetecting(false)
    }
  }

  const handleDiagnose = async () => {
    const p = projectPath.trim()
    if (!p) return
    setIsDiagnosing(true)
    try {
      const result = await window.electronAPI.systemTools.getProjectProfile({ rootDir: p })
      setProfile(result)
    } catch (err) {
      console.error('Diagnose failed:', err)
      toast.error(t('settings.systemTools.diagnoseFailed'))
    } finally {
      setIsDiagnosing(false)
    }
  }

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: tools.filter((t) => t.category === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title={t('settings.systemTools.title')} />
      <ScrollArea className="flex-1">
        <div className="px-5 py-7 max-w-3xl mx-auto space-y-5">

          {/* 修复未接入提示 */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span className="flex-1">{t('settings.systemTools.repairNotWired')}</span>
          </div>

          {/* 全局工具检测 */}
          <SettingsSection title={t('settings.systemTools.globalTools')}>
            <div className="flex items-center justify-end px-3 pb-2">
              <Button variant="outline" size="sm" onClick={handleRedetect} disabled={isRedetecting || isLoading}>
                {isRedetecting ? <Spinner className="mr-1.5" /> : <RotateCw className="h-3.5 w-3.5 mr-1.5" />}
                {t('settings.systemTools.redetect')}
              </Button>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : grouped.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t('settings.systemTools.noTools')}
              </div>
            ) : (
              grouped.map((g) => (
                <SettingsCard key={g.category}>
                  <div className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {t(CATEGORY_LABEL_KEY[g.category])}
                  </div>
                  {g.items.map((tool) => <ToolRow key={tool.toolId} tool={tool} />)}
                </SettingsCard>
              ))
            )}
          </SettingsSection>

          {/* 项目环境诊断（只读） */}
          <SettingsSection title={t('settings.systemTools.projectEnv')}>
            <SettingsCard>
              <SettingsInputRow
                label={t('settings.systemTools.projectPath')}
                value={projectPath}
                onChange={setProjectPath}
                placeholder={t('settings.systemTools.projectPathPlaceholder')}
              />
              <div className="flex justify-end px-3 pb-2.5">
                <Button variant="outline" size="sm" onClick={handleDiagnose} disabled={isDiagnosing || !projectPath.trim()}>
                  {isDiagnosing ? <Spinner className="mr-1.5" /> : null}
                  {t('settings.systemTools.diagnose')}
                </Button>
              </div>
            </SettingsCard>

            {profile && (
              <SettingsCard>
                <SettingsRow label={t('settings.systemTools.recommendedPm')}>
                  <span className="text-xs">{profile.recommendedPackageManager ?? '—'}</span>
                </SettingsRow>
                <SettingsRow label={t('settings.systemTools.lockfiles')}>
                  <span className="text-xs">{profile.lockfiles.join('、') || '—'}</span>
                </SettingsRow>
                <SettingsRow label={t('settings.systemTools.pythonEnvs')}>
                  <span className="text-xs">{profile.pythonEnvs.join('、') || '—'}</span>
                </SettingsRow>
                <SettingsRow label={t('settings.systemTools.scripts')}>
                  <span className="text-xs">{profile.packageScripts.join('、') || '—'}</span>
                </SettingsRow>
                <SettingsRow label={t('settings.systemTools.gitRoot')}>
                  <span className="text-xs">{profile.gitRoot ?? '—'}</span>
                </SettingsRow>
                {profile.diagnostics.length > 0 && (
                  <ul className="px-3 pb-2.5 space-y-1">
                    {profile.diagnostics.map((d, i) => <DiagnosticItem key={i} d={d} />)}
                  </ul>
                )}
              </SettingsCard>
            )}
          </SettingsSection>

        </div>
      </ScrollArea>
    </div>
  )
}
