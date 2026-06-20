/**
 * ProjectPackPanel — 自包含只读面板（T-PROJECTPACK）。
 *
 * 调用 LOCAL_ONLY RPC 打包当前项目根目录，展示文件数 / token 估算 / 排除项 /
 * secret scan 结果。不自动外发；高危 secret 时禁用"复制全文"并提示确认。
 *
 * 主线负责将此面板接进 Context tab；本文件不改 AppShell / Inspector 共享壳。
 */

import { useCallback, useState } from 'react'
import type { ProjectPackResult, ProjectPackScope } from '@craft-agent/shared/protocol'

type PackState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; result: ProjectPackResult }

const SCOPE_LABELS: Record<ProjectPackScope, string> = {
  repo: '整个仓库',
  diff: 'Git 改动',
  directory: '指定目录',
}

export interface ProjectPackPanelProps {
  /** 项目根目录（通常为 workspace folderPath） */
  rootPath: string
  /** 可选：scope=directory 时的相对子目录 */
  relativePath?: string
}

export function ProjectPackPanel({ rootPath, relativePath }: ProjectPackPanelProps) {
  const [scope, setScope] = useState<ProjectPackScope>('repo')
  const [state, setState] = useState<PackState>({ status: 'idle' })
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const runPack = useCallback(async () => {
    if (!rootPath) {
      setState({ status: 'error', message: '未接入项目根路径' })
      return
    }
    setState({ status: 'loading' })
    setCopyHint(null)
    try {
      const result = await window.electronAPI.packProject({
        rootPath,
        scope,
        relativePath: scope === 'directory' ? relativePath : undefined,
      })
      setState({ status: 'done', result })
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }, [rootPath, scope, relativePath])

  const copyPreview = useCallback(async () => {
    const done = state.status === 'done' ? state.result : null
    if (!done) return
    if (!done.summary.externalExportAllowed) {
      setCopyHint('检测到高危 secret，外发前需人工确认并移除敏感内容。')
      return
    }
    try {
      await navigator.clipboard.writeText(done.markdownPreview)
      setCopyHint('已复制预览片段到剪贴板（未外发）。')
    } catch {
      setCopyHint('复制失败，请手动选择预览文本。')
    }
  }, [state])

  const summary = state.status === 'done' ? state.result.summary : null

  return (
    <div className="flex flex-col gap-3 p-3 text-sm" data-testid="project-pack-panel">
      <div className="flex flex-col gap-1">
        <div className="font-medium">ProjectPack</div>
        <div className="text-xs text-muted-foreground break-all">{rootPath || '（未接入根路径）'}</div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {(Object.keys(SCOPE_LABELS) as ProjectPackScope[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`px-2 py-1 rounded border text-xs ${scope === s ? 'bg-accent' : 'bg-background'}`}
            onClick={() => setScope(s)}
          >
            {SCOPE_LABELS[s]}
          </button>
        ))}
        <button
          type="button"
          className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs disabled:opacity-50"
          disabled={!rootPath || state.status === 'loading'}
          onClick={() => void runPack()}
        >
          {state.status === 'loading' ? '打包中…' : '打包'}
        </button>
      </div>

      {state.status === 'error' && (
        <div className="text-destructive text-xs">{state.message}</div>
      )}

      {summary && (
        <div className="flex flex-col gap-2 border rounded-md p-2 bg-muted/30">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span>文件数</span>
            <span>{summary.fileCount}</span>
            <span>总字节</span>
            <span>{summary.totalBytes.toLocaleString()}</span>
            <span>Token（估算）</span>
            <span>{summary.estimatedTokens.toLocaleString()} ({summary.tokenEstimateKind})</span>
            <span>Bundle hash</span>
            <span className="font-mono truncate" title={summary.bundleHash}>{summary.bundleHash.slice(0, 12)}…</span>
            <span>Git</span>
            <span>
              {summary.gitCommit ? summary.gitCommit.slice(0, 7) : 'n/a'}
              {summary.gitDirty ? ' · dirty' : ''}
            </span>
            <span>Secret scan</span>
            <span>
              {summary.secretScan.findingCount} 条
              {summary.secretScan.hasHighSeverity ? ' · 含高危' : ''}
            </span>
            <span>外发许可</span>
            <span>{summary.externalExportAllowed ? '无高危 secret（仍需用户确认）' : '阻断（先处理 secret）'}</span>
          </div>

          {summary.excluded.length > 0 && (
            <details className="text-xs">
              <summary>排除项 ({summary.excluded.length})</summary>
              <ul className="mt-1 max-h-32 overflow-auto font-mono">
                {summary.excluded.slice(0, 50).map((e) => (
                  <li key={`${e.relativePath}:${e.reason}`}>
                    {e.relativePath} — {e.reason}
                  </li>
                ))}
                {summary.excluded.length > 50 && <li>…还有 {summary.excluded.length - 50} 项</li>}
              </ul>
            </details>
          )}

          {summary.secretScan.findings.length > 0 && (
            <details className="text-xs" open={summary.secretScan.hasHighSeverity}>
              <summary>Secret scan 结果</summary>
              <ul className="mt-1 max-h-40 overflow-auto">
                {summary.secretScan.findings.map((f, i) => (
                  <li key={`${f.relativePath}:${f.line}:${i}`}>
                    [{f.severity}] {f.relativePath}:{f.line} — {f.message} ({f.snippet})
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex gap-2">
            <button type="button" className="px-2 py-1 rounded border text-xs" onClick={() => void copyPreview()}>
              复制预览
            </button>
          </div>
          {copyHint && <div className="text-xs text-muted-foreground">{copyHint}</div>}

          <pre className="text-xs max-h-48 overflow-auto whitespace-pre-wrap border rounded p-2 bg-background">
            {state.status === 'done' ? state.result.markdownPreview : ''}
          </pre>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        本地打包 · 不外发。Token 为估算值，非真实计费。外发审查需另走 secret scan + 用户确认流程。
      </p>
    </div>
  )
}
