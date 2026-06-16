import { visibleWidth } from "@earendil-works/pi-tui";
import { ansiFg, ansiReset, getTheme } from "../theme/theme.js";
import { actionSet, clampActionIndex } from "./ActionModel.js";
import { Rule } from "./Bits.js";
import { padAnsi, row } from "./ShellLayout.js";
import type { ShellLayout, ShellRenderState } from "./ShellTypes.js";

export function renderFooter(state: ShellRenderState, layout: ShellLayout): string[] {
  return [
    Rule({ theme: state.theme, width: layout.width }),
    renderComposer(state, layout),
    renderActionBar(state, layout),
  ];
}

function renderComposer(state: ShellRenderState, layout: ShellLayout): string {
  const t = getTheme(state.theme);
  const input = state.activeScreen === "chat" ? state.chatInputLine : state.urlInputLine;
  const mode = state.composerHint
    ?? (state.activeScreen === "chat" ? "Ask this asset" : state.stage === "input" ? "Drop link, file, image, or request" : "Continue workflow");
  const chips = [
    `skill:${state.skillName}`,
    state.stage === "done" ? "asset:ready" : "asset:pending",
    state.config.live ? "live" : "mock",
  ].join(" ");
  const prefix = `${ansiFg(t.accent)}▸ ${mode}${ansiReset} `;
  const suffix = ` ${ansiFg(t.text_l4)}${chips} ${state.mascot}${ansiReset}`;
  const inputWidth = Math.max(8, layout.width - visibleWidth(prefix) - visibleWidth(suffix));
  return row(prefix + padAnsi(input || " ", inputWidth) + suffix, layout.width);
}

function renderActionBar(state: ShellRenderState, layout: ShellLayout): string {
  const t = getTheme(state.theme);
  const actions = actionSet(state);
  const selectedIndex = clampActionIndex(state);
  const primaryAction = actions.find((item) => item.primary) ?? actions[0];
  const secondary = actions.filter((item) => item !== primaryAction);
  const primaryText = formatAction(state, primaryAction.label, actions.indexOf(primaryAction) === selectedIndex, true);
  const secondaryText = secondary.map((item) => formatAction(state, item.label, actions.indexOf(item) === selectedIndex, false)).join("  ");
  const keyboard = `${ansiFg(t.text_l4)}Enter selects · Tab moves · Esc back/exit · Ctrl-C quits${ansiReset}`;
  const left = `${primaryText}  ${ansiFg(t.text_l3)}${secondaryText}${ansiReset}`;
  const gap = Math.max(1, layout.width - visibleWidth(left) - visibleWidth(keyboard));
  return row(left + " ".repeat(gap) + keyboard, layout.width);
}

function formatAction(state: ShellRenderState, label: string, selected: boolean, primary: boolean): string {
  const t = getTheme(state.theme);
  if (primary) {
    const text = selected ? `Primary: › ${label} ‹` : `Primary: ${label}`;
    return `${ansiFg(t.accent)}${text}${ansiReset}`;
  }
  const text = selected ? `› ${label} ‹` : label;
  return `[ ${text} ]`;
}
