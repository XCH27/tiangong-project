import type { StepState, BackendError } from "../../types/contracts";
import { PIPELINE_STEPS } from "../../types/contracts";
import { CardTitle } from "../components/bits";

const STEP_LABEL: Record<string, string> = {
  probe: "探测元数据", acquire_subtitle: "字幕 / ASR", transcribe: "分段",
  extract_frames: "抽取关键帧", vlm_describe: "VLM 描述", generate: "生成笔记", export: "导出资产",
};
const ICON: Record<string, string> = { completed: "✓", skipped: "⏭", degraded: "▽", running: "▸", failed: "✗", pending: "·" };

export function RunView({ progress, steps, mascot, onCancel }: {
  progress: number; steps: Record<string, StepState>; mascot: string; onCancel: () => void;
}) {
  return (
    <div className="card">
      <CardTitle>正在分析 <span className="mock-tag">SSE /tasks/&#123;id&#125;/events</span></CardTitle>
      <div className="progress-head">
        <span className="mascot">{mascot}</span>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        <span className="progress-pct">{Math.round(progress * 100)}%</span>
        <button className="btn ghost sm" onClick={onCancel}>取消</button>
      </div>
      <div className="steps">
        {PIPELINE_STEPS.map((s) => {
          const st = steps[s] ?? { step: s, status: "pending" as const };
          return (
            <div key={s} className={`step-row ${st.status}`}>
              <span className="step-ic">{ICON[st.status]}</span>
              <span className="step-name">{STEP_LABEL[s]}</span>
              <span className="step-msg">{st.message ?? (st.status === "pending" ? "等待中…" : "")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FallbackView({ err, onClipper, onUpload, onRetry, onBack }: {
  err: BackendError; onClipper: () => void; onUpload: () => void; onRetry: () => void; onBack: () => void;
}) {
  const needsClipper = err.code === "DOWNLOAD_BLOCKED" || err.code === "RATE_LIMITED";
  return (
    <div className="card fallback">
      <CardTitle>未能完成 · 有明确下一步</CardTitle>
      <div className="fb-code">{err.code} · step: {err.step}</div>
      <div className="fb-msg">{err.message}</div>
      <div className="fb-hint">{err.hint}</div>
      <div className="actions">
        {needsClipper && <button className="btn" onClick={onClipper}>用浏览器 Clipper 注入字幕</button>}
        <button className="btn ghost" onClick={onUpload}>手动上传文件</button>
        {err.retriable && <button className="btn ghost" onClick={onRetry}>重试</button>}
        <button className="btn ghost" onClick={onBack}>返回</button>
      </div>
    </div>
  );
}
