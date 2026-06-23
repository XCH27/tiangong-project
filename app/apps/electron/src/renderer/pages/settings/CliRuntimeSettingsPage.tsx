import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Terminal, AlertTriangle, CheckCircle2, Plus, Trash2, Save } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsToggle,
  SettingsInput,
  SettingsTextarea,
} from '@/components/settings'
import { canDeleteRuntime, canEditRuntimeCommand, type CliRuntimeDefinition, type CliRuntimeHealthResult } from '@craft-agent/shared/protocol'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'cliRuntime',
}

function healthLabel(result?: CliRuntimeHealthResult): string {
  if (!result) return '未测试'
  if (result.health === 'available') return '可用'
  if (result.health === 'fail_cli') return 'CLI 启动失败'
  if (result.health === 'fail_acp') return 'ACP 握手失败'
  if (result.health === 'disabled') return '已禁用'
  return '未测试'
}

interface RuntimeFormState {
  id: string | null
  displayName: string
  command: string
  argsText: string
  envText: string
}

const emptyForm: RuntimeFormState = {
  id: null,
  displayName: '',
  command: '',
  argsText: '',
  envText: '',
}

function argsToText(args: string[]): string {
  return args.join(' ')
}

function parseArgs(text: string): string[] {
  return text
    .split(/\s+/)
    .map(value => value.trim())
    .filter(Boolean)
}

function envToText(env?: Record<string, string>): string {
  if (!env) return ''
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

function parseEnv(text: string): Record<string, string> | undefined {
  const env: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const eq = line.indexOf('=')
    if (eq <= 0) throw new Error(`环境变量格式应为 KEY=value：${line}`)
    env[line.slice(0, eq).trim()] = line.slice(eq + 1)
  }
  return Object.keys(env).length ? env : undefined
}

export default function CliRuntimeSettingsPage() {
  const [runtimes, setRuntimes] = useState<CliRuntimeDefinition[]>([])
  const [health, setHealth] = useState<Record<string, CliRuntimeHealthResult>>({})
  const [loading, setLoading] = useState(true)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<RuntimeFormState>(emptyForm)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRuntimes(await window.electronAPI.listCliRuntimes())
    } catch (error) {
      console.error('[CliRuntimeSettings] failed to load runtimes', error)
      toast.error('加载本机 CLI 失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const testRuntime = async (runtimeId: string) => {
    setTestingId(runtimeId)
    try {
      const result = await window.electronAPI.testCliRuntime(runtimeId)
      setHealth(prev => ({ ...prev, [runtimeId]: result }))
    } catch (error) {
      console.error('[CliRuntimeSettings] test failed', error)
      toast.error('测试失败')
    } finally {
      setTestingId(null)
    }
  }

  const setEnabled = async (runtime: CliRuntimeDefinition, enabled: boolean) => {
    try {
      await window.electronAPI.setCliRuntimeEnabled(runtime.id, enabled)
      await load()
    } catch (error) {
      console.error('[CliRuntimeSettings] set enabled failed', error)
      toast.error('更新失败')
    }
  }

  const editRuntime = (runtime: CliRuntimeDefinition) => {
    if (!canEditRuntimeCommand(runtime.kind)) {
      toast.info('检测到的 runtime 只能测试、启用或删除；启动参数不可改。')
      return
    }
    setForm({
      id: runtime.id,
      displayName: runtime.displayName,
      command: runtime.command,
      argsText: argsToText(runtime.args),
      envText: envToText(runtime.env),
    })
  }

  const saveCustomRuntime = async () => {
    const displayName = form.displayName.trim()
    const command = form.command.trim()
    if (!displayName) {
      toast.error('请填写显示名称')
      return
    }
    if (!command) {
      toast.error('请填写启动命令')
      return
    }
    setSaving(true)
    try {
      const payload = {
        displayName,
        command,
        args: parseArgs(form.argsText),
        env: parseEnv(form.envText),
      }
      if (form.id) await window.electronAPI.updateCustomCliRuntime(form.id, payload)
      else await window.electronAPI.addCustomCliRuntime(payload)
      setForm(emptyForm)
      await load()
      toast.success('已保存 CLI Runtime')
    } catch (error) {
      console.error('[CliRuntimeSettings] save custom failed', error)
      toast.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const deleteRuntime = async (runtime: CliRuntimeDefinition) => {
    if (!canDeleteRuntime(runtime.kind)) return
    const ok = window.confirm(`删除“${runtime.displayName}”？检测到的 runtime 会被隐藏，自定义 runtime 会被移除。`)
    if (!ok) return
    try {
      await window.electronAPI.deleteCliRuntime(runtime.id)
      if (form.id === runtime.id) setForm(emptyForm)
      await load()
      toast.success('已删除')
    } catch (error) {
      console.error('[CliRuntimeSettings] delete failed', error)
      toast.error('删除失败')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="本机 CLI" />
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-8">
          <SettingsSection
            title="本机 CLI Runtime"
            description="把本机支持 stdio ACP 的 CLI 接入同一个会话。内置检测只放已确认 ACP 入口；Claude Code / Codex 需要单独 native adapter，不能伪装成 ACP。发送、权限、停止和输出仍走 Craft 原有 timeline。"
          >
            <SettingsCard>
              <SettingsRow
                label="运行时列表"
                description="检测到的 runtime 可停用和测试；自定义 runtime 后续在这里编辑。"
                action={
                  <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading}>
                    {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                    刷新
                  </Button>
                }
              />
              {loading ? (
                <div className="px-4 py-8 flex items-center justify-center text-muted-foreground">
                  <Spinner className="h-4 w-4 mr-2" />
                  正在加载
                </div>
              ) : runtimes.length === 0 ? (
                <div className="px-4 py-8 text-sm text-muted-foreground">
                  未检测到本机 ACP CLI。可以先安装支持 stdio ACP 的 Goose，或添加自定义 ACP runtime。
                </div>
              ) : runtimes.map(runtime => {
                const result = health[runtime.id]
                const isOk = result?.health === 'available'
                const isTesting = testingId === runtime.id
                return (
                  <div key={runtime.id} className="border-t border-border/50 first:border-t-0">
                    <SettingsToggle
                      label={
                        <span className="inline-flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-muted-foreground" />
                          {runtime.displayName}
                        </span>
                      }
                      description={`${runtime.kind} · ${runtime.command} ${runtime.args.join(' ')}`}
                      checked={runtime.enabled}
                      disabled={runtime.kind === 'managed'}
                      onCheckedChange={(checked) => void setEnabled(runtime, checked)}
                    />
                    <SettingsRow
                      label={
                        <span className="inline-flex items-center gap-2">
                          {isOk ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          )}
                          {healthLabel(result)}
                        </span>
                      }
                      description={result?.reason ?? (runtime.needsConfirmation ? '候选入口，使用前需要确认本机 CLI 行为。' : '点击测试会启动 CLI 并尝试握手。')}
                      action={
                        <div className="flex items-center gap-1">
                          {canEditRuntimeCommand(runtime.kind) && (
                            <Button size="sm" variant="ghost" onClick={() => editRuntime(runtime)}>
                              编辑
                            </Button>
                          )}
                          {canDeleteRuntime(runtime.kind) && (
                            <Button size="icon" variant="ghost" onClick={() => void deleteRuntime(runtime)} aria-label="删除 runtime">
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void testRuntime(runtime.id)}
                            disabled={isTesting || !runtime.enabled}
                          >
                            {isTesting && <Spinner className="h-4 w-4" />}
                            测试
                          </Button>
                        </div>
                      }
                    />
                  </div>
                )
              })}
            </SettingsCard>
          </SettingsSection>

          <SettingsSection
            title={form.id ? '编辑自定义 Runtime' : '添加自定义 Runtime'}
            description="用于接入本机已有但未进入内置检测清单的 ACP CLI。这里只保存启动方式，不保存登录凭据；真实发送仍走会话权限和 timeline。"
          >
            <SettingsCard>
              <SettingsInput
                inCard
                label="显示名称"
                value={form.displayName}
                onChange={(displayName) => setForm(prev => ({ ...prev, displayName }))}
                placeholder="例如：我的 ACP Agent"
              />
              <SettingsInput
                inCard
                label="启动命令"
                description="只填可执行命令，不要把参数写进这里。"
                value={form.command}
                onChange={(command) => setForm(prev => ({ ...prev, command }))}
                placeholder="例如：grok"
              />
              <SettingsInput
                inCard
                label="参数"
                description="用空格分隔。第一版不做 shell 级转义解析，复杂参数建议写 wrapper script。"
                value={form.argsText}
                onChange={(argsText) => setForm(prev => ({ ...prev, argsText }))}
                placeholder="例如：--acp"
              />
              <SettingsTextarea
                inCard
                label="环境变量"
                description="每行一个 KEY=value。不要在这里保存敏感 token；优先使用 CLI 自己的登录态。"
                value={form.envText}
                onChange={(envText) => setForm(prev => ({ ...prev, envText }))}
                placeholder={'例如：\nFOO=bar'}
                rows={4}
              />
              <div className="flex items-center justify-end gap-2 px-4 py-3.5 border-t border-border/50">
                {form.id && (
                  <Button variant="ghost" onClick={() => setForm(emptyForm)} disabled={saving}>
                    取消编辑
                  </Button>
                )}
                <Button onClick={() => void saveCustomRuntime()} disabled={saving}>
                  {saving ? <Spinner className="h-4 w-4" /> : form.id ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {form.id ? '保存修改' : '添加 Runtime'}
                </Button>
              </div>
            </SettingsCard>
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}
