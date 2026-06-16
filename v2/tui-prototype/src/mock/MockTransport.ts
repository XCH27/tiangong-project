import type { Transport, AnalyzeRequest } from "../transport/client.js";
import type { SSEEvent, BackendError, Depth } from "../types/contracts.js";
import { mockDoctor, mockMetadata, mockPlan, mockRecentTasks } from "./data.js";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Scripted backend. Failure keyword in URL (#blocked/#ratelimit/#oom) drives fallback branches. */
export class MockTransport implements Transport {
  async probe(url: string) { await delay(500); return mockMetadata(url); }
  async plan(url: string, skill: string, depth: Depth) { await delay(420); return mockPlan(url, skill, depth); }
  async doctor() { await delay(250); return mockDoctor(); }
  async recentTasks() { await delay(180); return mockRecentTasks(); }
  async analyze(_req: AnalyzeRequest) { await delay(280); return { task_id: "tsk_mock_" + Date.now() }; }

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
    e("done", { progress: 1, run_id: "run_xyz789", output_path: "~/.omnisee_every/runs/run_xyz789/output.md" });
  }
}
