export const DEFAULT_SKILLS = [
    { name: "note", depth: "with_vlm", description: "Structured time-aligned video note." },
    { name: "extract", depth: "text_only", description: "Extract facts, quotes, and structured data." },
    { name: "repurpose", depth: "text_only", description: "Rewrite media into article or social copy." },
    { name: "visual", depth: "with_vlm", description: "Analyze UI, scene, composition, and visual evidence." },
    { name: "chat", depth: "text_only", description: "Ask questions against generated assets." },
    { name: "index", depth: "with_frames", description: "Build reusable retrieval corpus." },
    { name: "transcript", depth: "text_only", description: "Export raw transcript." },
    { name: "reverse-prompt", depth: "with_vlm", description: "Reverse engineer an image or frame into a generation prompt." },
];
export function detectPlatform(url) {
    const u = url.toLowerCase();
    if (u.includes("bilibili.com") || u.includes("b23.tv"))
        return "bilibili";
    if (u.includes("youtube.com") || u.includes("youtu.be"))
        return "youtube";
    if (u.includes("douyin.com"))
        return "douyin";
    if (u.includes("kuaishou.com"))
        return "kuaishou";
    if (u.includes("xiaohongshu.com"))
        return "xiaohongshu";
    if (u.includes("instagram.com"))
        return "instagram";
    if (u.includes("x.com") || u.includes("twitter.com"))
        return "x";
    if (u.startsWith("/") || u.startsWith("~") || u.includes(":\\"))
        return "local";
    return "web";
}
export const PLATFORM_LABEL = {
    bilibili: "B站", youtube: "YouTube", douyin: "抖音", kuaishou: "快手",
    xiaohongshu: "小红书", instagram: "Instagram", x: "X", local: "本地媒体", web: "网页视频",
};
export function mockMetadata(url) {
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
export function mockPlan(url, _skill, depth) {
    const platform = detectPlatform(url);
    const wantsFrames = depth !== "text_only";
    const base = {
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
    }
    else if (platform === "douyin" || platform === "kuaishou") {
        base.estimated_risk = "medium";
        base.estimated_cost_bucket = "low";
        base.user_visible_warnings = ["短视频平台可能需要下载媒体；若风控失败将请你上传文件。"];
    }
    else if (platform === "xiaohongshu" || platform === "instagram" || platform === "x") {
        base.expected_fallback_path = "requires_browser_clipper";
        base.estimated_risk = "high";
        base.user_visible_warnings = [
            "高风控平台：不承诺直接抓取。",
            "建议用浏览器 Clipper 注入字幕，或手动上传字幕/视频文件。",
        ];
    }
    else if (platform === "web") {
        base.expected_fallback_path = "requires_user_upload";
        base.estimated_risk = "medium";
        base.user_visible_warnings = ["未识别平台：探测后可能需要你提供本地文件。"];
    }
    return base;
}
export function mockDoctor() {
    return {
        status: "warn",
        platform: "darwin",
        cpu_architecture: "arm64",
        memory_gb: 16,
        memory_tier: "medium",
        ffmpeg_status: "available",
        acceleration_hints: ["mps"],
        computed_tier: "accelerated",
        offline_preference: false,
        warnings: ["本地 VRAM 适中：with_vlm 深度建议云端 VLM，避免 OOM。"],
    };
}
export function mockRecentTasks() {
    return [
        { source_hash: "abc123def4567890", title: "30 分钟搞懂 Transformer 注意力机制", thumbnail_url: "", completed_at: "2026-05-31T09:12:00Z", skill: "video-note", run_id: "run_recent_transformer" },
        { source_hash: "def4567890abc123", title: "Diffusion 模型原理精讲", thumbnail_url: "", completed_at: "2026-05-30T22:40:00Z", skill: "course-outline", run_id: "run_recent_diffusion" },
        { source_hash: "xyz7890abc123def", title: "新品广告片拆解", thumbnail_url: "", completed_at: "2026-05-30T18:05:00Z", skill: "ad-analysis", run_id: "run_recent_ad" },
        { source_hash: "123def4567890abc", title: "城市夜景 vlog", thumbnail_url: "", completed_at: "2026-05-31T10:01:00Z", skill: "reverse-prompt", run_id: "run_recent_vlog" },
    ];
}
