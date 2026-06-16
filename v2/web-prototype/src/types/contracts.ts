/**
 * OmniVerse Vision — backend contract types.
 *
 * These mirror docs/BACKEND.md (REST + SSE + Asset Schema) so the prototype's
 * mock data is structurally honest and the real REST/SSE swap is type-checked.
 *
 * Status tags reflect docs/BACKEND.md route table:
 *   IMPLEMENTED / PARTIAL / TARGET.  Nothing here invents backend capability.
 */

// ── /api/v1/probe  (PARTIAL) + metadata.json ──────────────────────────────
export type Platform =
  | "bilibili" | "youtube" | "douyin" | "kuaishou"
  | "xiaohongshu" | "instagram" | "x" | "local" | "web";

export interface VideoMetadata {
  schema_version: 1;
  source_hash: string;
  url: string;
  title: string;
  duration: number; // seconds
  platform: Platform;
  uploader: string;
  upload_date: string;
  language: string;
  has_official_subtitles: boolean;
  subtitle_languages: string[];
  thumbnail_url: string;
  tags: string[];
}

// ── /api/v1/plan  →  AnalysisPlan  (G1.5) ─────────────────────────────────
export type Depth = "text_only" | "with_frames" | "with_vlm";
export type Bucket = "free" | "low" | "medium" | "high";
export type TimeBucket = "fast" | "moderate" | "slow";
export type Risk = "low" | "medium" | "high";
export type FallbackPath =
  | "none" | "requires_browser_clipper" | "requires_user_upload" | "cloud_asr_opt_in";

export interface AnalysisPlan {
  chosen_depth: Depth;
  planned_steps: string[];
  skipped_steps: string[];
  degraded_steps: string[];
  expected_fallback_path: FallbackPath;
  estimated_risk: Risk;
  estimated_cost_bucket: Bucket;
  estimated_time_bucket: TimeBucket;
  estimated_disk_bucket: Bucket;
  user_visible_warnings: string[];
}

// ── /api/v1/doctor  +  HardwareProfile  (G1.5) ───────────────────────────
export type MemoryTier = "tiny" | "low" | "medium" | "high";
export type ComputedTier = "tiny" | "baseline" | "accelerated";

export interface HardwareProfile {
  platform: string;
  cpu_architecture: string;
  memory_gb: number;
  memory_tier: MemoryTier;
  ffmpeg_available: boolean;
  local_acceleration_hints: string[];
  offline_preference: boolean;
  computed_tier: ComputedTier;
}

export type PrivacyLayer = "A" | "B" | "C";

export interface DoctorSummary {
  status: "ok" | "warn" | "error";
  hardware: HardwareProfile;
  warnings: string[];
  provider_chat: { name: string; model: string; reachable: boolean };
  provider_vlm: { name: string; model: string; layer: PrivacyLayer };
  offline_mode: boolean;
}

// ── /api/v1/analyze  →  task_id  +  SSE events  (PARTIAL/G1) ──────────────
// Full event-type list from docs/BACKEND.md.
export type SSEEventType =
  | "queued" | "probing" | "acquiring" | "subtitle_check" | "normalizing"
  | "transcribing" | "segmenting" | "extracting_frames" | "vlm_describing"
  | "generating" | "resolving_markers" | "exporting" | "done" | "error"
  | "heartbeat" | "stuck";

export interface SSEEvent {
  id: number;
  event: SSEEventType;
  data: {
    progress?: number;
    step?: string;
    message?: string;
    has_official?: boolean;
    skipping_asr?: boolean;
    run_id?: string;
    output_path?: string;
    error?: BackendError;
    alive?: boolean;
  };
}

// Canonical 7 pipeline steps the UI renders (docs/CLIENT_DESIGN §2 运行态).
export const PIPELINE_STEPS = [
  "probe", "acquire_subtitle", "transcribe",
  "extract_frames", "vlm_describe", "generate", "export",
] as const;
export type PipelineStep = (typeof PIPELINE_STEPS)[number];
export type StepStatus = "pending" | "running" | "completed" | "skipped" | "degraded" | "failed";

export interface StepState {
  step: PipelineStep;
  status: StepStatus;
  message?: string;
  elapsed_s?: number;
}

// ── Errors  (TARGET, core/errors.py 单一来源) ─────────────────────────────
export type ErrorCode =
  | "INPUT_CORRUPT" | "UNSUPPORTED_LANG" | "ZERO_DURATION"
  | "DOWNLOAD_BLOCKED" | "SUBTITLE_NOT_FOUND"
  | "OOM_VRAM" | "COST_EXCEEDED"
  | "STEP_STUCK" | "STEP_FAILED" | "SCHEMA_MIGRATION_ERROR" | "RATE_LIMITED";

export interface BackendError {
  code: ErrorCode;
  step: string;
  message: string;
  hint: string;
  retriable: boolean;
  degraded_to: string | null;
}

// ── Asset / EvidencePack  (G3 TARGET) ─────────────────────────────────────
export interface NarrativeSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  tags?: string[];
}

export interface VisualShot {
  id: string;
  start: number;
  key_frame_ts: number;
  thumbnail_path: string;
  vlm_description: {
    type: "visual_reference";
    content: string;
    confidence: number;
    model: string;
  };
}

export interface RunResult {
  run_id: string;
  source_hash: string;
  metadata: VideoMetadata;
  output_markdown: string;
  segments: NarrativeSegment[];
  shots: VisualShot[];
  options: { skill: string; style?: string; depth: Depth };
}

// ── /api/v1/chat  →  RAG answer with citations (PARTIAL) ──────────────────
export interface Citation { ts: number; segment_id: string; text: string; }
export interface ChatAnswer { answer: string; citations: Citation[]; }

export interface RecentTask {
  task_id: string;
  title: string;
  platform: Platform;
  skill: string;
  state: "done" | "running" | "failed" | "queued";
  created_at: string;
  run_id?: string;
}
