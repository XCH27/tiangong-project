import { getTheme, SEMANTIC, type ThemeKey, ansiFg, ansiReset } from "../theme/theme.js";
import type { Bucket, Risk } from "../types/contracts.js";

export function fmtTs(sec: number): string {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CardTitle({ theme, glyph = "◌", text }: { theme: ThemeKey; glyph?: string; text: string }): string {
  const t = getTheme(theme);
  return `${ansiFg(t.accent)}\x1b[1m${glyph} ${text}${ansiReset}`;
}

export function CostBadge({ theme, bucket }: { theme: ThemeKey; bucket: Bucket }): string {
  const label: Record<Bucket, string> = { free: "免费", low: "低", medium: "中", high: "高" };
  const color = bucket === "free" ? SEMANTIC.progress : bucket === "high" ? SEMANTIC.fallback : SEMANTIC.cost;
  return `${ansiFg(color)}[${label[bucket]}]${ansiReset}`;
}

export function RiskBadge({ theme, risk }: { theme: ThemeKey; risk: Risk }): string {
  const t = getTheme(theme);
  const label: Record<Risk, string> = { low: "低风险", medium: "中风险", high: "高风险" };
  const color = risk === "low" ? t.success : risk === "medium" ? t.warning : t.error;
  return `${ansiFg(color)}[${label[risk]}]${ansiReset}`;
}

export function ProgressBar({ frac, width = 24 }: { frac: number; width?: number }): string {
  const f = Math.max(0, Math.min(1, frac));
  const fw = f * width;
  const full = Math.floor(fw);
  const rem = fw - full;
  let bar = "█".repeat(full);
  if (full < width) {
    bar += rem > 0.75 ? "▓" : rem > 0.5 ? "▒" : rem > 0.25 ? "░" : "╌";
    bar += "╌".repeat(Math.max(0, width - full - 1));
  }
  return `${ansiFg(SEMANTIC.progress)}${bar} ${Math.round(f * 100)}%${ansiReset}`;
}

export function Rule({ theme, width = 78 }: { theme: ThemeKey; width?: number }): string {
  const t = getTheme(theme);
  return `${ansiFg(t.border_subtle)}${"─".repeat(width)}${ansiReset}`;
}
