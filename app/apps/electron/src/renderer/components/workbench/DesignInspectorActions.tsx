import * as React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { RotateCcw, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  designClient,
  designLatestSelectionAtom,
  designPendingPatchAtom,
  workbenchSessionIdAtom,
} from '@/atoms/design'
import {
  createReplaceTextAction,
  createSetStyleAction,
  isDomEditableSelection,
  primaryDomObject,
  readLocatorString,
  readStyleValue,
} from '@/lib/design-inspector-actions'
import { syncSelectionAfterDomMutation } from '@/lib/design-selection-sync'

export function DesignInspectorActions() {
  const selection = useAtomValue(designLatestSelectionAtom)
  const workbenchSessionId = useAtomValue(workbenchSessionIdAtom)
  const [pendingPatch, setPendingPatch] = useAtom(designPendingPatchAtom)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<'propose' | 'commit' | 'rollback' | 'apply' | null>(null)

  const object = selection ? primaryDomObject(selection) : null
  const sessionId = workbenchSessionId ?? selection?.sessionId ?? null
  const editable = Boolean(sessionId && selection && isDomEditableSelection(selection))

  const [color, setColor] = React.useState('')
  const [text, setText] = React.useState('')
  const [width, setWidth] = React.useState('')
  const [radius, setRadius] = React.useState('')

  React.useEffect(() => {
    if (!object) {
      setColor('')
      setText('')
      setWidth('')
      setRadius('')
      return
    }
    setColor(readStyleValue(object, 'color'))
    setText(object.preview?.text ?? readLocatorString(object, 'textContent'))
    setWidth(readStyleValue(object, 'width'))
    setRadius(readStyleValue(object, 'borderRadius'))
  }, [object, selection?.createdAt, selection?.selectionId])

  const buildAction = React.useCallback(() => {
    if (!sessionId || !selection || !object) return null

    const originalText = object.preview?.text ?? readLocatorString(object, 'textContent')
    if (text.trim() && text.trim() !== originalText) {
      return createReplaceTextAction(sessionId, selection, text.trim())
    }

    const styleProps: Record<string, string> = {}
    if (color.trim()) styleProps.color = color.trim()
    if (width.trim()) styleProps.width = width.trim().endsWith('px') ? width.trim() : `${width.trim()}px`
    if (radius.trim()) styleProps.borderRadius = radius.trim().endsWith('px') ? radius.trim() : `${radius.trim()}px`

    if (Object.keys(styleProps).length > 0) {
      return createSetStyleAction(sessionId, selection, styleProps)
    }
    return null
  }, [color, object, radius, selection, sessionId, text, width])

  const refreshSelection = React.useCallback(async () => {
    if (!sessionId || !selection) return
    try {
      await syncSelectionAfterDomMutation(sessionId, selection)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }, [selection, sessionId])

  const handlePropose = React.useCallback(async () => {
    const action = buildAction()
    if (!sessionId || !action) {
      setError('请先填写要应用的样式或文本')
      return
    }
    setBusy('propose')
    setError(null)
    try {
      const result = await designClient.proposeAction({ sessionId, action })
      setPendingPatch({ sessionId, patch: result.patch, action })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }, [buildAction, sessionId, setPendingPatch])

  const handleCommit = React.useCallback(async () => {
    if (!pendingPatch || pendingPatch.sessionId !== sessionId) return
    setBusy('commit')
    setError(null)
    try {
      await designClient.commitPatch({ sessionId: pendingPatch.sessionId, patchId: pendingPatch.patch.patchId })
      if (selection) await syncSelectionAfterDomMutation(sessionId!, selection)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }, [pendingPatch, sessionId])

  const handleRollback = React.useCallback(async () => {
    if (!pendingPatch || pendingPatch.sessionId !== sessionId) return
    setBusy('rollback')
    setError(null)
    try {
      await designClient.rollbackPatch({ sessionId: pendingPatch.sessionId, patchId: pendingPatch.patch.patchId })
      if (selection) await syncSelectionAfterDomMutation(sessionId!, selection)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }, [pendingPatch, sessionId])

  const handleApply = React.useCallback(async () => {
    const action = buildAction()
    if (!sessionId || !action) {
      setError('请先填写要应用的样式或文本')
      return
    }
    setBusy('apply')
    setError(null)
    try {
      const result = await designClient.proposeAction({ sessionId, action })
      setPendingPatch({ sessionId, patch: result.patch, action })
      await designClient.commitPatch({ sessionId, patchId: result.patch.patchId })
      if (selection) await syncSelectionAfterDomMutation(sessionId, selection)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusy(null)
    }
  }, [buildAction, sessionId, setPendingPatch])

  if (!editable || !object) return null

  return (
    <div className="rounded-[8px] border border-border/70 bg-foreground/[0.02] p-3 space-y-3">
      <div className="flex items-center gap-2 text-xs font-medium">
        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
        DOM 编辑
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span className="text-muted-foreground">颜色</span>
          <Input value={color} onChange={(event) => setColor(event.target.value)} className="h-8 text-xs" placeholder="#2563eb" />
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground">宽度</span>
          <Input value={width} onChange={(event) => setWidth(event.target.value)} className="h-8 text-xs" placeholder="240px" />
        </label>
        <label className="space-y-1">
          <span className="text-muted-foreground">圆角</span>
          <Input value={radius} onChange={(event) => setRadius(event.target.value)} className="h-8 text-xs" placeholder="12px" />
        </label>
        <label className="space-y-1 col-span-2">
          <span className="text-muted-foreground">文本</span>
          <Input value={text} onChange={(event) => setText(event.target.value)} className="h-8 text-xs" placeholder="替换文本" />
        </label>
      </div>

      {object.surface === 'artifact' && (
        <div className="text-[11px] text-muted-foreground space-y-1">
          <div>artifactId: {readLocatorString(object, 'artifactId') || '未设置'}</div>
          <div className="truncate">selector: {readLocatorString(object, 'selector') || '未设置'}</div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-7 text-xs gap-1" disabled={!!busy} onClick={handleApply}>
          <Send className="h-3.5 w-3.5" />
          {busy === 'apply' ? '应用中…' : '应用'}
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!!busy} onClick={handlePropose}>
          {busy === 'propose' ? '提案中…' : '提案'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={!!busy || !pendingPatch || pendingPatch.sessionId !== sessionId}
          onClick={handleCommit}
        >
          {busy === 'commit' ? '提交中…' : '提交'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          disabled={!!busy || !pendingPatch || pendingPatch.sessionId !== sessionId}
          onClick={handleRollback}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {busy === 'rollback' ? '回滚中…' : '回滚'}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={!!busy || !selection} onClick={refreshSelection}>
          刷新选区
        </Button>
      </div>

      {pendingPatch && pendingPatch.sessionId === sessionId && (
        <div className="text-[11px] text-muted-foreground">
          待处理补丁 · {pendingPatch.patch.status} · {pendingPatch.action.op.kind}
        </div>
      )}

      {error && <div className="text-[11px] text-destructive">{error}</div>}
    </div>
  )
}

export default DesignInspectorActions
