# Owner Voice — recovered verbatim signals

> **Recovered source material (2026-07-11).** The owner's own words are the least replaceable content
> in the retired corpus, and Decision P5 already establishes the rule for handling them: **quote
> verbatim; never paraphrase them into your own gloss.** The two UI statements live in
> `../01-PRODUCT.md` §4. The remaining product-defining signals are preserved here with their current
> disposition. Full original context: `_trash/2026-07-11/docs-legacy/OWNER-VOICE.md` (also in Git
> history).

## OV-001 — Software must keep growing without becoming a mess (2026-07-08)

> 「以后随着AI的发展我还会往这个软件里加入更多的功能，比如无线画布增加组件，增强浏览器功能，或者
> 增加工具面板之类的，现在的整个方案选择在面对这些情况的时候能应对么」

**Now carried by:** Decision E1 (register, don't rewire) and E2 (install/loadout/runtime separation).

## OV-002 — High concurrency must not freeze the machine or the canvas (2026-07-08)

> 「在多代理并行的时候，智能体同时进行节点创建编码工作程序测试，生图生视频，或者视频剪辑等等，
> 高并发的时候，软件和本地电脑能抗住吗，还有无限画布要承担这么多功能，他能抗的住么，会不会延迟
> 很高还卡顿」

**Now carried by:** Decision E8 (resource limits are product behavior) and the media/concurrency
budgets + Electron decision gate in `07-canvas-spatial-orchestration-VISION.md` §§6, 8, 10.

## OV-003 — Owner speaks in concepts; agents choose the technical route (2026-07-08)

> 「我说话可能东一句西一句，描述顺序还是乱的，然后方便工作局做印证，而且我说的一般都不是工程用语，
> 因为我不是专业的程序员，我说的往往都是理念，需要工作局自己选择最佳的技术路线」

**Now carried by:** Decision G1 and the plain-language rule in `../OWNER-CHECKPOINTS.md`.

## OV-004 — Universal spatial work system must remain modular (2026-07-09)

> 「我选3，但是所有功能都是一个个的模块化组件，这样可以文字生成到生图，生的图片还可以选择做网页/
> 视频/动态PPT等等，然后间距模组又能链接各种素材进行剪辑，你想想要怎么样才是能实现这个。」

**Now carried by:** `../01-PRODUCT.md` §3 layer model, Decisions E4/E5, D4 (one artifact version
consumed by several later surfaces), and the canvas VISION's artifact-graph-first boundary.

## OV-005 — Agents call modules and create workflows (2026-07-09)

> 「Agent也能调用每个模块的能力完成工作，还能根据情况创建工作流。」

**Now carried by:** Decision S1 (one caller-aware invocation model) and E5's finite versioned DAG
workflow rule; scheduled behind the action spine (see `../04-MILESTONES.md`).

## OV-006 — Thinking intensity adapts per model; some models cannot be graded (2026-07-11)

> 「我们软件应该要能根据不同的模型自动适配不同的思考强度分级策略，有些模型思考强大不能分级」

**Now carried by:** Decision E9 (one thinking-level vocabulary; per-backend/per-model adaptation;
honest handling — saturate, collapse to on/off, or hide — for models that cannot be graded). First
applied in `app/packages/shared/src/agent/backend/pi/constants.ts` (`max → 'xhigh'` saturation on
pi SDK 0.80.6).

## Rules for this file

Add a signal here only when the owner actually said it (with date) and it is not already carried
verbatim in an active document. When a signal's substance is promoted into a decision, note the
decision ID rather than rewriting the quote.
