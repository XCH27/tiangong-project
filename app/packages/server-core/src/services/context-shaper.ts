/**
 * 输入瘦身（杠杆0）— 调用 docs/16 上下文效率中心能力
 *
 * 单一真相：docs/03 §6.1 / docs/03 §15 序4
 *
 * 本模块是路由/Fusion 与 docs/16 之间的薄适配层。
 * 实际瘦身能力（rtk/codegraph/Reasonix）通过 sidecar 子进程调用。
 * sidecar 未就绪时跳过该工具，不抛异常、不阻塞。
 *
 * 硬约束（docs/26）：
 * - 不自动安装全局 hook、不改 shell 配置
 * - sidecar 未就绪时 no-op pass-through（保持现有行为）
 * - sidecar 就绪时调真实瘦身，并记 before/after token 与使用的工具
 * - 所有 sidecar 调用必须 try/catch，失败 no-op，不抛
 * - 瘦身节省记「估算」（docs/16 边界）
 */

import { execFileSync } from 'node:child_process';
import type { TaskType } from './fusion-types.ts';

/** 瘦身后的上下文。 */
export interface ShapedContext {
  /** 瘦身后的消息文本（可能被 rtk 压缩了命令输出段）。 */
  shapedMessage: string
  /** 瘦身前估算 token。 */
  beforeTokens: number
  /** 瘦身后估算 token。 */
  afterTokens: number
  /** 使用了哪些瘦身工具。 */
  tools: string[]
}

/** 偏好设置（与 ModelRoutingPrefs.shaping 对齐）。 */
export interface ShapingPrefs {
  rtk: boolean
  codegraph: boolean
  reasonixPrefix: boolean
}

/** 估算 token（粗略，chars/4）。 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

// ---------------------------------------------------------------------------
// Sidecar 探测与调用
// ---------------------------------------------------------------------------

/**
 * 探测二进制是否在 PATH 上。
 * 用 POSIX `command -v` 检查（shell builtin，不依赖 which 二进制）。
 */
export function probeBinary(name: string): boolean {
  try {
    execFileSync('sh', ['-c', `command -v "${name}"`], {
      stdio: 'ignore',
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 调用 sidecar 子进程，stdin 传入消息，读 stdout 作为结果。
 * 失败返回 null（no-op pass-through，不抛）。
 */
export function runSidecar(
  binary: string,
  args: string[],
  input: string,
  timeoutMs = 30_000,
): string | null {
  try {
    const result = execFileSync(binary, args, {
      input,
      timeout: timeoutMs,
      maxBuffer: 10 * 1024 * 1024, // 10 MB
      encoding: 'utf-8',
    });
    return result;
  } catch {
    // 失败 no-op：不抛、不阻塞
    return null;
  }
}

// ---------------------------------------------------------------------------
// 测试钩子（允许 test 文件注入 mock，避免真调外部二进制）
// ---------------------------------------------------------------------------

type ProbeFn = (name: string) => boolean;
type RunFn = (binary: string, args: string[], input: string, timeoutMs?: number) => string | null;

let _probe: ProbeFn = probeBinary;
let _run: RunFn = runSidecar;

/**
 * 注入 mock 探测/执行函数（仅测试用）。
 * 调用 __resetSidecarHooks() 恢复默认实现。
 */
export function __injectSidecarHooks(probe: ProbeFn, run: RunFn): void {
  _probe = probe;
  _run = run;
}

/** 恢复默认 sidecar 实现。 */
export function __resetSidecarHooks(): void {
  _probe = probeBinary;
  _run = runSidecar;
}

// ---------------------------------------------------------------------------
// 瘦身流水线
// ---------------------------------------------------------------------------

/** 空白规范化：\r\n → \n，连续 3+ 空行 → 2 空行，去首尾空白。 */
function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * 对输入做瘦身。
 *
 * 流水线顺序：
 * 1. whitespace-normalize（本地保守瘦身，始终可用）
 * 2. rtk compress（命令输出段压缩，sidecar 就绪时）
 * 3. codegraph query（结构化查询替代整文件 Read，sidecar 就绪时）
 * 4. reasonix layer（稳定前缀分层，sidecar 就绪时）
 *
 * sidecar 不可用时 push `<tool>-unavailable` 而非 `<tool>(pending)`。
 */
export function shape(
  message: string,
  _taskType: TaskType,
  prefs: ShapingPrefs,
): ShapedContext {
  const beforeTokens = estimateTokens(message);
  let shapedMessage = message;
  const tools: string[] = [];

  // 只在至少开启一个瘦身工具时才做空白规范化
  const anyShapingEnabled = prefs.rtk || prefs.codegraph || prefs.reasonixPrefix;

  // 1. 空白规范化（本地保守瘦身，始终可用）
  if (anyShapingEnabled) {
    const normalized = normalizeWhitespace(message);
    if (normalized !== message) {
      shapedMessage = normalized;
      tools.push('whitespace-normalize');
    }
  }

  // 2. rtk：命令输出压缩
  if (prefs.rtk) {
    if (_probe('rtk')) {
      const result = _run('rtk', ['compress'], shapedMessage);
      if (result !== null) {
        shapedMessage = result;
        tools.push('rtk');
      } else {
        tools.push('rtk-unavailable');
      }
    } else {
      tools.push('rtk-unavailable');
    }
  }

  // 3. codegraph：用结构化查询替代整文件 Read
  if (prefs.codegraph) {
    if (_probe('codegraph')) {
      const result = _run('codegraph', ['query'], shapedMessage);
      if (result !== null) {
        shapedMessage = result;
        tools.push('codegraph');
      } else {
        tools.push('codegraph-unavailable');
      }
    } else {
      tools.push('codegraph-unavailable');
    }
  }

  // 4. Reasonix：稳定前缀分层
  if (prefs.reasonixPrefix) {
    if (_probe('reasonix')) {
      const result = _run('reasonix', ['layer'], shapedMessage);
      if (result !== null) {
        shapedMessage = result;
        tools.push('reasonix');
      } else {
        tools.push('reasonix-unavailable');
      }
    } else {
      tools.push('reasonix-unavailable');
    }
  }

  const afterTokens = estimateTokens(shapedMessage);

  return {
    shapedMessage,
    beforeTokens,
    afterTokens,
    tools,
  };
}
