import type { ShellRenderState } from "./ShellTypes.js";

export type ActionId =
  | "analyze_input"
  | "start_analysis"
  | "prepare_safe_route"
  | "cancel_task"
  | "keep_running"
  | "retry_safest"
  | "new_analysis"
  | "open_chat"
  | "open_evidence"
  | "open_frames"
  | "open_recent"
  | "next_recent"
  | "open_settings"
  | "open_protocol"
  | "back_home"
  | "save_setup"
  | "test_connection"
  | "storage_settings"
  | "toggle_live"
  | "toggle_offline"
  | "edit_api_url"
  | "add_file"
  | "use_upload"
  | "use_clipper"
  | "upload_subtitles"
  | "run_asr"
  | "use_text_only"
  | "use_lighter_route"
  | "use_cloud_vlm"
  | "edit_recipe"
  | "export_note"
  | "quit";

export interface UIAction {
  id: ActionId;
  label: string;
  primary?: boolean;
}

export function actionSet(state: ShellRenderState): UIAction[] {
  if (state.activeScreen === "setup") {
    return [
      { id: "save_setup", label: "Save setup", primary: true },
      { id: "toggle_live", label: state.config.live ? "Use mock" : "Use live" },
      { id: "edit_api_url", label: "API URL" },
      { id: "toggle_offline", label: state.config.offline ? "Offline off" : "Offline on" },
      { id: "back_home", label: "Back" },
      { id: "test_connection", label: "Test connection" },
      { id: "storage_settings", label: "Storage" },
    ];
  }

  if (state.activeScreen === "protocol") {
    return [
      { id: "back_home", label: "Back to analysis", primary: true },
      { id: "open_settings", label: "Settings" },
      { id: "new_analysis", label: "New analysis" },
    ];
  }

  if (state.activeScreen === "chat") {
    return [
      { id: "open_chat", label: state.runResult ? "Ask with evidence" : "Ask follow-up", primary: true },
      { id: "open_evidence", label: "Open evidence" },
      { id: "export_note", label: "Export note" },
      { id: "back_home", label: "Back to analysis" },
    ];
  }

  if (state.stage === "plan") {
    const needsFallback = state.plan?.expected_fallback_path !== "none";
    return needsFallback
      ? [
          { id: "prepare_safe_route", label: "Prepare safe route", primary: true },
          { id: "use_upload", label: "Use upload" },
          { id: "use_clipper", label: "Use Clipper" },
          { id: "new_analysis", label: "Cancel" },
        ]
      : [
          { id: "start_analysis", label: "Start analysis", primary: true },
          { id: "edit_recipe", label: "Edit recipe" },
          { id: "use_text_only", label: "Use text only" },
          { id: "new_analysis", label: "Cancel" },
        ];
  }

  if (state.stage === "run") {
    return [
      { id: "cancel_task", label: "Cancel task", primary: true },
      { id: "open_protocol", label: "View protocol" },
      { id: "keep_running", label: "Keep running" },
    ];
  }

  if (state.stage === "done") {
    return [
      { id: "open_chat", label: "Ask about this asset", primary: true },
      { id: "export_note", label: "Export note" },
      { id: "open_frames", label: "Open frames" },
      { id: "new_analysis", label: "New analysis" },
    ];
  }

  if (state.stage === "fallback") return recoveryActions(state);

  return [
    { id: "analyze_input", label: "Analyze input", primary: true },
    ...(state.recentTasks.length ? [{ id: "open_recent" as const, label: "Open recent" }] : []),
    ...(state.recentTasks.length > 1 ? [{ id: "next_recent" as const, label: "Next recent" }] : []),
    { id: "add_file", label: "Add file" },
    { id: "open_settings", label: "Settings" },
    { id: "quit", label: "Quit" },
  ];
}

function recoveryActions(state: ShellRenderState): UIAction[] {
  if (state.err?.code === "DOWNLOAD_BLOCKED" || state.err?.code === "RATE_LIMITED") {
    return [
      { id: "use_clipper", label: "Use browser clipper", primary: true },
      { id: "use_upload", label: "Upload file" },
      { id: "new_analysis", label: "New analysis" },
    ];
  }
  if (state.err?.code === "SUBTITLE_NOT_FOUND") {
    return [
      { id: "upload_subtitles", label: "Upload subtitles", primary: true },
      { id: "run_asr", label: "Run ASR" },
      { id: "use_text_only", label: "Use text only" },
      { id: "new_analysis", label: "New analysis" },
    ];
  }
  if (state.err?.code === "OOM_VRAM") {
    return [
      { id: "use_lighter_route", label: "Use lighter route", primary: true },
      { id: "use_text_only", label: "Text only" },
      { id: "use_cloud_vlm", label: "VLM route" },
      { id: "new_analysis", label: "New analysis" },
    ];
  }
  return [
    { id: "retry_safest", label: "Retry safest path", primary: true },
    { id: "use_upload", label: "Use upload" },
    { id: "use_text_only", label: "Use text only" },
    { id: "new_analysis", label: "New analysis" },
  ];
}

export function clampActionIndex(state: ShellRenderState): number {
  return Math.min(Math.max(0, state.selectedActionIndex), Math.max(0, actionSet(state).length - 1));
}
