import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { ansiFg, ansiReset, getTheme } from "../theme/theme.js";
export const DEFAULT_SHELL_HEIGHT = 30;
const HEADER_ROWS = 2;
const FOOTER_ROWS = 3;
const GUTTER = 1;
function clamp(input, min, max) {
    return Math.max(min, Math.min(max, input));
}
export function createShellLayout(width, height = DEFAULT_SHELL_HEIGHT) {
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
export function padAnsi(text, width) {
    const clipped = truncateToWidth(text, width);
    const pad = Math.max(0, width - visibleWidth(clipped));
    return clipped + " ".repeat(pad);
}
export function row(text, width) {
    return padAnsi(text, width);
}
export function blank(width) {
    return " ".repeat(Math.max(0, width));
}
export function fitLines(lines, region) {
    const fitted = lines.slice(0, region.height).map((line) => row(line, region.width));
    while (fitted.length < region.height)
        fitted.push(blank(region.width));
    return fitted;
}
export function panelTitle(theme, title) {
    const t = getTheme(theme);
    return `${ansiFg(t.accent)}${title}${ansiReset}`;
}
