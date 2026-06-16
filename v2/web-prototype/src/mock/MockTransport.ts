import type { Transport, AnalyzeRequest } from "../transport/client";
import type { SSEEvent, BackendError } from "../types/contracts";
import {
  MOCK_SKILLS, mockChat, mockDoctor, mockMetadata,
  mockPlan, mockRecentTasks, mockRunResult,
} from "./data";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Scripted backend. Drives the four-state flow with realistic timing and,
 * crucially, the failure/fallback branches (DOWNLOAD_BLOCKED, RATE_LIMITED,
 * requires_browser_clipper) so the UI's "明确下一步动作" can be exercised.
 *
 * Trigger a failure on purpose by putting a keyword in the URL:
 *   ...#blocked   -> DOWNLOAD_BLOCKED  (requires_browser_clipper / upload)
 *   ...#ratelimit -> RATE_LIMITED
 *   ...#oom       -> OOM_VRAM degrade
 */
export class MockTransport implements Transport {
  async probe(url: string) { await delay(550); return mockMetadata(url); }
  async plan(url: string, skill: string, depth: import("../types/contracts").Depth) {
    await delay(450); return mockPlan(url, skill, depth);
  }
  async doctor() { await delay(300); return mockDoctor(); }
  async skills() { await delay(120); return MOCK_SKILLS; }
  async recentTasks() { await delay(200); return mockRecentTasks(); }
  async runResult(runId: string) { await delay(400); return mockRunResult(runId); }
  async chat(_runId: string, q: string) { await delay(700); return mockChat(q); }
  async export(_runId: string, _provider: string, title: string, _options: Record<string, any>) {
    await delay(300);
    return { path: `/mock/vault/${title}.md` };
  }

  async analyze(_req: AnalyzeRequest) { await delay(300); return { task_id: "tsk_mock_" + Date.now() }; }

  streamEvents(taskId: string, onEvent: (e: SSEEvent) => void): () => void {
    let cancelled = false;
    const url = (taskId.match(/__(.+)$/)?.[1]) ?? "";
    const fail = url; // failure keyword embedded by App when building task
    void this.run(onEvent, () => cancelled, fail);
    return () => { cancelled = true; };
  }

  private async run(emit: (e: SSEEvent) => void, isCancelled: () => boolean, fail: string) {
    let id = 0;
    const e = (event: SSEEvent["event"], data: SSEEvent["data"]) => { if (!isCancelled()) emit({ id: ++id, event, data }); };

    e("queued", { progress: 0, message: "任务已入队" }); await delay(500);
    e("probing", { progress: 0.05, step: "probe", message: "探测视频元数据" }); await delay(700);

    if (fail === "blocked") {
      await delay(400);
      const err: BackendError = {
        code: "DOWNLOAD_BLOCKED", step: "acquire",
        message: "平台风控，cookie 失效，无法直接下载。",
        hint: "用浏览器 Clipper 注入字幕，或手动上传本地视频/字幕文件。",
        retriable: true, degraded_to: null,
      };
      e("error", { progress: 0.12, error: err }); return;
    }
    if (fail === "ratelimit") {
      await delay(400);
      const err: BackendError = {
        code: "RATE_LIMITED", step: "acquire",
        message: "请求过于频繁，被平台限流。",
        hint: "稍后重试，或切换为浏览器 Clipper 通道。",
        retriable: true, degraded_to: null,
      };
      e("error", { progress: 0.1, error: err }); return;
    }

    e("subtitle_check", { progress: 0.12, step: "acquire_subtitle", has_official: true, skipping_asr: true, message: "命中官方字幕，跳过 ASR" }); await delay(800);
    e("segmenting", { progress: 0.25, step: "transcribe", message: "句/段边界划分" }); await delay(900);
    e("extracting_frames", { progress: 0.45, step: "extract_frames", message: "按锚点抽取关键帧（每段 ≤3）" }); await delay(900);

    if (fail === "oom") {
      e("vlm_describing", { progress: 0.6, step: "vlm_describe", message: "本地 VRAM 不足 → 降级云端 VLM（modelbest.cn）" }); await delay(900);
    } else {
      e("vlm_describing", { progress: 0.6, step: "vlm_describe", message: "VLM 描述关键帧（hypothesis，降权）" }); await delay(900);
    }
    e("generating", { progress: 0.8, step: "generate", message: "LLM 生成图文笔记" }); await delay(1100);
    e("exporting", { progress: 0.95, step: "export", message: "写出 Markdown 资产" }); await delay(700);
    e("done", { progress: 1, run_id: "run_xyz789", output_path: "~/.omnisee_every/runs/run_xyz789/output.md" });
  }
}
