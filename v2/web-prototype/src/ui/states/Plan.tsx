import type { AnalysisPlan, VideoMetadata } from "../../types/contracts";
import { CardTitle, CostBadge, RiskBadge } from "../components/bits";
import { PLATFORM_LABEL } from "../../mock/data";

const FALLBACK_LABEL: Record<string, string> = {
  none: "无需降级",
  requires_browser_clipper: "需浏览器 Clipper",
  requires_user_upload: "需手动上传",
  cloud_asr_opt_in: "需云端 ASR 授权",
};

export function PlanView({ meta, plan, onConfirm, onCancel }: {
  meta: VideoMetadata; plan: AnalysisPlan;
  onConfirm: () => void; onCancel: () => void;
}) {
  const dur = `${Math.floor(meta.duration / 60)}:${String(meta.duration % 60).padStart(2, "0")}`;
  const timeLabel = { fast: "快", moderate: "中等", slow: "较慢" }[plan.estimated_time_bucket];
  return (
    <div className="card">
      <CardTitle>分析计划 · 确认后再运行 <span className="mock-tag">POST /api/v1/plan</span></CardTitle>

      <div style={{ marginBottom: 16 }}>
        <div style={{ color: "var(--text_l1)", fontWeight: 600, fontSize: 15 }}>{meta.title}</div>
        <div className="muted" style={{ marginTop: 4 }}>
          {PLATFORM_LABEL[meta.platform]} · {dur} · {meta.has_official_subtitles ? "有官方字幕" : "无官方字幕"}
        </div>
      </div>

      <div className="meta-grid">
        <div className="meta-item"><div className="k">深度</div><div className="v">{plan.chosen_depth}</div></div>
        <div className="meta-item"><div className="k">预计耗时</div><div className="v">{timeLabel}</div></div>
        <div className="meta-item"><div className="k">预计成本</div><div className="v"><CostBadge bucket={plan.estimated_cost_bucket} /></div></div>
        <div className="meta-item"><div className="k">磁盘占用</div><div className="v"><CostBadge bucket={plan.estimated_disk_bucket} /></div></div>
        <div className="meta-item"><div className="k">风险</div><div className="v"><RiskBadge risk={plan.estimated_risk} /></div></div>
        <div className="meta-item"><div className="k">降级路线</div><div className="v" style={{ fontSize: 13 }}>{FALLBACK_LABEL[plan.expected_fallback_path]}</div></div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div className="k" style={{ fontSize: 11, color: "var(--text_l4)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>执行路线</div>
        <div className="route-flow">
          {plan.planned_steps.map((s, i) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <span className="route-arrow">›</span>}
              <span className={"route-step" + (plan.degraded_steps.includes(s) ? " degrade" : "")}>{s}</span>
            </span>
          ))}
          {plan.skipped_steps.map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span className="route-arrow">·</span><span className="route-step skip">{s}</span>
            </span>
          ))}
        </div>
      </div>

      {plan.user_visible_warnings.length > 0 && (
        <div className="warn-box">
          <div className="wt">诚实可见 · 请先了解</div>
          <ul>{plan.user_visible_warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      <div className="actions">
        <button className="btn" onClick={onConfirm}>确认运行</button>
        <button className="btn ghost" onClick={onCancel}>取消</button>
        <button className="btn ghost" disabled>改配方</button>
      </div>
    </div>
  );
}
