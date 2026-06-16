import React from "react";
import { Box, Text } from "ink";
import { getTheme, SEMANTIC, type ThemeKey } from "../theme/theme.js";
import { CardTitle, ProgressBar } from "./Bits.js";
import { PIPELINE_STEPS } from "../types/contracts.js";
import type { StepState, BackendError } from "../types/contracts.js";

const STEP_LABEL: Record<string, string> = {
  probe: "探测元数据", acquire_subtitle: "字幕 / ASR", transcribe: "分段",
  extract_frames: "抽取关键帧", vlm_describe: "VLM 描述", generate: "生成笔记", export: "导出资产",
};
const ICON: Record<string, string> = { completed: "✓", skipped: "⏭", degraded: "▽", running: "▸", failed: "✗", pending: "·" };

export function RunState({ theme, progress, steps }: { theme: ThemeKey; progress: number; steps: Record<string, StepState> }) {
  const t = getTheme(theme);
  const colorFor = (st: StepState["status"]) =>
    st === "completed" ? t.success : st === "skipped" ? t.text_l4 : st === "degraded" ? SEMANTIC.degrade
    : st === "running" ? SEMANTIC.progress : st === "failed" ? t.error : t.text_l4;
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box><CardTitle theme={theme} glyph="◐">正在分析　</CardTitle><ProgressBar frac={progress} /></Box>
      <Box flexDirection="column" marginTop={1} marginLeft={1}>
        {PIPELINE_STEPS.map((s) => {
          const st = steps[s] ?? { step: s, status: "pending" as const };
          const c = colorFor(st.status);
          return (
            <Box key={s}>
              <Text color={t.accent}>┃ </Text>
              <Text color={c}>{ICON[st.status]} </Text>
              <Text color={st.status === "pending" ? t.text_l4 : t.text_l1}>{STEP_LABEL[s].padEnd(14)}</Text>
              <Text color={t.text_l3}>{st.message ?? (st.status === "pending" ? "等待中…" : "")}</Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function FallbackState({ theme, err }: { theme: ThemeKey; err: BackendError }) {
  const t = getTheme(theme);
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <Box><Text color={t.error} bold>✗ 未能完成 · 有明确下一步</Text><Text color={t.text_l4}>          {err.code} · {err.step}</Text></Box>
      <Box marginTop={1} marginLeft={1}><Text color={t.accent}>┃ </Text><Text color={t.text_l1}>{err.message}</Text></Box>
      <Box marginLeft={1}><Text color={t.accent}>┃ </Text><Text color={t.text_l3}>建议：{err.hint}</Text></Box>
    </Box>
  );
}
