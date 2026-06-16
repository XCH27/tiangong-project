import React from "react";
import { Box, Text } from "ink";
import { getTheme, SEMANTIC, type ThemeKey } from "../theme/theme.js";
import type { Bucket, Risk } from "../types/contracts.js";

export function fmtTs(sec: number): string {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CardTitle({ theme, glyph = "◌", children }: { theme: ThemeKey; glyph?: string; children: React.ReactNode }) {
  const t = getTheme(theme);
  return <Text color={t.accent} bold>{glyph} {children}</Text>;
}

export function CostBadge({ theme, bucket }: { theme: ThemeKey; bucket: Bucket }) {
  const label: Record<Bucket, string> = { free: "免费", low: "低", medium: "中", high: "高" };
  const color = bucket === "free" ? SEMANTIC.progress : bucket === "high" ? SEMANTIC.fallback : SEMANTIC.cost;
  return <Text color={color}>[{label[bucket]}]</Text>;
}

export function RiskBadge({ theme, risk }: { theme: ThemeKey; risk: Risk }) {
  const t = getTheme(theme);
  const label: Record<Risk, string> = { low: "低风险", medium: "中风险", high: "高风险" };
  const color = risk === "low" ? t.success : risk === "medium" ? t.warning : t.error;
  return <Text color={color}>[{label[risk]}]</Text>;
}

/** A 16-wide block progress bar like V1's progress_markup. */
export function ProgressBar({ frac, width = 24 }: { frac: number; width?: number }) {
  const f = Math.max(0, Math.min(1, frac));
  const fw = f * width;
  const full = Math.floor(fw);
  const rem = fw - full;
  let bar = "█".repeat(full);
  if (full < width) {
    bar += rem > 0.75 ? "▓" : rem > 0.5 ? "▒" : rem > 0.25 ? "░" : "╌";
    bar += "╌".repeat(Math.max(0, width - full - 1));
  }
  return <Text color={SEMANTIC.progress}>{bar} {Math.round(f * 100)}%</Text>;
}

export function Rule({ theme, width = 78 }: { theme: ThemeKey; width?: number }) {
  const t = getTheme(theme);
  return <Text color={t.border_subtle}>{"─".repeat(width)}</Text>;
}
