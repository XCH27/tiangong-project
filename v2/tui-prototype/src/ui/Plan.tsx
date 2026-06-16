import React from "react";
import { Box, Text } from "ink";
import { getTheme, type ThemeKey } from "../theme/theme.js";
import { CardTitle, CostBadge, RiskBadge } from "./Bits.js";
import { PLATFORM_LABEL } from "../mock/data.js";
import type { AnalysisPlan, VideoMetadata } from "../types/contracts.js";

const FALLBACK_LABEL: Record<string, string> = {
  none: "无需降级", requires_browser_clipper: "需浏览器 Clipper",
  requires_user_upload: "需手动上传", cloud_asr_opt_in: "需云端 ASR 授权",
};
const TIME_LABEL: Record<string, string> = { fast: "快", moderate: "中等", slow: "较慢" };

export function PlanState({ theme, meta, plan }: { theme: ThemeKey; meta: VideoMetadata; plan: AnalysisPlan }) {
  const t = getTheme(theme);
  const dur = `${Math.floor(meta.duration / 60)}:${String(meta.duration % 60).padStart(2, "0")}`;
  const route = [...plan.planned_steps];
  return (
    <Box flexDirection="column" paddingX={1} flexGrow={1}>
      <CardTitle theme={theme}>分析计划 · 确认后再运行</CardTitle>
      <Box flexDirection="column" marginTop={1} marginLeft={1}>
        <Box><Text color={t.accent}>┃ </Text><Text color={t.text_l1} bold>{meta.title}</Text></Box>
        <Box><Text color={t.accent}>┃ </Text><Text color={t.text_l3}>{PLATFORM_LABEL[meta.platform]} · {dur} · {meta.has_official_subtitles ? `有官方字幕(${meta.subtitle_languages.join(",")})` : "无官方字幕"}</Text></Box>
        <Box><Text color={t.accent}>┃</Text></Box>
        <Box>
          <Text color={t.accent}>┃ </Text>
          <Text color={t.text_l4}>深度 </Text><Text color={t.text_l1}>{plan.chosen_depth}</Text>
          <Text color={t.text_l4}>   预计耗时 </Text><Text color={t.text_l1}>{TIME_LABEL[plan.estimated_time_bucket]}</Text>
          <Text color={t.text_l4}>   成本 </Text><CostBadge theme={theme} bucket={plan.estimated_cost_bucket} />
          <Text color={t.text_l4}>   磁盘 </Text><CostBadge theme={theme} bucket={plan.estimated_disk_bucket} />
          <Text color={t.text_l4}>   风险 </Text><RiskBadge theme={theme} risk={plan.estimated_risk} />
        </Box>
        <Box flexDirection="column">
          <Box><Text color={t.accent}>┃ </Text><Text color={t.text_l4}>路线</Text></Box>
          <Box paddingLeft={3}><Text color={t.text_l2}>{route.join("  ›  ")}</Text></Box>
        </Box>
        {plan.skipped_steps.length > 0 && <Box><Text color={t.accent}>┃ </Text><Text color={t.text_l4}>跳过 </Text><Text color={t.text_l4}>{plan.skipped_steps.join(", ")}</Text></Box>}
        <Box><Text color={t.accent}>┃ </Text><Text color={t.text_l4}>降级 </Text><Text color={t.text_l2}>{FALLBACK_LABEL[plan.expected_fallback_path]}</Text></Box>
        {plan.user_visible_warnings.map((w, i) => (
          <Box key={i}><Text color={t.accent}>┃ </Text><Text color={t.warning}>⚠ </Text><Text color={t.text_l2}>{w}</Text></Box>
        ))}
      </Box>
    </Box>
  );
}
