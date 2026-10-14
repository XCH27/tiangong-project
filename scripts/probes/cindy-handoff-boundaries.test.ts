/** Additional failure-oriented corpus against Cindy's unmodified handoff implementation. */
import { describe, expect, it } from 'vitest';
import { buildHandoffText } from '../../源码参考/software/cindy/apps/desktop/src/main/maker-ipc/agentHandoff';

const options = { fromLabel: 'Engine A', toLabel: 'Engine B', sessionId: 'offline-session' };
const message = (role: string, content: unknown, createdAt = 1) => ({ role, content, createdAt });

describe('cross-engine transfer limits', () => {
  it('preserves recent intent but is not a lossless transcript transfer', () => {
    const rows = [message('user', 'old requirement '.repeat(200) + 'ONLY_OLD_END_MARKER')];
    for (let index = 0; index < 12; index++) {
      rows.push(message('user', `request ${index}`, index + 2));
      rows.push(message('assistant', `answer ${index}`, index + 2));
    }
    const memo = buildHandoffText(rows, options);
    expect(memo).toContain('request 11');
    expect(memo).not.toContain('ONLY_OLD_END_MARKER');
    expect(memo.length).toBeLessThanOrEqual(16_000);
  });

  it('does not transfer native thinking or image bytes as executable state', () => {
    const memo = buildHandoffText([
      message('thinking', 'PRIVATE_REASONING_MARKER'),
      message('user', { text: 'Inspect the attached image', images: [{ data: 'IMAGE_BYTES_MARKER' }] }),
      message('assistant', 'Image identified'),
    ], options);
    expect(memo).toContain('Inspect the attached image');
    expect(memo).not.toContain('PRIVATE_REASONING_MARKER');
    expect(memo).not.toContain('IMAGE_BYTES_MARKER');
  });

  it('delta handoff can omit the earlier work text because it assumes native resume', () => {
    const previous = [message('user', 'EARLIER_REQUIREMENT_MARKER'), message('assistant', 'Completed before leaving A')];
    const delta = [message('user', 'New change while B was active'), message('assistant', 'B applied that change')];
    const memo = buildHandoffText(delta, { ...options, mode: 'delta', workStateMessages: [...previous, ...delta] });
    expect(memo).toContain('New change while B was active');
    expect(memo).not.toContain('EARLIER_REQUIREMENT_MARKER');
    // Therefore a lost native binding requires a new full handoff, not reusing this memo.
    expect(buildHandoffText([...previous, ...delta], options)).toContain('EARLIER_REQUIREMENT_MARKER');
  });
});
