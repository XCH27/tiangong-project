import themesData from "./themes.json" with { type: "json" };
export const THEME_KEYS = Object.keys(themesData.themes);
export const SEMANTIC = themesData.semantic;
export function getTheme(key) {
    return themesData.themes[key];
}
export function ansiFg(hex) {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
}
export function ansiBg(hex) {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `\x1b[48;2;${r};${g};${b}m`;
}
export const ansiReset = "\x1b[0m";
