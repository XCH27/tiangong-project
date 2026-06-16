import { Markdown, wrapTextWithAnsi } from "@earendil-works/pi-tui";
import { ansiFg, ansiReset, getTheme } from "../theme/theme.js";
import { ProgressBar } from "./Bits.js";
import { fitLines, panelTitle } from "./ShellLayout.js";
import type { Region, ShellRenderState } from "./ShellTypes.js";

export function renderAssetPreview(state: ShellRenderState, region: Region): string[] {
  const t = getTheme(state.theme);
  const note = (() => {
    if (state.runResult?.output_markdown) return state.runResult.output_markdown;
    if (state.assetLoadError) return `# Asset load failed\n\n${state.assetLoadError}`;
    if (state.stage === "done") return "# Asset preview\n\nRun finished. Loading backend run result...";
    return "# Asset preview\n\nRun an analysis first, then evidence-backed notes and frame refs appear here.";
  })();
  const md = new Markdown(note, 1, 0, {
    heading: (text: string) => `${ansiFg(t.accent)}\x1b[1m${text}${ansiReset}`,
    link: (text: string) => `\x1b[4m${text}\x1b[24m`,
    linkUrl: (text: string) => `${ansiFg(t.text_l4)}${text}${ansiReset}`,
    code: (text: string) => `\x1b[7m${text}\x1b[27m`,
    codeBlock: (text: string) => `${ansiFg(t.text_l2)}${text}${ansiReset}`,
    codeBlockBorder: (text: string) => `${ansiFg(t.text_l4)}${text}${ansiReset}`,
    quote: (text: string) => `${ansiFg(t.text_l3)}${text}${ansiReset}`,
    quoteBorder: (text: string) => `${ansiFg(t.text_l4)}${text}${ansiReset}`,
    hr: (text: string) => `${ansiFg(t.text_l4)}${text}${ansiReset}`,
    listBullet: (text: string) => `${ansiFg(t.accent)}${text}${ansiReset}`,
    bold: (text: string) => `\x1b[1m${text}\x1b[22m`,
    italic: (text: string) => `\x1b[3m${text}\x1b[23m`,
    strikethrough: (text: string) => `\x1b[9m${text}\x1b[29m`,
    underline: (text: string) => `\x1b[4m${text}\x1b[24m`,
  });
  return fitLines(md.render(region.width), region);
}

export function renderAssetWorkbench(state: ShellRenderState, region: Region): string[] {
  const t = getTheme(state.theme);
  const completed = Object.values(state.steps).filter((step) => step.status === "completed").length;
  const degraded = Object.values(state.steps).filter((step) => step.status === "degraded" || step.status === "skipped").length;
  const messages = state.chatHistory.slice(-4);
  const currentTitle = state.runResult?.metadata?.title ?? state.meta?.title ?? "No asset loaded";
  const taskSummary = state.taskRef
    ? `task ${state.taskRef.task_id} · ${state.taskRef.source_hash}`
    : "drop a link or open a recent asset";
  const recentLines = state.recentTasks.slice(0, 3).map((task, index) => {
    const title = task.title.length > 24 ? `${task.title.slice(0, 23)}…` : task.title;
    const marker = index === state.selectedRecentIndex ? `${ansiFg(t.accent)}▸${ansiReset} ` : "  ";
    return `${marker}${ansiFg(t.text_l3)}${title}${ansiFg(t.text_l4)} · ${task.skill}${ansiReset}`;
  });
  const lines = [
    panelTitle(state.theme, "Workbench"),
    "",
    `${ansiFg(t.text_l4)}Current asset${ansiReset}`,
    `${ansiFg(t.text_l1)}${currentTitle}${ansiReset}`,
    `${ansiFg(t.text_l4)}${taskSummary}${ansiReset}`,
    state.runId ? `${ansiFg(t.success)}run ready${ansiReset} · ${state.runId}` : "run: not ready",
    state.taskRef ? `${ansiFg(t.text_l4)}protocol available: events / cancel / retry${ansiReset}` : "",
    "",
    `${ansiFg(t.text_l4)}Assets${ansiReset}`,
    state.runResult?.output_markdown ? `${ansiFg(t.success)}● markdown${ansiReset}` : "○ markdown",
    state.runResult?.segments?.length ? `${ansiFg(t.success)}● segments ${state.runResult.segments.length}${ansiReset}` : "○ segments",
    state.runResult?.shots?.length ? `${ansiFg(t.success)}● frame refs ${state.runResult.shots.length}${ansiReset}` : "○ frame refs",
    state.runResult?.options ? `skill: ${state.runResult.options.skill}` : "skill: —",
    state.assetLoadError ? `${ansiFg(t.error)}asset error: ${state.assetLoadError}${ansiReset}` : "",
    "",
    `${ansiFg(t.text_l4)}Pipeline${ansiReset}`,
    `${ProgressBar({ frac: state.progress, width: Math.max(8, region.width - 10) })}`,
    `done:${completed} degraded:${degraded}`,
    "",
    `${ansiFg(t.text_l4)}Recent assets${ansiReset}`,
    ...(recentLines.length ? recentLines : ["none yet"]),
    "",
    `${ansiFg(t.text_l4)}Recent Q/A${ansiReset}`,
    ...messages.flatMap((msg) => wrapTextWithAnsi(`${msg.role === "user" ? "Q" : "A"}: ${msg.text}`, region.width)),
  ];
  return fitLines(lines, region);
}
