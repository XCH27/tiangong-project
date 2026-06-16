import type { Transport, AnalyzeRequest } from "../sdk/client.js";
import { toTaskRef } from "../sdk/client.js";
import type { SSEEvent, BackendError, Depth } from "../types/contracts.js";
import { DEFAULT_SKILLS, mockDoctor, mockMetadata, mockPlan, mockRecentTasks } from "./data.js";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Scripted backend. Failure keyword in URL (#blocked/#ratelimit/#oom) drives fallback branches. */
export class MockTransport implements Transport {
  async probe(url: string) { await delay(500); return mockMetadata(url); }
  async plan(url: string, skill: string, depth: Depth) { await delay(420); return mockPlan(url, skill, depth); }
  async skills() { await delay(120); return DEFAULT_SKILLS; }
  async doctor() { await delay(250); return mockDoctor(); }
  async recentTasks() { await delay(180); return mockRecentTasks(); }
  async chat(req: { question: string }, onChunk?: (chunk: string) => void) {
    await delay(160);
    const answer = req.question.includes("第 3 分钟")
      ? "第 3 分钟附近主要在解释关键帧和叙事分段如何对齐，回答会引用后端资产里的时间戳证据。"
      : "这是基于已生成资产的问答结果；真实模式下答案来自后端 /chat 检索流，而不是前端自行推理。";
    for (const chunk of answer.match(/.{1,18}/g) ?? [answer]) {
      await delay(40);
      onChunk?.(chunk);
    }
    return answer;
  }
  async exportRun(req: { runId: string; title: string }) {
    await delay(180);
    return {
      path: `tmp/exports/${req.title || req.runId}.md`,
      provider: "obsidian",
      dry_run: false,
    };
  }
  async getRunResult(runId: string) {
    await delay(260);
    return {
      run_id: runId,
      source_hash: "src_mock_result",
      metadata: mockMetadata("https://www.bilibili.com/video/BV1GJ411x7h7"),
      output_markdown: [
        "# OmniVerse Vision Mock Run",
        "",
        "## Key points",
        "- [00:00] Product framing and source context.",
        "- [00:45] Visual theme and multimodal workflow.",
        "- [02:15] Fallback path and asset export.",
        "",
        "## Evidence",
        "Frame refs and transcript spans are loaded through the backend run result contract.",
      ].join("\n"),
      segments: [
        { id: "seg_001", start: 0, end: 45, text: "Product framing and source context." },
        { id: "seg_002", start: 45, end: 135, text: "Visual theme and multimodal workflow." },
      ],
      shots: [
        {
          id: "shot_001",
          start: 15,
          key_frame_ts: 15,
          thumbnail_path: "/api/v1/frame?token=mock",
          vlm_description: { type: "visual_reference" as const, content: "A terminal UI overview frame.", confidence: 0.82, model: "mock-vlm" },
        },
      ],
      options: { skill: "video-note", depth: "with_frames" as const },
    };
  }
  async cancelTask(_taskId: string) { await delay(80); }
  async retryTask(_taskId: string) {
    await delay(160);
    return toTaskRef({ task_id: "tsk_retry_mock_" + Date.now(), source_hash: "src_retry_mock_" + Date.now() });
  }
  async analyze(_req: AnalyzeRequest) {
    await delay(280);
    return toTaskRef({ task_id: "tsk_mock_" + Date.now(), source_hash: "src_mock_" + Date.now() });
  }

  streamEvents(taskId: string, onEvent: (e: SSEEvent) => void): () => void {
    let cancelled = false;
    const fail = taskId.match(/__(.+)$/)?.[1] ?? "";
    void this.run(onEvent, () => cancelled, fail);
    return () => { cancelled = true; };
  }

  private async run(emit: (e: SSEEvent) => void, isCancelled: () => boolean, fail: string) {
    let id = 0;
    const e = (event: SSEEvent["event"], data: SSEEvent["data"]) => { if (!isCancelled()) emit({ id: ++id, event, data }); };
    e("queued", { progress: 0, message: "任务已入队" }); await delay(450);
    e("probing", { progress: 0.05, step: "probe", message: "探测视频元数据" }); await delay(650);
    if (fail === "blocked" || fail === "ratelimit") {
      await delay(350);
      const err: BackendError = fail === "blocked"
        ? { code: "DOWNLOAD_BLOCKED", step: "acquire", message: "平台风控，cookie 失效，无法直接下载。", hint: "用浏览器 Clipper 注入字幕，或手动上传本地视频/字幕文件。", retriable: true, degraded_to: null }
        : { code: "RATE_LIMITED", step: "acquire", message: "请求过于频繁，被平台限流。", hint: "稍后重试，或切换为浏览器 Clipper 通道。", retriable: true, degraded_to: null };
      e("error", { progress: 0.12, error: err }); return;
    }
    e("subtitle_check", { progress: 0.12, step: "acquire_subtitle", has_official: true, skipping_asr: true, message: "命中官方字幕，跳过 ASR" }); await delay(750);
    e("segmenting", { progress: 0.28, step: "transcribe", message: "叙事分段" }); await delay(800);
    e("extracting_frames", { progress: 0.48, step: "extract_frames", message: "按锚点抽取关键帧（每段 ≤3）" }); await delay(800);
    e("vlm_describing", { progress: 0.62, step: "vlm_describe", message: fail === "oom" ? "本地 VRAM 不足 → 降级云端 VLM" : "VLM 描述关键帧（hypothesis）" }); await delay(800);
    e("generating", { progress: 0.82, step: "generate", message: "LLM 生成图文笔记" }); await delay(950);
    e("exporting", { progress: 0.95, step: "export", message: "写出 Markdown 资产" }); await delay(600);
    e("done", { progress: 1, run_id: "run_xyz789", output_path: "tmp/workspace/runs/run_xyz789/output.md" });
  }
}
