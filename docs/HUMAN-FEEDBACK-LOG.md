# Human Feedback Log

> **Write Authority:** The Lead writes entries here based on direct owner/stakeholder input.
> Workers do NOT write to this file.
>
> **This file is a staging area, not a decision record.** Entries here represent raw
> observations and feedback. They are NOT binding until promoted to `DECISIONS-LEDGER.md`.
>
> **Entry format:**
> `[HFL-###] YYYY-MM-DD | Source: owner/stakeholder | Status: pending/promoted/dismissed`
> Followed by the feedback content and, if promoted, a reference to the DECISIONS-LEDGER entry.

> **Legacy-format note:** FB-001/FB-002 below predate the HFL schema and are retained as historical
> entries. New feedback uses only the `[HFL-###]` header/status vocabulary; do not create a second
> numbering or status format.

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

### [HFL-003] 2026-07-09 | Source: owner | Status: promoted

#### Raw Human Input

> “无线画布和多功能面板的方案都偏薄，而且不少项目方案还没有到可执行的程度。”
>
> “我选3，但是所有功能都是一个个的模块化组件，这样可以文字生成到生图，生的图片还可以选择做网页/视频/动态PPT等等，然后间距模组又能链接各种素材进行剪辑，你想想要怎么样才是能实现这个。”
>
> “Agent也能调用每个模块的能力完成工作，还能根据情况创建工作流。”

#### Agent Interpretation

- The owner selects the universal spatial-work-system direction, but requires strict modularity.
- Canvas is a composition surface, not the implementation of every capability.
- Human UI, Agents, and workflows must share module operations.
- Generated artifacts must fan out by reference/version into web, media, and presentation work.
- Multi-asset editing requires a real native media-project/timeline model.
- Existing short interface cards must not be treated as executable specifications.

#### Linked Decisions / Modules

- Decisions: D39-D46; ADR-0033
- Modules: M05, M07-M09, M12, M16-M19

#### Agent Response

Promoted into the composable workspace architecture, new module/contract drafts, revised wave
map, and Documentation Readiness register on 2026-07-09. Implementation remains Locked because
the v0.11 migration and W0.1 re-freeze are incomplete.

#### Open Questions

None at product-boundary level. Renderer, native editor, and export adapters require evidence
spikes before implementation.

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
