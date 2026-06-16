/**
 * OmniVerse Vision — backend contract types.
 *
 * These mirror docs/BACKEND.md (REST + SSE + Asset Schema) so the V2 TUI client is
 * structurally aligned with the backend and has type-safe integrations.
 */
// Canonical 7 pipeline steps the UI renders.
export const PIPELINE_STEPS = [
    "probe", "acquire_subtitle", "transcribe",
    "extract_frames", "vlm_describe", "generate", "export",
];
