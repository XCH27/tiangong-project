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
// Ink consumes hex colors directly via the `color` prop (truecolor terminals).
