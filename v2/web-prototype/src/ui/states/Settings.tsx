import type { DoctorSummary } from "../../types/contracts";
import { CardTitle } from "../components/bits";
import { THEME_KEYS, getTheme, type ThemeKey } from "../../theme/theme";

export function SettingsView({ doctor, offline, onToggleOffline, theme, onTheme }: {
  doctor: DoctorSummary | null; offline: boolean; onToggleOffline: () => void;
  theme: ThemeKey; onTheme: (k: ThemeKey) => void;
}) {
  return (
    <>
      <div className="card">
        <CardTitle>自检 · Doctor <span className="mock-tag">GET /api/v1/doctor</span></CardTitle>
        {!doctor ? <div className="muted">加载中…</div> : (
          <>
            <div className="set-row"><span className="sk">ffmpeg</span><span className="sv">
              <span className={doctor.hardware.ffmpeg_available ? "dot-ok" : "dot-err"}>●</span> {doctor.hardware.ffmpeg_available ? "可用" : "缺失"}</span></div>
            <div className="set-row"><span className="sk">硬件档位</span><span className="sv">
              {doctor.hardware.computed_tier} · {doctor.hardware.memory_gb}GB · {doctor.hardware.local_acceleration_hints.join(", ") || "无加速"}</span></div>
            <div className="set-row"><span className="sk">对话模型</span><span className="sv">
              <span className={doctor.provider_chat.reachable ? "dot-ok" : "dot-err"}>●</span> {doctor.provider_chat.name} / {doctor.provider_chat.model}</span></div>
            <div className="set-row"><span className="sk">视觉模型 VLM</span><span className="sv">
              <span className="dot-warn">●</span> {doctor.provider_vlm.name} / {doctor.provider_vlm.model} · 隐私层 {doctor.provider_vlm.layer}</span></div>
            <div className="set-row"><span className="sk">离线模式</span><span className="sv" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button className={"toggle" + (offline ? " on" : "")} onClick={onToggleOffline} aria-label="toggle offline" />
              <span className="muted">{offline ? "仅本地模型与素材，不发外网" : "允许调用配置的云端 provider"}</span></span></div>
            {doctor.warnings.map((w, i) => (
              <div key={i} className="warn-box" style={{ marginTop: 12 }}><div className="wt">提示</div><ul><li>{w}</li></ul></div>
            ))}
          </>
        )}
      </div>

      <div className="card">
        <CardTitle>主题 · 四季同源 token <span className="mock-tag">themes.json</span></CardTitle>
        <div className="theme-dots">
          {THEME_KEYS.map((k) => (
            <button key={k} title={getTheme(k).name_zh}
              className={"theme-dot" + (k === theme ? " active" : "")}
              style={{ background: getTheme(k).accent }} onClick={() => onTheme(k)} />
          ))}
        </div>
        <div className="muted" style={{ marginTop: 10 }}>当前：{getTheme(theme).glyph} {getTheme(theme).name_zh}（{getTheme(theme).mode === "night" ? "夜" : "昼"}）· 改色一处生效，V1/V2/Web 同源</div>
      </div>
    </>
  );
}
