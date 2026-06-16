/**
 * Transport seam — UI only talks to this. MockTransport now, RestTransport later.
 * Method shapes map 1:1 to docs/BACKEND.md routes. Flip with OE_LIVE=1 env.
 */
import type { AnalysisPlan, DoctorSummary, RecentTask, SSEEvent, VideoMetadata, Depth } from "../types/contracts.js";

export interface AnalyzeRequest {
  url: string; skill: string; style?: string; depth: Depth;
  client_provided?: { subtitle: string; language: string; source: string };
}

export interface Transport {
  probe(url: string): Promise<VideoMetadata>;                       // GET  /api/v1/probe
  plan(url: string, skill: string, depth: Depth): Promise<AnalysisPlan>; // POST /api/v1/plan
  doctor(): Promise<DoctorSummary>;                                  // GET  /api/v1/doctor
  analyze(req: AnalyzeRequest): Promise<{ task_id: string }>;        // POST /api/v1/analyze
  streamEvents(taskId: string, onEvent: (e: SSEEvent) => void): () => void; // SSE
  recentTasks(): Promise<RecentTask[]>;                              // GET  /api/v1/tasks/recent
}
