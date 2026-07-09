# Human Feedback Log

## Purpose
Captures raw feedback from the human owner (non-engineer). Entries are natural language — fragments and conceptual descriptions are valid. Agents must interpret intent, select the best technical path, and record the interpretation.

## Rules for the human owner
Write freely. Don’t worry about order or engineering terminology. One entry per conversation is enough.

## Rules for Agents
Treat entries as a conceptual brief, not a spec. Infer the intent. Translate into engineering principles. Record interpretation before acting. If feedback contradicts DECISIONS-LEDGER.md, flag it explicitly.

## Entry Format
```markdown
### FB-NNN — short title
Date: YYYY-MM-DD
Status: Open | In Progress | Resolved | Deferred
Source session: brief description

#### Raw Human Input
(owner's exact words)

#### Agent Interpretation
(engineering translation, mark chosen interpretation with ✓)

#### Linked Decisions / Modules
- Decision: D-XX
- Module: M-XX

#### Agent Response
(what was done, commit/doc references)

#### Open Questions
(max 2)
```

## Active Entries

### FB-001 — 方案完善度与多Agent并行启动条件
**Date:** 2026-07-08
**Status:** In Progress
**Source session:** Pre-parallel-launch review

#### Raw Human Input
整套方案设计足够完善了吗，能不能开始多Agent并行开发了

#### Agent Interpretation
Principle: Launch readiness gate for parallel agent execution.
Q1: Are shared contracts (schemas, action IDs) frozen enough for workers to code against?
Q2: Are module boundaries clear enough to prevent worker collision?

#### Linked Decisions / Modules
- Decision: D7, D11, D19
- Module: M00 Platform Spine, M03 Internal Action Registry

#### Agent Response
Two hard blockers identified:
1. M00 protocol/ snapshot not frozen — SessionEvent, ActorRef, ActionInvocation Zod schemas must exist as stubs.
2. M03 action-id table not published — needs docs/contracts/action-ids.md before surfaces + executor workers can run in parallel.
Day-0 Lead task: commit these two artifacts, then unlock 3-way parallel. See PARALLEL-AGENT-OPERATING-MODEL.md.

#### Open Questions
None.

### FB-002 — 人类反馈记录机制 + Agent解读规则
**Date:** 2026-07-08
**Status:** Resolved
**Source session:** Feedback logging mechanism design

#### Raw Human Input
还有你应该建立一套机制，对于人类反馈的问题应该做记录，不过得优化一下，我说话可能东一句西一句，描述顺序还是乱的，然后方便Agent做印证，而且我说的一般都不是工程用语，因为我不是专业的程序员，我说的往往都是理念，需要Agent自己选择最佳的技术路线

#### Agent Interpretation
Principle: Asymmetric communication bridge between a conceptual owner and technical agents.
Owner feedback is: fragmented, non-linear, conceptual-level, authoritative on outcomes not implementation.
System needs: persistent log queryable by agents, protocol stating agents translate (not the human), cross-reference to existing decisions, status tracker.
Technical choice: Plain Markdown in docs/ — agent-native read/write, stays in repo, git diff-visible audit trail, no external dependency.

#### Linked Decisions / Modules
- Decision: D7, D13
- Module: M00 spine (this is spine-level infrastructure)

#### Agent Response
HUMAN-FEEDBACK-LOG.md defined with 5-field entry schema. FB-001 and FB-002 bootstrapped. Stored in Apple Notes for cloud sync, to be pulled into docs/ by Agent. No changes to DECISIONS-LEDGER.md required.

#### Open Questions
None.

## Resolved / Archived Entries
*(Move fully resolved entries here after 30 days or when the affected module ships.)*
