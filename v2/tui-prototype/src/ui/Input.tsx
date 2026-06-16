import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { getTheme, type ThemeKey } from "../theme/theme.js";
import { detectPlatform, PLATFORM_LABEL, MOCK_SKILLS } from "../mock/data.js";
import type { DoctorSummary } from "../types/contracts.js";

const LOGO = [
  "  ____            _   __     __",
  " / __ \\____ ___  (_) / /_   / /____ ____  ___  ___",
  "/ /_/ / __ `__ \\/ / / __ \\ / / __ `/ _ \\/ _ \\(_-<",
  "\\____/_/ /_/ /_/_/ /_/ /_//_/\\__,_/\\___/\\___/___/",
];

export function InputState({ theme, url, setUrl, onSubmit, skill, doctor, mascot }: {
  theme: ThemeKey; url: string; setUrl: (s: string) => void; onSubmit: () => void;
  skill: string; doctor: DoctorSummary | null; mascot: string;
}) {
  const t = getTheme(theme);
  const platform = url.trim() ? detectPlatform(url) : null;
  const predict = platform
    ? (platform === "bilibili" || platform === "youtube") ? "将走「官方字幕优先 → 跳过 ASR」"
      : platform === "local" ? "本地文件，无平台风控"
      : platform === "image" as never ? "截图：只走 VLM 描述，跳过下载/ASR/抽帧"
      : "可能需要降级通道（Clipper / 上传）"
    : null;

  return (
    <Box flexDirection="column" alignItems="center" flexGrow={1} justifyContent="center">
      <Box flexDirection="column" alignItems="center" marginBottom={1}>
        {LOGO.map((l, i) => <Text key={i} color={t.accent} bold>{l}</Text>)}
        <Text color={t.text_l1} bold>OmniVerse Vision</Text>
        <Text color={t.text_l3}>视界无限，洞析万象</Text>
      </Box>

      <Box width={84} borderStyle="round" borderColor={t.border_strong} paddingX={1}>
        <Text color={t.accent}>{"┃ "}</Text>
        <Text color={t.text_l3}>{"> "}</Text>
        <TextInput value={url} onChange={setUrl} onSubmit={onSubmit}
          placeholder="贴 B站/YouTube 链接、拖文件、截图，或直接问视频里的事…" />
      </Box>
      {predict && <Box width={84}><Text color={t.text_l3}>▸ 识别到 </Text><Text color={t.accent} bold>{PLATFORM_LABEL[platform!]}</Text><Text color={t.text_l3}> · {predict}</Text></Box>}

      <Box width={84} marginTop={1} flexWrap="wrap">
        {MOCK_SKILLS.slice(0, 8).map((s) => (
          <Text key={s.name} color={s.name === skill ? t.accent : t.text_l4}>{s.name === skill ? `▸${s.name}` : ` ${s.name}`}  </Text>
        ))}
        <Text color={t.text_l4}>… F→全部</Text>
      </Box>

      <Box marginTop={1}>
        <Text color={t.text_l4}>对话模型 </Text><Text color={t.text_l3}>{doctor?.provider_chat.model ?? "—"}</Text>
        <Text color={t.text_l4}>   ·   眼睛 </Text><Text color={t.text_l3}>{doctor?.provider_vlm.model ?? "—"}(Layer {doctor?.provider_vlm.layer ?? "A"})</Text>
        <Text color={t.text_l4}>   ·   硬件 </Text><Text color={t.text_l3}>{doctor?.hardware.computed_tier ?? "—"}</Text>
      </Box>
    </Box>
  );
}
