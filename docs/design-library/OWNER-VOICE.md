# Owner Voice — current verbatim product signals

These owner statements remain active product intent. Quote them verbatim when exact wording matters;
do not turn this file into an archive or infer implementation status from it. The two binding UI
statements also live in `../01-WHITEPAPER.md` §5.

## OV-001 — Software must keep growing without becoming a mess (2026-07-08)

> 「以后随着AI的发展我还会往这个软件里加入更多的功能，比如无线画布增加组件，增强浏览器功能，或者
> 增加工具面板之类的，现在的整个方案选择在面对这些情况的时候能应对么」

**English gloss:** As AI evolves, the product will gain canvas components, stronger browser capabilities,
and tool panels; the architecture must absorb that growth without losing control.

**Now carried by:** Decision E1 (register, don't rewire) and E2 (install/loadout/runtime separation).

## OV-002 — High concurrency must not freeze the machine or the canvas (2026-07-08)

> 「在多代理并行的时候，智能体同时进行节点创建编码工作程序测试，生图生视频，或者视频剪辑等等，
> 高并发的时候，软件和本地电脑能抗住吗，还有无限画布要承担这么多功能，他能抗的住么，会不会延迟
> 很高还卡顿」

**English gloss:** Concurrent agents may create nodes, code, test, generate media, and edit video; Fleet and
the local machine must remain responsive, including the infinite canvas.

**Now carried by:** Decision E8 (resource limits are product behavior) and the media/concurrency
budgets + Electron decision gate in `07-canvas-spatial-orchestration-VISION.md` §§6, 8, 10.

## OV-003 — Owner speaks in concepts; agents choose the technical route (2026-07-08)

> 「我说话可能东一句西一句，描述顺序还是乱的，然后方便工作局做印证，而且我说的一般都不是工程用语，
> 因为我不是专业的程序员，我说的往往都是理念，需要工作局自己选择最佳的技术路线」

**English gloss:** Owner input expresses product intent rather than engineering vocabulary; agents must
reconstruct the intent, verify it against evidence, and choose the best technical route.

**Now carried by:** Decision G1 and the plain-language rule in `../OWNER-GUIDE.md`.

## OV-004 — Universal spatial work system must remain modular (2026-07-09)

> 「我选3，但是所有功能都是一个个的模块化组件，这样可以文字生成到生图，生的图片还可以选择做网页/
> 视频/动态PPT等等，然后间距模组又能链接各种素材进行剪辑，你想想要怎么样才是能实现这个。」

**English gloss:** The system should be modular: text can lead to images, and the same artifact can continue
into web, video, dynamic presentations, or editing workflows.

**Now carried by:** `../04-ARCHITECTURE.md` §1 (native surfaces on one spine) and
`../13-ORCHESTRATION.md` §3, Decisions E4/E5, D4 (one artifact version consumed by several later
surfaces), and the canvas VISION's artifact-graph-first boundary.

## OV-005 — Agents call modules and create workflows (2026-07-09)

> 「Agent也能调用每个模块的能力完成工作，还能根据情况创建工作流。」

**English gloss:** Agents can invoke module capabilities and compose workflows when the task requires them.

**Now carried by:** Decision S1 (one caller-aware invocation model) and E5's finite versioned DAG
workflow rule; dependent on the action spine (see `../04-ARCHITECTURE.md` and `../specs/R4-action-seam.md`).

## OV-006 — Thinking intensity adapts per model; some models cannot be graded (2026-07-11)

> 「我们软件应该要能根据不同的模型自动适配不同的思考强度分级策略，有些模型思考强大不能分级」

**English gloss:** Thinking intensity should adapt to each model; models without graded controls must be
represented honestly rather than forced into a false scale.

**Now carried by:** Decision E9 (one thinking-level vocabulary; per-backend/per-model adaptation;
honest handling — saturate, collapse to on/off, or hide — for models that cannot be graded). First
applied in `app/packages/shared/src/agent/backend/pi/constants.ts` (`max → 'xhigh'` saturation on
pi SDK 0.80.6).

## OV-007 — Every plan is a Craft Agents second-development plan (2026-07-20)

> 「而且你是要对Craft Agents进行二开，所有规划都应该在他的基础上整改或优化」

**English gloss:** Fleet is a Craft Agents fork; every plan must begin by reusing, extending, or deliberately
replacing a proven Craft capability rather than designing an unrelated product.

**Now carried by:** Decision P2, root `AGENTS.md` rule 1, the mandatory
[`../08-CRAFT-CAPABILITY-MAP.md`](../08-CRAFT-CAPABILITY-MAP.md) REUSE/EXTEND/NEW classification,
and the module compatibility gate. Pi, OpenHands, Hermes, OpenClaw and every other repository are
evidence or replaceable adapters only; none becomes Fleet's shell, kernel or authority.

## OV-008 — Collapse Craft's redundant surfaces; task-first creation (2026-07-20)

> 「我觉得Craft Agents原版的很多设计都是多余，跟主流的Claude，codeX，Cursor桌面版都存在差别，很多
> 按钮重复功能重叠，比如我的工作区和本地文件夹还有项目，这三者的关系就高度重叠，然后新建对话应该
> 改成新建项目或者任务，还有很多设计都不合理」

**English gloss:** Much of upstream Craft's chrome is redundant compared to mainstream agent
desktops (Claude, Codex, Cursor, TRAE): duplicated buttons and overlapping concepts. Workspace,
local folder and project must collapse into one Project concept, and "new chat" must become "new
project / new task". The owner also supplied a TRAE desktop screenshot (task-first sidebar; local /
worktree / cloud execution presets in the composer) as presentation evidence.

Amendment (2026-07-20, same conversation): 「工作树的设计应该交给Agent管理，选择有本地和云端就
行」 — worktree isolation is agent-managed, never a user preset; user-facing location choices are
local and cloud only.

**Now carried by:** Decision P6 (folder collapse + single switcher), Decision P10 (task-first
command surface), Decision P9 presentation rule (location presets + agent-managed worktrees), and
the R1 dedup inventory in
[`../specs/R1-one-boundary-language.md`](../specs/R1-one-boundary-language.md).

## OV-009 — Branch UX follows Claude/Codex desktop; upstream basics land first (2026-07-20)

> 「关于分支，参考Cloud和CodeX桌面版的设计」「我觉得有些设计是不是应该先落地，对于原版软件的一些
> 基础功能的设计」「特别是功能合并、精简或者删除的那些设计」

**English gloss:** Branch handling should follow the Claude / Codex desktop pattern — the user
reviews diffs and chooses apply/discard/PR; branch and worktree mechanics stay agent-managed.
And the basic-feature redesigns of the upstream software — especially the merge / simplify /
delete decisions — must land before differentiating features.

**Now carried by:** Decision C4 presentation rule + landing ladder; Decision P9 (agent-managed
worktrees); R1 slice order (dedup/merge slices first) in
[`../specs/R1-one-boundary-language.md`](../specs/R1-one-boundary-language.md); roadmap change log
2026-07-20.

## Rules for this file

Add a signal here only when the owner actually said it (with date) and it is not already carried
verbatim in an active document. When a signal's substance is promoted into a decision, note the
decision ID rather than rewriting the quote.
