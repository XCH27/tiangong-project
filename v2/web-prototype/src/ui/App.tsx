import { useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { applyTheme, getTheme, type ThemeKey } from "../theme/theme";
import { MockTransport } from "../mock/MockTransport";
import { RestTransport, type Transport } from "../transport/client";
import { MOCK_SKILLS, PLATFORM_LABEL, detectPlatform } from "../mock/data";
import type {
  AnalysisPlan, BackendError, ChatAnswer, DoctorSummary, RecentTask,
  RunResult, StepState, VideoMetadata, Depth,
} from "../types/contracts";
import { PIPELINE_STEPS } from "../types/contracts";
import { Chip, CardTitle } from "./components/bits";
import { PlanView } from "./states/Plan";
import { RunView, FallbackView } from "./states/Run";
import { AssetView } from "./states/Asset";
import { SettingsView } from "./states/Settings";

// Swap mock -> real backend with ?live in the URL (proxied to :8000). No UI changes.
const USE_MOCK = !new URLSearchParams(location.search).has("live");
const transport: Transport = USE_MOCK ? new MockTransport() : new RestTransport();

type Stage = "input" | "plan" | "run" | "asset" | "fallback";
type Tab = "work" | "library" | "settings";

// SSE event -> which pipeline step + status it maps to (mirrors docs/BACKEND.md).
const EVENT_TO_STEP: Record<string, { step: string; status: StepState["status"] }> = {
  probing: { step: "probe", status: "running" },
  subtitle_check: { step: "acquire_subtitle", status: "completed" },
  segmenting: { step: "transcribe", status: "running" },
  extracting_frames: { step: "extract_frames", status: "running" },
  vlm_describing: { step: "vlm_describe", status: "running" },
  generating: { step: "generate", status: "running" },
  exporting: { step: "export", status: "running" },
};

export default function App() {
  const [theme, setTheme] = useState<ThemeKey>("ink-night");
  const [tab, setTab] = useState<Tab>("work");
  const [stage, setStage] = useState<Stage>("input");

  const [url, setUrl] = useState("");
  const [skill, setSkill] = useState("video-note");
  const [depth, setDepth] = useState<Depth>("text_only");
  const [busy, setBusy] = useState(false);

  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [plan, setPlan] = useState<AnalysisPlan | null>(null);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Record<string, StepState>>({});
  const [mascot, setMascot] = useState("•ω•");
  const [err, setErr] = useState<BackendError | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  const [doctor, setDoctor] = useState<DoctorSummary | null>(null);
  const [offline, setOffline] = useState(false);
  const [recent, setRecent] = useState<RecentTask[]>([]);
  const unsub = useRef<(() => void) | null>(null);

  // Advanced feature: Client-provided assets and premium feedback
  const [availableSkills, setAvailableSkills] = useState<{ name: string; depth: Depth }[]>(MOCK_SKILLS);
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [customLanguage, setCustomLanguage] = useState("zh-Hans");
  const [showClipperPanel, setShowClipperPanel] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { 
    transport.doctor().then(setDoctor); 
    transport.recentTasks().then(setRecent);
    transport.skills().then((s) => { if (s && s.length) setAvailableSkills(s); });
  }, []);

  useEffect(() => {
    if (availableSkills && availableSkills.length > 0) {
      const exists = availableSkills.some((s) => s.name === skill);
      if (!exists) {
        const defaultSkill = availableSkills.find((s) => s.name === "note")?.name ?? availableSkills[0].name;
        setSkill(defaultSkill);
      }
    }
  }, [availableSkills, skill]);

  const platform = useMemo(() => (url.trim() ? detectPlatform(url) : null), [url]);
  const skillDepth = useMemo(() => availableSkills.find((s) => s.name === skill)?.depth ?? "text_only", [skill, availableSkills]);
  useEffect(() => setDepth(skillDepth), [skillDepth]);

  const reset = () => {
    unsub.current?.(); unsub.current = null;
    setStage("input"); setMeta(null); setPlan(null); setProgress(0);
    setSteps({}); setErr(null); setResult(null); setMascot("•ω•");
  };

  // input -> plan : probe + plan
  const onAnalyze = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const [m, p] = await Promise.all([transport.probe(url), transport.plan(url, skill, depth)]);
      setMeta(m); setPlan(p); setStage("plan");
    } finally { setBusy(false); }
  };

  // plan -> run : analyze + stream SSE
  const onConfirm = async () => {
    setStage("run"); setProgress(0); setSteps({}); setMascot("·ω·");
    const fail = url.includes("#blocked") ? "blocked" : url.includes("#ratelimit") ? "ratelimit" : url.includes("#oom") ? "oom" : "";
    
    // Aligned client_provided structure matching backend's ClientProvidedInput Pydantic schema
    const client_provided = customSubtitle.trim()
      ? {
          subtitle: {
            content: customSubtitle,
            format: "srt",
            language: customLanguage,
            source: "browser_clipper"
          }
        }
      : undefined;

    const { task_id } = await transport.analyze({ url, skill, depth, client_provided });
    const tid = task_id + "__" + fail; // mock reads failure keyword from id suffix
    unsub.current = transport.streamEvents(tid, (ev) => {
      if (ev.data.progress != null) setProgress(ev.data.progress);
      const map = EVENT_TO_STEP[ev.event];
      if (map) {
        setSteps((prev) => {
          const next = { ...prev };
          // close out prior running steps as completed
          for (const s of PIPELINE_STEPS) if (next[s]?.status === "running") next[s] = { ...next[s], status: "completed" };
          const isSkip = ev.event === "subtitle_check" && ev.data.skipping_asr;
          const isDeg = ev.event === "vlm_describing" && (ev.data.message ?? "").includes("降级");
          next[map.step] = { step: map.step as never, status: isDeg ? "degraded" : map.status, message: ev.data.message };
          if (isSkip) next["transcribe"] = { step: "transcribe" as never, status: "skipped", message: "使用官方字幕" };
          return next;
        });
        setMascot("·ω·");
      }
      if (ev.event === "error" && ev.data.error) { setErr(ev.data.error); setMascot("×﹏×"); setStage("fallback"); }
      if (ev.event === "done") {
        setSteps((prev) => { const n = { ...prev }; for (const s of PIPELINE_STEPS) if (n[s]?.status === "running") n[s] = { ...n[s], status: "completed" }; n["export"] = { step: "export" as never, status: "completed", message: "已写出资产" }; return n; });
        setMascot("•‿•");
        transport.runResult(ev.data.run_id ?? "run_xyz789").then((r) => { setResult(r); setStage("asset"); });
      }
    });
  };

  const onSeek = (sec: number) => setMascot(`▸ ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);
  const onAsk = (q: string): Promise<ChatAnswer> => transport.chat(result?.run_id ?? "", q);

  const t = getTheme(theme);

  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="brand">OmniVerse Vision{t.mode === "night" ? "" : ""} <span className="dot">·</span></span>
        <span className="tagline">视界无限，洞析万象</span>
        <span className="topbar-spacer" />
        <Chip onClick={() => setTab("settings")}><span className="swatch" />{t.glyph} {t.name_zh}</Chip>
        <Chip onClick={() => setTab("settings")}>{offline ? "离线" : `${doctor?.provider_vlm?.name ?? "VLM"} · Layer ${doctor?.provider_vlm?.layer ?? "A"}`}</Chip>
      </div>

      <div className="body"><div className="center">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div className="nav">
            <button className={tab === "work" ? "active" : ""} onClick={() => setTab("work")}>工作台</button>
            <button className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}>资产库</button>
            <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>设置</button>
          </div>
          {tab === "work" && stage !== "input" && <button className="btn ghost sm" onClick={reset}>＋ 新分析</button>}
        </div>

        {tab === "work" && stage === "input" && (
          <>
            <div className="home-hero">
              <div className="home-logo"><span className="o">Omni</span>Verse Vision</div>
              <div className="home-sub">贴一个视频链接 / 文件 / 截图，描述你想要什么，剩下交给它。</div>
            </div>
            <div className="input-frame">
              <button className={`btn-icon ${customSubtitle.trim() ? "glowing" : ""}`} title="上传文件 / 截图" onClick={() => setShowClipperPanel(true)}>＋</button>
              <input autoFocus value={url} placeholder="粘贴 B站 / YouTube 链接，或拖入本地视频…"
                onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAnalyze()} />
              <button className="btn" onClick={onAnalyze} disabled={busy || !url.trim()}>{busy ? "探测中…" : "分析"}</button>
            </div>
            {platform && <div style={{ marginTop: 12, fontSize: 13, color: "var(--text_l3)" }}>
              ▸ 识别到 <b style={{ color: "var(--accent)" }}>{PLATFORM_LABEL[platform]}</b>
              {(platform === "bilibili" || platform === "youtube") ? " · 将走「官方字幕优先」" : platform === "local" ? " · 本地文件，无平台风控" : " · 可能需要降级通道"}</div>}

            <div className="hint-row">
              {availableSkills.slice(0, 8).map((s) => (
                <button key={s.name} className={"hint-pill"} style={skill === s.name ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined}
                  onClick={() => setSkill(s.name)}>{s.name}</button>
              ))}
            </div>
            <div className="statusline">
              <span><b>对话模型</b> {doctor?.provider_chat?.model ?? "—"}</span>
              <span><b>视觉</b> {doctor?.provider_vlm?.model ?? "—"} (Layer {doctor?.provider_vlm?.layer ?? "A"})</span>
              <span><b>隐私</b> {offline ? "离线" : "云端可用"}</span>
              <span><b>硬件</b> {doctor?.hardware?.computed_tier ?? "—"}</span>
              <span><b>当前 Skill</b> {skill} · {depth}</span>
            </div>
            <div className="muted" style={{ textAlign: "center", marginTop: 24 }}>
              试试失败分支：链接后加 <code>#blocked</code> / <code>#ratelimit</code> / <code>#oom</code>
            </div>
          </>
        )}

        {tab === "work" && stage === "plan" && meta && plan && (
          <PlanView meta={meta} plan={plan} onConfirm={onConfirm} onCancel={reset} />
        )}
        {tab === "work" && stage === "run" && (
          <RunView progress={progress} steps={steps} mascot={mascot} onCancel={reset} />
        )}
        {tab === "work" && stage === "fallback" && err && (
          <FallbackView err={err} onClipper={() => setShowClipperPanel(true)} onUpload={() => setShowClipperPanel(true)} onRetry={onConfirm} onBack={reset} />
        )}
        {tab === "work" && stage === "asset" && result && (
          <AssetView result={result} onAsk={onAsk} onSeek={onSeek}
            onExport={async () => {
              try {
                showToast("正在导出到 Obsidian...", "info");
                const defaultVault = doctor?.hardware?.platform === "darwin" ? "~/Documents/Obsidian/Vault" : "~/.obsidian_vault";
                const res = await transport.export(result.run_id, "obsidian", result.metadata.title, {
                  vault_dir: defaultVault,
                  wiki_links: true,
                  overwrite: true
                });
                showToast(`成功导出到 Obsidian！路径：${res.path}`, "success");
              } catch (e: any) {
                showToast(`导出失败：${e.message || e}`, "error");
              }
            }}
          />
        )}

        {tab === "library" && (
          <div className="card">
            <CardTitle>最近任务 <span className="mock-tag">GET /api/v1/tasks/recent</span></CardTitle>
            {recent.map((r) => (
              <div key={r.task_id} className="task-row"
                onClick={() => { if (r.run_id) transport.runResult(r.run_id).then((res) => { setResult(res); setTab("work"); setStage("asset"); }); }}
                style={{ cursor: r.run_id ? "pointer" : "default" }}>
                <span className={`state-dot ${r.state}`} />
                <span className="t-title">{r.title}</span>
                <span className="t-meta">{PLATFORM_LABEL[r.platform]} · {r.skill} · {r.created_at}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "settings" && (
          <SettingsView doctor={doctor} offline={offline} onToggleOffline={() => setOffline((v) => !v)} theme={theme} onTheme={setTheme} />
        )}
      </div></div>

      {showClipperPanel && (
        <div className="clipper-overlay" onClick={() => setShowClipperPanel(false)}>
          <div className="clipper-panel" onClick={(e) => e.stopPropagation()}>
            <div className="clipper-header">
              <h3>注入本地字幕 / 文本段落</h3>
              <button className="clipper-close" onClick={() => setShowClipperPanel(false)}>×</button>
            </div>
            <div className="clipper-body">
              <p style={{ fontSize: 13, color: "var(--text_l3)", marginBottom: 12 }}>
                当平台由于高风控无法直接下载（如 `DOWNLOAD_BLOCKED` 错误）时，请在此粘贴通过浏览器 Clipper 抓取的字幕内容或本地字幕文件内容。
              </p>
              <textarea 
                value={customSubtitle} 
                onChange={(e) => setCustomSubtitle(e.target.value)} 
                placeholder="在此粘贴 SRT / VTT / TXT 格式字幕..."
              />
              <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
                <span className="muted" style={{ fontSize: 13 }}>字幕语言:</span>
                <select value={customLanguage} onChange={(e) => setCustomLanguage(e.target.value)} className="select">
                  <option value="zh-Hans">简体中文 (zh-Hans)</option>
                  <option value="zh-Hant">繁体中文 (zh-Hant)</option>
                  <option value="en">英文 (en)</option>
                </select>
              </div>
            </div>
            <div className="clipper-footer">
              <button className="btn sm" onClick={() => {
                setShowClipperPanel(false);
                showToast(customSubtitle.trim() ? "已成功注入自定义字幕！" : "已清除自定义字幕", "success");
              }}>保存并应用</button>
              {customSubtitle.trim() && (
                <button className="btn ghost sm" style={{ marginLeft: 8 }} onClick={() => {
                  setCustomSubtitle("");
                  setShowClipperPanel(false);
                  showToast("已清除自定义字幕", "info");
                }}>清空</button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          <span className="toast-icon">{toast.type === "success" ? "✓" : toast.type === "error" ? "✗" : "ℹ"}</span>
          <span className="toast-msg">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
