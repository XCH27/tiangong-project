import type {
  AnalysisPlan, DoctorSummary, RecentTask, RunResult, VideoMetadata, Depth, Platform,
} from "../types/contracts";

export const MOCK_SKILLS: { name: string; depth: Depth }[] = [
  { name: "video-note", depth: "text_only" },
  { name: "summary", depth: "text_only" },
  { name: "chapters", depth: "text_only" },
  { name: "transcript-only", depth: "text_only" },
  { name: "course-outline", depth: "with_frames" },
  { name: "video-blog", depth: "with_frames" },
  { name: "video-note-visual", depth: "with_frames" },
  { name: "video-note-academic", depth: "text_only" },
  { name: "video-note-casual", depth: "text_only" },
  { name: "video-note-xiaohongshu", depth: "text_only" },
  { name: "video-mindmap", depth: "text_only" },
  { name: "storyboard", depth: "with_frames" },
  { name: "shot-breakdown", depth: "with_vlm" },
  { name: "reverse-prompt", depth: "with_vlm" },
  { name: "ad-analysis", depth: "with_vlm" },
  { name: "video-ask", depth: "text_only" },
  { name: "corpus-build", depth: "text_only" },
];

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("bilibili.com") || u.includes("b23.tv")) return "bilibili";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("douyin.com")) return "douyin";
  if (u.includes("kuaishou.com")) return "kuaishou";
  if (u.includes("xiaohongshu.com")) return "xiaohongshu";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("x.com") || u.includes("twitter.com")) return "x";
  if (u.startsWith("/") || u.startsWith("~") || u.includes(":\\")) return "local";
  return "web";
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  bilibili: "B站", youtube: "YouTube", douyin: "抖音", kuaishou: "快手",
  xiaohongshu: "小红书", instagram: "Instagram", x: "X", local: "本地媒体", web: "网页视频",
};

export function mockMetadata(url: string): VideoMetadata {
  const platform = detectPlatform(url);
  const hasSubs = platform === "bilibili" || platform === "youtube";
  return {
    schema_version: 1,
    source_hash: "abc123def4567890",
    url,
    title: platform === "bilibili"
      ? "【机器学习】30 分钟搞懂 Transformer 注意力机制"
      : "Demo Video · " + PLATFORM_LABEL[platform],
    duration: 1834,
    platform,
    uploader: "示例 UP 主",
    upload_date: "2026-05-20",
    language: "zh",
    has_official_subtitles: hasSubs,
    subtitle_languages: hasSubs ? ["zh-Hans", "en"] : [],
    thumbnail_url: "",
    tags: ["机器学习", "教程", "深度学习"],
  };
}

// AnalysisPlan keyed by platform — exercises every fallback path honestly.
export function mockPlan(url: string, _skill: string, depth: Depth): AnalysisPlan {
  const platform = detectPlatform(url);
  const wantsFrames = depth !== "text_only";
  const base: AnalysisPlan = {
    chosen_depth: depth,
    planned_steps: ["probe", "acquire_subtitle", "extract_narrative", "llm_generate", "marker_resolve", "export"],
    skipped_steps: [],
    degraded_steps: [],
    expected_fallback_path: "none",
    estimated_risk: "low",
    estimated_cost_bucket: "free",
    estimated_time_bucket: "fast",
    estimated_disk_bucket: "low",
    user_visible_warnings: [],
  };
  if (wantsFrames) {
    base.planned_steps.splice(3, 0, "download_video", "extract_frames", "visual_caption");
    base.estimated_disk_bucket = "medium";
    base.estimated_time_bucket = "moderate";
  }
  if (platform === "bilibili" || platform === "youtube") {
    base.skipped_steps = ["transcribe"];
    base.user_visible_warnings = ["检测到官方字幕 → 跳过 ASR 转写，速度更快、成本为零。"];
  } else if (platform === "douyin" || platform === "kuaishou") {
    base.estimated_risk = "medium";
    base.estimated_cost_bucket = "low";
    base.user_visible_warnings = ["短视频平台可能需要下载媒体；若风控失败将请你上传文件。"];
  } else if (platform === "xiaohongshu" || platform === "instagram" || platform === "x") {
    base.expected_fallback_path = "requires_browser_clipper";
    base.estimated_risk = "high";
    base.user_visible_warnings = [
      "高风控平台：不承诺直接抓取。",
      "建议用浏览器 Clipper 注入字幕，或手动上传字幕/视频文件。",
    ];
  } else if (platform === "web") {
    base.expected_fallback_path = "requires_user_upload";
    base.estimated_risk = "medium";
    base.user_visible_warnings = ["未识别平台：探测后可能需要你提供本地文件。"];
  }
  return base;
}

export function mockDoctor(): DoctorSummary {
  return {
    status: "warn",
    hardware: {
      platform: "darwin", cpu_architecture: "arm64", memory_gb: 16,
      memory_tier: "medium", ffmpeg_available: true,
      local_acceleration_hints: ["mps"], offline_preference: false,
      computed_tier: "accelerated",
    },
    warnings: ["本地 VRAM 适中：with_vlm 深度建议云端 VLM，避免 OOM。"],
    provider_chat: { name: "deepseek", model: "deepseek-chat", reachable: true },
    provider_vlm: { name: "modelbest", model: "MiniCPM-V-4.6-Instruct", layer: "A" },
    offline_mode: false,
  };
}

export function mockRecentTasks(): RecentTask[] {
  return [
    { task_id: "tsk_a1", title: "30 分钟搞懂 Transformer", platform: "bilibili", skill: "video-note", state: "done", created_at: "2026-05-31 09:12", run_id: "run_xyz789" },
    { task_id: "tsk_a2", title: "Diffusion 模型原理精讲", platform: "youtube", skill: "course-outline", state: "done", created_at: "2026-05-30 22:40", run_id: "run_def456" },
    { task_id: "tsk_a3", title: "新品广告片拆解", platform: "douyin", skill: "ad-analysis", state: "failed", created_at: "2026-05-30 18:05" },
    { task_id: "tsk_a4", title: "城市夜景 vlog", platform: "xiaohongshu", skill: "reverse-prompt", state: "queued", created_at: "2026-05-31 10:01" },
  ];
}

const SAMPLE_MD = `# 30 分钟搞懂 Transformer 注意力机制

> 来源：B站 · 示例 UP 主 · 30:34 · 官方字幕（已跳过 ASR）

## 一、为什么需要注意力 \`[00:42]\`
传统 RNN 串行处理序列，长依赖会衰减。注意力让每个 token 直接看到全序列，
并行度更高。

## 二、QKV 是什么 \`[04:18]\`
- **Query**：当前 token 想问什么
- **Key**：每个 token 能回答什么
- **Value**：实际被取走的信息

讲者在白板上写出 \`softmax(QKᵀ/√d)V\` 的公式 \`▣ 06:21\`。

## 三、多头注意力 \`[11:05]\`
把表示拆成多个子空间并行做注意力，再拼接，捕捉不同关系。

## 四、小结 \`[27:50]\`
注意力 = 可学习的、内容寻址的信息路由。`;

export function mockRunResult(runId: string): RunResult {
  return {
    run_id: runId,
    source_hash: "abc123def4567890",
    metadata: mockMetadata("https://www.bilibili.com/video/BV1xx"),
    output_markdown: SAMPLE_MD,
    segments: [
      { id: "seg_001", start: 42, end: 110, text: "传统 RNN 串行处理序列，长依赖会衰减…", tags: ["intro"] },
      { id: "seg_002", start: 258, end: 372, text: "Query / Key / Value 的直觉…", tags: ["definition"] },
      { id: "seg_003", start: 665, end: 780, text: "多头注意力把表示拆成多个子空间…", tags: ["core"] },
      { id: "seg_004", start: 1670, end: 1834, text: "注意力是可学习的信息路由…", tags: ["summary"] },
    ],
    shots: [
      {
        id: "shot_001", start: 360, key_frame_ts: 381, thumbnail_path: "frames/thumb_381.jpg",
        vlm_description: { type: "visual_reference", content: "讲者站在白板前，白板上写着 softmax(QKᵀ/√d)V 公式", confidence: 0.72, model: "MiniCPM-V-4.6-Instruct" },
      },
    ],
    options: { skill: "video-note", depth: "text_only" },
  };
}

export function mockChat(question: string): { answer: string; citations: { ts: number; segment_id: string; text: string }[] } {
  return {
    answer: `根据视频内容，${question.includes("QKV") || question.includes("注意力") ? "Query 表示“当前 token 想问什么”，Key 表示“每个 token 能回答什么”，Value 是实际取走的信息；三者通过 softmax(QKᵀ/√d)V 完成内容寻址的信息路由。" : "该问题在视频 04:18 与 11:05 附近有直接讲解，已附出处。"}`,
    citations: [
      { ts: 258, segment_id: "seg_002", text: "Query / Key / Value 的直觉…" },
      { ts: 665, segment_id: "seg_003", text: "多头注意力把表示拆成多个子空间…" },
    ],
  };
}
