/**
 * OmniVerse Vision — backend contract types.
 *
 * These mirror docs/BACKEND.md (REST + SSE + Asset Schema) so the V2 TUI client is
 * structurally aligned with the backend and has type-safe integrations.
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

// ── /api/v1/doctor  →  flat selfcheck & HardwareProfile (G1.5) ─────────────
export type MemoryTier = "tiny" | "low" | "medium" | "high";
export type ComputedTier = "tiny" | "baseline" | "accelerated";

export interface DoctorSummary {
  status: "ok" | "warn" | "error";
  platform: string;
  cpu_architecture: string;
  memory_gb: number;
  memory_tier: MemoryTier;
  ffmpeg_status: "available" | "unavailable";
  acceleration_hints: string[];
  computed_tier: ComputedTier;
  offline_preference: boolean;
  warnings: string[];
}

export interface SkillInfo {
  name: string;
  depth: Depth;
  description: string;
  requires?: string[];
  produces?: string[];
}

// ── /api/v1/analyze  →  task_id  +  SSE events  (PARTIAL/G1) ──────────────
export interface TaskRef {
  task_id: string;
  source_hash: string;
  events_url: string;
  cancel_url: string;
  retry_url: string;
}

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

// Canonical 7 pipeline steps the UI renders.
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

// ── Errors  (core/errors.py) ──────────────────────────────────────────────
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

// ── /api/v1/chat  →  RAG answer with citations ──────────────────────────
export interface Citation { ts: number; segment_id: string; text: string; }
export interface ChatAnswer { answer: string; citations: Citation[]; }

export interface RecentTask {
  source_hash: string;
  title: string;
  thumbnail_url: string;
  completed_at: string;
  skill: string;
  run_id?: string;
}
