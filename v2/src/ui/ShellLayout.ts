import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { ansiFg, ansiReset, getTheme, type ThemeKey } from "../theme/theme.js";
import type { Region, ShellLayout } from "./ShellTypes.js";

export const DEFAULT_SHELL_HEIGHT = 30;

const HEADER_ROWS = 2;
const FOOTER_ROWS = 3;
const GUTTER = 1;

function clamp(input: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, input));
}

export function createShellLayout(width: number, height = DEFAULT_SHELL_HEIGHT): ShellLayout {
  const usableWidth = Math.max(72, width);
  const usableHeight = Math.max(24, height);
  const bodyHeight = usableHeight - HEADER_ROWS - FOOTER_ROWS;
  const showSide = usableWidth >= 108;
  const railWidth = clamp(Math.floor(usableWidth * 0.17), 15, 22);
  const sideWidth = showSide ? clamp(Math.floor(usableWidth * 0.29), 30, 40) : 0;
  const separators = showSide ? GUTTER * 2 : GUTTER;
  const mainWidth = usableWidth - railWidth - sideWidth - separators;

  return {
    width: usableWidth,
    height: usableHeight,
    rail: { width: railWidth, height: bodyHeight },
    main: { width: mainWidth, height: bodyHeight },
    side: { width: sideWidth, height: bodyHeight },
    composer: { width: usableWidth, height: 1 },
    showSide,
  };
}

export function padAnsi(text: string, width: number): string {
  const clipped = truncateToWidth(text, width);
  const pad = Math.max(0, width - visibleWidth(clipped));
  return clipped + " ".repeat(pad);
}

export function row(text: string, width: number): string {
  return padAnsi(text, width);
}

export function blank(width: number): string {
  return " ".repeat(Math.max(0, width));
}

export function fitLines(lines: string[], region: Region): string[] {
  const fitted = lines.slice(0, region.height).map((line) => row(line, region.width));
  while (fitted.length < region.height) fitted.push(blank(region.width));
  return fitted;
}

export function panelTitle(theme: ThemeKey, title: string): string {
  const t = getTheme(theme);
  return `${ansiFg(t.accent)}${title}${ansiReset}`;
}
