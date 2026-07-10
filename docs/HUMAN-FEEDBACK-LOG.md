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

### [HFL-005] 2026-07-10 | Source: owner | Status: promoted

#### Raw Human Input

> LobeHub 好像有开源自己的组件库。主要是想借鉴它的**文稿模式**，它在文稿编辑方面做得非常好。

#### Agent Interpretation

- LobeHub is **not** a product shell baseline (D52 still Craft).
- Primary reference value: **document / 文稿 editing UX** (structure, density, AI-around-doc).
- Component library (e.g. `@lobehub/*`) is **not** auto green-light: LobeHub Community License restricts derivative distribution; Fleet must not copy packages without license + promotion.
- Optimize Craft’s existing document/TipTap path using black-box study, not fork LobeChat.

#### Linked Decisions / Modules

- D50, D51, D52; M05 document surface; Craft editor
- `REFERENCE-PROJECT-POLICY` LobeHub black-box row

#### Agent Response

Restored LobeHub to active black-box catalog with 文稿-only scope; re-cloned local checkout; matrix M05 note (2026-07-10).

#### Open Questions

None unless owner later approves commercial derivative license for component code.

### [HFL-004] 2026-07-10 | Source: owner | Status: promoted

#### Raw Human Input

> 「对于界面安排应该做到如无必要，勿增实体。现在大部分Agent的软件的前端界面都非常的简约。也不会有过多的没必要的设置，这样才能适配大多数的用户。」
>
> 「你直接把我这句话写进去，不同的Agent会有不同的理解，这样是不对的。而且你也要仔细检查项目文档中有没有过于笼统泛化的话，有时候如果它会对项目产生负面影响，就要注意控制或删除。」
>
> 「我在UI上的很多设计都会选择在原版Craft Agents的基础上做简化或者做优化，而不是凭空增加。」

#### Agent Interpretation

- D51 must cite the first paragraph **verbatim**; paraphrases are not authority.
- D52: UI baseline is original Craft Agents; change mode is simplify/optimize, not greenfield add.
- Vague UI slogans in docs are controlled or removed when they cause divergent Agent behavior.
- Operational detail lives only in `FRONTEND-EXPOSURE-MATRIX.md` §0 (D51-R* / D52-R*).

#### Linked Decisions / Modules

- Decisions: D51, D52 (with D27-R, D50)
- Modules: M01, M13, M16, All UI-facing

#### Agent Response

Promoted to D51/D52 + matrix §0 quote blocks + FORBIDDEN misreading table (2026-07-10).

#### Open Questions

None.

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
**Status:** Superseded (gate replaced by W0.1)
**Source session:** Pre-parallel-launch review

#### Raw Human Input
整套方案设计足够完善了吗，能不能开始多Agent并行开发了

#### Agent Interpretation
Principle: Launch readiness gate for parallel agent execution.
Q1: Are shared contracts (schemas, action IDs) frozen enough for workers to code against?
Q2: Are module boundaries clear enough to prevent worker collision?

#### Linked Decisions / Modules
- Decision: D7, D11, D19; later superseded in scope by D38–D46 and W0.1
- Module: M00 Platform Spine, M03 Internal Action Registry

#### Agent Response
**Historical (2026-07-08):** Two hard blockers identified — protocol stubs and action-id table.
Those artifacts were recorded as v1.2 evidence, but they are **not** sufficient to open Worker
implementation.

**Superseding gate (2026-07-09):** Parallel Worker implementation is blocked by the full W0.1
exit checklist in `WAVE-MODULE-MAP.md`: clean v0.11 migration ledger, canonical contract
re-freeze, persistence authority, ownership/path parity, namespace decision, and Lead declaration
that W1 is Ready. No module is `execution-ready`. Active packet is Lead-only
`wave-0.1-control-plane-reconciliation.md`. Do not treat this FB as permission to start
3-way parallel coding.

#### Open Questions
None at feedback level. Remaining work is W0.1 evidence, not a second readiness debate.

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
