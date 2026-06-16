import { getTheme, type ThemeKey, ansiFg, ansiReset } from "../theme/theme.js";
import { detectPlatform, PLATFORM_LABEL } from "../mock/data.js";
import type { DoctorSummary, RecentTask, SkillInfo } from "../types/contracts.js";
import { visibleWidth } from "@earendil-works/pi-tui";

const LOGO = [
  "  ____            _   __     __",
  " / __ \\____ ___  (_) / /_   / /____ ____  ___  ___",
  "/ /_/ / __ `__ \\/ / / __ \\ / / __ `/ _ \\/ _ \\(_-<",
  "\\____/_/ /_/ /_/_/ /_/ /_//_/\\__,_/\\___/\\___/___/",
];

export function renderInputState({
  theme,
  urlInputRenderedLine,
  url,
  skill,
  skills,
  doctor,
  recentTasks,
  selectedRecentIndex,
  width,
}: {
  theme: ThemeKey;
  urlInputRenderedLine: string;
  url: string;
  skill: string;
  skills: SkillInfo[];
  doctor: DoctorSummary | null;
  recentTasks: RecentTask[];
  selectedRecentIndex: number;
  width: number;
}): string[] {
  const t = getTheme(theme);
  const platform = url.trim() ? detectPlatform(url) : null;
  const predict = platform
    ? (platform === "bilibili" || platform === "youtube") ? "将走「官方字幕优先 → 跳过 ASR」"
      : platform === "local" ? "本地文件，无平台风控"
      : (platform as any) === "image" ? "截图：只走 VLM 描述，跳过下载/ASR/抽帧"
      : "可能需要降级通道（Clipper / 上传）"
    : null;

  const lines: string[] = [];
  
  lines.push("");
  
  for (const logoLine of LOGO) {
    const padded = logoLine.padStart(Math.floor((width + logoLine.length) / 2));
    lines.push(`${ansiFg(t.accent)}${padded}${ansiReset}`);
  }
  
  const title = "OmniVerse Vision";
  lines.push(`${ansiFg(t.text_l1)}\x1b[1m${title.padStart(Math.floor((width + title.length) / 2))}${ansiReset}`);
  
  const subtitle = "视界无限，洞析万象";
  lines.push(`${ansiFg(t.text_l3)}${subtitle.padStart(Math.floor((width + visibleWidth(subtitle)) / 2))}${ansiReset}`);
  lines.push("");

  const boxWidth = Math.max(24, Math.min(84, width - 2));
  const margin = Math.max(0, Math.floor((width - boxWidth) / 2));
  const indent = " ".repeat(margin);
  
  lines.push(`${indent}${ansiFg(t.border_strong)}┌${"─".repeat(boxWidth - 2)}┐${ansiReset}`);
  
  const inputLine = `${indent}${ansiFg(t.border_strong)}│ ${ansiFg(t.accent)}┃ ${ansiReset}${urlInputRenderedLine} ${ansiFg(t.border_strong)}│${ansiReset}`;
  lines.push(inputLine);
  
  lines.push(`${indent}${ansiFg(t.border_strong)}└${"─".repeat(boxWidth - 2)}┘${ansiReset}`);

  if (predict && platform) {
    const platformLabel = PLATFORM_LABEL[platform] || String(platform);
    const predictText = `▸ 识别到 ${platformLabel} · ${predict}`;
    lines.push(`${indent}${ansiFg(t.text_l3)}${predictText}${ansiReset}`);
  } else {
    lines.push("");
  }
  lines.push("");

  let skillsRow = "";
  for (const s of skills.slice(0, 8)) {
    if (s.name === skill) {
      skillsRow += `${ansiFg(t.accent)}▸${s.name}${ansiReset}  `;
    } else {
      skillsRow += `${ansiFg(t.text_l4)} ${s.name}${ansiReset}  `;
    }
  }
  skillsRow += `${ansiFg(t.text_l4)}… Tab/F→切换${ansiReset}`;
  lines.push(`${indent}${skillsRow}`);
  lines.push("");

  if (!url.trim() && recentTasks.length > 0) {
    lines.push(`${indent}${ansiFg(t.text_l4)}最近资产${ansiReset}`);
    for (const [index, item] of recentTasks.slice(0, 3).entries()) {
      const title = item.title.length > 30 ? `${item.title.slice(0, 29)}…` : item.title;
      const marker = index === selectedRecentIndex ? `${ansiFg(t.accent)}▸${ansiReset}` : " ";
      lines.push(`${indent}${marker} ${ansiFg(t.text_l3)}${title}${ansiFg(t.text_l4)} · ${item.skill}${ansiReset}`);
    }
    lines.push("");
  }

  const sysPlatform = doctor?.platform ?? "—";
  const cpuArch = doctor?.cpu_architecture ?? "—";
  const compTier = doctor?.computed_tier ?? "—";
  const ffmpegStat = doctor?.ffmpeg_status ?? "—";
  
  const doctorInfo = `系统: ${sysPlatform} (${cpuArch})  ·  算能: ${compTier}  ·  FFmpeg: ${ffmpegStat}`;
  const docPadded = doctorInfo.padStart(Math.floor((width + visibleWidth(doctorInfo)) / 2));
  lines.push(`${ansiFg(t.text_l4)}${docPadded}${ansiReset}`);
  
  return lines;
}
