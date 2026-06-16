/**
 * LocalizationService — 显示层翻译（命令 / Skill / 插件 的"短说明"）。
 *
 * 原则（见 docs/08）：只翻"给人看的说明"，**绝不改动**原始命令 / Skill / 插件——
 * 执行、注入、匹配永远用原文。译文只用于 UI 显示。
 *
 * 同构 & 零依赖：不 import node/electron/craft，任何东西，既能在 renderer(浏览器)
 * 也能在 main(node) 跑，且可独立单测。真实的 `translate`(模型调用) 与持久化 `store`
 * 由调用方在边缘注入（接口隔离，见 docs/07）。
 */

export type TextKind = 'command' | 'skill' | 'plugin' | 'generic';

/** 服务需要的最小持久化（接到 SQLite / electron-store）。 */
export interface TranslationStore {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

/** 可插拔翻译器：原文 -> 目标语言短文本。 */
export type Translator = (text: string, kind: TextKind, lang: string) => Promise<string>;

export interface LocalizationOptions {
  /** 目标显示语言，默认 "zh-CN"。 */
  lang?: string;
  /** 人工策展覆盖，按"原文精确匹配"（质量最高，用于内置命令等）。 */
  curated?: Readonly<Record<string, string>>;
  /** 短说明最大字符数，默认 24。 */
  maxChars?: number;
}

/** FNV-1a 32-bit -> 8 位 hex。确定性、同构、零依赖（不用 node:crypto，浏览器也能跑）。 */
export function hashText(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** 压成单行短说明。 */
export function clampShort(text: string, maxChars: number): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= maxChars) return oneLine;
  return oneLine.slice(0, Math.max(1, maxChars - 1)).trimEnd() + '…';
}

export class LocalizationService {
  private readonly lang: string;
  private readonly curated: Readonly<Record<string, string>>;
  private readonly maxChars: number;

  constructor(
    private readonly store: TranslationStore,
    private readonly translate: Translator,
    options: LocalizationOptions = {},
  ) {
    this.lang = options.lang ?? 'zh-CN';
    this.curated = options.curated ?? {};
    this.maxChars = options.maxChars ?? 24;
  }

  private key(text: string, kind: TextKind): string {
    return `${this.lang}:${kind}:${hashText(text)}`;
  }

  /** 同步尽力而为：策展 > 缓存。未翻过返回 undefined（UI 先显示原文，翻好再刷新）。 */
  peek(text: string, kind: TextKind = 'generic'): string | undefined {
    const original = text.trim();
    if (!original) return '';
    const curated = this.curated[original];
    if (curated !== undefined) return curated;
    return this.store.get(this.key(original, kind));
  }

  /** 确保有短译文：策展 > 缓存 > 翻译(并缓存)。 */
  async localize(text: string, kind: TextKind = 'generic'): Promise<string> {
    const original = text.trim();
    if (!original) return text;
    const curated = this.curated[original];
    if (curated !== undefined) return curated;
    const key = this.key(original, kind);
    const cached = this.store.get(key);
    if (cached !== undefined) return cached;
    const translated = clampShort(await this.translate(original, kind, this.lang), this.maxChars);
    this.store.set(key, translated);
    return translated;
  }

  /** 用户纠正：优先并持久化。 */
  correct(text: string, translated: string, kind: TextKind = 'generic'): void {
    const original = text.trim();
    if (!original) return;
    this.store.set(this.key(original, kind), clampShort(translated, this.maxChars));
  }
}
