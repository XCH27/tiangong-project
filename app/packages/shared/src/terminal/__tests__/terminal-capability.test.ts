import { describe, expect, it } from 'bun:test'
import {
  MAX_COMMAND_LENGTH,
  ONE_SHOT_CAPABILITY,
  PTY_CAPABILITY,
  admitCommand,
  classifyCommand,
  truncateOutput,
} from '../terminal-capability'

describe('classification', () => {
  it('treats ordinary commands as bounded', () => {
    for (const command of ['ls -la', 'git status', 'echo hi', 'cat README.md']) {
      expect(classifyCommand(command)).toBe('bounded')
    }
  })

  // Without a PTY these do not fail, they block — which is worse, because it is
  // indistinguishable from a slow command until the timeout.
  it('flags programs that take over the terminal', () => {
    for (const command of ['vim src/a.ts', 'top', 'less log.txt', 'ssh host', 'man git']) {
      expect(classifyCommand(command)).toBe('interactive')
    }
  })

  it('resolves a program given by absolute path', () => {
    expect(classifyCommand('/usr/bin/vim a.ts')).toBe('interactive')
  })

  // `git status` is bounded and `git clone` is not, so the subcommand matters.
  it('separates bounded from long-running subcommands of the same program', () => {
    expect(classifyCommand('git status')).toBe('bounded')
    expect(classifyCommand('git clone https://example.test/r.git')).toBe('long-running')
    expect(classifyCommand('npm install')).toBe('long-running')
    expect(classifyCommand('npm --version')).toBe('bounded')
  })

  it('treats a program with no bounded subcommands as long-running outright', () => {
    expect(classifyCommand('make')).toBe('long-running')
    expect(classifyCommand('make build')).toBe('long-running')
  })

  // `git rebase -i` waits for an editor; `--watch` never exits.
  it('flags interactive and watch flags', () => {
    expect(classifyCommand('git rebase -i HEAD~3')).toBe('interactive')
    expect(classifyCommand('jest --watch')).toBe('interactive')
  })

  it('is case-insensitive and tolerates extra whitespace', () => {
    expect(classifyCommand('  VIM   a.ts ')).toBe('interactive')
  })
})

describe('admission against the shipped one-shot backend', () => {
  it('admits an ordinary command', () => {
    expect(admitCommand('ls -la', ONE_SHOT_CAPABILITY))
      .toEqual({ admitted: true, requirement: 'bounded' })
  })

  // The boundary should be stated, not discovered after a thirty-second wait.
  it('refuses an interactive program up front', () => {
    expect(admitCommand('vim a.ts', ONE_SHOT_CAPABILITY))
      .toEqual({ admitted: false, reason: 'needs-pty', requirement: 'interactive' })
  })

  // Without streaming the process is killed before exit and its buffered output
  // is discarded, so the user gets nothing at all.
  it('refuses a command that would outlive the budget', () => {
    expect(admitCommand('npm install', ONE_SHOT_CAPABILITY))
      .toEqual({ admitted: false, reason: 'exceeds-budget', requirement: 'long-running' })
  })

  it('refuses empty and oversized input the way the handler does', () => {
    expect(admitCommand('   ', ONE_SHOT_CAPABILITY)).toEqual({ admitted: false, reason: 'empty' })
    expect(admitCommand('x'.repeat(MAX_COMMAND_LENGTH + 1), ONE_SHOT_CAPABILITY))
      .toEqual({ admitted: false, reason: 'too-long' })
  })
})

describe('admission against a PTY backend', () => {
  // Adding the backend must not require touching any caller.
  it('admits everything the one-shot backend refuses', () => {
    for (const command of ['vim a.ts', 'npm install', 'top', 'make']) {
      expect(admitCommand(command, PTY_CAPABILITY).admitted).toBe(true)
    }
  })

  it('still refuses empty input', () => {
    expect(admitCommand('', PTY_CAPABILITY)).toEqual({ admitted: false, reason: 'empty' })
  })
})

describe('output truncation', () => {
  // maxBuffer currently kills the process and discards everything, including the
  // error at the end — the only part anyone wanted.
  it('keeps the tail, where failures live', () => {
    const result = truncateOutput('aaaaBBBB', 4)
    expect(result).toEqual({ output: 'BBBB', truncated: true })
  })

  it('leaves output that fits untouched', () => {
    expect(truncateOutput('short', 100)).toEqual({ output: 'short', truncated: false })
  })

  it('measures bytes rather than characters', () => {
    // Four multi-byte characters exceed a ten-byte budget.
    expect(truncateOutput('日本語です', 10).truncated).toBe(true)
  })

  it('does not throw when a slice starts mid-character', () => {
    expect(() => truncateOutput('日本語です', 7)).not.toThrow()
  })

  it('is a no-op for an unbounded budget', () => {
    expect(truncateOutput('anything', Number.POSITIVE_INFINITY))
      .toEqual({ output: 'anything', truncated: false })
  })
})
