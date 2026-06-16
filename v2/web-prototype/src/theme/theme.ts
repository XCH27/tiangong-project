import themesData from "./themes.json";

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

/** Apply a theme by writing role tokens as CSS custom properties on :root. */
export function applyTheme(key: ThemeKey): void {
  const t = getTheme(key);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t)) {
    if (typeof v === "string" && v.startsWith("#")) root.style.setProperty(`--${k}`, v);
  }
  for (const [k, v] of Object.entries(SEMANTIC)) {
    if (typeof v === "string" && v.startsWith("#")) root.style.setProperty(`--sem-${k}`, v);
  }
  root.style.setProperty("color-scheme", t.mode === "night" ? "dark" : "light");
}
