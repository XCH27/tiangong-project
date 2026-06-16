import type { Region, ShellRenderState } from "./ShellTypes.js";
import { fitLines } from "./ShellLayout.js";
import { renderInputState } from "./Input.js";
import { renderPlanState } from "./Plan.js";
import { renderFallbackState, renderRunState } from "./Run.js";

export function renderSessionTimeline(state: ShellRenderState, region: Region): string[] {
  if (state.stage === "input") {
    return fitLines(
      renderInputState({
        theme: state.theme,
        urlInputRenderedLine: state.urlInputLine,
        url: state.url,
        skill: state.skillName,
        skills: state.skills,
        doctor: state.doctor,
        recentTasks: state.recentTasks,
        selectedRecentIndex: state.selectedRecentIndex,
        width: region.width,
      }),
      region,
    );
  }

  if (state.stage === "plan" && state.meta && state.plan) {
    return fitLines(
      renderPlanState({
        theme: state.theme,
        meta: state.meta,
        plan: state.plan,
        width: region.width,
      }),
      region,
    );
  }

  if (state.stage === "run" || state.stage === "done") {
    return fitLines(
      renderRunState({
        theme: state.theme,
        progress: state.progress,
        steps: state.steps,
        width: region.width,
      }),
      region,
    );
  }

  if (state.stage === "fallback" && state.err) {
    return fitLines(
      renderFallbackState({
        theme: state.theme,
        err: state.err,
        width: region.width,
      }),
      region,
    );
  }

  return fitLines(["Waiting for input..."], region);
}
