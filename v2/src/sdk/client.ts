/**
 * TypeScript RestTransport client — connects natively to Python REST & SSE endpoints
 * using Node.js built-in fetch and streams.
 */

import type {
  AnalysisPlan,
  DoctorSummary,
  RecentTask,
  RunResult,
  SkillInfo,
  SSEEvent,
  TaskRef,
  VideoMetadata,
  Depth
} from "../types/contracts.js";

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

export interface ChatRequest {
  question: string;
  source_hash: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  attachments?: Array<{ type: string; description: string }>;
}

export interface ExportRunRequest {
  runId: string;
  provider: "obsidian" | "notion" | "feishu";
  title: string;
  options: Record<string, unknown>;
}

export interface ExportRunResult {
  path?: string;
  url?: string;
  [key: string]: unknown;
}

export interface Transport {
  probe(url: string): Promise<VideoMetadata>;
  plan(url: string, skill: string, depth: Depth, metadata?: VideoMetadata): Promise<AnalysisPlan>;
  skills(): Promise<SkillInfo[]>;
  doctor(): Promise<DoctorSummary>;
  analyze(req: AnalyzeRequest): Promise<TaskRef>;
  getRunResult(runId: string): Promise<RunResult>;
  chat(req: ChatRequest, onChunk?: (chunk: string) => void): Promise<string>;
  exportRun(req: ExportRunRequest): Promise<ExportRunResult>;
  cancelTask(taskId: string): Promise<void>;
  retryTask(taskId: string): Promise<TaskRef>;
  streamEvents(taskId: string, onEvent: (e: SSEEvent) => void): () => void;
  recentTasks(): Promise<RecentTask[]>;
}

export class RestTransport implements Transport {
  private baseUrl: string;

  constructor(baseUrl: string = "http://127.0.0.1:8000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async probe(url: string): Promise<VideoMetadata> {
    const res = await fetch(`${this.baseUrl}/api/v1/probe?url=${encodeURIComponent(url)}`);
    if (!res.ok) {
      throw new Error(`Failed to probe metadata: ${res.status} ${res.statusText}`);
    }
    return await res.json() as VideoMetadata;
  }

  async plan(url: string, skill: string, depth: Depth, metadata?: VideoMetadata): Promise<AnalysisPlan> {
    const res = await fetch(`${this.baseUrl}/api/v1/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, skill, depth, ...(metadata ? { metadata } : {}) }),
    });
    if (!res.ok) {
      throw new Error(`Failed to generate AnalysisPlan: ${res.status} ${res.statusText}`);
    }
    return await res.json() as AnalysisPlan;
  }

  async skills(): Promise<SkillInfo[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/skills`);
    if (!res.ok) {
      throw new Error(`Failed to retrieve skills: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { skills: SkillInfo[] };
    return data.skills || [];
  }

  async doctor(): Promise<DoctorSummary> {
    const res = await fetch(`${this.baseUrl}/api/v1/doctor`);
    if (!res.ok) {
      throw new Error(`Failed to run doctor selfcheck: ${res.status} ${res.statusText}`);
    }
    return await res.json() as DoctorSummary;
  }

  async analyze(req: AnalyzeRequest): Promise<TaskRef> {
    const { url, ...rest } = req;
    const res = await fetch(`${this.baseUrl}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: url, ...rest }),
    });
    if (!res.ok) {
      throw new Error(`Failed to submit analyze task: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { task_id: string; source_hash: string };
    return toTaskRef(data);
  }

  async recentTasks(): Promise<RecentTask[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/tasks/recent`);
    if (!res.ok) {
      throw new Error(`Failed to retrieve recent tasks: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { tasks: RecentTask[] };
    return data.tasks || [];
  }

  async getRunResult(runId: string): Promise<RunResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/runs/${encodeURIComponent(runId)}`);
    if (!res.ok) {
      throw new Error(`Failed to retrieve run result: ${res.status} ${res.statusText}`);
    }
    return await res.json() as RunResult;
  }

  async chat(req: ChatRequest, onChunk?: (chunk: string) => void): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok || !res.body) {
      throw new Error(`Failed to ask asset question: ${res.status} ${res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const citationMarker = "[CITATIONS]";
    let answer = "";
    let pending = "";
    let citationMode = false;
    let doneReading = false;
    const emitSafeText = () => {
      if (citationMode) return;
      const markerIndex = pending.indexOf(citationMarker);
      if (markerIndex >= 0) {
        const clean = pending.slice(0, markerIndex).trimEnd();
        if (clean) {
          answer += clean;
          onChunk?.(clean);
        }
        pending = "";
        citationMode = true;
        return;
      }
      const safeLength = Math.max(0, pending.length - citationMarker.length + 1);
      if (safeLength === 0) return;
      const clean = pending.slice(0, safeLength);
      pending = pending.slice(safeLength);
      answer += clean;
      onChunk?.(clean);
    };

    while (!doneReading) {
      const { done, value } = await reader.read();
      doneReading = done;
      if (!value) continue;
      const chunk = decoder.decode(value, { stream: !done });
      pending += chunk;
      emitSafeText();
    }

    emitSafeText();
    if (!citationMode && pending) {
      answer += pending;
      onChunk?.(pending);
    }
    return answer.trimEnd();
  }

  async exportRun(req: ExportRunRequest): Promise<ExportRunResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/runs/${encodeURIComponent(req.runId)}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: req.provider,
        title: req.title,
        options: req.options,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to export run: ${res.status} ${res.statusText}`);
    }
    return await res.json() as ExportRunResult;
  }

  async cancelTask(taskId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`Failed to cancel task: ${res.status} ${res.statusText}`);
    }
  }

  async retryTask(taskId: string): Promise<TaskRef> {
    const res = await fetch(`${this.baseUrl}/api/v1/tasks/${encodeURIComponent(taskId)}/retry`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Failed to retry task: ${res.status} ${res.statusText}`);
    }
    return toTaskRef(await res.json() as { task_id: string; source_hash: string });
  }

  streamEvents(taskId: string, onEvent: (e: SSEEvent) => void): () => void {
    const abortController = new AbortController();
    const url = `${this.baseUrl}/api/v1/tasks/${taskId}/events`;
    let lastEventId = 0;
    let terminalSeen = false;

    (async () => {
      let attempts = 0;
      while (!abortController.signal.aborted && !terminalSeen) {
        try {
          const response = await fetch(url, {
            headers: {
              "Accept": "text/event-stream",
              ...(lastEventId > 0 ? { "Last-Event-ID": String(lastEventId) } : {}),
            },
            signal: abortController.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`SSE failed with status: ${response.status}`);
          }

          attempts = 0;
          await this.readEventStream(response, onEvent, (event) => {
            lastEventId = Math.max(lastEventId, event.id || 0);
            terminalSeen = event.event === "done" || event.event === "error";
          });
        } catch (err: any) {
          if (err.name === "AbortError" || abortController.signal.aborted) return;
          attempts += 1;
          if (attempts > 5) {
            onEvent({
              id: -1,
              event: "error",
              data: {
                error: {
                  code: "STEP_FAILED",
                  step: "sse_stream",
                  message: err.message || "SSE connection error",
                  hint: "Ensure the local Python backend server is running.",
                  retriable: true,
                  degraded_to: null,
                },
              },
            });
            return;
          }
          await delay(Math.min(1000, 180 * attempts));
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }

  private async readEventStream(
    response: Response,
    onEvent: (e: SSEEvent) => void,
    onParsedEvent: (e: SSEEvent) => void,
  ): Promise<void> {
    if (!response.body) return;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    let currentId = 0;
    let currentEvent = "message";
    let currentData = "";

    try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed === "") {
              if (currentData) {
                try {
                  const parsed = JSON.parse(currentData);
                  const event = {
                    id: currentId,
                    event: currentEvent as any,
                    data: parsed,
                  };
                  onParsedEvent(event);
                  onEvent(event);
                } catch {
                  // Ignore JSON parse errors on partial heartbeats
                }
                currentData = "";
              }
              continue;
            }

            const colonIdx = line.indexOf(":");
            if (colonIdx === -1) continue;

            const key = line.slice(0, colonIdx).trim();
            const val = line.slice(colonIdx + 1).trim();

            if (key === "id") {
              currentId = parseInt(val, 10) || 0;
            } else if (key === "event") {
              currentEvent = val;
            } else if (key === "data") {
              currentData += val;
            }
          }
        }
    } finally {
      reader.releaseLock();
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toTaskRef(data: { task_id: string; source_hash: string }): TaskRef {
  return {
    task_id: data.task_id,
    source_hash: data.source_hash,
    events_url: `/api/v1/tasks/${data.task_id}/events`,
    cancel_url: `/api/v1/tasks/${data.task_id}`,
    retry_url: `/api/v1/tasks/${data.task_id}/retry`,
  };
}
