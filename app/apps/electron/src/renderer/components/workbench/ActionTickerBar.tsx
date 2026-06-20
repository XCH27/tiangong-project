/**
 * ActionTickerBar — Fleet 工作台 · 底部动作流（AppShell 级全局底部条）
 *
 * 位置：AppShell 级别的全局底部条（不是 ChatPage 局部），所有视图都可见。
 * 它订阅 `onSessionEvent`，把 `design_*` / `selection_changed` / `tool_start` 事件
 * 渲染成人和 Agent 在同一条 timeline 上的真实操作（T-ENGINE 发这些事件，T-EVENT-ACTOR
 * 给 tool 事件带上 actor）。与输入区的 `ActiveTasksBar` 是两个东西（那个保持原位）。
 * 无事件时诚实显示占位说明。
 *
 * 还没接的部分（诚实）：跳转/回放/撤销按钮、跨会话精确分组——后续接。
 */

import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { Radio } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SessionEvent } from '@craft-agent/shared/protocol'
import {
  designTickerAtom,
  designLatestSelectionAtom,
  mapDesignEventToEntry,
  DESIGN_TICKER_MAX,
  type DesignTickerEntry,
} from '@/atoms/design'

const ACTOR_FILTERS = ['全部', '我', 'Agent'] as const

const KIND_COLOR: Record<DesignTickerEntry['kind'], string> = {
  selection: 'text-sky-600 dark:text-sky-400',
  proposed: 'text-amber-600 dark:text-amber-400',
  committed: 'text-emerald-600 dark:text-emerald-400',
  rolled_back: 'text-muted-foreground',
  tool: 'text-violet-600 dark:text-violet-400',
}

export function ActionTickerBar() {
  const [filter, setFilter] = React.useState<(typeof ACTOR_FILTERS)[number]>('全部')
  const entries = useAtomValue(designTickerAtom)
  const setTicker = useSetAtom(designTickerAtom)
  const setSelection = useSetAtom(designLatestSelectionAtom)

  // 订阅同一条 SessionEvent 流，只挑动作事件。design_* / tool_start 和别的事件同通道，无需新 listener。
  React.useEffect(() => {
    const cleanup = window.electronAPI.onSessionEvent((event: SessionEvent) => {
      const entry = mapDesignEventToEntry(event)
      if (entry) setTicker((prev) => [entry, ...prev].slice(0, DESIGN_TICKER_MAX))
      if (event.type === 'selection_changed') setSelection(event.selection)
    })
    return cleanup
  }, [setTicker, setSelection])

  const visible = entries.filter((e) =>
    filter === '全部' ? true : filter === '我' ? e.actorLabel === '我' : e.actorLabel !== '我',
  )

  return (
    <div className="shrink-0 h-7 flex items-center gap-2 px-2.5 border-t border-border/60 bg-background/80 text-[11px] select-none">
      <Radio className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="font-medium text-muted-foreground">动作流</span>

      <div className="flex items-center gap-0.5">
        {ACTOR_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'h-5 px-1.5 rounded-[4px] transition-colors',
              filter === f ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground/70 hover:text-foreground',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <span className="mx-1 h-3 w-px bg-border/70" />

      {visible.length === 0 ? (
        <span className="truncate text-muted-foreground/70">
          暂无动作 · 这里显示人和 Agent 的真实操作（Agent 工具调用 / 选择 / 提案 / 提交 / 回滚），订阅同一条 SessionEvent
        </span>
      ) : (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {visible.slice(0, 12).map((e) => (
            <span key={e.id} className="flex items-center gap-1 whitespace-nowrap">
              <span className="text-muted-foreground/60">[{e.actorLabel}]</span>
              <span className={cn('font-medium', KIND_COLOR[e.kind])}>{e.summary}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ActionTickerBar
