import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { App } from "./App.js";
import { DEFAULT_SKILLS, mockDoctor, mockMetadata, mockPlan, mockRecentTasks } from "../mock/data.js";
import { toTaskRef, type AnalyzeRequest, type Transport } from "../sdk/client.js";
import type { AnalysisPlan, Depth, SSEEvent, VideoMetadata } from "../types/contracts.js";

class FakeTransport implements Transport {
  probeCalls = 0;
  planCalls: Array<{ url: string; skill: string; depth: Depth; metadata?: VideoMetadata }> = [];
  analyzeRequests: AnalyzeRequest[] = [];

  async probe(_url: string): Promise<VideoMetadata> {
    this.probeCalls += 1;
    throw new Error("client-provided route must not probe remote media");
  }

  async plan(url: string, skill: string, depth: Depth, metadata?: VideoMetadata): Promise<AnalysisPlan> {
    this.planCalls.push({ url, skill, depth, metadata });
    return {
      ...mockPlan(url, skill, depth),
      expected_fallback_path: "requires_browser_clipper",
      estimated_risk: "high",
    };
  }

  async skills() { return DEFAULT_SKILLS; }
  async doctor() { return mockDoctor(); }
  async recentTasks() { return mockRecentTasks(); }
  async analyze(req: AnalyzeRequest) {
    this.analyzeRequests.push(req);
    return toTaskRef({ task_id: "tsk_client_provided", source_hash: "src_client_provided" });
  }
  async getRunResult(runId: string) {
    return {
      run_id: runId,
      source_hash: "src_client_provided",
      metadata: mockMetadata("https://example.com/high-risk-video"),
      output_markdown: "",
      segments: [],
      shots: [],
      options: { skill: "note", depth: "text_only" as const },
    };
  }
  async chat() { return ""; }
  async exportRun() { return {}; }
  async cancelTask() {}
  async retryTask() { return toTaskRef({ task_id: "tsk_retry", source_hash: "src_retry" }); }
  streamEvents(_taskId: string, _onEvent: (e: SSEEvent) => void) { return () => {}; }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ovv-v2-client-provided-"));
const handoff = path.join(tmp, "handoff.json");
fs.writeFileSync(
  handoff,
  JSON.stringify({
    source: "https://example.com/high-risk-video",
    subtitle: {
      content: "1\n00:00:00,000 --> 00:00:01,000\nhello from clipper\n",
      format: "srt",
      language: "zh-Hans",
    },
  }),
  "utf-8"
);

const fakeTui = {
  setFocus() {},
  requestRender() {},
  stop() {},
} as any;
const transport = new FakeTransport();
const app = new App(fakeTui, transport, {
  live: false,
  apiUrl: "http://127.0.0.1:8000",
  exportDir: "tmp/exports",
  offline: false,
  path: path.join(tmp, "v2.json"),
});

let failed = false;
function assert(condition: unknown, message: string) {
  if (!condition) {
    console.error(message);
    failed = true;
  }
}

const composerValue = `https://example.com/high-risk-video :: ${handoff}`;
app.urlInput.setValue(composerValue);
await app.goPlan(composerValue);
assert(transport.probeCalls === 0, "client-provided plan called probe()");
assert(transport.planCalls.length === 1, "client-provided route did not call plan()");
assert(transport.planCalls[0]?.metadata?.title.includes("Client-provided subtitle"), "plan metadata was not client-provided");
assert(transport.planCalls[0]?.depth === "text_only", "client-provided route did not force text_only plan depth");
assert(app.stage === "plan", "app did not enter plan stage");
assert(app.plan?.expected_fallback_path === "none", "client-provided plan should clear remote fallback path");
assert(app.plan?.skipped_steps.includes("remote_probe"), "client-provided plan did not mark remote_probe skipped");

await app.goRun();
assert(transport.analyzeRequests.length === 1, "client-provided route did not submit analyze request");
assert(transport.analyzeRequests[0]?.depth === "text_only", "client-provided analyze did not use text_only depth");
assert(Boolean(transport.analyzeRequests[0]?.client_provided?.subtitle?.content), "client-provided subtitle missing from analyze request");

fs.rmSync(tmp, { recursive: true, force: true });
if (failed) process.exit(1);
console.log("client-provided route check passed");
