import React, { useEffect, useRef, useState } from "react";
import { Box, Text, useApp, useInput, useStdin } from "ink";
import { getTheme, THEME_KEYS, type ThemeKey } from "../theme/theme.js";
import { MockTransport } from "../mock/MockTransport.js";
import type { Transport } from "../transport/client.js";
import { MOCK_SKILLS } from "../mock/data.js";
import { PIPELINE_STEPS } from "../types/contracts.js";
import type { AnalysisPlan, BackendError, DoctorSummary, StepState, VideoMetadata } from "../types/contracts.js";
import { InputState } from "./Input.js";
import { PlanState } from "./Plan.js";
import { RunState, FallbackState } from "./Run.js";
import { Rule } from "./Bits.js";

const transport: Transport = new MockTransport(); // OE_LIVE=1 → RestTransport (later)
type Stage = "input" | "plan" | "run" | "fallback" | "done";

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
  const { exit } = useApp();
  const { isRawModeSupported } = useStdin();
  const [theme, setTheme] = useState<ThemeKey>("ink-night");
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [skillIdx, setSkillIdx] = useState(0);
  const skill = MOCK_SKILLS[skillIdx].name;

  const [meta, setMeta] = useState<VideoMetadata | null>(null);
  const [plan, setPlan] = useState<AnalysisPlan | null>(null);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Record<string, StepState>>({});
  const [mascot, setMascot] = useState("•ω•");
  const [err, setErr] = useState<BackendError | null>(null);
  const [doctor, setDoctor] = useState<DoctorSummary | null>(null);
  const unsub = useRef<(() => void) | null>(null);

  useEffect(() => { transport.doctor().then(setDoctor); }, []);

  const reset = () => { unsub.current?.(); unsub.current = null; setStage("input"); setMeta(null); setPlan(null); setProgress(0); setSteps({}); setErr(null); setMascot("•ω•"); };

  const goPlan = async () => {
    if (!url.trim()) return;
    setMascot("·ω·");
    const [m, p] = await Promise.all([transport.probe(url), transport.plan(url, skill, MOCK_SKILLS[skillIdx].depth)]);
    setMeta(m); setPlan(p); setStage("plan");
  };

  const goRun = async () => {
    setStage("run"); setProgress(0); setSteps({}); setMascot("·ω·");
    const fail = url.includes("#blocked") ? "blocked" : url.includes("#ratelimit") ? "ratelimit" : url.includes("#oom") ? "oom" : "";
    const { task_id } = await transport.analyze({ url, skill, depth: MOCK_SKILLS[skillIdx].depth });
    unsub.current = transport.streamEvents(task_id + "__" + fail, (ev) => {
      if (ev.data.progress != null) setProgress(ev.data.progress);
      const map = EVENT_TO_STEP[ev.event];
      if (map) {
        setSteps((prev) => {
          const next = { ...prev };
          for (const s of PIPELINE_STEPS) if (next[s]?.status === "running") next[s] = { ...next[s], status: "completed" };
          const isSkip = ev.event === "subtitle_check" && ev.data.skipping_asr;
          const isDeg = ev.event === "vlm_describing" && (ev.data.message ?? "").includes("降级");
          next[map.step] = { step: map.step as never, status: isDeg ? "degraded" : map.status, message: ev.data.message };
          if (isSkip) next["transcribe"] = { step: "transcribe" as never, status: "skipped", message: "使用官方字幕" };
          return next;
        });
      }
      if (ev.event === "error" && ev.data.error) { setErr(ev.data.error); setMascot("×﹏×"); setStage("fallback"); }
      if (ev.event === "done") {
        setSteps((prev) => { const n = { ...prev }; for (const s of PIPELINE_STEPS) if (n[s]?.status === "running") n[s] = { ...n[s], status: "completed" }; n["export"] = { step: "export" as never, status: "completed", message: "已写出资产" }; return n; });
        setProgress(1); setMascot("•‿•"); setStage("done");
      }
    });
  };

  useInput((input, key) => {
    if (key.escape) { stage === "input" ? exit() : reset(); return; }
    if (input === "") { /* noop */ }
    // F-keys arrive as escape sequences; map letters as fallbacks too.
    if (input === "2") setTheme(THEME_KEYS[(THEME_KEYS.indexOf(theme) + 1) % THEME_KEYS.length]);
    if (stage === "input") {
      if (key.tab) setSkillIdx((i) => (i + 1) % MOCK_SKILLS.length);
    }
    if (stage === "plan") { if (key.return) void goRun(); }
    if ((stage === "fallback") && key.return) void goRun();
    if (input === "q" && stage !== "input") exit();
  }, { isActive: isRawModeSupported });

  const t = getTheme(theme);
  const modeBadge = "模式B";

  return (
    <Box flexDirection="column" minHeight={28} paddingX={1}>
      {/* Topbar */}
      <Box>
        <Text color={t.text_l1} bold>◈ OmniVerse Vision </Text><Text color={t.accent}>·</Text>
        <Box flexGrow={1} />
        <Text color={t.text_l4}>[{modeBadge}] [Layer {doctor?.provider_vlm.layer ?? "A"}] [⛰{doctor?.hardware.computed_tier ?? "—"}] [{t.glyph}{t.name_zh}·{t.mode === "night" ? "夜" : "昼"}]</Text>
      </Box>
      <Rule theme={theme} />

      {/* Body */}
      <Box flexDirection="column" flexGrow={1} minHeight={20}>
        {stage === "input" && <InputState theme={theme} url={url} setUrl={setUrl} onSubmit={goPlan} skill={skill} doctor={doctor} mascot={mascot} />}
        {stage === "plan" && meta && plan && <PlanState theme={theme} meta={meta} plan={plan} />}
        {(stage === "run" || stage === "done") && <RunState theme={theme} progress={progress} steps={steps} />}
        {stage === "fallback" && err && <FallbackState theme={theme} err={err} />}
      </Box>

      {/* Footer / action bar */}
      <Rule theme={theme} />
      <Box>
        {stage === "input" && <Text color={t.text_l3}>[+] 直接输入即开始 · Tab 切 Skill</Text>}
        {stage === "plan" && <Text color={t.text_l3}>[确认运行 ↵]  [改配方 F5]  [取消 Esc]</Text>}
        {stage === "run" && <Text color={t.text_l3}>分析中… 取消 Esc（级联 kill）</Text>}
        {stage === "done" && <Text color={t.success}>✓ 完成 · 资产已生成（资产态待接 G3）  ＋新分析 Esc</Text>}
        {stage === "fallback" && <Text color={t.text_l3}>[重试 ↵]  [Clipper 注字幕]  [上传]  [返回 Esc]</Text>}
        <Box flexGrow={1} />
        <Text color={t.text_l4}>skill:{skill} </Text><Text color={t.accent}>🐾{mascot}</Text>
      </Box>
      <Box>
        <Text color={t.text_l4}>「2」切主题 · Esc 返回/退出 · q 退出　　mock 数据，OE_LIVE=1 接真实 REST/SSE</Text>
      </Box>
    </Box>
  );
}
