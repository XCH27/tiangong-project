import { getTheme, type ThemeKey, ansiFg, ansiReset } from "../theme/theme.js";
import { CardTitle, CostBadge, RiskBadge } from "./Bits.js";
import { PLATFORM_LABEL } from "../mock/data.js";
import type { AnalysisPlan, VideoMetadata } from "../types/contracts.js";

const FALLBACK_LABEL: Record<string, string> = {
  none: "无需降级",
  requires_browser_clipper: "需浏览器 Clipper",
  requires_user_upload: "需手动上传",
  cloud_asr_opt_in: "需云端 ASR 授权",
};
const TIME_LABEL: Record<string, string> = { fast: "快", moderate: "中等", slow: "较慢" };

export function renderPlanState({
  theme,
  meta,
  plan,
  width,
}: {
  theme: ThemeKey;
  meta: VideoMetadata;
  plan: AnalysisPlan;
  width: number;
}): string[] {
  const t = getTheme(theme);
  const dur = `${Math.floor(meta.duration / 60)}:${String(meta.duration % 60).padStart(2, "0")}`;
  const route = [...plan.planned_steps];
  
  const lines: string[] = [];
  lines.push(CardTitle({ theme, glyph: "✿", text: "分析计划 · 确认后再运行 (Enter 运行，Esc 返回)" }));
  lines.push("");
  
  lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l1)}\x1b[1m${meta.title}${ansiReset}`);
  lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l3)}${(PLATFORM_LABEL as any)[meta.platform] || String(meta.platform)} · ${dur} · ${meta.has_official_subtitles ? `有官方字幕(${meta.subtitle_languages.join(",")})` : "无官方字幕"}${ansiReset}`);
  lines.push(`  ${ansiFg(t.accent)}┃${ansiReset}`);
  
  const cost = CostBadge({ theme, bucket: plan.estimated_cost_bucket });
  const disk = CostBadge({ theme, bucket: plan.estimated_disk_bucket });
  const risk = RiskBadge({ theme, risk: plan.estimated_risk });
  
  lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l4)}深度 ${ansiFg(t.text_l1)}${plan.chosen_depth}${ansiFg(t.text_l4)}   预计耗时 ${ansiFg(t.text_l1)}${TIME_LABEL[plan.estimated_time_bucket] || plan.estimated_time_bucket}${ansiFg(t.text_l4)}   成本 ${cost}${ansiFg(t.text_l4)}   磁盘 ${disk}${ansiFg(t.text_l4)}   风险 ${risk}${ansiReset}`);
  
  lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l4)}路线${ansiReset}`);
  lines.push(`    ${ansiFg(t.text_l2 || "#888888")}${route.join("  ›  ")}${ansiReset}`);
  
  if (plan.skipped_steps.length > 0) {
    lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l4)}跳过 ${plan.skipped_steps.join(", ")}${ansiReset}`);
  }
  
  lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.text_l4)}降级 ${ansiFg(t.text_l2 || "#888888")}${FALLBACK_LABEL[plan.expected_fallback_path] || plan.expected_fallback_path}${ansiReset}`);
  
  for (const w of plan.user_visible_warnings) {
    lines.push(`  ${ansiFg(t.accent)}┃ ${ansiFg(t.warning || t.accent)}⚠ ${ansiFg(t.text_l2 || "#888888")}${w}${ansiReset}`);
  }
  
  return lines;
}
