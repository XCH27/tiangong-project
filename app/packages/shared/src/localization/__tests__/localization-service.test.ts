import { describe, it, expect } from 'bun:test';
import {
  LocalizationService,
  hashText,
  clampShort,
  type TranslationStore,
} from '../localization-service.js';

function memStore(): TranslationStore {
  const m = new Map<string, string>();
  return { get: (k) => m.get(k), set: (k, v) => void m.set(k, v) };
}

describe('LocalizationService', () => {
  it('策展覆盖优先，且不调用翻译器', async () => {
    let calls = 0;
    const svc = new LocalizationService(
      memStore(),
      async () => {
        calls++;
        return 'X';
      },
      { curated: { '/clear': '清空会话' } },
    );
    expect(await svc.localize('/clear', 'command')).toBe('清空会话');
    expect(svc.peek('/clear', 'command')).toBe('清空会话');
    expect(calls).toBe(0);
  });

  it('翻一次后命中缓存', async () => {
    let calls = 0;
    const svc = new LocalizationService(memStore(), async (t) => {
      calls++;
      return '中:' + t;
    });
    expect(await svc.localize('Commit changes', 'skill')).toBe('中:Commit changes');
    expect(await svc.localize('Commit changes', 'skill')).toBe('中:Commit changes');
    expect(calls).toBe(1);
    expect(svc.peek('Commit changes', 'skill')).toBe('中:Commit changes');
  });

  it('压成短说明（默认 ≤24 字 + 省略号）', async () => {
    const svc = new LocalizationService(
      memStore(),
      async () => '这是一个非常非常非常非常非常非常非常长的说明文本明显超过限制了',
    );
    const out = await svc.localize('long', 'generic');
    expect(out.length).toBeLessThanOrEqual(24);
    expect(out.endsWith('…')).toBe(true);
  });

  it('用户纠正覆盖缓存', async () => {
    const svc = new LocalizationService(memStore(), async () => '机翻');
    await svc.localize('Deploy', 'command');
    svc.correct('Deploy', '部署', 'command');
    expect(svc.peek('Deploy', 'command')).toBe('部署');
  });

  it('空串透传；未翻过 peek 为 undefined', () => {
    const svc = new LocalizationService(memStore(), async () => 'x');
    expect(svc.peek('Never seen', 'skill')).toBeUndefined();
  });

  it('hash 确定性、clamp 折叠空白', () => {
    expect(hashText('abc')).toBe(hashText('abc'));
    expect(hashText('abc')).not.toBe(hashText('abd'));
    expect(clampShort('  a   b  ', 24)).toBe('a b');
  });
});
