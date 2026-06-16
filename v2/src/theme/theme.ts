import themesData from "./themes.json" with { type: "json" };

export type ThemeKey = keyof typeof themesData.themes;
export const THEME_KEYS = Object.keys(themesData.themes) as ThemeKey[];
export const SEMANTIC = themesData.semantic;

export interface ThemeTokens {
  name: string; name_zh: string; glyph: string; mode: "day" | "night";
  bg_base: string; bg_panel: string; bg_elev: string; bg_input: string;
  text_l1: string; text_l2: string; text_l3: string; text_l4: string;
  accent: string; laser: string;
  border_subtle: string; border_strong: string;
  success: string; warning: string; error: string;
  user_bar: string; ai_bar: string;
}

export function getTheme(key: ThemeKey): ThemeTokens {
  return themesData.themes[key] as unknown as ThemeTokens;
}

export function ansiFg(hex: string): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function ansiBg(hex: string): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `\x1b[48;2;${r};${g};${b}m`;
}

export const ansiReset = "\x1b[0m";

