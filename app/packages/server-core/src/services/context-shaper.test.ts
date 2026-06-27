/**
 * context-shaper 单元测试
 *
 * 覆盖三种场景：
 * - sidecar 可用（probe 返回 true，run 返回瘦身结果）
 * - sidecar 不可用（probe 返回 false，push <tool>-unavailable）
 * - sidecar 调用失败（probe 返回 true 但 run 返回 null，no-op）
 *
 * 不真调外部二进制：通过 __injectSidecarHooks 注入 mock。
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  shape,
  estimateTokens,
  __injectSidecarHooks,
  __resetSidecarHooks,
  type ShapingPrefs,
} from './context-shaper';

// ---------------------------------------------------------------------------
// 测试辅助
// ---------------------------------------------------------------------------

/** 默认 prefs：全部关闭。 */
const PREFS_NONE: ShapingPrefs = { rtk: false, codegraph: false, reasonixPrefix: false };

/** 默认 prefs：仅 rtk。 */
const PREFS_RTK: ShapingPrefs = { rtk: true, codegraph: false, reasonixPrefix: false };

/** 默认 prefs：全部开启。 */
const PREFS_ALL: ShapingPrefs = { rtk: true, codegraph: true, reasonixPrefix: true };

/**
 * 构造 mock probe：根据 map 返回对应二进制的可用性。
 */
function mockProbe(available: Record<string, boolean>) {
  return (name: string): boolean => available[name] ?? false;
}

/**
 * 构造 mock run：返回传入回调的结果；null 表示调用失败。
 */
function mockRun(results: Record<string, string | null>) {
  return (_binary: string, args: string[], input: string): string | null => {
    const key = args[0] ?? ''; // compress / query / layer
    const result = results[key];
    if (result === null) return null;
    // 用明确标记替代输入来模拟瘦身输出
    if (result !== undefined) return result;
    return input; // 兜底：原样返回
  };
}

// 在每个测试前重置钩子
beforeEach(() => {
  __resetSidecarHooks();
});

afterEach(() => {
  __resetSidecarHooks();
});

// ---------------------------------------------------------------------------
// estimateTokens
// ---------------------------------------------------------------------------

describe('estimateTokens', () => {
  it('空字符串 → 0', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('4 字符 → 1 token', () => {
    expect(estimateTokens('abcd')).toBe(1);
  });

  it('5 字符 → 2 token（向上取整）', () => {
    expect(estimateTokens('abcde')).toBe(2);
  });

  it('中文：每字符仍按 1/4 token 计', () => {
    expect(estimateTokens('你好')).toBe(1); // 2 chars → ceil(2/4) = 1
  });
});

// ---------------------------------------------------------------------------
// shape() - 无 prefs 开启
// ---------------------------------------------------------------------------

describe('shape: no prefs enabled', () => {
  it('所有 prefs 关闭 → no-op，tools 为空', () => {
    const result = shape('hello world', 'chat-text', PREFS_NONE);
    expect(result.shapedMessage).toBe('hello world');
    expect(result.tools).toEqual([]);
    expect(result.beforeTokens).toBe(estimateTokens('hello world'));
    expect(result.afterTokens).toBe(result.beforeTokens);
  });
});

// ---------------------------------------------------------------------------
// shape() - whitespace-normalize
// ---------------------------------------------------------------------------

describe('shape: whitespace-normalize', () => {
  it('有 prefs 开启时做空白规范化', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: false }),
      mockRun({}),
    );
    const result = shape('\r\n\r\n\r\nhello\r\n\r\n\r\n\r\nworld\r\n', 'chat-text', PREFS_RTK);
    expect(result.shapedMessage).toBe('hello\n\nworld');
    expect(result.tools).toContain('whitespace-normalize');
  });

  it('空白已规范时不重复 push', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: false }),
      mockRun({}),
    );
    const result = shape('hello\nworld', 'chat-text', PREFS_RTK);
    // 没有多余空白 → whitespace-normalize 不 push
    // rtk-unavailable 会推入（因为 rtk probe 返回 false）
    expect(result.tools).not.toContain('whitespace-normalize');
    expect(result.tools).toContain('rtk-unavailable');
  });
});

// ---------------------------------------------------------------------------
// shape() - rtk
// ---------------------------------------------------------------------------

describe('shape: rtk', () => {
  it('rtk 可用 → 调用 compress 并记 rtk', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: true }),
      mockRun({ compress: '[rtk-compressed] original' }),
    );

    const result = shape('some command output here', 'code-tools', PREFS_RTK);
    expect(result.tools).toContain('rtk');
    expect(result.tools).not.toContain('rtk-unavailable');
    expect(result.shapedMessage).toBe('[rtk-compressed] original');
  });

  it('rtk 不可用（probe 返回 false）→ push rtk-unavailable，消息不变', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: false }),
      mockRun({}),
    );

    const result = shape('some command output', 'code-tools', PREFS_RTK);
    expect(result.tools).toContain('rtk-unavailable');
    expect(result.tools).not.toContain('rtk');
    // 消息不变（假设没有空白规范化）
    expect(result.shapedMessage).toBe('some command output');
  });

  it('rtk probe 通过但 run 失败（返回 null）→ push rtk-unavailable，消息不变', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: true }),
      mockRun({ compress: null }),
    );

    const result = shape('some command output', 'code-tools', PREFS_RTK);
    expect(result.tools).toContain('rtk-unavailable');
    expect(result.tools).not.toContain('rtk');
    expect(result.shapedMessage).toBe('some command output');
  });

  it('rtk 不可用时仍做空白规范化', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: false }),
      mockRun({}),
    );

    const result = shape('\r\n\r\n\r\nhello\r\n\r\n\r\n\r\n', 'code-tools', PREFS_RTK);
    expect(result.tools).toContain('rtk-unavailable');
    expect(result.tools).toContain('whitespace-normalize');
    expect(result.shapedMessage).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// shape() - codegraph
// ---------------------------------------------------------------------------

describe('shape: codegraph', () => {
  const PREFS_CG: ShapingPrefs = { rtk: false, codegraph: true, reasonixPrefix: false };

  it('codegraph 可用 → 调用 query 并记 codegraph', () => {
    __injectSidecarHooks(
      mockProbe({ codegraph: true }),
      mockRun({ query: '[codegraph-result] structured' }),
    );

    const result = shape('read file foo.ts', 'code-tools', PREFS_CG);
    expect(result.tools).toContain('codegraph');
    expect(result.tools).not.toContain('codegraph-unavailable');
    expect(result.shapedMessage).toBe('[codegraph-result] structured');
  });

  it('codegraph 不可用 → push codegraph-unavailable', () => {
    __injectSidecarHooks(
      mockProbe({ codegraph: false }),
      mockRun({}),
    );

    const result = shape('read file foo.ts', 'code-tools', PREFS_CG);
    expect(result.tools).toContain('codegraph-unavailable');
    expect(result.tools).not.toContain('codegraph');
  });

  it('codegraph probe 通过但 run 失败 → push codegraph-unavailable', () => {
    __injectSidecarHooks(
      mockProbe({ codegraph: true }),
      mockRun({ query: null }),
    );

    const result = shape('read file foo.ts', 'code-tools', PREFS_CG);
    expect(result.tools).toContain('codegraph-unavailable');
    expect(result.tools).not.toContain('codegraph');
  });
});

// ---------------------------------------------------------------------------
// shape() - reasonix
// ---------------------------------------------------------------------------

describe('shape: reasonix', () => {
  const PREFS_RX: ShapingPrefs = { rtk: false, codegraph: false, reasonixPrefix: true };

  it('reasonix 可用 → 调用 layer 并记 reasonix', () => {
    __injectSidecarHooks(
      mockProbe({ reasonix: true }),
      mockRun({ layer: '[reasonix-layered] stable prefix' }),
    );

    const result = shape('long reasoning chain...', 'review-analysis', PREFS_RX);
    expect(result.tools).toContain('reasonix');
    expect(result.tools).not.toContain('reasonix-unavailable');
    expect(result.shapedMessage).toBe('[reasonix-layered] stable prefix');
  });

  it('reasonix 不可用 → push reasonix-unavailable', () => {
    __injectSidecarHooks(
      mockProbe({ reasonix: false }),
      mockRun({}),
    );

    const result = shape('long reasoning chain...', 'review-analysis', PREFS_RX);
    expect(result.tools).toContain('reasonix-unavailable');
    expect(result.tools).not.toContain('reasonix');
  });

  it('reasonix probe 通过但 run 失败 → push reasonix-unavailable', () => {
    __injectSidecarHooks(
      mockProbe({ reasonix: true }),
      mockRun({ layer: null }),
    );

    const result = shape('long reasoning chain...', 'review-analysis', PREFS_RX);
    expect(result.tools).toContain('reasonix-unavailable');
    expect(result.tools).not.toContain('reasonix');
  });
});

// ---------------------------------------------------------------------------
// shape() - 组合场景
// ---------------------------------------------------------------------------

describe('shape: combined scenarios', () => {
  it('全部 sidecar 可用 → 按序调用 rtk → codegraph → reasonix', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: true, codegraph: true, reasonix: true }),
      mockRun({
        compress: '[rtk] compressed',
        query: '[cg] after codegraph',
        layer: '[rx] after reasonix',
      }),
    );

    const result = shape('\r\nraw input\r\n\r\n\r\nextra\n', 'code-tools', PREFS_ALL);
    // 顺序：whitespace → rtk → codegraph → reasonix
    expect(result.tools).toEqual([
      'whitespace-normalize',
      'rtk',
      'codegraph',
      'reasonix',
    ]);
    expect(result.shapedMessage).toBe('[rx] after reasonix');
  });

  it('部分可用：rtk 可用，codegraph 不可用，reasonix 可用', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: true, codegraph: false, reasonix: true }),
      mockRun({
        compress: '[rtk] done',
        layer: '[rx] done',
      }),
    );

    const result = shape('test input', 'code-tools', PREFS_ALL);
    expect(result.tools).toContain('rtk');
    expect(result.tools).toContain('codegraph-unavailable');
    expect(result.tools).toContain('reasonix');
    expect(result.shapedMessage).toBe('[rx] done');
  });

  it('全部不可用 → 仅有 whitespace-normalize 和三个 unavailable 标记', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: false, codegraph: false, reasonix: false }),
      mockRun({}),
    );

    const result = shape('clean input', 'code-tools', PREFS_ALL);
    expect(result.tools).toEqual([
      'rtk-unavailable',
      'codegraph-unavailable',
      'reasonix-unavailable',
    ]);
    expect(result.shapedMessage).toBe('clean input');
  });

  it('rtk 和 codegraph 可用但 run 均失败 → push unavailable', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: true, codegraph: true, reasonix: false }),
      mockRun({ compress: null, query: null }),
    );

    const result = shape('test input', 'code-tools', {
      rtk: true,
      codegraph: true,
      reasonixPrefix: false,
    });
    expect(result.tools).toContain('rtk-unavailable');
    expect(result.tools).toContain('codegraph-unavailable');
    expect(result.tools).not.toContain('rtk');
    expect(result.tools).not.toContain('codegraph');
    expect(result.shapedMessage).toBe('test input');
  });
});

// ---------------------------------------------------------------------------
// shape() - token 记账
// ---------------------------------------------------------------------------

describe('shape: token accounting', () => {
  it('瘦身后 afterTokens 小于 beforeTokens', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: true }),
      mockRun({ compress: 'short' }),
    );

    const longMessage = 'a very long message that contains lots of text to compress';
    const result = shape(longMessage, 'code-tools', PREFS_RTK);
    expect(result.beforeTokens).toBe(estimateTokens(longMessage));
    expect(result.afterTokens).toBeLessThan(result.beforeTokens);
  });

  it('no-op 时 beforeTokens === afterTokens', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: false }),
      mockRun({}),
    );

    const message = 'hello';
    const result = shape(message, 'chat-text', PREFS_RTK);
    expect(result.beforeTokens).toBe(result.afterTokens);
  });
});

// ---------------------------------------------------------------------------
// shape() - TaskType 不影响行为（目前 taskType 预留未用）
// ---------------------------------------------------------------------------

describe('shape: taskType preserved for future use', () => {
  it('不同 taskType 产生相同结果（当前 _taskType 未参与决策）', () => {
    __injectSidecarHooks(
      mockProbe({ rtk: false }),
      mockRun({}),
    );

    const tasks: Parameters<typeof shape>[1][] = [
      'chat-text',
      'code-tools',
      'review-analysis',
      'design-canvas',
      'animation',
      'video-edit',
    ];

    const results = tasks.map(t => shape('hello', t, PREFS_RTK));
    const first = results[0]!;
    for (const r of results.slice(1)) {
      expect(r.shapedMessage).toBe(first.shapedMessage);
      expect(r.tools).toEqual(first.tools);
    }
  });
});
