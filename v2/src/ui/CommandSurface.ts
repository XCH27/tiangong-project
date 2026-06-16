import { ansiFg, ansiReset, getTheme } from "../theme/theme.js";
import type { Region, ShellRenderState } from "./ShellTypes.js";
import { fitLines, panelTitle } from "./ShellLayout.js";

export function renderCommandSurface(state: ShellRenderState, region: Region): string[] {
  if (state.activeScreen === "protocol") return renderProtocolSurface(state, region);
  const t = getTheme(state.theme);
  const doctor = state.doctor;
  const lines = [
    panelTitle(state.theme, "Setup / Doctor"),
    "",
    `Transport    ${ansiFg(t.text_l1)}${state.config.live ? "REST backend" : "Mock transport"}${ansiReset}`,
    `API          ${state.config.apiUrl}`,
    `Platform     ${doctor?.platform ?? "detecting"}`,
    `CPU          ${doctor?.cpu_architecture ?? "detecting"}`,
    `Tier         ${doctor?.computed_tier ?? "detecting"}`,
    `FFmpeg       ${doctor?.ffmpeg_status ?? "detecting"}`,
    "",
    panelTitle(state.theme, "User-safe configuration"),
    "Privacy     local assets first",
    `Offline     ${state.config.offline ? "enabled" : "disabled"}`,
    `Export      ${state.config.exportDir}`,
    `Config      ${state.config.path}`,
    "VLM         planner decides route by depth/profile",
    "",
    `${ansiFg(t.text_l4)}Actions: Save setup / Test connection / Storage.${ansiReset}`,
  ];
  return fitLines(lines, region);
}

function renderProtocolSurface(state: ShellRenderState, region: Region): string[] {
  const t = getTheme(state.theme);
  const lines = [
    panelTitle(state.theme, "Protocol inspector"),
    "",
    `${ansiFg(t.text_l4)}Current REST/SSE route${ansiReset}`,
    state.taskRef ? `Task       ${state.taskRef.task_id}` : "Task       not submitted",
    state.taskRef ? `Source     ${state.taskRef.source_hash}` : "Source     —",
    state.taskRef ? `Events     ${state.taskRef.events_url}` : "Events     /api/v1/tasks/{task_id}/events",
    state.taskRef ? `Cancel     ${state.taskRef.cancel_url}` : "Cancel     /api/v1/tasks/{task_id}",
    state.taskRef ? `Retry      ${state.taskRef.retry_url}` : "Retry      /api/v1/tasks/{task_id}/retry",
    state.runId ? `Run        /api/v1/runs/${state.runId}` : "Run        —",
    "",
    `${ansiFg(t.text_l4)}Equivalent MCP intent${ansiReset}`,
    state.stage === "input" ? "analyze_media(action=\"plan\")" : "analyze_media(action=\"run_skill\")",
    state.runResult ? "query_knowledge(...) / get_frame_image(...)" : "query_knowledge waits for backend assets",
    "",
    `${ansiFg(t.text_l4)}Boundary${ansiReset}`,
    "UI never downloads, transcribes, extracts frames, or reads raw asset files.",
    "It only drives backend-owned tasks and displays returned assets.",
  ];
  return fitLines(lines, region);
}
