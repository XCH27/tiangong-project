/**
 * Transport abstraction — the single seam between UI and backend.
 *
 * The UI only ever talks to a `Transport`.  Today it is backed by `MockTransport`
 * (deterministic fake data + scripted SSE).  When the real backend is reachable,
 * flip USE_MOCK=false (or set ?live in the URL) and `RestTransport` takes over —
 * NO UI code changes.  Method shapes map 1:1 to docs/BACKEND.md routes.
 */
import type {
  AnalysisPlan, ChatAnswer, DoctorSummary, RecentTask,
  RunResult, SSEEvent, VideoMetadata, Depth,
} from "../types/contracts";

export interface AnalyzeRequest {
  url: string;
  skill: string;
  style?: string;
  depth: Depth;
  client_provided?: {
    subtitle?: {
      content: string;
      format: string;
      language: string;
      source: string;
    };
  };
}

export interface Transport {
  // GET  /api/v1/probe
  probe(url: string): Promise<VideoMetadata>;
  // POST /api/v1/plan
  plan(url: string, skill: string, depth: Depth): Promise<AnalysisPlan>;
  // GET  /api/v1/doctor
  doctor(): Promise<DoctorSummary>;
  // GET  /api/v1/skills
  skills(): Promise<{ name: string; depth: Depth }[]>;
  // POST /api/v1/analyze  -> task_id   then GET /tasks/{id}/events (SSE)
  analyze(req: AnalyzeRequest): Promise<{ task_id: string }>;
  // SSE stream consumer. Returns an unsubscribe fn.
  streamEvents(taskId: string, onEvent: (e: SSEEvent) => void): () => void;
  // GET  /api/v1/tasks/recent
  recentTasks(): Promise<RecentTask[]>;
  // (assembled from run assets, G3) -> what the asset view renders
  runResult(runId: string): Promise<RunResult>;
  // POST /api/v1/chat
  chat(runId: string, question: string): Promise<ChatAnswer>;
  // POST /api/v1/runs/{run_id}/export
  export(runId: string, provider: string, title: string, options: Record<string, any>): Promise<{ path: string }>;
}

// REST stub — wired to real routes, not used until USE_MOCK=false.
export class RestTransport implements Transport {
  constructor(private base = "/api/v1") {}
  private async j<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${this.base}${path}`, init);
    if (!r.ok) throw new Error(`${path} -> ${r.status}`);
    return r.json() as Promise<T>;
  }
  probe(url: string) { return this.j<VideoMetadata>(`/probe?url=${encodeURIComponent(url)}`); }
  plan(url: string, skill: string, depth: Depth) {
    return this.j<AnalysisPlan>(`/plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, skill, depth }) });
  }
  async doctor() {
    const raw = await this.j<any>(`/doctor`);
    return {
      status: raw.status === "warning" ? "warn" : (raw.status || "ok"),
      hardware: {
        platform: raw.platform || "unknown",
        cpu_architecture: raw.cpu_architecture || "unknown",
        memory_gb: raw.memory_gb || 8.0,
        memory_tier: raw.memory_tier || "low",
        ffmpeg_available: raw.ffmpeg_status === "available" || !!raw.ffmpeg_available,
        local_acceleration_hints: raw.acceleration_hints || [],
        offline_preference: !!raw.offline_preference,
        computed_tier: raw.computed_tier || "baseline"
      },
      warnings: raw.warnings || [],
      provider_chat: {
        name: "DeepSeek",
        model: "deepseek-chat",
        reachable: true
      },
      provider_vlm: {
        name: "ModelBest",
        model: "MiniCPM-V-4.6-Instruct",
        layer: "A"
      },
      offline_mode: !!raw.offline_preference
    } as DoctorSummary;
  }
  skills() {
    return this.j<{ skills: { name: string; depth: Depth }[] }>(`/skills`).then((r) => r.skills || []);
  }
  analyze(req: AnalyzeRequest) {
    return this.j<{ task_id: string }>(`/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req) });
  }
  streamEvents(taskId: string, onEvent: (e: SSEEvent) => void) {
    const cleanTaskId = taskId.split("__")[0];
    const es = new EventSource(`${this.base}/tasks/${cleanTaskId}/events`);
    let id = 0;
    
    // Explicitly listen to named events since standard onmessage ignores named SSE events in browsers
    const eventTypes = [
      "queued", "probing", "acquiring", "subtitle_check", "normalizing",
      "transcribing", "segmenting", "extracting_frames", "vlm_describing",
      "generating", "resolving_markers", "exporting", "done", "error",
      "heartbeat", "stuck"
    ];

    eventTypes.forEach((type) => {
      es.addEventListener(type, (m: MessageEvent) => {
        try {
          const data = JSON.parse(m.data);
          onEvent({
            id: ++id,
            event: type as any,
            data
          });
        } catch (err) {
          console.error(`Failed to parse SSE event type [${type}]:`, err);
        }
      });
    });

    es.onmessage = (m) => {
      try {
        const data = JSON.parse(m.data);
        onEvent({ id: ++id, event: "heartbeat", data });
      } catch (err) {
        console.error("Failed to parse fallback SSE message:", err);
      }
    };

    es.onerror = (err) => {
      console.error("EventSource connection error:", err);
    };

    return () => es.close();
  }
  async recentTasks() {
    const raw = await this.j<{ tasks: any[] }>(`/tasks/recent`);
    const tasks = raw.tasks || [];
    return tasks.map((t) => ({
      task_id: t.source_hash || t.task_id || Math.random().toString(),
      title: t.title || "未知视频",
      platform: t.platform || (t.source_hash ? "bilibili" : "local"),
      skill: t.skill || "video-note",
      state: t.state || "done",
      created_at: t.completed_at || t.created_at || new Date().toISOString(),
      run_id: t.run_id || t.source_hash || "",
    }));
  }
  runResult(runId: string) { return this.j<RunResult>(`/runs/${runId}`); }
  chat(runId: string, question: string) {
    return this.j<ChatAnswer>(`/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ run_id: runId, question }) });
  }
  export(runId: string, provider: string, title: string, options: Record<string, any>) {
    return this.j<{ path: string }>(`/runs/${runId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, title, options }),
    });
  }
}
