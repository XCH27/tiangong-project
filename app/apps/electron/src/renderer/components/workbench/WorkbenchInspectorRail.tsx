import * as React from 'react'
import { useAtomValue } from 'jotai'
import { MousePointer2, PanelRight, RotateCcw, ShieldCheck } from 'lucide-react'
import { UsageLedger } from '@craft-agent/ui'
import { designLatestSelectionAtom, designTickerAtom } from '@/atoms/design'
import { focusedSessionIdAtom } from '@/atoms/panel-stack'
import { sessionAtomFamily, sessionMetaMapAtom } from '@/atoms/sessions'
import { cn } from '@/lib/utils'
import { useAppShellContext } from '@/context/AppShellContext'
import { ProjectPackPanel } from './ProjectPackPanel'
import { buildUsageLedgerData } from '@/lib/usage-ledger'

const tabs = ['选区', '动作', '上下文'] as const

export function WorkbenchInspectorRail() {
  const [activeTab, setActiveTab] = React.useState<(typeof tabs)[number]>('选区')
  const selection = useAtomValue(designLatestSelectionAtom)
  const ticker = useAtomValue(designTickerAtom)
  const focusedSessionId = useAtomValue(focusedSessionIdAtom)
  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)
  const session = useAtomValue(sessionAtomFamily(focusedSessionId ?? '__no-session__'))
  const { activeWorkspaceId, workspaces, llmConnections } = useAppShellContext()
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId)
  const meta = focusedSessionId ? sessionMetaMap.get(focusedSessionId) : undefined
  const connectionSlug = session?.llmConnection ?? meta?.llmConnection
  const connection = llmConnections.find((item) => item.slug === connectionSlug)
  const model = session?.model ?? meta?.model ?? undefined
  const ledger = React.useMemo(() => {
    if (!focusedSessionId) return null
    return buildUsageLedgerData({
      sessionId: focusedSessionId,
      tokenUsage: session?.tokenUsage ?? meta?.tokenUsage,
      connectionSlug,
      connectionName: connection?.name,
      authType: connection?.authType,
      model,
    })
  }, [connection?.authType, connection?.name, connectionSlug, focusedSessionId, meta?.tokenUsage, model, session?.tokenUsage])

  return (
    <aside
      className="h-full w-[320px] shrink-0 overflow-hidden rounded-[8px] bg-background shadow-middle border border-border/60 flex flex-col"
      data-panel-role="right-sidebar"
    >
      <div className="h-[50px] shrink-0 flex items-center justify-between px-3 border-b border-border/60">
        <div className="flex items-center gap-2 min-w-0">
          <PanelRight className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Inspector</div>
            <div className="text-[11px] text-muted-foreground truncate">选区、动作和上下文</div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1 px-2 py-2 border-b border-border/60">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'h-7 px-2 rounded-[6px] text-xs transition-colors',
              activeTab === tab
                ? 'bg-foreground/[0.07] text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-3">
        {activeTab === '选区' && (
          <div className="space-y-3">
            <div className="rounded-[8px] border border-border/70 bg-foreground/[0.02] p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <MousePointer2 className="h-3.5 w-3.5 text-sky-500" />
                当前选区
              </div>
              {selection ? (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">对象数</span>
                    <span className="font-medium">{selection.objects.length}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">来源</span>
                    <span className="font-medium">{selection.objects[0]?.surface ?? 'unknown'}</span>
                  </div>
                  {selection.label && (
                    <div className="text-muted-foreground">{selection.label}</div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  暂无选区。浏览器选择、Artifact 选择或 Agent 工具写入选区后，这里会显示真实对象。
                </div>
              )}
            </div>

            {selection?.objects.map((object, index) => (
              <div key={`${object.type}-${index}`} className="rounded-[8px] border border-border/70 p-3 text-xs">
                <div className="font-medium">{object.type}</div>
                <div className="mt-1 text-muted-foreground">{object.surface}</div>
                {object.preview?.text && (
                  <div className="mt-2 line-clamp-3 text-muted-foreground">{object.preview.text}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === '动作' && (
          <div className="space-y-2">
            {ticker.length === 0 ? (
              <div className="text-xs text-muted-foreground leading-relaxed">
                暂无动作。底部动作流和这里读取同一条 SessionEvent，不会有第二套记录。
              </div>
            ) : (
              ticker.slice(0, 12).map((entry) => (
                <div key={entry.id} className="rounded-[8px] border border-border/70 p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{entry.summary}</span>
                    <span className="text-muted-foreground shrink-0">{entry.actorLabel}</span>
                  </div>
                  <div className="mt-1 text-muted-foreground">{entry.kind}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === '上下文' && (
          <div className="space-y-3 text-xs">
            {ledger ? (
              <div className="rounded-[8px] border border-border/70 overflow-hidden p-2">
                <UsageLedger
                  ledger={ledger}
                  connectionName={connection?.name ?? connectionSlug}
                  model={model}
                />
              </div>
            ) : (
              <div className="rounded-[8px] border border-border/70 p-3 text-muted-foreground">
                当前没有可统计的会话用量。
              </div>
            )}
            <div className="rounded-[8px] border border-border/70 overflow-hidden">
              <ProjectPackPanel rootPath={activeWorkspace?.rootPath ?? ''} />
            </div>
            <div className="rounded-[8px] border border-border/70 p-3">
              <div className="flex items-center gap-2 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                权限和证据
              </div>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                后续 ProjectPack、用量账本和外部审查结果会从这里接入，但共享壳由主线统一管理。
              </p>
            </div>
            <div className="rounded-[8px] border border-border/70 p-3">
              <div className="flex items-center gap-2 font-medium">
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                回滚点
              </div>
              <p className="mt-2 text-muted-foreground leading-relaxed">
                committed patch 接入后，这里显示可回滚动作，不展示不可恢复的临时 DOM 状态。
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default WorkbenchInspectorRail
