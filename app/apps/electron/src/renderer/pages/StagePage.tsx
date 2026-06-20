import * as React from 'react'
import { Boxes, Code2, Globe2, ImageIcon, LayoutGrid, PanelRight, Rows3, SendHorizontal } from 'lucide-react'
import { Panel } from '@/components/app-shell/Panel'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { routes, useNavigation, useNavigationState } from '@/contexts/NavigationContext'
import type { StageMode } from '../../shared/types'
import { designClient, workbenchSessionIdAtom } from '@/atoms/design'
import { useSession } from '@/hooks/useSession'
import { useAtomValue } from 'jotai'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import { BrowserStageSurface } from '@/components/workbench/BrowserStageSurface'

const stageModes: Array<{ id: StageMode; label: string; icon: React.ComponentType<{ className?: string }>; enabled: boolean }> = [
  { id: 'browser', label: 'Browser', icon: Globe2, enabled: true },
  { id: 'artifact', label: 'Artifact', icon: ImageIcon, enabled: true },
  { id: 'canvas', label: 'Canvas', icon: Boxes, enabled: false },
  { id: 'code', label: 'Code', icon: Code2, enabled: false },
  { id: 'timeline', label: 'Timeline', icon: Rows3, enabled: false },
  { id: 'board', label: 'Board', icon: LayoutGrid, enabled: false },
]

function getModeCopy(mode: StageMode) {
  switch (mode) {
    case 'browser':
      return {
        title: '浏览器画布',
        subtitle: '网页标注、框选、多选和 Comment AI 的第一落点',
      }
    case 'artifact':
      return {
        title: 'Artifact Studio',
        subtitle: 'AI 生成页面和本地可编辑预览的手动编辑入口',
      }
    case 'canvas':
      return { title: 'Canvas', subtitle: '后续承载组件库、素材和自由画布' }
    case 'code':
      return { title: 'Code', subtitle: '后续承载代码对象选区和补丁预览' }
    case 'timeline':
      return { title: 'Timeline', subtitle: '后续承载动画、分镜和视频片段编排' }
    case 'board':
      return { title: 'Board', subtitle: '后续承载分镜、任务板和知识卡片' }
  }
}

export default function StagePage({ mode }: { mode: StageMode }) {
  const { navigate, toggleRightSidebar, updateRightSidebar } = useNavigation()
  const navState = useNavigationState()
  const [session] = useSession()
  const workbenchSessionId = useAtomValue(workbenchSessionIdAtom)
  const designSessionId = workbenchSessionId ?? session.selected
  const copy = getModeCopy(mode)
  const openedInspectorRef = React.useRef(false)
  const [selectionError, setSelectionError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!openedInspectorRef.current && navState.navigator === 'stage' && navState.rightSidebar?.type !== 'inspector') {
      openedInspectorRef.current = true
      updateRightSidebar({ type: 'inspector' })
    }
  }, [navState, updateRightSidebar])

  const handleCreateSelection = React.useCallback(async () => {
    if (!designSessionId) return
    setSelectionError(null)
    const selectionId = `stage-sel-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`
    try {
      await designClient.setSelection({
        sessionId: designSessionId,
        selection: {
          selectionId,
          sessionId: designSessionId,
          createdBy: USER_ACTOR,
          createdAt: Date.now(),
          label: `${copy.title} 测试选区`,
          objects: [
            {
              type: 'design_node',
              surface: mode === 'artifact' ? 'artifact' : 'browser',
              locator: {
                source: 'stage-shell',
                mode,
                selector: '[data-stage-test-selection]',
              },
              preview: {
                text: `${copy.title} 中由人类 UI 创建的测试选区`,
              },
            },
          ],
        },
      })
    } catch (error) {
      setSelectionError(error instanceof Error ? error.message : String(error))
    }
  }, [copy.title, designSessionId, mode])

  return (
    <Panel variant="grow" className="bg-background">
      <PanelHeader
        title="Stage"
        badge={<span className="text-[11px] text-muted-foreground font-normal">{copy.title}</span>}
        actions={
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs"
            onClick={() => toggleRightSidebar({ type: 'inspector' })}
          >
            <PanelRight className="h-3.5 w-3.5" />
            Inspector
          </Button>
        }
      />

      <div className="flex-1 min-h-0 p-3 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {stageModes.map((item) => {
            const Icon = item.icon
            const active = item.id === mode
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => navigate(routes.view.stage(item.id))}
                className={cn(
                  'h-8 px-2.5 rounded-[7px] text-xs flex items-center gap-1.5 border transition-colors whitespace-nowrap',
                  active
                    ? 'bg-foreground/[0.08] border-border text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]',
                  !item.enabled && 'opacity-45 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 min-h-0 rounded-[8px] border border-border/70 bg-foreground/[0.015] overflow-hidden flex flex-col">
          <div className="h-10 shrink-0 border-b border-border/60 flex items-center justify-between px-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{copy.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{copy.subtitle}</div>
            </div>
            <span className="text-[11px] rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5">
              shell 已接入
            </span>
          </div>

          {mode === 'browser' ? (
            <BrowserStageSurface />
          ) : (
          <div className="flex-1 min-h-0 grid place-items-center p-6">
            <div className="w-full max-w-[680px] rounded-[10px] border border-dashed border-border bg-background/70 p-4">
              <div className="text-sm font-medium">{copy.title}</div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                这是正式 Stage panel。下一步把 BrowserPane / Artifact preview 挂进这里，选区和编辑动作走同一套 DesignAction、permission、SessionEvent 和回滚。
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-[8px] border border-border/70 p-3">
                  <div className="font-medium">人类操作</div>
                  <div className="mt-1 text-muted-foreground">选择、框选、标注、手动调参</div>
                </div>
                <div className="rounded-[8px] border border-border/70 p-3">
                  <div className="font-medium">Agent 操作</div>
                  <div className="mt-1 text-muted-foreground">同一动作通道、同一 timeline、同一回滚点</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  disabled={!designSessionId}
                  onClick={handleCreateSelection}
                  data-stage-test-selection
                >
                  创建测试选区
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {designSessionId ? '走真实 DesignEngine 选区事件' : '需要从一个会话进入工作台'}
                </span>
              </div>
              {selectionError && (
                <div className="mt-2 text-[11px] text-destructive">{selectionError}</div>
              )}
            </div>
          </div>
          )}

          <div className="h-12 shrink-0 border-t border-border/60 px-3 flex items-center gap-2">
            <div className="flex-1 h-8 rounded-[8px] border border-border/70 bg-background px-3 flex items-center text-xs text-muted-foreground">
              统一输入 · 按当前 Stage 模式和选区路由给人类/Agent 共用动作
            </div>
            <Button size="sm" className="h-8 gap-1.5" disabled>
              <SendHorizontal className="h-3.5 w-3.5" />
              执行
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  )
}
